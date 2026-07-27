const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'staff'], required: true },

  // Patient & shared fields
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  contact: { type: String },
  address: { type: String },
  bloodGroup: { type: String },
  allergies: { type: String },
  emergencyContact: { type: String },

  // Doctor-specific
  specialization: { type: String },
  qualification: { type: String },
  experience: { type: Number }, // years

  // Avatar / profile pic (optional)
  avatar: { type: String },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Don't send password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
