const router = require('express').Router();
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');
const { requireAdmin, signToken } = require('../middleware/authMiddleware');

// ── Login ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Please enter both username and password.' });

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'No admin account found with that username.' });

    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Incorrect password.' });

    // Generate JWT token
    const token = signToken({ role: 'admin', username: admin.username, id: admin._id });

    // Also set session as fallback
    req.session.admin_logged_in = true;
    req.session.admin_username  = admin.username;

    res.json({ success: true, username: admin.username, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ── Me ────────────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  // Check JWT
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || 'escooter_jwt_secret');
      if (decoded.role === 'admin') {
        return res.json({ loggedIn: true, username: decoded.username });
      }
    } catch {}
  }
  if (req.session?.admin_logged_in) {
    return res.json({ loggedIn: true, username: req.session.admin_username });
  }
  res.json({ loggedIn: false });
});

// ── Dashboard ─────────────────────────────────────────────────────────────
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [
      totalOrders, totalProducts, totalCustomers, totalDrivers,
      pendingOrders, deliveredOrders,
      revenueAgg, costAgg, driverPayAgg,
      recentOrders, stockValueAgg
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ is_active: true }),
      Customer.countDocuments(),
      Driver.countDocuments({ is_active: true }),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.aggregate([{ $match: { status: 'Delivered', is_partner_order: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Order.aggregate([{ $match: { status: 'Delivered', is_partner_order: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$cost_price' } } }]),
      Order.aggregate([{ $match: { status: 'Delivered', is_partner_order: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$driver_payment' } } }]),
      Order.find().sort({ created_at: -1 }).limit(8).populate('assigned_driver', 'name'),
      Product.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ['$cost_price', { $ifNull: ['$stock', 0] }] } } } }]),
    ]);

    res.json({
      totalOrders, totalProducts, totalCustomers, totalDrivers,
      pendingOrders, deliveredOrders,
      totalRevenue:   revenueAgg[0]?.total || 0,
      totalCost:      stockValueAgg[0]?.total || 0,
      totalDriverPay: driverPayAgg[0]?.total || 0,
      totalProfit:    (revenueAgg[0]?.total || 0) - (costAgg[0]?.total || 0) - (driverPayAgg[0]?.total || 0),
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Customers list ────────────────────────────────────────────────────────
router.get('/customers', requireAdmin, async (req, res) => {
  try {
    const customers = await Customer.find().select('-password').sort({ created_at: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Seed default admin ────────────────────────────────────────────────────
router.post('/seed', async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) return res.json({ message: 'Admin already exists.' });
    await Admin.create({ username: 'admin', password: 'admin123' });
    res.json({ message: 'Default admin created. Username: admin, Password: admin123' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Change username ───────────────────────────────────────────────────────
router.put('/change-username', requireAdmin, async (req, res) => {
  try {
    const { new_username, current_password } = req.body;
    if (!new_username || !current_password)
      return res.status(400).json({ error: 'New username and current password are required.' });

    const username = req.admin?.username || req.session?.admin_username;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });

    const ok = await admin.comparePassword(current_password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });

    const exists = await Admin.findOne({ username: new_username });
    if (exists) return res.status(409).json({ error: 'Username already taken.' });

    admin.username = new_username;
    await admin.save();

    // Generate new token with new username
    const token = signToken({ role: 'admin', username: new_username, id: admin._id });
    req.session.admin_username = new_username;

    res.json({ success: true, token, username: new_username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Change password ───────────────────────────────────────────────────────
router.put('/change-password', requireAdmin, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'Both current and new password are required.' });
    if (new_password.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const username = req.admin?.username || req.session?.admin_username;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });

    const ok = await admin.comparePassword(current_password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });

    admin.password = new_password;
    await admin.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── List admins ───────────────────────────────────────────────────────────
router.get('/admins', requireAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: 1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Add admin ─────────────────────────────────────────────────────────────
router.post('/admins', requireAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const exists = await Admin.findOne({ username });
    if (exists) return res.status(409).json({ error: `Username "${username}" is already taken.` });

    await Admin.create({ username, password });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Remove admin ──────────────────────────────────────────────────────────
router.delete('/admins/:id', requireAdmin, async (req, res) => {
  try {
    const oldest = await Admin.findOne().sort({ createdAt: 1 });
    if (oldest && String(oldest._id) === String(req.params.id))
      return res.status(403).json({ error: 'Cannot remove the owner admin account.' });

    const username = req.admin?.username || req.session?.admin_username;
    const self = await Admin.findOne({ username });
    if (self && String(self._id) === String(req.params.id))
      return res.status(403).json({ error: 'You cannot remove your own account.' });

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
