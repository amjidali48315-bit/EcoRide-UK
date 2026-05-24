const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender:  { type: String, enum: ['customer', 'admin'], required: true },
  text:    { type: String, required: true, trim: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Message', messageSchema);