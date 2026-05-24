const router = require('express').Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { requireCustomer, signToken } = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, phone, city, postcode } = req.body;
    const errors = [];
    if (!full_name?.trim()) errors.push('Full name is required.');
    if (!email?.trim())     errors.push('Email is required.');
    if (!password || password.length < 6) errors.push('Password must be at least 6 characters.');
    if (errors.length) return res.status(400).json({ errors });

    const exists = await Customer.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ errors: ['An account with this email already exists.'] });

    const customer = await Customer.create({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim() || '',
      city: city?.trim() || '',
      postcode: postcode?.toUpperCase().trim() || '',
    });

    const token = signToken({ id: customer._id, role: 'customer', email: customer.email });
    res.status(201).json({
      token,
      customer: { id: customer._id, full_name: customer.full_name, email: customer.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) return res.status(401).json({ error: 'No account found with that email.' });

    const ok = await customer.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Incorrect password.' });

    const token = signToken({ id: customer._id, role: 'customer', email: customer.email });
    res.json({
      token,
      customer: { id: customer._id, full_name: customer.full_name, email: customer.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password');
    if (!customer) return res.status(404).json({ error: 'Account not found.' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my-orders', requireCustomer, async (req, res) => {
  try {
    const orders = await Order.find({ customer_id: req.customer.id }).sort({ created_at: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cart', requireCustomer, async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer_id: req.customer.id });
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cart', requireCustomer, async (req, res) => {
  try {
    const { product_id, product_name, price, quantity, image } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);

    let cart = await Cart.findOne({ customer_id: req.customer.id });
    if (!cart) {
      cart = new Cart({ customer_id: req.customer.id, items: [] });
    }

    const idx = cart.items.findIndex(i => i.product_id.toString() === product_id);
    if (idx >= 0) {
      cart.items[idx].quantity = qty;
    } else {
      cart.items.push({ product_id, product_name, price, quantity: qty, image });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cart/:productId', requireCustomer, async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer_id: req.customer.id });
    if (!cart) return res.json({ items: [] });
    cart.items = cart.items.filter(i => i.product_id.toString() !== req.params.productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cart', requireCustomer, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ customer_id: req.customer.id }, { items: [] });
    res.json({ items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  res.json([]);
});

module.exports = router;
