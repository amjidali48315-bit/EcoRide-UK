const router  = require('express').Router();
const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/authMiddleware');
const { createUploader, deleteImage } = require('../utils/cloudinary');

// Single image uploader for main image
const uploadSingle = createUploader('ecoride-products', 1);
// Multiple images uploader (up to 5)
const uploadMulti  = createUploader('ecoride-products', 5);

const handleUpload = (req, res, next) => {
  uploadMulti(req, res, (err) => {
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

router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: -1 });
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
    const { name, category, price, cost_price, description, badge, specs: rawSpecs, city } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category and price are required.' });
    }

    // Handle multiple uploaded images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => f.path);
    }
    const image = images[0] || '';

    let specs = {};
    if (rawSpecs) {
      try { specs = JSON.parse(rawSpecs); } catch {}
    }

    let stockByCity = {};
    if (req.body.stock_by_city) {
      try { stockByCity = JSON.parse(req.body.stock_by_city); } catch {}
    }
    const totalStock = Object.values(stockByCity).reduce((s, v) => s + (Number(v) || 0), 0);

    const product = await Product.create({
      name, category,
      price:         parseFloat(price),
      cost_price:    parseFloat(cost_price) || 0,
      stock_by_city: stockByCity,
      stock:         totalStock,
      description:   description || '',
      badge:         badge || '',
      image,
      images,
      specs,
      is_active: true,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, handleUpload, async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { name, category, price, cost_price, description, badge, is_active, specs: rawSpecs } = req.body;

    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(f => f.path);
    }

    const images = newImages.length > 0 ? newImages : (existing.images || []);
    const image  = images[0] || existing.image || '';

    let specs = existing.specs || {};
    if (rawSpecs) {
      try { specs = JSON.parse(rawSpecs); } catch {}
    }

    let stockByCity = existing.stock_by_city || {};
    if (req.body.stock_by_city !== undefined) {
      try { stockByCity = JSON.parse(req.body.stock_by_city); } catch {}
    }
    const totalStock = Object.values(stockByCity).reduce((s, v) => s + (Number(v) || 0), 0);

    const update = {
      name:          name      || existing.name,
      category:      category  || existing.category,
      price:         price     ? parseFloat(price)      : existing.price,
      cost_price:    cost_price ? parseFloat(cost_price) : existing.cost_price,
      description:   description !== undefined ? description : existing.description,
      badge:         badge        !== undefined ? badge       : existing.badge,
      is_active:     is_active    !== undefined ? (is_active === 'true' || is_active === true) : existing.is_active,
      stock_by_city: stockByCity,
      stock:         totalStock,
      image,
      images,
      specs,
    };

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.images) {
      for (const url of product.images) await deleteImage(url);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
