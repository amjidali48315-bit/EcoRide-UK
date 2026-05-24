const router = require('express').Router();
const City   = require('../models/City');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const cities = await City.find({ is_active: true }).sort({ sort_order: 1, name: 1 });
    res.json(cities);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/all', requireAdmin, async (req, res) => {
  try {
    const cities = await City.find().sort({ sort_order: 1, name: 1 });
    res.json(cities);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'City name is required.' });
    const exists = await City.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ error: 'This city already exists.' });
    const city = await City.create({ name: name.trim(), sort_order: parseInt(sort_order) || 0 });
    res.status(201).json(city);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, is_active, sort_order } = req.body;
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim(), is_active, sort_order: parseInt(sort_order) || 0 },
      { new: true }
    );
    if (!city) return res.status(404).json({ error: 'City not found.' });
    res.json(city);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/seed', requireAdmin, async (req, res) => {
  try {
    const defaults = [
      'London','Birmingham','Manchester','Leeds','Sheffield',
      'Liverpool','Bristol','Newcastle','Nottingham','Leicester',
      'Coventry','Bradford','Hull','Stoke-on-Trent','Wolverhampton',
      'Derby','Southampton','Portsmouth','Oxford','Cambridge',
      'Brighton','Luton','Reading','Sunderland','Middlesbrough',
      'Glasgow','Edinburgh','Cardiff','Belfast','Plymouth',
    ];
    let added = 0;
    for (let i = 0; i < defaults.length; i++) {
      const exists = await City.findOne({ name: defaults[i] });
      if (!exists) { await City.create({ name: defaults[i], sort_order: i }); added++; }
    }
    res.json({ success: true, added });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await City.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;