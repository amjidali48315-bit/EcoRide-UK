const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  full_name:  { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  phone:      { type: String, default: '' },
  city:       { type: String, default: '' },
  postcode:   { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

customerSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);
