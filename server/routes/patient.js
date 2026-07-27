const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { upload } = require('../services/fileStorage');
const { chat } = require('../services/gemini');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Upload = require('../models/Upload');

const isPatient = [protect, requireRole('patient')];

router.get('/profile', ...isPatient, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', ...isPatient, async (req, res) => {
  try {
    const allowed = ['name', 'contact', 'address', 'dob', 'gender', 'bloodGroup', 'allergies', 'emergencyContact'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/doctors', ...isPatient, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name specialization qualification experience');
    res.json({ doctors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// returns the list of already-booked slots for a doctor on a given date
router.get('/doctors/:doctorId/slots', ...isPatient, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.json({ bookedSlots: [] });
    const d = new Date(date);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);
    const appointments = await Appointment.find({
      doctor: req.params.doctorId,
      date: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] }
    }).select('slot');
    res.json({ bookedSlots: appointments.map(a => a.slot) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/appointments', ...isPatient, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/appointments', ...isPatient, async (req, res) => {
  try {
    const { doctorId, date, slot, reason } = req.body;
    if (!doctorId || !date || !slot || !reason) {
      return res.status(400).json({ message: 'Doctor, date, slot and reason are required.' });
    }
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

    // make sure nobody else has this slot
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      slot,
      status: { $nin: ['cancelled'] }
    });
    if (conflict) return res.status(400).json({ message: 'That slot is already booked. Please choose another.' });

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date: new Date(date),
      slot,
      reason,
      status: 'pending'
    });
    const populated = await appointment.populate('doctor', 'name specialization');
    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/ai/chat', ...isPatient, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required.' });
    }
    const reply = await chat(messages);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/uploads', ...isPatient, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const { type, reportDate, description } = req.body;
    const doc = await Upload.create({
      patient: req.user._id,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      type: type || 'other',
      reportDate: reportDate ? new Date(reportDate) : undefined,
      description
    });
    res.status(201).json({ upload: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/uploads', ...isPatient, async (req, res) => {
  try {
    const uploads = await Upload.find({ patient: req.user._id }).sort({ reportDate: -1, createdAt: -1 });
    res.json({ uploads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/uploads/:id', ...isPatient, async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, patient: req.user._id });
    if (!upload) return res.status(404).json({ message: 'Upload not found.' });
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', 'uploads', upload.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await upload.deleteOne();
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
