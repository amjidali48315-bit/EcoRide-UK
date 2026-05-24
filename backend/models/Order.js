const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_ref:        { type: String, required: true, unique: true },

  
  customer_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customer_name:    { type: String, required: true },
  phone:            { type: String, required: true },
  address:          { type: String, required: true },
  postcode:         { type: String, required: true },
  city:             { type: String, default: '' },

  
  product_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  product_name:     { type: String, required: true },
  quantity:         { type: Number, default: 1 },
  total_amount:     { type: Number, required: true },
  payment_method:   { type: String, default: 'Cash on Delivery' },

  
  stock_source:     { type: String, default: '' },

  
  is_partner_order: { type: Boolean, default: false },
  partner_name:     { type: String, default: '' },
  partner_whatsapp: { type: String, default: '' },

  
  assigned_driver:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  driver_payment:   { type: Number, default: 0 },
  distance_miles:   { type: Number, default: 0 },

  
  cost_price:       { type: Number, default: 0 },
  profit:           { type: Number, default: 0 },

  
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Assigned', 'Dispatched', 'Partner', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },

  admin_notes: { type: String, default: '' },

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


orderSchema.pre('save', function (next) {
  if (!this.is_partner_order) {
    this.profit = this.total_amount - this.cost_price - this.driver_payment;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);