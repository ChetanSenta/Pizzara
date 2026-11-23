export const freeDeliveryThreshold = 999;

export function checkoutLine(item) {
  return {
    name: item.name,
    type: item.isCustomPizza ? 'custom' : 'menu',
    pizza: item.pizza || {
      base: item.toppings?.[0] || 'Thin Crust',
      sauce: item.toppings?.[1] || 'Marinara',
      cheese: item.toppings?.[2] || 'Mozzarella',
      veggies: item.toppings?.slice(3) || [],
    },
    quantity: item.quantity,
    unitPrice: item.price,
  };
}

export function checkoutTotals(items, orderType = 'DELIVERY') {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = orderType === 'DELIVERY' && items.length && subtotal < freeDeliveryThreshold ? 49 : 0;
  const taxes = Math.floor((subtotal * 5 + 50) / 100);
  return { subtotal, deliveryFee, taxes, total: subtotal + deliveryFee + taxes };
}

export function cartItemFromOrder(item) {
  const isCustomPizza = item.type === 'custom';
  const { base, sauce, cheese, veggies } = item.pizza;
  return {
    name: item.name,
    id: isCustomPizza ? ['custom', base, sauce, cheese, ...[...(veggies || [])].sort()].join('|').toLowerCase() : item.name,
    price: item.unitPrice,
    quantity: item.quantity,
    pizza: item.pizza,
    isCustomPizza,
  };
}
