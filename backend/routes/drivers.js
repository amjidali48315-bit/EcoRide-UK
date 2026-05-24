const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const Driver  = require('../models/Driver');
const Order   = require('../models/Order');
const DriverPayment   = require('../models/DriverPayment');
const LocationRequest = require('../models/LocationRequest');
const { requireDriver, requireAdmin, signToken } = require('../middleware/authMiddleware');

const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'images', 'payment-proofs');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proof-${Date.now()}${ext}`);
  },
});

const uploadProof = multer({
  storage: proofStorage,
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    if (ok.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images or PDF allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('proof_image');

const handleProofUpload = (req, res, next) => {
  uploadProof(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

const areaCentres = {
  'E':{'lat':51.52,'lng':-0.04},'EC':{'lat':51.52,'lng':-0.09},
  'N':{'lat':51.56,'lng':-0.11},'NW':{'lat':51.55,'lng':-0.17},
  'SE':{'lat':51.47,'lng':-0.04},'SW':{'lat':51.47,'lng':-0.17},
  'W':{'lat':51.51,'lng':-0.21},'WC':{'lat':51.52,'lng':-0.12},
  'B':{'lat':52.48,'lng':-1.89},'CV':{'lat':52.41,'lng':-1.51},
  'WS':{'lat':52.58,'lng':-1.98},'WV':{'lat':52.59,'lng':-2.13},
  'DY':{'lat':52.51,'lng':-2.08},'LS':{'lat':53.80,'lng':-1.55},
  'S':{'lat':53.38,'lng':-1.47},'M':{'lat':53.48,'lng':-2.24},
  'L':{'lat':53.41,'lng':-2.98},'BR':{'lat':51.41,'lng':0.01},
  'CR':{'lat':51.37,'lng':-0.10},'DA':{'lat':51.45,'lng':0.22},
  'EN':{'lat':51.65,'lng':-0.08},'HA':{'lat':51.58,'lng':-0.33},
  'IG':{'lat':51.56,'lng':0.08},'KT':{'lat':51.41,'lng':-0.30},
  'RM':{'lat':51.57,'lng':0.18},'SM':{'lat':51.38,'lng':-0.19},
  'TW':{'lat':51.45,'lng':-0.33},'UB':{'lat':51.53,'lng':-0.48},
  'WD':{'lat':51.66,'lng':-0.41},'MK':{'lat':52.04,'lng':-0.76},
  'OX':{'lat':51.75,'lng':-1.26},'CB':{'lat':52.20,'lng':0.12},
  'NG':{'lat':52.95,'lng':-1.14},'LE':{'lat':52.64,'lng':-1.13},
};

function postcodeToCoords(postcode) {
  const area = (postcode || '').trim().toUpperCase().replace(/\s+/g,'').match(/^[A-Z]+/)?.[0] || '';
  return areaCentres[area] || { lat: 52.48, lng: -1.89 };
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Driver Login Attempt:', { email, password: '***' });
    
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    
    const driver = await Driver.findOne({ email: email.toLowerCase(), is_active: true });
    console.log('Driver Found:', driver ? 'Yes' : 'No');
    
    if (!driver) return res.status(401).json({ error: 'No active driver account found.' });
    
    const ok = await driver.comparePassword(password);
    console.log('Password Match:', ok);
    
    if (!ok) return res.status(401).json({ error: 'Incorrect password.' });
    
    const token = signToken({ id: driver._id, role: 'driver', city: driver.city });
    console.log('Driver Login Success:', driver.email);
    res.json({
      token,
      driver: {
        id: driver._id, name: driver.name, email: driver.email,
        city: driver.city, postcode: driver.postcode,
        payment_per_mile: driver.payment_per_mile,
        total_earned: driver.total_earned,
      },
    });
  } catch (err) { 
    console.error('Driver Login Error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

router.post('/location-request', requireDriver, async (req, res) => {
  try {
    const { postcode } = req.body;
    if (!postcode?.trim()) return res.status(400).json({ error: 'Postcode is required.' });
    const driver = await Driver.findById(req.driver.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });
    await LocationRequest.deleteMany({ driver_id: driver._id, status: 'Pending' });
    const request = await LocationRequest.create({
      driver_id:          driver._id,
      current_postcode:   driver.postcode || '',
      requested_postcode: postcode.trim().toUpperCase(),
    });
    res.status(201).json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-location-request', requireDriver, async (req, res) => {
  try {
    const request = await LocationRequest.findOne({ driver_id: req.driver.id })
      .sort({ created_at: -1 });
    res.json(request || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin/location-requests', requireAdmin, async (req, res) => {
  try {
    const { status = 'Pending' } = req.query;
    const filter = status === 'All' ? {} : { status };
    const requests = await LocationRequest.find(filter)
      .populate('driver_id', 'name email city postcode phone')
      .sort({ created_at: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/location-requests/:id/approve', requireAdmin, async (req, res) => {
  try {
    const request = await LocationRequest.findById(req.params.id).populate('driver_id');
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    if (request.status !== 'Pending') return res.status(400).json({ error: 'Request already resolved.' });
    await Driver.findByIdAndUpdate(request.driver_id._id, { postcode: request.requested_postcode });
    request.status = 'Approved';
    await request.save();
    res.json({ success: true, request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/location-requests/:id/reject', requireAdmin, async (req, res) => {
  try {
    const request = await LocationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    if (request.status !== 'Pending') return res.status(400).json({ error: 'Request already resolved.' });
    request.status           = 'Rejected';
    request.rejection_reason = req.body.reason || '';
    await request.save();
    res.json({ success: true, request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', requireDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver.id).select('-password');
    res.json(driver);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-orders', requireDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver.id).select('-password');
    const orders = await Order.find({ assigned_driver: req.driver.id }).sort({ created_at: -1 });
    const result = orders.map(o => {
      const obj = o.toObject();
      if (driver.postcode && o.postcode) {
        const dCoords = postcodeToCoords(driver.postcode);
        const cCoords = postcodeToCoords(o.postcode);
        obj.live_distance = haversine(dCoords.lat, dCoords.lng, cCoords.lat, cCoords.lng);
        obj.driver_lat    = dCoords.lat;
        obj.driver_lng    = dCoords.lng;
        obj.customer_lat  = cCoords.lat;
        obj.customer_lng  = cCoords.lng;
      }
      return obj;
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/orders/:id/status', requireDriver, async (req, res) => {
  try {
    const { status, cancellation_reason } = req.body;
    if (!['Dispatched', 'Delivered', 'Cancelled'].includes(status))
      return res.status(400).json({ error: 'Invalid status.' });

    const order = await Order.findOne({ _id: req.params.id, assigned_driver: req.driver.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (status === 'Cancelled') {
      if (!cancellation_reason?.trim())
        return res.status(400).json({ error: 'Please enter a cancellation reason.' });
      order.status      = 'Cancelled';
      order.admin_notes = `Cancelled by driver: ${cancellation_reason.trim()}`;
      await order.save();
      return res.json({ success: true });
    }

    order.status = status;

    if (status === 'Delivered') {
      const driver = await Driver.findById(req.driver.id);
      const dist    = order.distance_miles || 0;
      const earning = dist === 0 || dist <= 4
        ? 15.00
        : parseFloat((driver.payment_per_mile * dist).toFixed(2));
      order.driver_payment = earning;
      order.profit         = order.total_amount - order.cost_price - earning;
      driver.total_earned += earning;
      await driver.save();

      const existing = await DriverPayment.findOne({ order_id: order._id });
      if (!existing) {
        await DriverPayment.create({
          driver_id:      driver._id,
          order_id:       order._id,
          order_ref:      order.order_ref,
          cash_collected: order.total_amount,
          driver_earning: earning,
          amount_owed:    parseFloat((order.total_amount - earning).toFixed(2)),
          payment_status: 'Pending',
        });
      }
    }

    await order.save();
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-payments', requireDriver, async (req, res) => {
  try {
    const payments = await DriverPayment.find({ driver_id: req.driver.id }).sort({ created_at: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/payments/bulk-pay', requireDriver, handleProofUpload, async (req, res) => {
  try {
    const entered = parseFloat(req.body.amount_paid);
    if (!entered || isNaN(entered) || entered <= 0)
      return res.status(400).json({ error: 'Please enter a valid payment amount.' });
    if (!req.file)
      return res.status(400).json({ error: 'Please upload proof of payment.' });

    const pending = await DriverPayment.find({
      driver_id: req.driver.id,
      payment_status: { $in: ['Pending', 'Partial'] },
    }).sort({ created_at: 1 });

    const totalOwed = pending.reduce((s, p) => s + Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0)), 0);
    if (totalOwed <= 0) return res.status(400).json({ error: 'No outstanding balance to pay.' });
    if (entered > totalOwed + 0.01)
      return res.status(400).json({ error: `Amount exceeds total owed of £${totalOwed.toFixed(2)}.` });

    const proofPath = `/images/payment-proofs/${req.file.filename}`;
    const notes     = req.body.notes || '';
    let   remaining = entered;

    for (const p of pending) {
      if (remaining <= 0.005) break;
      const recordOwed = Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0));
      const paying     = Math.min(remaining, recordOwed);
      const newPaid    = parseFloat(((p.amount_paid || 0) + paying).toFixed(2));
      const newOwe     = parseFloat((p.amount_owed - newPaid).toFixed(2));
      p.amount_paid    = newPaid;
      p.payment_status = newOwe <= 0.01 ? 'Paid' : 'Partial';
      p.proof_image    = proofPath;
      p.paid_at        = new Date();
      p.paid_by        = 'driver';
      p.notes          = notes;
      await p.save();
      remaining = parseFloat((remaining - paying).toFixed(2));
    }

    res.json({ success: true, applied: entered });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/payments/:id/pay', requireDriver, handleProofUpload, async (req, res) => {
  try {
    const payment = await DriverPayment.findOne({ _id: req.params.id, driver_id: req.driver.id });
    if (!payment) return res.status(404).json({ error: 'Payment record not found.' });
    if (payment.payment_status === 'Paid')
      return res.status(400).json({ error: 'This payment is already fully settled.' });

    const entered   = parseFloat(req.body.amount_paid);
    const remaining = parseFloat((payment.amount_owed - (payment.amount_paid || 0)).toFixed(2));

    if (!entered || isNaN(entered) || entered <= 0)
      return res.status(400).json({ error: 'Please enter a valid payment amount.' });
    if (entered > remaining + 0.01)
      return res.status(400).json({ error: `Amount exceeds remaining balance of £${remaining.toFixed(2)}.` });
    if (!req.file)
      return res.status(400).json({ error: 'Please upload proof of payment.' });

    const newPaid      = parseFloat(((payment.amount_paid || 0) + entered).toFixed(2));
    const newRemaining = parseFloat((payment.amount_owed - newPaid).toFixed(2));
    payment.amount_paid    = newPaid;
    payment.payment_status = newRemaining <= 0.01 ? 'Paid' : 'Partial';
    payment.proof_image    = `/images/payment-proofs/${req.file.filename}`;
    payment.paid_at        = new Date();
    payment.paid_by        = 'driver';
    payment.notes          = req.body.notes || '';
    await payment.save();
    res.json(payment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password').sort({ name: 1 });
    res.json(drivers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, phone, city, payment_per_mile } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password required.' });
    const exists = await Driver.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'A driver with that email already exists.' });
    const driver = await Driver.create({ name, email: email.toLowerCase(), password, phone, city, payment_per_mile });
    const obj = driver.toObject(); delete obj.password;
    res.status(201).json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, phone, city, payment_per_mile, is_active } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id, { name, phone, city, payment_per_mile, is_active }, { new: true }
    ).select('-password');
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });
    res.json(driver);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin/bulk-confirm/:driverId', requireAdmin, handleProofUpload, async (req, res) => {
  try {
    const entered = parseFloat(req.body.amount_confirmed);
    if (!entered || isNaN(entered) || entered <= 0)
      return res.status(400).json({ error: 'Please enter a valid amount.' });

    const pending = await DriverPayment.find({
      driver_id: req.params.driverId,
      payment_status: { $in: ['Pending', 'Partial'] },
    }).sort({ created_at: 1 });

    const totalOwed = pending.reduce((s, p) => s + Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0)), 0);
    if (totalOwed <= 0) return res.status(400).json({ error: 'No outstanding balance for this driver.' });

    const proofPath = req.file ? `/images/payment-proofs/${req.file.filename}` : null;
    const notes     = req.body.notes || '';
    let   remaining = entered;

    for (const p of pending) {
      if (remaining <= 0.005) break;
      const recordOwed = Math.max(0, (p.amount_owed || 0) - (p.amount_paid || 0));
      const confirming = Math.min(remaining, recordOwed);
      const newPaid    = parseFloat(((p.amount_paid || 0) + confirming).toFixed(2));
      const newOwe     = parseFloat((p.amount_owed - newPaid).toFixed(2));
      p.amount_paid    = newPaid;
      p.payment_status = newOwe <= 0.01 ? 'Paid' : 'Partial';
      if (proofPath) p.proof_image = proofPath;
      p.paid_at = new Date();
      p.paid_by = 'admin';
      p.notes   = notes;
      await p.save();
      remaining = parseFloat((remaining - confirming).toFixed(2));
    }

    res.json({ success: true, confirmed: entered });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin/payments', requireAdmin, async (req, res) => {
  try {
    const payments = await DriverPayment.find()
      .populate('driver_id', 'name email city')
      .sort({ created_at: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/payments/:id', requireAdmin, handleProofUpload, async (req, res) => {
  try {
    const payment = await DriverPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    payment.payment_status = 'Paid';
    payment.paid_at        = new Date();
    payment.paid_by        = 'admin';
    payment.notes          = req.body.notes || payment.notes;
    if (req.file) payment.proof_image = `/images/payment-proofs/${req.file.filename}`;
    await payment.save();
    res.json(payment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;