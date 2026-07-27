const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  slot: { type: String, required: true }, // e.g. "10:00 AM"
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'waiting', 'inProgress', 'done', 'cancelled'],
    default: 'pending'
  },
  fee: { type: Number, default: 0 },
  feePaid: { type: Boolean, default: false },
  notes: { type: String }, // Reception-side notes (e.g. reschedule reason)
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
