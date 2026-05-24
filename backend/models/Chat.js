const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  customer_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customer_name:   { type: String, required: true, trim: true },
  customer_email:  { type: String, default: '', trim: true },
  status:          { type: String, enum: ['open', 'closed'], default: 'open' },
  last_message:    { type: String, default: '' },
  unread_admin:    { type: Number, default: 0 },   
  unread_customer: { type: Number, default: 0 },   
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Chat', chatSchema);