const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { summarize } = require('../services/gemini');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Note = require('../models/Note');
const Upload = require('../models/Upload');

const isDoctor = [protect, requireRole('doctor')];

router.get('/profile', ...isDoctor, async (req, res) => {
  res.json({ user: req.user });
});

router.get('/today', ...isDoctor, async (req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

    // cast a wide net around today to handle timezone differences, then filter precisely below
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setTime(start.getTime() - 14 * 60 * 60 * 1000);
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999);
    end.setTime(end.getTime() + 14 * 60 * 60 * 1000);

    const appointments = await Appointment.find({
      doctor: req.user._id,
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    }).populate('patient', 'name dob gender contact bloodGroup').sort({ slot: 1 });

    // narrow down to appointments that actually fall on today's date string
    const todayAppts = appointments.filter(a => {
      const d = new Date(a.date);
      return d.toLocaleDateString('en-CA') === todayStr;
    });

    res.json({ appointments: todayAppts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/appointments/:id/status', ...isDoctor, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'waiting', 'inProgress', 'done', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user._id },
      { status },
      { new: true }
    ).populate('patient', 'name');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// only shows patients this doctor has actually seen (completed appointments)
router.get('/all-patients', ...isDoctor, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.user._id,
      status: 'done'
    }).populate('patient', 'name dob gender contact bloodGroup').sort({ date: -1 });

    const patientMap = {};
    appointments.forEach(a => {
      if (!a.patient) return;
      const pid = a.patient._id.toString();
      if (!patientMap[pid]) {
        patientMap[pid] = {
          patient: a.patient,
          appointments: [],
          lastVisit: a.date,
          totalVisits: 0,
        };
      }
      patientMap[pid].appointments.push(a);
      patientMap[pid].totalVisits++;
      if (new Date(a.date) > new Date(patientMap[pid].lastVisit)) {
        patientMap[pid].lastVisit = a.date;
      }
    });

    const patients = Object.values(patientMap);
    res.json({ patients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/patients/:patientId', ...isDoctor, async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.patientId, role: 'patient' });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    const [appointments, prescriptions, notes, uploads] = await Promise.all([
      Appointment.find({ patient: req.params.patientId, doctor: req.user._id }).sort({ date: -1 }).limit(10),
      Prescription.find({ patient: req.params.patientId, doctor: req.user._id }).sort({ date: -1 }),
      Note.find({ patient: req.params.patientId, doctor: req.user._id }).sort({ createdAt: -1 }),
      Upload.find({ patient: req.params.patientId }).sort({ reportDate: -1 }),
    ]);

    res.json({ patient, appointments, prescriptions, notes, uploads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/patients/:patientId/ai-summary', ...isDoctor, async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.patientId, role: 'patient' });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    const [appointments, prescriptions, notes, uploads] = await Promise.all([
      Appointment.find({ patient: req.params.patientId }).sort({ date: -1 }).limit(5),
      Prescription.find({ patient: req.params.patientId }).sort({ date: -1 }).limit(5),
      Note.find({ patient: req.params.patientId, doctor: req.user._id }).sort({ createdAt: -1 }).limit(5),
      Upload.find({ patient: req.params.patientId }),
    ]);

    const patientData = {
      profile: { name: patient.name, dob: patient.dob, gender: patient.gender, bloodGroup: patient.bloodGroup, allergies: patient.allergies },
      recentAppointments: appointments.map(a => ({ date: a.date, reason: a.reason, status: a.status })),
      prescriptions: prescriptions.map(p => ({ date: p.date, diagnosis: p.diagnosis, medicines: p.medicines })),
      doctorNotes: notes.map(n => ({ date: n.createdAt, content: n.content })),
      uploadedFiles: uploads.map(u => ({ type: u.type, date: u.reportDate, name: u.originalName })),
    };

    const summary = await summarize(patientData);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/patients/:patientId/notes', ...isDoctor, async (req, res) => {
  try {
    const notes = await Note.find({ patient: req.params.patientId, doctor: req.user._id }).sort({ createdAt: -1 });
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/patients/:patientId/notes', ...isDoctor, async (req, res) => {
  try {
    const { content, appointmentId } = req.body;
    if (!content) return res.status(400).json({ message: 'Note content required.' });
    const note = await Note.create({
      doctor: req.user._id,
      patient: req.params.patientId,
      appointment: appointmentId || undefined,
      content
    });
    res.status(201).json({ note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/notes/:noteId', ...isDoctor, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.noteId, doctor: req.user._id });
    res.json({ message: 'Note deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/patients/:patientId/prescriptions', ...isDoctor, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.params.patientId }).sort({ date: -1 });
    res.json({ prescriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/patients/:patientId/prescriptions', ...isDoctor, async (req, res) => {
  try {
    const { medicines, diagnosis, additionalNotes, appointmentId } = req.body;
    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ message: 'At least one medicine is required.' });
    }
    const prescription = await Prescription.create({
      appointment: appointmentId || undefined,
      doctor: req.user._id,
      patient: req.params.patientId,
      medicines,
      diagnosis,
      additionalNotes
    });
    res.status(201).json({ prescription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
