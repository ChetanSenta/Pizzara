const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const Razorpay = require('razorpay');
const Inventory = require('../models/Inventory');
const { ingredientFilters } = require('../utils/checkoutPricing');

// @route   GET /api/orders/my-orders
// @desc    Get current user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const filter = { user: req.user._id };
    if (search) {
      if (search.toLowerCase() === 'cancelled') {
        filter.cancelledAt = { $exists: true };
      } else {
        filter.status = search;
        filter.cancelledAt = { $exists: false };
      }
    }
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/orders/summary
// @desc    Get dashboard totals (admin)
router.get('/summary', auth, adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    let timezone = 'Asia/Kolkata';
    if (typeof req.query.tz === 'string') {
      try {
        const requestedZone = new Intl.DateTimeFormat('en', { timeZone: req.query.tz });
        // Intl also accepts numeric offsets, but the dashboard expects an IANA zone.
        if (!/^[+-]/.test(req.query.tz)) timezone = requestedZone.resolvedOptions().timeZone;
      } catch {
        // Keep the default for an invalid timezone.
      }
    }
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);
    const windowStart = {
      $dateSubtract: {
        startDate: { $dateTrunc: { date: now, unit: 'day', timezone } },
        unit: 'day',
        amount: 6,
        timezone,
      },
    };

    const [totalOrders, pendingOrders, revenueResult, statusCounts, dailyOrders, topBases] = await Promise.all([
      Order.countDocuments({ cancelledAt: { $exists: false } }),
      Order.countDocuments({ status: { $nin: ['Delivered'] }, cancelledAt: { $exists: false } }),
      Order.aggregate([
        { $match: { cancelledAt: { $exists: false } } },
        { $group: { _id: null, revenue: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { cancelledAt: { $exists: false } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $lte: now },
            $expr: { $gte: ['$createdAt', windowStart] },
            cancelledAt: { $exists: false },
          },
        },
        {
          $group: {
            _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone } },
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
      ]),
      Order.aggregate([
        { $match: { cancelledAt: { $exists: false } } },
        { $project: { lines: { $cond: [
          { $gt: [{ $size: { $ifNull: ['$items', []] } }, 0] },
          '$items',
          [{ pizza: '$pizza', quantity: 1 }],
        ] } } },
        { $unwind: '$lines' },
        { $group: { _id: '$lines.pizza.base', count: { $sum: '$lines.quantity' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);
    const threshold = Number(process.env.STOCK_THRESHOLD) || 20;
    const lowStock = await Inventory.countDocuments({ quantity: { $lt: threshold } });

    const dailyMap = new Map(dailyOrders.map((item) => [item._id, item]));
    const lastSevenDays = [];
    // UTC arithmetic here steps through calendar labels, independent of DST.
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(`${today}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const data = dailyMap.get(key);
      lastSevenDays.push({
        date: key,
        label: date.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }),
        count: data?.count || 0,
        revenue: data?.revenue || 0,
      });
    }

    res.json({
      totalOrders,
      pendingOrders,
      lowStock,
      revenue: revenueResult[0]?.revenue || 0,
      statusCounts: Object.fromEntries(statusCounts.map((item) => [item._id, item.count])),
      dailyOrders: lastSevenDays,
      topBases: topBases.map((item) => ({ name: item._id, count: item.count })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (admin)
router.get('/', auth, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const filter = { cancelledAt: { $exists: false } };
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { 'pizza.base': { $regex: search, $options: 'i' } },
        { 'pizza.sauce': { $regex: search, $options: 'i' } },
        { 'pizza.cheese': { $regex: search, $options: 'i' } },
        { 'pizza.veggies': { $regex: search, $options: 'i' } },
        ...['name', 'pizza.base', 'pizza.sauce', 'pizza.cheese', 'pizza.veggies'].map((field) => ({
          [`items.${field}`]: { $regex: search, $options: 'i' },
        })),
        { 'deliveryAddress.city': { $regex: search, $options: 'i' } },
        { 'deliveryAddress.postalCode': { $regex: search, $options: 'i' } },
      ];
    }
    const [orders, total] = await Promise.all([
      Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (admin)
router.put('/:id/status', auth, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Order Placed', 'Order Received', 'In the Kitchen', 'Sent to Delivery', 'Delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (existingOrder.cancelledAt) {
      return res.status(400).json({ message: 'Cancelled orders cannot change status.' });
    }

    const currentIndex = validStatuses.indexOf(existingOrder.status);
    const nextIndex = validStatuses.indexOf(status);
    if (nextIndex < currentIndex) {
      return res.status(400).json({ message: 'Orders can only move forward through the delivery lifecycle.' });
    }

    const updates = { status, updatedAt: new Date() };
    if (status === 'Delivered' && existingOrder.paymentMethod === 'COD') {
      updates.paymentStatus = 'PAID';
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (['In the Kitchen', 'Sent to Delivery', 'Delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'This order can no longer be cancelled.' });
    }
    if (order.cancelledAt) {
      return res.status(400).json({ message: 'This order is already cancelled.' });
    }

    if (order.razorpayPaymentId && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: Math.round(order.totalPrice * 100),
      });
      order.refundId = refund.id;
    }

    const lines = order.items?.length ? order.items : [{ pizza: order.pizza, quantity: 1 }];
    for (const { pizza, quantity } of lines) {
      for (const filter of ingredientFilters(pizza)) {
        await Inventory.findOneAndUpdate(filter, { $inc: { quantity } });
      }
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Unable to cancel this order.' });
  }
});

module.exports = router;
