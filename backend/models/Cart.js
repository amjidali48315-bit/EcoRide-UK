const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  price:        { type: Number, required: true },
  quantity:     { type: Number, default: 1 },
  image:        { type: String, default: '' },
});

const cartSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
  items:       [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
