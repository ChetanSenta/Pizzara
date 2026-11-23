<div align="center">

# <img src="frontend/public/pizzara-logo.svg" width="32" height="32" alt=""> Pizzara — Pizza Store Ordering & Management

**OIBSIP Web Development & Designing | Level 3 – Final Task**

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://github.com/ChetanSenta/Pizzara)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.12+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

A web app for running a pizza store. Customers can browse the menu or build a custom pizza, then choose **Eat in shop** or **Home delivery**. Staff can manage orders, payments, and ingredient stock from the admin panel.

</div>

---

## 🎯 Project Objective

Help a pizza store take orders for dine-in and home delivery. Customers can create an account, customize a pizza with a live preview, pay online or with cash, and follow their order status. Staff can manage fulfillment, track payment status, update ingredient stock, and receive low-stock email alerts.

---

## 🍕 Feature Highlights

### 🍽️ Customer Experience
| Feature | Description |
|---|---|
| 🔐 Secure Auth | JWT-based login and registration, bcrypt password hashing, and email verification and password reset flows |
| 🍕 Pizza Builder | Step-by-step customizer — base, sauce, cheese, veggies, and meat toppings |
| 👀 Live Preview Canvas | Layered transparent PNG overlays with fade-in animations for a food-photography feel |
| 🍽️ Eat in shop | Check out with a name and mobile number. Orders have no delivery fee and progress through **Ready to serve** and **Served**. |
| 🚚 Home Delivery | Check out with a delivery address. Delivery costs ₹49 below a ₹999 subtotal and is free from ₹999. |
| 💳 Payments | Razorpay online payments with signature verification in test mode, cash at the shop, and cash on delivery |
| 🧾 My Orders | Track order and payment status, reorder past purchases, and cancel eligible orders |

### 🏪 Admin Panel
| Feature | Description |
|---|---|
| 📊 Dashboard | Revenue, total and pending orders, recent orders, low-stock totals, and a seven-day order activity chart |
| 🧀 Inventory Control | Manage ingredient prices and quantities for bases, sauces, cheeses, vegetables, and meats in table or grid view. Search, sort, and filter low-stock items. Checkout checks and deducts the required stock. |
| 📋 Order Management | Search and filter orders by status and date, see customer phone numbers and order type, and update order status. Cash payments are marked paid when the order is delivered or served. |
| 🔔 Email Alerts | Restock notifications when ingredient stock is below the configured threshold (20 by default) and email is configured |

---

## 🛠️ Tech Stack

### Frontend
- **Vite + React 19** — Fast, modular UI with hot module replacement
- **React Router v7** — Declarative client-side routing with `ProtectedRoute` and `AdminRoute` guards
- **Axios** — Promise-based HTTP client for all API interactions
- **React toast context** — Non-blocking notifications with a shared provider
- **Vanilla CSS** — Custom responsive styling with glassmorphism aesthetics and keyframe animations

### Backend
- **Node.js + Express.js** — RESTful API server
- **MongoDB + Mongoose ODM** — Schema design for `User`, `Order`, and `Inventory` collections
- **JWT + bcryptjs** — Token-based session management and secure password hashing
- **Nodemailer** — SMTP transactional email for verification and admin stock alerts

### Payment Gateway
- **Razorpay SDK (Test Mode)** — Order creation, payment simulation, and HMAC signature verification

---

## 🗂️ Project Structure

```
Pizzara/
├── frontend/               # Vite + React 19 client
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page views
│   │   ├── context/        # Auth & cart context providers
│   │   └── assets/         # Static assets
│   └── package.json
├── backend/                # Node.js + Express API server
│   ├── models/             # Mongoose schemas (User, Order, Inventory)
│   ├── routes/             # Auth, order, inventory, admin routes
│   ├── middleware/         # JWT auth & role-check middleware
│   ├── utils/              # Nodemailer & Razorpay helpers
│   ├── seed/               # DB seed script
│   ├── test/               # Checkout and order regression tests
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Frontend environment

Copy the example environment file before starting the client:

```bash
cd frontend
cp .env.example .env
```

Set `VITE_API_URL` and `VITE_RAZORPAY_KEY_ID` in `.env`.

### Prerequisites
- Node.js 20.19+ on the 20.x line, or Node.js 22.12+
- MongoDB (local instance or MongoDB Atlas)
- Razorpay account (test mode keys)
- Gmail SMTP credentials for email delivery (optional for local cash checkout)

---

### 1. Clone the Repository

```bash
git clone https://github.com/ChetanSenta/Pizzara.git
cd Pizzara
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/pizza-delivery
JWT_SECRET=your-secret-jwt-key

# Razorpay (test mode)
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Gmail SMTP (optional for local cash checkout)
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

ADMIN_EMAIL=admin@pizzara.com
CLIENT_URL=http://localhost:5173
STOCK_THRESHOLD=20
```

The backend seeds default inventory and a local demo admin on first run.

Start the development server:

```bash
npm run dev
```

> API runs at **http://localhost:5001**

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

> App runs at **http://localhost:5173**

From the repository root, run `cd frontend && npm run build` to build the frontend, or `node --test backend/test/*.test.js` to run the backend regression tests.

---

### 🔑 Default Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@pizzara.com` | `admin@123` |

> ⚠️ Change these credentials before deploying to production.

---

## 📸 Application Walkthrough

### 👨‍🍳 Custom Pizza Builder
The builder walks users through a step-by-step ingredient selection flow. Each choice instantly updates a layered preview canvas — transparent PNG overlays are composited in real time to show crust thickness, sauce color, melted cheese, and stacked toppings with fade-in animations.

### 💳 Checkout & Payments
Customers choose eat-in or home delivery at checkout. The backend computes prices and checks ingredient availability for both types. For online payment, it creates a Razorpay test order and verifies the payment before confirming the order. For cash, it records the order as payment pending and marks it paid when staff mark the order Delivered or Served. Checkout deducts ingredient stock and can send a low-stock email alert.

### 📊 Admin Dashboard
The dashboard shows order activity, recent orders, revenue, and low-stock totals. Staff can then open Admin Orders to update fulfillment status or Inventory Management to edit ingredient details and adjust stock.

---

## 📚 Key Engineering Concepts Practiced

- Full-stack MERN application architecture
- REST API design with role-based access control
- JWT authentication flow with email verification
- NoSQL schema design and data seeding
- Payment gateway integration and HMAC signature verification
- Automated background processes (stock threshold monitoring)
- Component-level state management in React 19
- Responsive design with CSS custom properties and animations

---

## 🙏 Acknowledgements

Developed as **Level 3 – Final Task** for the **Web Development & Designing** domain internship at **[Oasis Infobyte (OIBSIP)](https://oasisinfobyte.com/)**.

---

<div align="center">

Built by [Chetan Senta](https://github.com/ChetanSenta)

</div>
