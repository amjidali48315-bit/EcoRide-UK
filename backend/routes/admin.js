const router = require('express').Router();
const Admin = require('../models/Admin');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');
const { requireAdmin } = require('../middleware/authMiddleware');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Admin Login Attempt:', { username, password: '***' });
    
    if (!username || !password)
      return res.status(400).json({ error: 'Please enter both username and password.' });

    const admin = await Admin.findOne({ username });
    console.log('Admin Found:', admin ? 'Yes' : 'No');
    
    if (!admin) return res.status(401).json({ error: 'No admin account found with that username.' });

    const ok = await admin.comparePassword(password);
    console.log('Password Match:', ok);
    
    if (!ok) return res.status(401).json({ error: 'Incorrect password.' });

    req.session.admin_logged_in = true;
    req.session.admin_username  = admin.username;
    console.log('Admin Login Success:', admin.username);
    res.json({ success: true, username: admin.username });
  } catch (err) {
    console.error('Admin Login Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  if (req.session?.admin_logged_in) {
    res.json({ loggedIn: true, username: req.session.admin_username });
  } else {
    res.json({ loggedIn: false });
  }
});

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
      // Financial aggregations — exclude partner orders (revenue=0, profit=0 for them)
      Order.aggregate([{ $match: { status: 'Delivered', is_partner_order: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$total_amount'   } } }]),
      Order.aggregate([{ $match: { status: 'Delivered', is_partner_order: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$cost_price'     } } }]),
      Order.aggregate([{ $match: { status: 'Delivered', is_partner_order: { $ne: true } } }, { $group: { _id: null, total: { $sum: '$driver_payment' } } }]),
      Order.find().sort({ created_at: -1 }).limit(8).populate('assigned_driver', 'name'),
      Product.aggregate([
        { $group: { _id: null, total: { $sum: { $multiply: ['$cost_price', { $ifNull: ['$stock', 0] }] } } } }
      ]),
    ]);

    const totalRevenue   = revenueAgg[0]?.total || 0;
    const totalCost      = stockValueAgg[0]?.total || 0;   // current inventory value
    const totalDriverPay = driverPayAgg[0]?.total || 0;
    const totalProfit    = totalRevenue - (costAgg[0]?.total || 0) - totalDriverPay;

    res.json({
      totalOrders, totalProducts, totalCustomers, totalDrivers,
      pendingOrders, deliveredOrders,
      totalRevenue, totalCost, totalDriverPay, totalProfit,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers', requireAdmin, async (req, res) => {
  try {
    const customers = await Customer.find().select('-password').sort({ created_at: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// ── Change password ───────────────────────────────────────────────────────
router.put('/change-password', requireAdmin, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'Both current and new password are required.' });
    if (new_password.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const admin = await Admin.findOne({ username: req.session.admin_username });
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

// ── List all admins ───────────────────────────────────────────────────────
router.get('/admins', requireAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: 1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Add new admin ─────────────────────────────────────────────────────────
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
    // Prevent deleting the oldest (owner) admin
    const oldest = await Admin.findOne().sort({ createdAt: 1 });
    if (oldest && String(oldest._id) === String(req.params.id))
      return res.status(403).json({ error: 'Cannot remove the owner admin account.' });

    // Prevent deleting yourself
    const self = await Admin.findOne({ username: req.session.admin_username });
    if (self && String(self._id) === String(req.params.id))
      return res.status(403).json({ error: 'You cannot remove your own account.' });

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;