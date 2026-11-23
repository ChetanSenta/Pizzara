<div align="center">

# <img src="frontend/public/pizzara-logo.svg" width="32" height="32" alt=""> Pizzara — Pizza Store Ordering & Management

**OIBSIP Web Development & Designing | Level 3 – Final Task**

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://github.com/ChetanSenta/Pizzara)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

Pizzara brings customer ordering and day-to-day store operations into one app. Customers can order from the menu or build a custom pizza for **Eat in shop** or **Home delivery**. Store staff can track orders, collect cash payments, and manage ingredient stock.

</div>

---

## <img src="docs/icons/target.svg" width="24" height="24" alt=""> Project Objective

The project connects each customer order to the work it creates in the store. Checkout validates stock and calculates the total. Staff can then see what to prepare, how to fulfill the order, and whether payment has been collected.

---

## <img src="frontend/public/pizzara-logo.svg" width="24" height="24" alt=""> Feature Highlights

### <img src="docs/icons/utensils.svg" width="20" height="20" alt=""> Customer Experience

| Feature | What it does |
| --- | --- |
| <img src="docs/icons/lock.svg" width="16" height="16" alt=""> Account access | Create an account, sign in, or reset a password. The backend uses JWT sessions, bcrypt password hashing, and email verification links. |
| <img src="frontend/public/pizzara-logo.svg" width="16" height="16" alt=""> Pizza Builder | Browse the menu, filter vegetarian and non-vegetarian pizzas, and sort by price. Customize a pizza by choosing its base, sauce, cheese, and toppings. |
| <img src="docs/icons/eye.svg" width="16" height="16" alt=""> Live Preview | Layered ingredient images update as selections change. |
| <img src="docs/icons/utensils.svg" width="16" height="16" alt=""> Eat in shop | Check out with a name and mobile number. Orders have no delivery fee and progress through **Ready to serve** and **Served**. |
| <img src="docs/icons/truck.svg" width="16" height="16" alt=""> Home Delivery | Check out with a delivery address. Delivery costs ₹49 below a ₹999 subtotal and is free from ₹999. |
| <img src="docs/icons/credit-card.svg" width="16" height="16" alt=""> Payments | Pay online through Razorpay test mode, pay cash at the shop, or choose cash on delivery. |
| <img src="docs/icons/receipt.svg" width="16" height="16" alt=""> My Orders | Track order and payment status, reorder past purchases, and cancel eligible orders. |

### <img src="docs/icons/store.svg" width="20" height="20" alt=""> Admin Panel

| Feature | What it does |
| --- | --- |
| <img src="docs/icons/chart.svg" width="16" height="16" alt=""> Dashboard | Revenue, total and pending orders, recent orders, low-stock totals, and a seven-day order activity chart in the viewer’s time zone. |
| <img src="docs/icons/package.svg" width="16" height="16" alt=""> Inventory Control | Manage ingredient prices and quantities for bases, sauces, cheeses, vegetables, and meats in table or grid view. Search, sort, and filter low-stock items. Checkout checks and deducts the required stock. |
| <img src="docs/icons/shopping-bag.svg" width="16" height="16" alt=""> Order Management | Search and filter orders by status and date, see customer phone numbers and order type, and update order status. Cash payments are marked paid when the order is delivered or served. |
| <img src="docs/icons/mail.svg" width="16" height="16" alt=""> Email Alerts | Send restock notifications when stock falls below the configured threshold (20 units by default) and email is configured. |

---

## <img src="docs/icons/layers.svg" width="24" height="24" alt=""> Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 and Vite, React Router v7 with customer and admin route guards, Axios, Lucide icons, and responsive CSS |
| Frontend state | React context for authentication, the cart, and toast notifications |
| Backend | Node.js and Express REST API with JWT authentication and bcrypt password hashing |
| Database | MongoDB with Mongoose models for users, orders, inventory, and pending online checkouts |
| Payments | Razorpay test SDK for order creation, HMAC signature verification, and payment capture |
| Email | Nodemailer for verification, password reset, and low-stock notifications |

---

## <img src="docs/icons/folder-tree.svg" width="24" height="24" alt=""> Project Structure

```
Pizzara/
├── frontend/               # Vite + React 19 client
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page views
│   │   ├── context/        # Auth, cart, and toast providers
│   │   ├── styles/         # Shared tokens and styles
│   │   └── assets/         # Static assets
│   └── package.json
├── backend/                # Node.js + Express API server
│   ├── models/             # Mongoose schemas (User, Order, Inventory)
│   ├── routes/             # Auth, orders, payments, and inventory
│   ├── middleware/         # JWT auth & role-check middleware
│   ├── utils/              # Checkout pricing, stock, and email helpers
│   ├── seed/               # DB seed script
│   ├── test/               # Checkout and order regression tests
│   └── package.json
├── docs/icons/             # README icons matching the app
├── .gitignore
└── README.md
```

---

## <img src="docs/icons/zap.svg" width="24" height="24" alt=""> Getting Started

### Prerequisites

- Node.js 20.19 or later on the 20.x line, or Node.js 22.12 or later
- A running MongoDB instance, locally or on MongoDB Atlas
- Razorpay test credentials for online checkout
- Gmail SMTP credentials for verification, password reset, and low-stock emails

Local cash checkout works without Razorpay or email credentials.

### 1. Clone the repository and install backend dependencies

```bash
git clone https://github.com/ChetanSenta/Pizzara.git
cd Pizzara/backend
npm ci
cp .env.example .env
```

### 2. Configure and start the API

Edit `backend/.env` before starting the server. The key settings are below.

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | A unique random secret for signing session tokens |
| `PORT`, `CLIENT_URL` | API port and browser app URL. The local defaults are `5001` and `http://localhost:5173`. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Test credentials for online payments |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail address and app password for SMTP |
| `ADMIN_EMAIL`, `STOCK_THRESHOLD` | Low-stock alert recipient and ingredient threshold. The threshold defaults to 20 units. |

```bash
npm run dev
```

The API runs at `http://localhost:5001` by default. On first run, the backend creates a local demo admin and seeds the inventory if it is empty.

### 3. Start the frontend

Open a second terminal at the repository root.

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. Update `VITE_API_URL` in `frontend/.env` if the API uses a different host or port. For online checkout, set `VITE_RAZORPAY_KEY_ID` to the backend’s Razorpay test key ID. Keep the key secret in the backend environment.

### <img src="docs/icons/key.svg" width="20" height="20" alt=""> Local Demo Admin

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@pizzara.com` | `admin@123` |

> <img src="docs/icons/alert.svg" width="16" height="16" alt=""> Use these credentials for local development only. Replace the default admin credentials before exposing the app to other users.

---

## <img src="docs/icons/list.svg" width="24" height="24" alt=""> Application Walkthrough

### <img src="docs/icons/chef-hat.svg" width="20" height="20" alt=""> Custom Pizza Builder

Choose a base, sauce, cheese, and toppings. The preview layers ingredient images as selections change, and the builder shows a running total before the review step.

### <img src="docs/icons/credit-card.svg" width="20" height="20" alt=""> Checkout & Payments

Customers select their fulfillment and payment methods at checkout. The backend calculates the subtotal, adds 5% tax rounded to the nearest rupee, and applies a delivery fee when applicable. It verifies online payments before confirming the order. Cash orders stay pending until staff mark them **Delivered** or **Served**. Completing checkout checks and deducts ingredient stock and can trigger a low-stock alert.

### <img src="docs/icons/chart.svg" width="20" height="20" alt=""> Admin Dashboard

Use the dashboard to review recent orders and activity. Open **Admin Orders** to see contact details, filter orders, and update fulfillment. Open **Inventory Management** to add or edit ingredients, adjust stock, or inspect low-stock items.

---

## <img src="docs/icons/zap.svg" width="24" height="24" alt=""> Build and Test

Run these commands from the repository root after installing dependencies in both folders.

```bash
(cd frontend && npm run build)
node --test backend/test/*.test.js
```

The backend suite covers cart pricing, dine-in and delivery, cash and mocked Razorpay checkout, stock rollback, and compatibility with older orders.

---

## <img src="docs/icons/book.svg" width="24" height="24" alt=""> Key Engineering Concepts Practiced

- Full-stack MERN application architecture
- REST API design with role-based access control
- JWT authentication flow with email verification
- NoSQL schema design and data seeding
- Payment gateway integration and HMAC signature verification
- Stock threshold checks and transactional email notifications
- Component-level state management in React 19
- Responsive design with CSS custom properties and animations

---

## <img src="docs/icons/heart.svg" width="24" height="24" alt=""> Acknowledgements

Developed as **Level 3 – Final Task** for the **Web Development & Designing** domain internship at **[Oasis Infobyte (OIBSIP)](https://oasisinfobyte.com/)**.

---

<div align="center">

Built by [Chetan Senta](https://github.com/ChetanSenta)

</div>
