# Pizzara — Pizza Store Ordering & Management

Pizzara is a web app for running a pizza store. Customers can order from the menu or build a custom pizza, then choose **Eat in shop** or **Home delivery**. Store staff use the admin dashboard to manage orders and ingredient stock in one place.

## Customer ordering

- **Menu and custom pizzas** — Browse the menu, filter vegetarian and non-vegetarian pizzas, sort by price, or choose your own base, sauce, cheese, and toppings with a live preview.
- **Eat in shop** — Check out with a name and mobile number. There is no delivery fee. Customers can track the order through **Ready to serve** and **Served**.
- **Home delivery** — Enter a delivery address at checkout and track the order through delivery. The delivery fee is ₹49 below a ₹999 subtotal and free from ₹999.
- **Payment options** — Pay online with Razorpay in test mode, pay cash at the shop, or choose cash on delivery.
- **My Orders** — View order history, track status, reorder a past purchase, or cancel an eligible order.

## Store operations

- **Dashboard** — Review order activity, recent orders, revenue, and low-stock totals.
- **Order management** — Filter orders, see the payment method and fulfillment type, update order status, and find customer phone numbers.
- **Ingredient inventory** — Manage quantities and prices for bases, sauces, cheeses, vegetables, and meats. Checkout checks and deducts stock, and the admin can filter for ingredients with fewer than 20 units.
- **Notifications** — Send low-stock alerts when email is configured.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios, Lucide, CSS |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Authentication and email | JWT, bcryptjs, Nodemailer |
| Online payments | Razorpay test mode |

## Run locally

Use Node.js 20.19+ on the 20.x line, or 22.12+, and a running MongoDB instance.

```bash
git clone https://github.com/ChetanSenta/Pizzara.git
cd Pizzara/backend
npm ci
cp .env.example .env
```

Set `MONGO_URI` and a unique `JWT_SECRET` in `backend/.env`. Set the Razorpay test keys to test online payment and configure email credentials to test email delivery. Cash checkout works without Razorpay keys.

```bash
npm run dev
```

The API defaults to `http://localhost:5001`. On first run, it seeds inventory and creates a local demo admin. Replace the default demo credentials before exposing the API to other users.

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

The app defaults to `http://localhost:5173`. If you use a different backend address, update `VITE_API_URL` in `frontend/.env`. Set `VITE_RAZORPAY_KEY_ID` to the same test key ID used by the backend for online checkout.

## Build and test

Run these commands from the repository root after installing dependencies:

```bash
(cd frontend && npm run build)
node --test backend/test/*.test.js
```

## Acknowledgements

The original version was developed for the [Oasis Infobyte](https://oasisinfobyte.com/) Web Development & Designing internship.

Built by [Chetan Senta](https://github.com/ChetanSenta).
