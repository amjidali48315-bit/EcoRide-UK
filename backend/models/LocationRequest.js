const mongoose = require('mongoose');

const locationRequestSchema = new mongoose.Schema({
  driver_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  current_postcode:   { type: String, default: '' },
  requested_postcode: { type: String, required: true },
  status:             { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  rejection_reason:   { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('LocationRequest', locationRequestSchema);