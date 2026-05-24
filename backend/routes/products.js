const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'images', 'products');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-');
    cb(null, `product-${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image_file');

const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

router.get('/', async (req, res) => {
  try {
    const filter = { is_active: true };
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    const products = await Product.find(filter).sort({ created_at: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, is_active: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, handleUpload, async (req, res) => {
  try {
    const {
      name, category, price, cost_price,
      description, badge, specs: rawSpecs, city,
    } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category and price are required.' });
    }

    let image = '';
    if (req.file) image = `/images/products/${req.file.filename}`;

    let specs = {};
    if (rawSpecs) { try { specs = JSON.parse(rawSpecs); } catch { specs = {}; } }

    let stockByCity = {};
    if (req.body.stock_by_city) {
      try { stockByCity = JSON.parse(req.body.stock_by_city); } catch {}
    }
    const totalStock = Object.values(stockByCity).reduce((s, v) => s + (Number(v) || 0), 0);

    const product = await Product.create({
      name, category,
      price:        parseFloat(price)      || 0,
      cost_price:   parseFloat(cost_price) || 0,
      city:         city || '',
      stock_by_city: stockByCity,
      stock:         totalStock,
      description:  description || '',
      badge:        badge       || '',
      image, specs,
      is_active: true,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, handleUpload, async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const {
      name, category, price, cost_price,
      description, badge, specs: rawSpecs, is_active, city,
    } = req.body;

    const update = {};
    if (name)                        update.name        = name;
    if (category)                    update.category    = category;
    if (price)                       update.price       = parseFloat(price)      || 0;
    if (cost_price !== undefined)    update.cost_price  = parseFloat(cost_price) || 0;
    if (description !== undefined)   update.description = description;
    if (badge !== undefined)         update.badge       = badge;
    if (is_active !== undefined)     update.is_active   = is_active;
    if (city !== undefined)          update.city        = city;

    if (req.body.stock_by_city !== undefined) {
      let stockByCity = {};
      try { stockByCity = JSON.parse(req.body.stock_by_city); } catch {}
      update.stock_by_city = stockByCity;
      update.stock = Object.values(stockByCity).reduce((s, v) => s + (Number(v) || 0), 0);
    }

    if (req.file) {
      update.image = `/images/products/${req.file.filename}`;
      if (existing.image && existing.image.startsWith('/images/products/')) {
        const oldPath = path.join(__dirname, '..', 'public', existing.image);
        fs.unlink(oldPath, () => {});
      }
    }

    // Specs
    if (rawSpecs) {
      try { update.specs = JSON.parse(rawSpecs); } catch { /* keep existing */ }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(product);
  } catch (err) {
    console.error('PUT /products error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;