const mongoose = require('mongoose');

const driverPaymentSchema = new mongoose.Schema({
  driver_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  order_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order',  required: true },
  order_ref:      { type: String, required: true },

  cash_collected: { type: Number, default: 0 },  
  driver_earning: { type: Number, default: 0 },  
  amount_owed:    { type: Number, default: 0 },  
  amount_paid:    { type: Number, default: 0 },  

  payment_status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
  proof_image:    { type: String, default: '' },
  paid_at:        { type: Date, default: null },
  paid_by:        { type: String, default: '' },  
  notes:          { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('DriverPayment', driverPaymentSchema);