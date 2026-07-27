// Seed script — populates the DB with demo data on first run.
// Skips automatically if a .seed marker file already exists.
// Delete server/.seed to force a re-seed (this wipes all existing data).

require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

const User         = require('./models/User');
const Appointment  = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const Note         = require('./models/Note');

const SEED_MARKER = path.join(__dirname, '.seed');


const doctors = [
  {
    name: 'Dr. Arjun Mehta',
    email: 'arjun.mehta@gmail.com',
    password: 'doctor123',
    role: 'doctor',
    specialization: 'General Physician',
    qualification: 'MBBS, MD',
    experience: 10,
    gender: 'male',
    contact: '9876543210',
  },
  {
    name: 'Dr. Priya Nair',
    email: 'priya.nair@gmail.com',
    password: 'doctor123',
    role: 'doctor',
    specialization: 'Cardiologist',
    qualification: 'MBBS, DM Cardiology',
    experience: 14,
    gender: 'female',
    contact: '9876543211',
  },
];

const staff = [
  {
    name: 'Ravi Kumar',
    email: 'ravi.kumar@gmail.com',
    password: 'staff123',
    role: 'staff',
    gender: 'male',
    contact: '9123456780',
  },
];

// Only one patient is seeded - others can self-register
const patients = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    password: 'patient123',
    role: 'patient',
    dob: new Date('1995-06-15'),
    gender: 'male',
    contact: '9000000001',
    address: '12 MG Road, Bangalore',
    bloodGroup: 'B+',
    allergies: 'None',
    emergencyContact: '9000000099',
  },
];


function todayAt(timeStr) {
  const d = new Date();
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}


async function seed() {
  // Skip if already seeded
  if (fs.existsSync(SEED_MARKER)) {
    console.log('Database already seeded (.seed file found). Skipping.');
    console.log('To re-seed, delete the server/.seed file first.');
    process.exit(0);
  }

  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  // 1. Clear existing data
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Appointment.deleteMany({}),
    Prescription.deleteMany({}),
    Note.deleteMany({}),
  ]);
  console.log('Done.\n');

  // 2. Create users
  console.log('Creating users...');
  const createdDoctors  = await User.create(doctors);
  const createdStaff    = await User.create(staff);
  const createdPatients = await User.create(patients);

  const [doc1, doc2] = createdDoctors;
  const [pat1]       = createdPatients;

  console.log(`  ${createdDoctors.length} doctors`);
  console.log(`  ${createdStaff.length} staff`);
  console.log(`  ${createdPatients.length} patients\n`);

  // 3. Create appointments - 2 per doctor
  console.log('Creating appointments...');
  const appointments = await Appointment.create([
    // Dr. Arjun Mehta - appointment 1 (today, done)
    {
      patient: pat1._id, doctor: doc1._id,
      date: todayAt('10:00 AM'), slot: '10:00 AM',
      reason: 'General check-up',
      status: 'done', fee: 300, feePaid: true,
    },
    // Dr. Arjun Mehta - appointment 2 (upcoming)
    {
      patient: pat1._id, doctor: doc1._id,
      date: daysFromNow(3), slot: '11:00 AM',
      reason: 'Follow-up visit',
      status: 'pending', fee: 300, feePaid: false,
    },
    // Dr. Priya Nair - appointment 1 (today, waiting)
    {
      patient: pat1._id, doctor: doc2._id,
      date: todayAt('02:00 PM'), slot: '02:00 PM',
      reason: 'Routine consultation',
      status: 'waiting', fee: 400, feePaid: false,
    },
    // Dr. Priya Nair - appointment 2 (upcoming)
    {
      patient: pat1._id, doctor: doc2._id,
      date: daysFromNow(5), slot: '03:00 PM',
      reason: 'Review test results',
      status: 'pending', fee: 400, feePaid: false,
    },
  ]);
  console.log(`  ${appointments.length} appointments\n`);

  const [appt1] = appointments;

  // 4. Create one simple prescription
  console.log('Creating prescriptions...');
  const prescriptions = await Prescription.create([
    {
      appointment: appt1._id,
      doctor: doc1._id,
      patient: pat1._id,
      date: new Date(),
      diagnosis: 'Common cold',
      medicines: [
        { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '3 days', instructions: 'Take after meals' },
        { name: 'Cetirizine', dosage: '10mg', frequency: 'Once at night', duration: '3 days', instructions: 'Take before sleep' },
      ],
      additionalNotes: 'Rest and drink plenty of fluids.',
    },
  ]);
  console.log(`  ${prescriptions.length} prescription\n`);

  // 5. Create one simple note
  console.log('Creating doctor notes...');
  const notes = await Note.create([
    {
      doctor: doc1._id,
      patient: pat1._id,
      appointment: appt1._id,
      content: 'Patient came in with cold symptoms. Prescribed basic medication. Follow up in 3 days if not better.',
    },
  ]);
  console.log(`  ${notes.length} note\n`);

  // Summary
  console.log('===================================================');
  console.log('Seeding complete! Demo credentials:\n');

  console.log('DOCTORS');
  console.log('  arjun.mehta@gmail.com  / doctor123');
  console.log('  priya.nair@gmail.com   / doctor123\n');

  console.log('RECEPTION');
  console.log('  ravi.kumar@gmail.com   / staff123\n');

  console.log('PATIENT (1 seeded, others can self-register)');
  console.log('  aarav.sharma@gmail.com / patient123\n');

  console.log('===================================================');

  // Write the .seed marker so this script won't run again automatically
  fs.writeFileSync(SEED_MARKER, new Date().toISOString());
  console.log('Marker file created: server/.seed\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
