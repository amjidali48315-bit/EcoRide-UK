const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const Offer   = require('../models/Offer');
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'images', 'offers');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-');
    cb(null, `offer-${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Images only (jpg, png, webp, gif).'));
  },
  limits: { fileSize: 8 * 1024 * 1024 },
});

const handleUpload = (req, res, next) => {
  upload.single('image_file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

async function deleteLinkedProduct(productId) {
  if (!productId) return;
  try {
    const product = await Product.findByIdAndDelete(productId);
    if (product?.image && product.image.startsWith('/images/')) {
      fs.unlink(path.join(__dirname, '..', 'public', product.image), () => {});
    }
  } catch (err) {
    console.error('deleteLinkedProduct error:', err.message);
  }
}

router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find({ is_active: true }).sort({ sort_order: 1, created_at: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', requireAdmin, async (req, res) => {
  try {
    const offers = await Offer.find().sort({ sort_order: 1, created_at: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, handleUpload, async (req, res) => {
  try {
    const {
      title, subtitle, label, discount, expires_at, btn_text, sort_order, price,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ error: 'Offer title is required.' });
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)
      return res.status(400).json({ error: 'A valid product price is required.' });

    const image    = req.file ? `/images/offers/${req.file.filename}` : '';
    const category = 'Offers';

    let stockByCity = {};
    if (req.body.stock_by_city) {
      try { stockByCity = JSON.parse(req.body.stock_by_city); } catch {}
    }
    const totalStock = Object.values(stockByCity).reduce((s, v) => s + (Number(v) || 0), 0);

    const product = await Product.create({
      name:          title.trim(),
      category,
      price:         parseFloat(price),
      cost_price:    0,
      stock_by_city: stockByCity,
      stock:         totalStock,
      description:   subtitle || '',
      badge:         label    || '',
      image,
      is_active:     true,
    });

    const offer = await Offer.create({
      title:       title.trim(),
      subtitle:    subtitle || '',
      label:       label    || '',
      discount:    discount || '',
      expires_at:  expires_at ? new Date(expires_at) : null,
      link:        `/products/${product._id}`,
      btn_text:    btn_text || 'Shop Now',
      sort_order:  parseInt(sort_order) || 0,
      image,
      is_active:   true,
      product_id:  product._id,
      price:       parseFloat(price),
      category,
      stock_by_city: stockByCity,
    });

    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, handleUpload, async (req, res) => {
  try {
    const existing = await Offer.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Offer not found.' });

    const {
      title, subtitle, label, discount, expires_at, btn_text, sort_order, is_active, price,
    } = req.body;

    const newImage      = req.file ? `/images/offers/${req.file.filename}` : null;
    if (newImage && existing.image && existing.image.startsWith('/images/offers/')) {
      fs.unlink(path.join(__dirname, '..', 'public', existing.image), () => {});
    }
    const resolvedImage    = newImage || existing.image;
    const resolvedPrice    = price ? parseFloat(price) : existing.price;
    const resolvedCategory = 'Offers';

    let stockByCity = existing.stock_by_city || {};
    if (req.body.stock_by_city !== undefined) {
      try { stockByCity = JSON.parse(req.body.stock_by_city); } catch {}
    }
    const totalStock = Object.values(stockByCity).reduce((s, v) => s + (Number(v) || 0), 0);

    const update = {
      title:       title ? title.trim() : existing.title,
      subtitle:    subtitle  !== undefined ? subtitle  : existing.subtitle,
      label:       label     !== undefined ? label     : existing.label,
      discount:    discount  !== undefined ? discount  : existing.discount,
      btn_text:    btn_text  || existing.btn_text,
      sort_order:  sort_order !== undefined ? parseInt(sort_order) || 0 : existing.sort_order,
      is_active:   is_active  !== undefined ? (is_active === 'true' || is_active === true) : existing.is_active,
      expires_at:  expires_at === '' ? null : expires_at ? new Date(expires_at) : existing.expires_at,
      image:       resolvedImage,
      price:       resolvedPrice,
      category:    resolvedCategory,
      stock_by_city: stockByCity,
      link:        existing.link,
    };

    if (existing.product_id) {
      await Product.findByIdAndUpdate(existing.product_id, {
        name:          update.title,
        category:      resolvedCategory,
        price:         resolvedPrice,
        stock_by_city: stockByCity,
        stock:         totalStock,
        description:   update.subtitle,
        badge:         update.label,
        image:         resolvedImage,
        is_active:     update.is_active,
      });
    }

    const offer = await Offer.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found.' });

    // Delete offer image from disk
    if (offer.image && offer.image.startsWith('/images/offers/')) {
      fs.unlink(path.join(__dirname, '..', 'public', offer.image), () => {});
    }

    await deleteLinkedProduct(offer.product_id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;