const statusSuffixes = {
  'Order Placed': 'placed',
  'Order Received': 'received',
  'In the Kitchen': 'kitchen',
  'Sent to Delivery': 'delivery',
  Delivered: 'delivered',
};

export const orderStatuses = Object.keys(statusSuffixes);

export const statusFilterLabels = {
  All: 'All',
  'Order Placed': 'Placed',
  'Order Received': 'Received',
  'In the Kitchen': 'Kitchen',
  'Sent to Delivery': 'Delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

export function getOrderStatusClass(status) {
  return Object.hasOwn(statusSuffixes, status) ? statusSuffixes[status] : '';
}

export function getStatusBadgeClass(status) {
  return `badge-${getOrderStatusClass(status) || 'placed'}`;
}

export function getOrderStatusLabel(order, status = order.status) {
  if (order.orderType === 'DINE_IN') {
    if (status === 'Sent to Delivery') return 'Ready to serve';
    if (status === 'Delivered') return 'Served';
  }
  return status;
}
