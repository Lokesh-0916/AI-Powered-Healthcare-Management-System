const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const isStaff = [protect, requireRole('staff')];

router.get('/doctors', ...isStaff, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name specialization');
    res.json({ doctors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/appointments', ...isStaff, async (req, res) => {
  try {
    const { date, doctorId, status } = req.query;
    const filter = {};

    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    if (doctorId) filter.doctor = doctorId;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .sort({ date: 1, slot: 1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/appointments', ...isStaff, async (req, res) => {
  try {
    const { patientId, doctorId, date, slot, reason, fee } = req.body;
    if (!patientId || !doctorId || !date || !slot || !reason) {
      return res.status(400).json({ message: 'All fields required.' });
    }
    const conflict = await Appointment.findOne({
      doctor: doctorId, date: new Date(date), slot, status: { $nin: ['cancelled'] }
    });
    if (conflict) return res.status(400).json({ message: 'Slot already booked.' });

    const appointment = await Appointment.create({
      patient: patientId, doctor: doctorId, date: new Date(date), slot, reason,
      fee: fee || 0, status: 'pending'
    });
    const populated = await appointment.populate([
      { path: 'patient', select: 'name contact' },
      { path: 'doctor', select: 'name specialization' }
    ]);
    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/appointments/:id', ...isStaff, async (req, res) => {
  try {
    const allowed = ['date', 'slot', 'doctor', 'status', 'reason', 'notes'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/appointments/:id/fee', ...isStaff, async (req, res) => {
  try {
    const { fee, feePaid } = req.body;
    const updates = {};
    if (fee !== undefined) updates.fee = fee;
    if (feePaid !== undefined) updates.feePaid = feePaid;
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('patient', 'name')
      .populate('doctor', 'name');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/patients', ...isStaff, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: 'patient' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ];
    }
    const patients = await User.find(filter).select('name email contact dob bloodGroup createdAt');

    // add completed visit count to each patient record
    const patientsWithCounts = await Promise.all(patients.map(async (p) => {
      const visitCount = await Appointment.countDocuments({ patient: p._id, status: 'done' });
      return { ...p.toObject(), visitCount };
    }));

    res.json({ patients: patientsWithCounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/patients/:id/appointments', ...isStaff, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.id })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/reminders', ...isStaff, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const now = new Date();
    const future = new Date(); future.setDate(future.getDate() + days);
    future.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: { $gte: now, $lte: future },
      status: { $nin: ['cancelled', 'done'] }
    })
      .populate('patient', 'name contact')
      .populate('doctor', 'name')
      .sort({ date: 1, slot: 1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/fees/summary', ...isStaff, async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};
    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    const appointments = await Appointment.find(filter).select('fee feePaid');
    const totalRevenue = appointments.filter(a => a.feePaid).reduce((sum, a) => sum + (a.fee || 0), 0);
    const totalPending = appointments.filter(a => !a.feePaid).reduce((sum, a) => sum + (a.fee || 0), 0);
    res.json({ totalRevenue, totalPending, count: appointments.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// walk-in patients don't have an account, so we create a minimal one on the spot
router.post('/appointments/walkin', ...isStaff, async (req, res) => {
  try {
    const { name, age, phone, doctorId, date, slot, reason, fee } = req.body;
    if (!name || !phone || !age || !doctorId || !date || !slot || !reason) {
      return res.status(400).json({ message: 'All fields required for walk-in.' });
    }

    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - parseInt(age));

    // use a generated email so the unique constraint doesn't break
    const fakeEmail = `walkin_${phone.replace(/\D/g, '')}_${Date.now()}@walkin.healthcare`;
    const fakePassword = Math.random().toString(36).slice(-10);

    const patient = await User.create({
      name,
      email: fakeEmail,
      password: fakePassword,
      role: 'patient',
      contact: phone,
      dob,
    });

    const conflict = await Appointment.findOne({
      doctor: doctorId, date: new Date(date), slot, status: { $nin: ['cancelled'] }
    });
    if (conflict) {
      await User.findByIdAndDelete(patient._id);
      return res.status(400).json({ message: 'Slot already booked.' });
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      date: new Date(date),
      slot,
      reason,
      fee: fee || 0,
      status: 'pending',
    });

    const populated = await appointment.populate([
      { path: 'patient', select: 'name contact' },
      { path: 'doctor', select: 'name specialization' },
    ]);

    res.status(201).json({ appointment: populated, walkinPatient: patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
