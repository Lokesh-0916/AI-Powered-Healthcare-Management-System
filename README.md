# AI Powered Healthcare Management System

![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat-square&logo=css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=googlegemini&logoColor=white)

A full-stack, role-based healthcare management system that connects **Patients**, **Doctors**, and **Reception staff** in a single, unified platform. It streamlines core hospital workflows (like appointments, records, and prescriptions) while featuring an integrated Google Gemini AI assistant to answer patient health queries.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Project](#running-the-project)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Patient Portal](#patient-portal)
  - [Doctor Portal](#doctor-portal)
  - [Reception Portal](#reception-portal)
- [Project Structure](#project-structure)
- [Seeding Demo Data](#seeding-demo-data)
- [Environment Variables](#environment-variables)
- [Database](#database)

---

## Overview

The **AI Powered Healthcare Management System** is a web application that digitises core hospital workflows. It provides three separate role-based dashboards, each tailored to the specific needs of that user type:

- **Patients** can book appointments, view prescriptions, upload medical reports, and chat with an AI health assistant.
- **Doctors** can view their patient list, manage appointments, write notes and prescriptions, review patient-uploaded files, and instantly generate AI summaries of patient data.
- **Reception staff** can manage appointments, handle fee records, set reminders, and view system-wide logs.

All three roles share a single login/register page and are automatically redirected to their respective dashboards after authentication.

---

## Prerequisites

Before you start, make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) — **Community Edition** (local) **OR** a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud account
- [Git](https://git-scm.com/) (to clone the repo)
- A **Google Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/)

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/Lokesh-0916/HealthCare-Portal.git
cd healthcare-portal
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your real values:

```bash
# In the server/ directory:
copy .env.example .env
```

Then open `server/.env` and update:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthcare   # or your Atlas URI
JWT_SECRET=replace_this_with_a_long_random_string
GEMINI_API_KEY=your_actual_gemini_api_key
CLIENT_URL=http://127.0.0.1:5500
```

> **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## Running the Project

### Option A — One-click (Windows)

Double-click **`runme.bat`** in the project root.  
It will automatically start the Node.js server and open the login page in your browser.

### Option B — Manual

**Terminal 1 — Start the backend:**
```bash
cd server
npm start
```

**Browser — Open the frontend:**  
Open `client/login.html` directly in your browser, or serve it with a tool like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (VS Code extension).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (via Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens) + bcryptjs |
| **AI Assistant** | Google Gemini API (`@google/generative-ai`) |
| **File Uploads** | Multer |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Environment** | dotenv |

---

## Features

### Patient Portal

- **Dashboard** — Overview of upcoming appointments and recent activity
- **Book Appointment** — Schedule appointments with available doctors
- **My Details** — View and manage personal health information
- **My Prescriptions** — View doctor-issued medical prescriptions and dosages
- **My Uploads** — Upload and manage medical reports/documents (PDF)
- **AI Chat** — Chat with a Gemini-powered AI health assistant

### Doctor Portal

- **Dashboard** — Summary of today's appointments and patient activity
- **Patient List** — Browse all assigned patients
- **Patient Detail View** — Deep-dive into a specific patient:
  - View & write consultation notes
  - Issue prescriptions
  - Review patient-uploaded reports
  - Manage appointments
  - **AI Summaries** — Instantly generate patient history and report summaries using Gemini AI

### Reception Portal

- **Dashboard** — At-a-glance summary of daily operations
- **Appointments** — Create, update, and manage all appointments
- **Fees** — Record and track patient fee payments
- **Reminders** — Set and manage staff/patient reminders
- **Logs** — View system activity logs

---

## Project Structure

```
HealthCare Portal/
│
├── client/                   # Frontend (HTML/CSS/JS — no framework)
│   ├── login.html            # Unified login page
│   ├── register.html         # Registration page
│   ├── css/                  # Stylesheets
│   ├── js/                   # Shared JavaScript utilities
│   ├── doctor/               # Doctor dashboard pages
│   ├── patient/              # Patient dashboard pages
│   └── reception/            # Reception dashboard pages
│
├── server/                   # Backend (Node.js / Express)
│   ├── index.js              # App entry point, DB connection, route mounting
│   ├── .env                  # Secret config (NOT committed to Git)
│   ├── .env.example          # Template showing required env variables
│   ├── models/               # Mongoose data models
│   │   ├── User.js
│   │   ├── Appointment.js
│   │   ├── Prescription.js
│   │   ├── Note.js
│   │   └── Upload.js
│   ├── routes/               # Express API routes
│   │   ├── auth.js           # /api/auth — login, register
│   │   ├── doctor.js         # /api/doctor — doctor-scoped endpoints
│   │   ├── patient.js        # /api/patient — patient-scoped endpoints
│   │   └── reception.js      # /api/reception — reception-scoped endpoints
│   ├── middleware/           # Auth & role-guard middleware
│   ├── services/             # AI service (Gemini integration)
│   └── uploads/              # Stores uploaded patient files (gitignored)
│
├── runme.bat                 # One-click launcher for Windows
├── .gitignore
└── README.md
```

---

## Seeding Demo Data

**If you use `runme.bat`, seeding happens automatically** — no manual step needed.

On the very first launch, `runme.bat` checks for a `server/.seed` marker file. If it doesn't exist, it runs the seed script before starting the server. On every subsequent launch, the marker is present so seeding is skipped.

If you are running the server manually, you can seed once with:

```bash
# From the server/ directory:
npm run seed
```

This also checks for the marker file and skips if already seeded.

**To force a re-seed** (wipes all data and starts fresh):
```bash
# Delete the marker file first, then re-run
del server\.seed
npm run seed
```

> **Warning:** Re-seeding wipes the entire database — all registered patients, appointments, and data will be lost.

This will create the following demo accounts:

| Role | Email | Password |
|---|---|---|
| Doctor | `arjun.mehta@gmail.com` | `doctor123` |
| Doctor | `priya.nair@gmail.com` | `doctor123` |
| Reception | `ravi.kumar@gmail.com` | `staff123` |
| Patient | `aarav.sharma@gmail.com` | `patient123` |

It also seeds:
- **4 appointments** — 2 per doctor (one today, one upcoming)
- **1 prescription** with basic medicines
- **1 doctor note**

> **Note:** Only doctors and one demo patient are seeded. Doctors cannot self-register — they must be seeded or added manually. Additional patients can register themselves through the app.

> **Warning:** The seed script **clears all existing data** before inserting. Do not run it if you have real data you want to keep.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the Express server runs on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/healthcare` |
| `JWT_SECRET` | Secret key used to sign auth tokens | `a_long_random_secret` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIza...` |
| `CLIENT_URL` | Frontend URL (used for CORS) | `http://127.0.0.1:5500` |

---

## Database

The project uses **MongoDB** with **Mongoose**. You have two options:

**Option 1 — Local MongoDB**
- Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
- Start the MongoDB service
- Set `MONGO_URI=mongodb://localhost:27017/healthcare` in your `.env`
- Use [MongoDB Compass](https://www.mongodb.com/products/compass) to visually browse your data

**Option 2 — MongoDB Atlas (Cloud)**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Whitelist your IP address
- Copy your connection string and set it as `MONGO_URI` in your `.env`


---

## Author

**Majji Lokesh Krishna**
