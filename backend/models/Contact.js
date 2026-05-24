const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true },
  phone:   { type: String, default: '',    trim: true },
  subject: { type: String, default: '',    trim: true },
  message: { type: String, required: true, trim: true },
  is_read: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Contact', contactSchema);