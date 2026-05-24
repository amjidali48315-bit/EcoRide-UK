const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  label: { type: String, default: '' },
  discount: { type: String, default: '' },
  expires_at: { type: Date, default: null },
  image: { type: String, default: '' },
  link: { type: String, default: '/products' },
  btn_text: { type: String, default: 'Shop Now' },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 },

  
  product_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  price:            { type: Number, default: 0 },
  category:         { type: String, enum: ['E-Scooter', 'E-Bike', 'Offers', ''], default: 'Offers' },
  stock_london:     { type: Number, default: 0 },
  stock_birmingham: { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});


const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

module.exports = Offer;