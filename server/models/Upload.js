const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  filename: { type: String, required: true }, // stored filename on disk
  mimetype: { type: String },
  size: { type: Number }, // bytes
  type: {
    type: String,
    enum: ['labReport', 'scan', 'prescription', 'other'],
    default: 'other'
  },
  reportDate: { type: Date }, // date of the checkup/report
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Upload', uploadSchema);
