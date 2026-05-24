const router = require('express').Router();
const SiteSetting = require('../models/SiteSetting');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const all = await SiteSetting.find();
    const settings = {};
    all.forEach(s => { settings[s.key] = s.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', requireAdmin, async (req, res) => {
  try {
    const fields = [
      'banner_title','banner_subtitle','banner_btn_text',
      'site_email','site_phone','site_hours','site_address','delivery_days',
      'social_whatsapp','social_instagram','social_facebook','social_tiktok',
    ];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        await SiteSetting.findOneAndUpdate(
          { key: field },
          { value: req.body[field].toString().trim() },
          { upsert: true, new: true }
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;