const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  content: { type: String, required: true },
  // Private — only visible to the doctor who wrote it
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
