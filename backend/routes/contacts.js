const router  = require('express').Router();
const Contact = require('../models/Contact');
const { requireAdmin } = require('../middleware/authMiddleware');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim())    return res.status(400).json({ error: 'Name is required.' });
    if (!email?.trim())   return res.status(400).json({ error: 'Email is required.' });
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });

    await Contact.create({
      name: name.trim(), email: email.trim(),
      phone: phone?.trim() || '', subject: subject?.trim() || '',
      message: message.trim(),
    });
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ created_at: -1 });
    res.json(contacts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/read', requireAdmin, async (req, res) => {
  try {
    const c = await Contact.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Message not found.' });
    c.is_read = !c.is_read;
    await c.save();
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;