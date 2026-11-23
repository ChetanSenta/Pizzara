const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const CheckoutPayment = require('../models/CheckoutPayment');
const auth = require('../middleware/auth');
const checkStockAndAlert = require('../utils/stockAlert');
const { CheckoutError, validateOrderType, priceCart, deductStock, restoreStock } = require('../utils/checkoutPricing');

let razorpay;

function getRazorpay() {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.includes('replace-with') || keySecret.includes('replace-with')) {
      throw new CheckoutError('Razorpay is not configured. Choose Cash on Delivery or add valid test keys.', 503);
    }
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpay;
}

function fulfillmentDetails(orderType, address, contact) {
  const details = orderType === 'DELIVERY' ? address : contact;
  const required = orderType === 'DELIVERY'
    ? ['name', 'phone', 'line1', 'city', 'state', 'postalCode']
    : ['name', 'phone'];
  if (!required.every((key) => typeof details?.[key] === 'string' && details[key].trim())) {
    throw new CheckoutError(orderType === 'DELIVERY'
      ? 'Complete delivery address is required.'
      : 'Full name and mobile number are required.');
  }
  if (!/^[6-9]\d{9}$/.test(details.phone.trim())) {
    throw new CheckoutError('Enter a valid 10-digit Indian mobile number.');
  }
  const fields = Object.fromEntries(required.map((key) => [key, details[key].trim()]));
  if (orderType === 'DINE_IN') return { orderType, contact: fields };
  if (typeof address.line2 === 'string') fields.line2 = address.line2.trim();
  return { orderType, deliveryAddress: fields };
}

function requirePaymentMethod(method, expected) {
  if (method !== undefined && method !== expected) {
    throw new CheckoutError('Invalid payment method.');
  }
}

function orderFields(quote) {
  const { items, subtotal, deliveryFee, tax, totalPrice } = quote;
  return { items, subtotal, deliveryFee, tax, totalPrice, pizza: items[0].pizza };
}

function checkDisplayedPrice(quote, lines, expectedTotal) {
  if (expectedTotal === undefined) return;
  if (quote.totalPrice !== expectedTotal || quote.items.some((item, index) => item.unitPrice !== lines[index].unitPrice)) {
    throw new CheckoutError('A cart price has changed. Remove the affected pizza and add it again before checking out.', 409);
  }
}

function sendError(res, error, fallback) {
  if (error instanceof CheckoutError) return res.status(error.status).json({ message: error.message });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
}

async function sendOrder(res, order, message) {
  // A failed stock alert must not turn a committed order into a failed checkout.
  try {
    await checkStockAndAlert();
  } catch (error) {
    console.error('Stock alert failed:', error);
  }
  res.status(201).json({ message, order });
}

router.post('/cod', auth, async (req, res) => {
  try {
    const { items, deliveryAddress, contact, expectedTotal, paymentMethod } = req.body;
    requirePaymentMethod(paymentMethod, 'COD');
    const orderType = validateOrderType(req.body.orderType);
    const fulfillment = fulfillmentDetails(orderType, deliveryAddress, contact);
    const quote = await priceCart(items, req.user._id, orderType);
    checkDisplayedPrice(quote, items, expectedTotal);
    await deductStock(quote.stock);
    let order;
    try {
      order = await Order.create({
        ...orderFields(quote),
        user: req.user._id,
        ...fulfillment,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        status: 'Order Placed',
      });
    } catch (error) {
      await restoreStock(quote.stock);
      throw error;
    }
    await sendOrder(res, order, 'Cash on Delivery order placed successfully!');
  } catch (error) {
    sendError(res, error, 'Unable to place COD order.');
  }
});

router.post('/create-order', auth, async (req, res) => {
  try {
    const { items, deliveryAddress, contact, expectedTotal, quoteOnly, paymentMethod } = req.body;
    requirePaymentMethod(paymentMethod, 'ONLINE');
    const orderType = validateOrderType(req.body.orderType);
    const quote = await priceCart(items, req.user._id, orderType);
    if (quoteOnly === true) return res.json(orderFields(quote));

    const fulfillment = fulfillmentDetails(orderType, deliveryAddress, contact);
    checkDisplayedPrice(quote, items, expectedTotal);
    const paymentOrder = await getRazorpay().orders.create({
      amount: quote.amount,
      currency: 'INR',
      receipt: `receipt_${crypto.randomBytes(12).toString('hex')}`,
      payment: {
        capture: 'manual',
        capture_options: { manual_expiry_period: 60, refund_speed: 'normal' },
      },
    });
    await CheckoutPayment.create({
      razorpayOrderId: paymentOrder.id,
      user: req.user._id,
      ...fulfillment,
      quote,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    res.json(paymentOrder);
  } catch (error) {
    sendError(res, error, 'Razorpay is unavailable.');
  }
});

function isValidSignature(orderId, paymentId, signature) {
  if (typeof orderId !== 'string' || typeof paymentId !== 'string'
    || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

function checkGatewayPayment(payment, orderId, amount) {
  if (payment.order_id !== orderId || payment.amount !== amount || payment.currency !== 'INR') {
    throw new CheckoutError('Payment amount or order does not match checkout.');
  }
}

router.post('/verify', auth, async (req, res) => {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body;
  let pending;
  try {
    const gateway = getRazorpay();
    if (!isValidSignature(orderId, paymentId, signature)) throw new CheckoutError('Payment verification failed.');

    const confirmed = await Order.findOne({ user: req.user._id, razorpayOrderId: orderId, razorpayPaymentId: paymentId });
    if (confirmed) return res.json({ message: 'Order already confirmed.', order: confirmed });

    pending = await CheckoutPayment.findOneAndUpdate({
      razorpayOrderId: orderId,
      user: req.user._id,
      processing: false,
      $or: [{ paymentId: { $exists: false } }, { paymentId }],
    }, { $set: { processing: true } }, { new: true });
    if (!pending) throw new CheckoutError('Checkout is unavailable or already being verified.', 409);

    const { quote } = pending;
    let payment = await gateway.payments.fetch(paymentId);
    checkGatewayPayment(payment, orderId, quote.amount);
    if (!['authorized', 'captured'].includes(payment.status)) {
      if (pending.reserved && ['failed', 'refunded'].includes(payment.status)) {
        await restoreStock(quote.stock);
        await CheckoutPayment.deleteOne({ _id: pending._id });
      }
      throw new CheckoutError('Payment is not authorized.', 409);
    }

    if (!pending.reserved) {
      try {
        await deductStock(quote.stock);
      } catch (error) {
        // Compensate if the gateway captured despite the manual-capture request.
        if (payment.status === 'captured' && error instanceof CheckoutError) {
          await gateway.payments.refund(paymentId, { amount: quote.amount });
        }
        throw error;
      }

      try {
        pending.reserved = true;
        pending.paymentId = paymentId;
        pending.expiresAt = undefined;
        await pending.save();
      } catch (error) {
        await restoreStock(quote.stock);
        throw error;
      }
    }

    if (payment.status === 'authorized') {
      try {
        payment = await gateway.payments.capture(paymentId, quote.amount, 'INR');
      } catch (error) {
        // Capture and a network timeout can happen together. Keep the reservation
        // until a retry can establish the gateway's actual payment status.
        payment = await gateway.payments.fetch(paymentId);
        if (payment.status !== 'captured') throw error;
      }
    }
    checkGatewayPayment(payment, orderId, quote.amount);
    if (payment.status !== 'captured') throw new CheckoutError('Payment capture is pending. Retry verification.', 409);

    const order = await Order.create({
      ...orderFields(quote),
      user: req.user._id,
      orderType: pending.orderType || 'DELIVERY',
      ...(pending.orderType === 'DINE_IN'
        ? { contact: pending.contact }
        : { deliveryAddress: pending.deliveryAddress }),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      status: 'Order Placed',
    });
    await CheckoutPayment.deleteOne({ _id: pending._id }).catch(console.error);
    await sendOrder(res, order, 'Order placed successfully!');
  } catch (error) {
    if (pending) {
      await CheckoutPayment.updateOne({ _id: pending._id }, { $set: { processing: false } }).catch(console.error);
    }
    sendError(res, error, 'Error processing order.');
  }
});

module.exports = router;
