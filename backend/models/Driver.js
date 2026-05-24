const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  phone:          { type: String, default: '' },
  postcode:       { type: String, default: '' },          
  city:           { type: String, enum: ['London', 'Birmingham', 'Other'], default: 'Other' },
  payment_per_mile: { type: Number, default: 1.5 },       
  is_active:      { type: Boolean, default: true },
  total_earned:   { type: Number, default: 0 },
}, { timestamps: true });

driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

driverSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
