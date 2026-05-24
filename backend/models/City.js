const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true, trim: true },
  is_active:  { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('City', citySchema);