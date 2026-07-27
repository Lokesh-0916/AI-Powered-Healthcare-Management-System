const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String },   // e.g. "500mg"
  frequency: { type: String }, // e.g. "Twice daily"
  duration: { type: String },  // e.g. "7 days"
  instructions: { type: String }, // e.g. "Take after meals"
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  medicines: [medicineSchema],
  diagnosis: { type: String },
  additionalNotes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
