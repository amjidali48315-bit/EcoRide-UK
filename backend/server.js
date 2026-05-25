const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const session    = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CLIENT_URL || 'https://eco-ride-uk-frontend.vercel.app',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/images', express.static('public/images'));
app.use('/videos', express.static('public/videos'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'escooter_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge:   1000 * 60 * 60 * 24 * 7,
    secure:   true,
    httpOnly: true,
    sameSite: 'none',
  },
}));

const Offer   = require('./models/Offer');
const Product = require('./models/Product');
const path    = require('path');
const fs      = require('fs');

async function cleanupExpiredOffers() {
  try {
    const expired = await Offer.find({ expires_at: { $lte: new Date() } });
    if (expired.length === 0) return;
    for (const offer of expired) {
      if (offer.product_id) {
        const product = await Product.findByIdAndDelete(offer.product_id);
        if (product?.image && product.image.startsWith('/images/')) {
          fs.unlink(path.join(__dirname, 'public', product.image), () => {});
        }
      }
      if (offer.image && offer.image.startsWith('/images/offers/')) {
        fs.unlink(path.join(__dirname, 'public', offer.image), () => {});
      }
      await Offer.findByIdAndDelete(offer._id);
    }
    console.log(`[Cleanup] Removed ${expired.length} expired offer(s).`);
  } catch (err) {
    console.error('[Cleanup] Error:', err.message);
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    cleanupExpiredOffers();
    setInterval(cleanupExpiredOffers, 5 * 60 * 1000);
  })
  .catch(err => console.error('MongoDB error:', err));

app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/drivers',   require('./routes/drivers'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/offers',    require('./routes/offers'));
app.use('/api/videos',    require('./routes/videos'));
app.use('/api/reviews',   require('./routes/reviews'));
app.use('/api/contacts',  require('./routes/contacts'));
app.use('/api/cities',    require('./routes/cities'));
app.use('/api/chats',     require('./routes/chats'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
