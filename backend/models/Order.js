const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['menu', 'custom'], required: true },
  pizza: {
    base: { type: String, required: true },
    sauce: { type: String, required: true },
    cheese: { type: String, required: true },
    veggies: [String],
  },
  quantity: { type: Number, min: 1, max: 10, required: true },
  unitPrice: { type: Number, min: 0, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pizza: {
    base: { type: String, required: true },
    sauce: { type: String, required: true },
    cheese: { type: String, required: true },
    veggies: [{ type: String }],
  },
  items: { type: [orderItemSchema], default: undefined },
  subtotal: Number,
  deliveryFee: Number,
  tax: Number,
  totalPrice: {
    type: Number,
    required: true,
  },
  orderType: { type: String, enum: ['DELIVERY', 'DINE_IN'], default: 'DELIVERY', required: true },
  contact: {
    name: { type: String, trim: true, required() { return this.orderType === 'DINE_IN'; } },
    phone: { type: String, trim: true, required() { return this.orderType === 'DINE_IN'; } },
  },
  deliveryAddress: {
    name: { type: String, trim: true, required() { return this.isNew && this.orderType === 'DELIVERY'; } },
    phone: { type: String, trim: true, required() { return this.isNew && this.orderType === 'DELIVERY'; } },
    line1: { type: String, required() { return this.orderType === 'DELIVERY'; }, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required() { return this.orderType === 'DELIVERY'; }, trim: true },
    state: { type: String, required() { return this.orderType === 'DELIVERY'; }, trim: true },
    postalCode: { type: String, required() { return this.orderType === 'DELIVERY'; }, trim: true },
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
  paymentMethod: {
    type: String,
    enum: ['ONLINE', 'COD'],
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PENDING'],
  },
  status: {
    type: String,
    enum: ['Order Placed', 'Order Received', 'In the Kitchen', 'Sent to Delivery', 'Delivered', 'Cancelled'],
    default: 'Order Placed',
  },
  cancelledAt: Date,
  refundId: String,
}, {
  timestamps: true,
});

orderSchema.pre('init', (record) => {
  if (record.paymentMethod === 'Razorpay') record.paymentMethod = 'ONLINE';
});

orderSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
