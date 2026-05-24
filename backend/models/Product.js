const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  category:       { type: String, enum: ['E-Scooter', 'E-Bike', 'Deals', 'Child Gifts', 'Offers'], required: true },
  price:          { type: Number, required: true },
  cost_price:     { type: Number, default: 0 },
  city:           { type: String, default: '' },

  
  stock_by_city:  { type: mongoose.Schema.Types.Mixed, default: {} },
  stock:          { type: Number, default: 0 },  

  
  stock_london:   { type: Number, default: 0 },
  stock_birmingham: { type: Number, default: 0 },

  description:    { type: String, default: '' },
  badge:          { type: String, default: '' },
  image:          { type: String, default: '' },
  is_active:      { type: Boolean, default: true },
  specs:          { type: Map, of: String, default: {} },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Product', productSchema);