const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  order_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order',    required: true },
  product_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product',  default: null },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, default: '',    trim: true },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  message:     { type: String, required: true, trim: true },
  approved:    { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


reviewSchema.index({ customer_id: 1, order_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);