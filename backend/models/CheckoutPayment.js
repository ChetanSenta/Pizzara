const mongoose = require('mongoose');

const checkoutPaymentSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  quote: { type: mongoose.Schema.Types.Mixed, required: true },
  orderType: { type: String, enum: ['DELIVERY', 'DINE_IN'], default: 'DELIVERY' },
  deliveryAddress: mongoose.Schema.Types.Mixed,
  contact: mongoose.Schema.Types.Mixed,
  paymentId: String,
  processing: { type: Boolean, default: false },
  reserved: { type: Boolean, default: false },
  expiresAt: { type: Date, expires: 0 },
});

module.exports = mongoose.model('CheckoutPayment', checkoutPaymentSchema);
