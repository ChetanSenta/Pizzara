const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const { isObjectIdOrHexString } = require('mongoose');
const menu = require('../data/menuPizzas.json');

class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const recipeKey = ({ base, sauce, cheese, veggies = [] }) =>
  JSON.stringify([base, sauce, cheese, [...veggies].sort()]);

function validateOrderType(orderType = 'DELIVERY') {
  if (orderType !== 'DELIVERY' && orderType !== 'DINE_IN') throw new CheckoutError('Invalid order type.');
  return orderType;
}

function getTotals(items, orderType) {
  const type = validateOrderType(orderType);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal < 0 || subtotal > Math.floor(Number.MAX_SAFE_INTEGER / 200)) {
    throw new CheckoutError('Invalid cart total.');
  }
  const deliveryFee = type === 'DELIVERY' && items.length && subtotal < 999 ? 49 : 0;
  const tax = Math.floor((subtotal * 5 + 50) / 100);
  const totalPrice = subtotal + deliveryFee + tax;
  return { subtotal, deliveryFee, tax, totalPrice, amount: totalPrice * 100 };
}

function ingredientFilters(pizza) {
  return [
    { category: 'base', name: pizza.base },
    { category: 'sauce', name: pizza.sauce },
    { category: 'cheese', name: pizza.cheese },
    ...(pizza.veggies || []).map((name) => ({ category: { $in: ['veggie', 'meat'] }, name })),
  ];
}

async function priceCart(lines, userId, orderType) {
  const type = validateOrderType(orderType);
  if (!Array.isArray(lines) || !lines.length) throw new CheckoutError('Your cart is empty.');
  const requiredStock = new Map();
  const quantities = new Map();
  const ingredients = new Map();
  const items = [];

  for (const line of lines) {
    if (!line || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10) {
      throw new CheckoutError('Each cart line must have a quantity from 1 to 10.');
    }

    let { name, type, pizza } = line;
    let legacyTotal;
    if (line.legacyOrderId) {
      if (!isObjectIdOrHexString(line.legacyOrderId)) throw new CheckoutError('Unknown reorder item.');
      const oldOrder = await Order.findOne({ _id: line.legacyOrderId, user: userId });
      if (!oldOrder?.pizza || oldOrder.items?.length) throw new CheckoutError('Unknown reorder item.');
      pizza = oldOrder.pizza;
      legacyTotal = oldOrder.totalPrice;
      const match = menu.find((entry) => recipeKey(entry) === recipeKey(pizza));
      type = match ? 'menu' : 'custom';
      name = match?.name;
    }

    const menuItem = type === 'menu' ? menu.find((entry) => entry.name === name) : null;
    if ((type === 'menu' && !menuItem) || (type !== 'menu' && type !== 'custom')) {
      throw new CheckoutError('Unknown pizza.');
    }
    if (menuItem) pizza = menuItem;
    if (!pizza || ![pizza.base, pizza.sauce, pizza.cheese].every((value) => typeof value === 'string' && value)
      || !Array.isArray(pizza.veggies) || !pizza.veggies.every((value) => typeof value === 'string' && value)
      || new Set(pizza.veggies).size !== pizza.veggies.length) {
      throw new CheckoutError('Invalid pizza configuration.');
    }

    let ingredientPrice = 0;
    for (const filter of ingredientFilters(pizza)) {
      const ingredientKey = JSON.stringify(filter);
      if (!ingredients.has(ingredientKey)) {
        ingredients.set(ingredientKey, await Inventory.findOne(filter));
      }
      const ingredient = ingredients.get(ingredientKey);
      if (!ingredient) throw new CheckoutError(`Ingredient "${filter.name}" is unavailable.`, 409);

      const id = String(ingredient._id);
      const needed = (requiredStock.get(id)?.quantity || 0) + line.quantity;
      if (ingredient.quantity < needed) throw new CheckoutError(`Not enough stock for "${filter.name}".`, 409);
      requiredStock.set(id, { id, name: ingredient.name, quantity: needed });
      ingredientPrice += ingredient.price;
    }

    const customUnitPrice = Math.round(ingredientPrice) + 49;
    // Legacy orders carry neither a menu ID nor a custom flag. The old custom
    // total can disambiguate a matching recipe when inventory prices are unchanged.
    const legacyCustomTotal = customUnitPrice + 49 + Math.round(customUnitPrice * .05);
    const pricedMenuItem = legacyTotal === legacyCustomTotal ? null : menuItem;
    const key = pricedMenuItem ? pricedMenuItem.name : recipeKey(pizza);
    const quantity = (quantities.get(key) || 0) + line.quantity;
    if (quantity > 10) throw new CheckoutError('Each pizza configuration is limited to 10.');
    quantities.set(key, quantity);

    items.push({
      name: pricedMenuItem?.name || 'Custom Pizza',
      type: pricedMenuItem ? 'menu' : 'custom',
      pizza: { base: pizza.base, sauce: pizza.sauce, cheese: pizza.cheese, veggies: [...pizza.veggies] },
      quantity: line.quantity,
      unitPrice: pricedMenuItem?.unitPrice ?? customUnitPrice,
    });
  }

  return { items, ...getTotals(items, type), stock: [...requiredStock.values()] };
}

async function restoreStock(stock) {
  await Promise.all(stock.map(({ id, quantity }) =>
    Inventory.findByIdAndUpdate(id, { $inc: { quantity } })
  ));
}

async function deductStock(stock) {
  const deducted = [];
  try {
    for (const ingredient of stock) {
      const { id, quantity, name } = ingredient;
      const updated = await Inventory.findOneAndUpdate(
        { _id: id, quantity: { $gte: quantity } },
        { $inc: { quantity: -quantity } },
      );
      if (!updated) throw new CheckoutError(`Not enough stock for "${name}".`, 409);
      deducted.push(ingredient);
    }
  } catch (error) {
    await restoreStock(deducted);
    throw error;
  }
}

module.exports = { CheckoutError, validateOrderType, getTotals, priceCart, ingredientFilters, deductStock, restoreStock };
