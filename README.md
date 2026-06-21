# EcoRide UK (MERN Stack)

A full-featured e-scooter e-commerce platform with customer auth, shopping cart, multi-city driver routing, postcode-based distance calculation, live chat support, and profit tracking.

---

##  Features

### Customer
- Register / Login (JWT-based auth)
- Browse products, view product details, customer reviews
- Shopping cart — persists for logged-in users (MongoDB) and guest users (memory)
- Cart checkout — place multiple items in one go
- Order history — track all past orders
- Live chat widget for support
- Contact form

### Driver Portal (`/driver`)
- Separate driver login
- Postcode update — driver enters current location so admin can calculate distances
- Order view — drivers only see orders assigned to them
- Status updates — mark orders as Dispatched / Delivered
- Earnings tracking — driver earns £/mile × distance on delivery
- Driver payment history

### Admin Panel (`/admin`)
- Dashboard with revenue, stock cost, driver payments, and net profit overview
- Product & stock management (per-city stock levels)
- Order management with city detection, distance calculator, and driver assignment
- Driver management (accounts, pay rates, payments)
- Customer management
- City management
- Reviews management
- Contact message inbox
- Live chat (admin side)
- Promotional video management
- Site settings
- Admin account management (multiple admin roles)

---

##  Tech Stack

- **Frontend:** React 18, React Router 6, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + Express Sessions (connect-mongo store)
- **File/Image Hosting:** Cloudinary (via Multer)

---

##  Project Structure

```
EcoRide UK/
├── backend/
│   ├── models/          # Mongoose schemas (Admin, Customer, Driver, Product,
│   │                    #   Order, Cart, Offer, Review, Chat, Message, City,
│   │                    #   Contact, DriverPayment, LocationRequest, Video,
│   │                    #   SiteSetting)
│   ├── routes/          # Express route handlers (one file per resource)
│   ├── middleware/       # Auth middleware (admin / customer / driver guards)
│   ├── utils/            # Cloudinary config
│   ├── public/images     # Static image assets
│   └── server.js         # App entry point
└── frontend/
    └── src/
        ├── components/   # Navbar, Footer, ChatWidget, CookieBanner
        ├── context/      # AdminContext, CustomerContext, DriverContext
        ├── pages/         # Customer-facing pages
        │   ├── admin/    # Admin panel pages
        │   └── driver/   # Driver panel pages
        ├── App.jsx        # Routes
        └── axiosConfig.js # Axios instance config
```

---

##  Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- A Cloudinary account (for image uploads)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the following keys:

```
MONGO_URI=
JWT_SECRET=
SESSION_SECRET=
CLIENT_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PORT=
```

Then run:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

##  Login URLs

| Role     | URL             | Notes                                  |
|----------|-----------------|-----------------------------------------|
| Admin    | `/admin/login`  | Set up via backend admin seeding/creation |
| Driver   | `/driver`       | Account created by admin via Admin → Drivers |
| Customer | `/login`        | Self-register                          |

---

##  Admin Workflow — New Order

1. Order comes in (shown as **Pending** in Admin → Orders)
2. Admin opens the order and sees customer postcode with distances to all drivers (auto-calculated)
3. Admin assigns the nearest suitable driver, or routes to a partner if no driver fits
4. Driver sees the order in their portal and updates status: Dispatched → Delivered
5. Profit is auto-calculated: **Sale Price − Cost Price − Driver Pay = Net Profit**

---

##  Profit Tracking

1. **Admin → Products** — set cost price (supplier buy price) per product
2. **Admin → Drivers** — set pay rate (£/mile) per driver
3. Distance is auto-filled from the distance calculator when assigning an order
4. Driver pay = `pay_rate × distance`
5. Profit = `sale_price − cost_price − driver_pay`
6. Totals are visible on **Admin → Dashboard**

---

##  How Distance Calculation Works

The system uses UK postcode area centroids with the Haversine formula to calculate approximate straight-line distances between customer and driver postcodes. For production-grade accuracy, this can be swapped for the [postcodes.io](https://postcodes.io) API, which returns exact lat/lng for any UK postcode.

---

##  City Detection

Orders are auto-tagged by postcode area into supported cities (e.g. London, Birmingham) or routed to a partner if outside the supported delivery zones.

---

##  Notes

- Image uploads are handled via Cloudinary, not local disk storage.
- Expired promotional offers are automatically cleaned up by a scheduled job in the backend.