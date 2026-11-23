const express = require('express');
const cors = require('cors');
require('dotenv').config();
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const pizzaRoutes = require('./routes/pizza');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const inventoryRoutes = require('./routes/inventory');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  // Refreshing an authenticated session should not consume the sign-in budget.
  skip: (req) => req.method === 'GET' && req.path === '/me',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/pizza', pizzaRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5001;

const start = async () => {
  await connectDB();

  // Auto-seed on first run
  const User = require('./models/User');
  const Inventory = require('./models/Inventory');
  
  const adminExists = await User.findOne({ email: 'admin@pizzara.com' });
  if (!adminExists) {
    await User.create({ name: 'Admin', email: 'admin@pizzara.com', password: 'admin@123', role: 'admin', isVerified: true });
    console.log('Admin seeded: admin@pizzara.com / admin@123');
  }
  
  const invCount = await Inventory.countDocuments();
  if (invCount === 0) {
    const items = [
      { category: 'base', name: 'Thin Crust', quantity: 100, price: 120, image: '🫓' },
      { category: 'base', name: 'Thick Crust', quantity: 100, price: 140, image: '🍞' },
      { category: 'base', name: 'Stuffed Crust', quantity: 100, price: 180, image: '🥐' },
      { category: 'base', name: 'Gluten-Free', quantity: 100, price: 200, image: '🌾' },
      { category: 'base', name: 'Whole Wheat', quantity: 100, price: 150, image: '🌿' },
      { category: 'sauce', name: 'Marinara', quantity: 100, price: 40, image: '🍅' },
      { category: 'sauce', name: 'BBQ', quantity: 100, price: 50, image: '🔥' },
      { category: 'sauce', name: 'Alfredo', quantity: 100, price: 60, image: '🥛' },
      { category: 'sauce', name: 'Pesto', quantity: 100, price: 55, image: '🌿' },
      { category: 'sauce', name: 'Hot Sauce', quantity: 100, price: 45, image: '🌶️' },
      { category: 'cheese', name: 'Mozzarella', quantity: 100, price: 80, image: '🧀' },
      { category: 'cheese', name: 'Cheddar', quantity: 100, price: 90, image: '🧀' },
      { category: 'cheese', name: 'Parmesan', quantity: 100, price: 100, image: '🧀' },
      { category: 'cheese', name: 'Gouda', quantity: 100, price: 110, image: '🧀' },
      { category: 'cheese', name: 'Vegan Cheese', quantity: 100, price: 120, image: '🌱' },
      { category: 'veggie', name: 'Mushrooms', quantity: 100, price: 30, image: '🍄' },
      { category: 'veggie', name: 'Bell Peppers', quantity: 100, price: 25, image: '🫑' },
      { category: 'veggie', name: 'Onions', quantity: 100, price: 20, image: '🧅' },
      { category: 'veggie', name: 'Olives', quantity: 100, price: 35, image: '🫒' },
      { category: 'veggie', name: 'Tomatoes', quantity: 100, price: 25, image: '🍅' },
      { category: 'veggie', name: 'Jalapeños', quantity: 100, price: 30, image: '🌶️' },
      { category: 'veggie', name: 'Spinach', quantity: 100, price: 25, image: '🥬' },
      { category: 'veggie', name: 'Corn', quantity: 100, price: 20, image: '🌽' },
      { category: 'meat', name: 'Pepperoni', quantity: 100, price: 60, image: '🥓' },
      { category: 'meat', name: 'Chicken', quantity: 100, price: 70, image: '🍗' },
      { category: 'meat', name: 'Sausage', quantity: 100, price: 65, image: '🌭' },
      { category: 'meat', name: 'Bacon', quantity: 100, price: 75, image: '🥓' },
    ];
    await Inventory.insertMany(items);
    console.log(`Seeded ${items.length} inventory items.`);
  }

  app.listen(PORT, () => {
    console.log(`🍕 Server running on port ${PORT}`);
  });
};

start();

// Handle clean process termination (helps prevent port locking during watch restarts)
process.on('SIGINT', () => {
  console.log('\nShutting down server cleanly...');
  process.exit(0);
});