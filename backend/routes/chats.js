const router  = require('express').Router();
const Chat    = require('../models/Chat');
const Message = require('../models/Message');
const { requireAdmin } = require('../middleware/authMiddleware');

const getMessages = async (chatId) =>
  Message.find({ chat_id: chatId }).sort({ created_at: 1 }).lean();

/* ── Public: start chat ─────────────────────────────────────── */
router.post('/start', async (req, res) => {
  try {
    const { customer_name, customer_email, chat_id } = req.body;

    if (chat_id) {
      const existing = await Chat.findById(chat_id);
      if (existing) return res.json(existing);
    }

    let customerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret_key');
        customerId = decoded.id;
        const openChat = await Chat.findOne({ customer_id: customerId, status: 'open' });
        if (openChat) return res.json(openChat);
      } catch {}
    }

    if (!customer_name?.trim()) return res.status(400).json({ error: 'Name is required.' });

    const chat = await Chat.create({
      customer_id:    customerId,
      customer_name:  customer_name.trim(),
      customer_email: customer_email?.trim() || '',
      last_message:   '',
      unread_admin:   0,
    });
    res.status(201).json(chat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Admin routes (MUST be before /:id routes) ──────────────── */
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updated_at: -1 }).lean();
    res.json(chats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin/:id/messages', requireAdmin, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    const messages = await getMessages(req.params.id);
    res.json({ chat, messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/admin/:id/messages', requireAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    const msg = await Message.create({ chat_id: chat._id, sender: 'admin', text: text.trim() });
    await Chat.findByIdAndUpdate(chat._id, {
      last_message:    text.trim().slice(0, 100),
      unread_customer: (chat.unread_customer || 0) + 1,
      updated_at:      new Date(),
    });

    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/:id/read', requireAdmin, async (req, res) => {
  try {
    await Chat.findByIdAndUpdate(req.params.id, { unread_admin: 0 });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admin/:id/close', requireAdmin, async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    res.json(chat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    await Message.deleteMany({ chat_id: req.params.id });
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Customer /:id routes (AFTER /admin/* routes) ───────────── */
router.get('/:id/messages', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });
    const messages = await getMessages(req.params.id);
    res.json({ chat, messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ error: 'Chat not found.' });

    const msg = await Message.create({ chat_id: chat._id, sender: 'customer', text: text.trim() });
    await Chat.findByIdAndUpdate(chat._id, {
      last_message: text.trim().slice(0, 100),
      unread_admin: (chat.unread_admin || 0) + 1,
      status: 'open',
      updated_at: new Date(),
    });

    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/read-customer', async (req, res) => {
  try {
    await Chat.findByIdAndUpdate(req.params.id, { unread_customer: 0 });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;