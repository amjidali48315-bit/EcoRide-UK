const router  = require('express').Router();
const Review  = require('../models/Review');
const Order   = require('../models/Order');
const { requireAdmin, requireCustomer } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true })
      .sort({ created_at: -1 })
      .select('-email -customer_id');
    res.json(reviews);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/all', requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ created_at: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/mine', requireCustomer, async (req, res) => {
  try {
    const reviews = await Review.find({ customer_id: req.customer.id }).select('order_id');
    res.json(reviews.map(r => r.order_id?.toString()));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', async (req, res) => {
  try {
    const agg = await Review.aggregate([
      { $match: { approved: true, product_id: { $exists: true, $ne: null } } },
      { $group: { _id: '$product_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const map = {};
    agg.forEach(s => {
      map[s._id.toString()] = { avg: parseFloat(s.avg.toFixed(1)), count: s.count };
    });
    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/product/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ product_id: req.params.id, approved: true })
      .sort({ created_at: -1 })
      .select('-email -customer_id');
    res.json(reviews);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireCustomer, async (req, res) => {
  try {
    const { order_id, rating, message, name, email } = req.body;

    if (!order_id)        return res.status(400).json({ error: 'Please select which order you are reviewing.' });
    if (!name?.trim())    return res.status(400).json({ error: 'Name is required.' });
    if (!message?.trim()) return res.status(400).json({ error: 'Please write a message.' });
    const r = parseInt(rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ error: 'Please select a star rating (1–5).' });

    const order = await Order.findOne({
      _id: order_id, customer_id: req.customer.id, status: 'Delivered',
    });
    if (!order) return res.status(403).json({ error: 'Order not found, not yet delivered, or does not belong to your account.' });

    const existing = await Review.findOne({ order_id, customer_id: req.customer.id });
    if (existing) return res.status(400).json({ error: 'You have already submitted a review for this order.' });

    await Review.create({
      customer_id: req.customer.id,
      order_id,
      product_id:  order.product_id || null,
      name:        name.trim(),
      email:       email?.trim() || '',
      rating:      r,
      message:     message.trim(),
    });
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    review.approved = !review.approved;
    await review.save();
    res.json(review);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;