# E-Scooter UK — v2.0 (MERN Stack)

A full-featured e-scooter e-commerce platform with customer auth, shopping cart, multi-city driver routing, postcode-based distance calculation, and profit tracking.

---

## 🆕 What's New in v2.0

### Customer Features
- **Register / Login** — JWT-based auth. Sign In / Create Account from the navbar.
- **Shopping Cart** — Add to Cart from any product page. Cart persists for logged-in users (MongoDB) and guest users (memory).
- **Cart Checkout** — Place multiple items in one go from the cart.
- **Order History** — Logged-in customers can track all their past orders.

### Driver System
- **Driver Portal** — Separate login at `/driver`
- **Postcode Update** — Driver enters their current postcode after login so admin can calculate distances.
- **Order View** — Drivers only see orders assigned to them (customer name, phone, address, product, amount).
- **Status Updates** — Driver marks orders as Dispatched or Delivered.
- **Earnings Tracking** — Driver earns £/mile × distance when they mark an order as Delivered.

### Admin — Order Routing
- **City Detection** — Orders auto-tagged London / Birmingham / Other from postcode area.
- **Distance Calculator** — Admin opens any order → sees all drivers sorted by distance from customer postcode (Haversine formula using postcode area centroids).
- **Driver Assignment** — Click a driver row to select, set distance (auto-filled), click Assign.
- **Partner Routing** — If no driver is right, set Stock Source = Partner and enter partner name/city.
- **City Filter** — Filter orders by London / Birmingham / Other.

### Admin — Profit Tracking
- **Cost Price per Product** — Set cost price (your buy price from supplier) on each product.
- **Per-City Stock** — Each product has separate London and Birmingham stock. Orders auto-deduct from the right city.
- **Profit Formula**: `Sale Price − Cost Price − Driver Pay = Net Profit`
- **Driver Pay** = `£/mile × distance miles` (set per driver, calculated on assignment)
- **Dashboard** shows: Total Revenue, Stock Cost, Driver Payments, Net Profit — all for Delivered orders.

---

## 📁 Project Structure

```
escooter-updated/
├── backend/
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Customer.js       ← updated: has password/auth
│   │   ├── Driver.js         ← NEW: driver accounts
│   │   ├── Product.js        ← updated: stock_london, stock_birmingham, cost_price
│   │   ├── Order.js          ← updated: city, driver, profit, cost_price fields
│   │   ├── Cart.js           ← NEW: shopping cart
│   │   └── SiteSetting.js
│   ├── routes/
│   │   ├── admin.js          ← updated: profit dashboard, customer list
│   │   ├── customers.js      ← updated: register/login/cart JWT auth
│   │   ├── drivers.js        ← NEW: driver login, postcode, orders
│   │   ├── orders.js         ← updated: city routing, distance, driver assign
│   │   ├── products.js       ← updated: cost_price, per-city stock
│   │   └── settings.js
│   ├── middleware/
│   │   └── authMiddleware.js ← updated: requireAdmin + requireCustomer + requireDriver
│   ├── server.js             ← updated: /api/drivers route added
│   ├── package.json          ← updated: jsonwebtoken added
│   └── .env                  ← updated: JWT_SECRET added
└── frontend/src/
    ├── context/
    │   ├── AdminContext.jsx
    │   └── CustomerContext.jsx  ← NEW: customer auth + cart state
    ├── components/
    │   ├── Navbar.jsx           ← updated: cart icon, Sign In/Out, cart count badge
    │   └── Footer.jsx
    ├── pages/
    │   ├── HomePage.jsx
    │   ├── ProductsPage.jsx
    │   ├── ProductDetailPage.jsx  ← updated: Add to Cart button
    │   ├── CheckoutPage.jsx       ← updated: passes customer_id
    │   ├── CartPage.jsx           ← NEW: view/manage cart
    │   ├── CartCheckoutPage.jsx   ← NEW: checkout all cart items
    │   ├── CustomerAuthPage.jsx   ← NEW: register/login page
    │   ├── MyOrdersPage.jsx
    │   ├── DriverLogin.jsx        ← NEW: driver portal (login + dashboard)
    │   └── admin/
    │       ├── AdminLogin.jsx
    │       ├── AdminLayout.jsx    ← updated: Drivers nav link added
    │       ├── AdminDashboard.jsx ← updated: profit breakdown cards
    │       ├── AdminOrders.jsx    ← updated: city filter, distance calc, driver assign, profit cols
    │       ├── AdminDrivers.jsx   ← NEW: manage driver accounts
    │       ├── AdminProducts.jsx  ← updated: cost_price + per-city stock fields
    │       ├── AdminStock.jsx     ← updated: per-city stock management
    │       ├── AdminCustomers.jsx ← updated: uses /api/admin/customers
    │       └── AdminSettings.jsx
    └── App.jsx                    ← updated: all new routes
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
# Edit .env with your MONGO_URI and secrets
npm run dev
```

**First time:** Create the default admin account:
```bash
curl -X POST http://localhost:5000/api/admin/seed
# Username: admin  Password: admin123
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🔑 Login URLs

| Role | URL | Default Credentials |
|------|-----|---------------------|
| Admin | `/admin/login` | admin / admin123 (after seeding) |
| Driver | `/driver` | Set by admin via Admin → Drivers |
| Customer | `/login` | Self-register |

---

## 💡 Admin Workflow — New Order

1. Order comes in (shown as **Pending** in Admin → Orders)
2. Click **Manage** on the order
3. See customer postcode and **distances to all drivers** (auto-calculated)
4. **London/Birmingham orders** → pick your London or Birmingham driver
5. **Other city orders** → set Stock Source = Partner, enter partner name
6. Click **Assign Driver** or **Send to Partner**
7. Driver sees it in their portal, marks Dispatched → Delivered
8. Profit auto-calculated: **Sale − Cost − Driver Pay = Profit**

---

## 💰 Profit Tracking Setup

1. **Admin → Products** → set **Cost Price** for each product (what you paid the supplier)
2. **Admin → Drivers** → set **Pay Rate (£/mile)** for each driver
3. When assigning an order, **distance is auto-filled** from the distance calculator
4. Driver pay = `pay_rate × distance`
5. Profit = `sale_price − cost_price − driver_pay`
6. See totals on **Admin → Dashboard**

---

## 🗺️ How Distance Works

The system uses **UK postcode area centroids** (e.g. SW = Central London, B = Birmingham) with the Haversine formula to calculate approximate straight-line distances. For production accuracy, integrate [postcodes.io](https://postcodes.io) API which gives exact lat/lng for every UK postcode — replace the `postcodeToApproxCoords` function in `backend/routes/orders.js`.

---

## 🏙️ City Detection Logic

| Postcode Areas | City |
|----------------|------|
| E, EC, N, NW, SE, SW, W, WC, BR, CR, DA, EN, HA, IG, KT, RM, SM, TW, UB, WD | London |
| B, CV, WS, WV, DY | Birmingham |
| Everything else | Other (→ Partner routing) |
