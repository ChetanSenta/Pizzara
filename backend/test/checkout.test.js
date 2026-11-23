const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const CheckoutPayment = require('../models/CheckoutPayment');
const menu = require('../data/menuPizzas.json');
const { getTotals, priceCart, deductStock } = require('../utils/checkoutPricing');

const fixture = readFileSync(path.join(__dirname, '../seed/seed.js'), 'utf8');
const recipes = vm.runInNewContext(fixture.match(/const items = (\[[\s\S]*?\n\]);/)[1]);
const dashboard = readFileSync(path.join(__dirname, '../../frontend/src/pages/user/Dashboard.jsx'), 'utf8');
const sourceCatalog = dashboard.split('const preconfiguredPizzas = [')[1].split('\n];')[0];
const menuLine = (name, quantity = 1) => ({
  name, type: 'menu', quantity, unitPrice: menu.find((item) => item.name === name).unitPrice,
});
const bbq = menuLine('BBQ Chicken Delight');
const mexican = menuLine('Mexican Heat');
const custom = {
  name: 'Custom Pizza', type: 'custom', quantity: 1, unitPrice: 314,
  pizza: { base: 'Thin Crust', sauce: 'Marinara', cheese: 'Mozzarella', veggies: ['Tomatoes'] },
};
const user = '507f1f77bcf86cd799439011';
const address = { name: 'Test Customer', phone: '9876543210', line1: 'Test address', city: 'Test city', state: 'Test state', postalCode: '123456' };

function mockInventory(context) {
  const stock = new Map(recipes.map((item, index) => [String(index), { ...item, _id: String(index) }]));
  context.mock.method(Inventory, 'findOne', async ({ category, name }) =>
    [...stock.values()].find((item) => item.name === name && (category.$in || [category]).includes(item.category))
  );
  context.mock.method(Inventory, 'findOneAndUpdate', async ({ _id, quantity }, update) => {
    const item = stock.get(_id);
    if (!item || item.quantity < quantity.$gte) return null;
    item.quantity += update.$inc.quantity;
    return item;
  });
  context.mock.method(Inventory, 'findByIdAndUpdate', async (id, update) => {
    stock.get(id).quantity += update.$inc.quantity;
  });
  return stock;
}

test('server menu matches every displayed menu price and recipe', () => {
  const displayed = sourceCatalog.split('\n  {').slice(1).map((entry) => ({
    ...Object.fromEntries(['name', 'base', 'sauce', 'cheese'].map((field) =>
      [field, entry.match(new RegExp(`\\b${field}: "([^"]+)"`))[1]]
    )),
    unitPrice: Number(entry.match(/\bprice: (\d+)/)[1]),
    veggies: JSON.parse(entry.match(/\bveggies: (\[[^\]]*\])/)[1]),
  }));
  assert.deepEqual(menu, displayed);
});

test('server and drawer agree for single, multi-line, custom and free delivery', async (context) => {
  mockInventory(context);
  const { checkoutTotals } = await import('../../frontend/src/utils/checkout.js');
  const cases = [
    [[bbq], [429, 49, 21, 499]],
    [[bbq, mexican], [798, 49, 40, 887]],
    [[{ ...bbq, quantity: 2 }, mexican], [1227, 0, 61, 1288]],
    [[menuLine('Four Cheese Delight')], [449, 49, 22, 520]],
    [[{ ...bbq, quantity: 2 }], [858, 49, 43, 950]],
    [[custom], [314, 49, 16, 379]],
    [[custom, bbq], [743, 49, 37, 829]],
  ];
  for (const [lines, expected] of cases) {
    const quote = await priceCart(lines, user);
    assert.deepEqual([quote.subtotal, quote.deliveryFee, quote.tax, quote.totalPrice], expected);
    assert.equal(quote.amount, expected[3] * 100);
    assert.deepEqual(Object.values(checkoutTotals(lines)), expected);
    assert.ifError(new Order({ ...quote, pizza: quote.items[0].pizza, user, deliveryAddress: address }).validateSync());
  }
  assert.equal(getTotals([{ unitPrice: 998, quantity: 1 }]).deliveryFee, 49);
  assert.equal(getTotals([{ unitPrice: 999, quantity: 1 }]).deliveryFee, 0);
  const quote = await priceCart([{ ...bbq, unitPrice: 1, pizza: custom.pizza }], user);
  assert.equal(quote.items[0].unitPrice, 429);
  assert.equal(quote.items[0].pizza.base, 'Stuffed Crust');
  for (const lines of [[], [{ ...bbq, quantity: 0 }], [{ ...bbq, quantity: 11 }], [{ ...bbq, name: 'Unknown' }], [
    { ...bbq, quantity: 10 }, bbq,
  ]]) await assert.rejects(priceCart(lines, user));
});

test('delivery and dine-in totals agree with the checkout display', async (context) => {
  mockInventory(context);
  const { checkoutTotals } = await import('../../frontend/src/utils/checkout.js');
  const veggie = menuLine('Veggie Supreme');
  for (const [items, delivery, dineIn] of [
    [[veggie], 415, 366],
    [[veggie, bbq], 866, 817],
    [[menuLine('Veggie Supreme', 3)], 1099, 1099],
  ]) {
    for (const [type, expected] of [['DELIVERY', delivery], ['DINE_IN', dineIn]]) {
      const quote = await priceCart(items, user, type);
      assert.equal(quote.totalPrice, expected);
      assert.equal(quote.amount, expected * 100);
      assert.equal(checkoutTotals(items, type).total, expected);
    }
  }
  await assert.rejects(priceCart([], user, 'DINE_IN'), /cart is empty/);
  await assert.rejects(priceCart([{ ...veggie, quantity: 0 }], user, 'DINE_IN'), /quantity/);
  await assert.rejects(priceCart([veggie], user, null), /Invalid order type/);
});

test('a later stock conflict rolls back previous ingredient deductions', async (context) => {
  const stock = mockInventory(context);
  const quote = await priceCart([{ ...bbq, quantity: 2 }, mexican], user);
  const conflict = quote.stock.at(-1);
  stock.get(conflict.id).quantity = 0;
  await assert.rejects(deductStock(quote.stock), /Not enough stock/);
  for (const ingredient of quote.stock.slice(0, -1)) assert.equal(stock.get(ingredient.id).quantity, 100);
});

test('COD and Razorpay save the entire cart, and Razorpay captures only after stock deduction', async (context) => {
  const stock = mockInventory(context);
  const orders = [];
  let pending;
  let captureCount = 0;
  let gatewayAmount;
  let gatewayCreated = 0;
  let paymentStatus = 'authorized';
  let orderId = 'order_test';
  const paymentId = 'pay_test';
  const key = 'checkout-test-secret';
  const request = { items: [{ ...bbq, quantity: 2 }, mexican], deliveryAddress: address, expectedTotal: 1288 };
  context.mock.method(Order, 'findOne', async (filter) => orders.find((order) =>
    Object.entries(filter).every(([field, value]) => order[field] === value)
  ));
  context.mock.method(Order, 'create', async (order) => {
    assert.ifError(new Order(order).validateSync());
    orders.push(order);
    return order;
  });
  context.mock.method(CheckoutPayment, 'create', async (fields) => {
    pending = { ...fields, _id: 'quote', processing: false, reserved: false, save: async () => {} };
    return pending;
  });
  context.mock.method(CheckoutPayment, 'findOneAndUpdate', async (filter) => {
    if (!pending || pending.razorpayOrderId !== filter.razorpayOrderId || pending.user !== filter.user || pending.processing) return null;
    pending.processing = true;
    return pending;
  });
  context.mock.method(CheckoutPayment, 'updateOne', async () => { if (pending) pending.processing = false; });
  context.mock.method(CheckoutPayment, 'deleteOne', async () => { pending = undefined; });
  const razorpayModule = require.resolve('razorpay');
  require(razorpayModule);
  const gatewayPayment = () => ({ order_id: orderId, currency: 'INR', amount: gatewayAmount, status: paymentStatus });
  context.mock.method(require.cache[razorpayModule], 'exports', function MockGateway() {
    this.orders = { create: async (options) => {
      gatewayCreated++;
      assert.deepEqual(options.payment, {
        capture: 'manual',
        capture_options: { manual_expiry_period: 60, refund_speed: 'normal' },
      });
      gatewayAmount = options.amount;
      return { id: orderId, amount: gatewayAmount, currency: 'INR' };
    } };
    this.payments = {
      fetch: async () => gatewayPayment(),
      capture: async (id, amount) => {
        assert.equal(id, paymentId);
        assert.equal(amount, pending.quote.amount);
        for (const ingredient of pending.quote.stock) {
          assert.equal(stock.get(ingredient.id).quantity, 100 - ingredient.quantity);
        }
        captureCount++;
        paymentStatus = 'captured';
        return gatewayPayment();
      },
    };
  });
  const alertsModule = require.resolve('../utils/stockAlert');
  require(alertsModule);
  context.mock.method(require.cache[alertsModule], 'exports', async () => {});
  process.env.RAZORPAY_KEY_ID = 'rzp_test_checkout';
  process.env.RAZORPAY_KEY_SECRET = key;
  const router = require('../routes/payment');
  const invoke = async (route, body, id = user) => {
    const res = { statusCode: 200, status(status) { this.statusCode = status; return this; }, json(data) { return data; } };
    const handler = router.stack.find((entry) => entry.route.path === route).route.stack.at(-1).handle;
    let data;
    res.json = (value) => { data = value; };
    await handler({ body, user: { _id: id } }, res);
    return { status: res.statusCode, data };
  };
  const quote = await priceCart(request.items, user);
  assert.equal((await invoke('/cod', { ...request, paymentMethod: 'ONLINE' })).status, 400);
  assert.equal((await invoke('/create-order', { ...request, paymentMethod: 'COD' })).status, 400);
  assert.equal((await invoke('/cod', { ...request, expectedTotal: 1 })).status, 409);
  assert.equal((await invoke('/cod', { ...request, paymentMethod: 'COD', paymentStatus: 'PAID' })).status, 201);
  assert.equal(orders[0].totalPrice, 1288);
  assert.equal(orders[0].paymentMethod, 'COD');
  assert.equal(orders[0].paymentStatus, 'PENDING');
  assert.equal(gatewayCreated, 0);
  assert.deepEqual(orders[0].items, quote.items);
  for (const ingredient of quote.stock) {
    assert.equal(stock.get(ingredient.id).quantity, 100 - ingredient.quantity);
    stock.get(ingredient.id).quantity = 100;
  }
  const { data } = await invoke('/create-order', request);
  assert.equal(data.amount, 128800);
  const verification = () => ({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: crypto.createHmac('sha256', key).update(`${orderId}|${paymentId}`).digest('hex'),
  });
  assert.equal((await invoke('/verify', { ...verification(), razorpay_signature: 'bad' })).status, 400);
  assert.equal((await invoke('/verify', verification(), 'another-user')).status, 409);
  gatewayAmount = 100;
  assert.equal((await invoke('/verify', verification())).status, 400);
  gatewayAmount = 128800;
  assert.equal((await invoke('/verify', verification())).status, 201);
  assert.equal((await invoke('/verify', verification())).status, 200);
  assert.equal(captureCount, 1);
  assert.equal(orders[1].totalPrice * 100, data.amount);
  assert.equal(orders[1].paymentMethod, 'ONLINE');
  assert.equal(orders[1].paymentStatus, 'PAID');
  assert.deepEqual(orders[1].items, quote.items);

  orderId = 'order_stock_race';
  paymentStatus = 'authorized';
  assert.equal((await invoke('/create-order', request)).status, 200);
  stock.get(quote.stock.at(-1).id).quantity = 0;
  assert.equal((await invoke('/verify', verification())).status, 409);
  assert.equal(captureCount, 1);
  assert.equal(orders.length, 2);

  for (const [items, expectedTotal] of [[[bbq], 499], [[bbq, mexican], 887]]) {
    for (const ingredient of stock.values()) ingredient.quantity = 100;
    const quote = await priceCart(items, user);
    const result = await invoke('/cod', { items, expectedTotal, deliveryAddress: address, paymentMethod: 'COD' });
    assert.equal(result.status, 201);
    assert.equal(result.data.order.paymentStatus, 'PENDING');
    assert.equal(result.data.order.totalPrice, expectedTotal);
    assert.deepEqual(result.data.order.items, quote.items);
    for (const ingredient of quote.stock) {
      assert.equal(stock.get(ingredient.id).quantity, 100 - ingredient.quantity);
    }
  }
  assert.equal(gatewayCreated, 2);

  const contact = { name: address.name, phone: address.phone, line1: 'Do not store' };
  const dineIn = {
    orderType: 'DINE_IN', contact, deliveryAddress: address,
    items: [{ name: 'Veggie Supreme', type: 'menu', quantity: 1, unitPrice: 1 }],
    deliveryFee: -49, totalPrice: 1, paymentStatus: 'PAID',
  };
  assert.equal((await invoke('/cod', { ...dineIn, orderType: 'DELIVERY', deliveryAddress: undefined })).status, 400);
  assert.equal((await invoke('/create-order', { ...dineIn, orderType: 'INVALID' })).status, 400);
  assert.equal((await invoke('/cod', { ...dineIn, contact: {} })).status, 400);
  assert.equal((await invoke('/cod', { ...dineIn, orderType: null })).status, 400);
  const dineInQuote = await priceCart(dineIn.items, user, dineIn.orderType);
  for (const ingredient of stock.values()) ingredient.quantity = 100;
  const cash = await invoke('/cod', dineIn);
  assert.equal(cash.status, 201);
  assert.equal(cash.data.order.paymentStatus, 'PENDING');
  assert.equal(cash.data.order.orderType, 'DINE_IN');
  assert.equal(cash.data.order.totalPrice, 366);
  assert.equal(cash.data.order.deliveryFee, 0);
  assert.equal(cash.data.order.deliveryAddress, undefined);
  assert.deepEqual(cash.data.order.contact, { name: address.name, phone: address.phone });
  assert.equal(gatewayCreated, 2);
  for (const ingredient of dineInQuote.stock) {
    assert.equal(stock.get(ingredient.id).quantity, 100 - ingredient.quantity);
    stock.get(ingredient.id).quantity = 100;
  }

  orderId = 'order_dine_in';
  paymentStatus = 'authorized';
  const online = await invoke('/create-order', dineIn);
  assert.equal(online.status, 200);
  assert.equal(online.data.amount, 36600);
  assert.equal(pending.deliveryAddress, undefined);
  const verified = await invoke('/verify', { ...verification(), orderType: 'DELIVERY' });
  assert.equal(verified.status, 201);
  assert.equal(verified.data.order.orderType, 'DINE_IN');
  assert.equal(verified.data.order.paymentStatus, 'PAID');
  assert.equal(verified.data.order.totalPrice * 100, online.data.amount);
  assert.equal(verified.data.order.deliveryAddress, undefined);
  assert.deepEqual(verified.data.order.contact, cash.data.order.contact);
  assert.equal((await invoke('/verify', verification())).status, 200);
  assert.equal(captureCount, 2);
  for (const ingredient of dineInQuote.stock) {
    assert.equal(stock.get(ingredient.id).quantity, 100 - ingredient.quantity);
  }
});

test('legacy records keep missing payment fields and normalize the old Razorpay method', async () => {
  const fields = {
    user,
    pizza: custom.pizza,
    deliveryAddress: address,
    totalPrice: 379,
  };
  const unknown = Order.hydrate(fields);
  assert.equal(unknown.orderType, 'DELIVERY');
  assert.equal(unknown.paymentMethod, undefined);
  assert.equal(unknown.paymentStatus, undefined);
  await unknown.validate();
  const legacy = Order.hydrate({ ...fields, paymentMethod: 'Razorpay', razorpayPaymentId: 'pay_legacy' });
  assert.equal(legacy.paymentMethod, 'ONLINE');
  assert.equal(legacy.paymentStatus, undefined);
  await legacy.validate();
  await assert.rejects(new Order({ ...fields, paymentMethod: 'OTHER', paymentStatus: 'PAID' }).validate(), /paymentMethod/);
});

test('marking Delivered records a COD payment only for known cash orders', async (context) => {
  const router = require('../routes/order');
  const handler = router.stack.find((entry) => entry.route.path === '/:id/status').route.stack.at(-1).handle;
  let existingOrder;
  context.mock.method(Order, 'findById', async () => existingOrder);
  context.mock.method(Order, 'findByIdAndUpdate', (_id, updates) => ({
    populate: async () => ({ ...existingOrder, ...updates }),
  }));
  for (const paymentMethod of ['COD', 'ONLINE', undefined]) {
    existingOrder = { status: 'Sent to Delivery', paymentMethod };
    let result;
    await handler({
      params: { id: 'order' },
      body: { status: 'Delivered', paymentStatus: 'PENDING' },
    }, { json: (data) => { result = data; } });
    assert.equal(result.status, 'Delivered');
    assert.equal(result.paymentStatus, paymentMethod === 'COD' ? 'PAID' : undefined);
  }
});
