# 🩸 Sweety – Blood Glucose Tracker (PERN Stack)

**Sweety** is a clinical-grade full-stack web application designed for diabetes patients to record up to 4 daily blood glucose readings across dedicated meal-related time slots, enforce strict medical validation rules, and monitor their glycemic control through Daily, Month-to-Date, and Monthly analytical reports.

Built with **Node.js + Express**, **PostgreSQL**, and **React (Vite + Tailwind CSS)**.

---

## 📑 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Features](#-features)
  - [1. Authentication & Security](#1-authentication--security)
  - [2. Readings CRUD & Clinical Validation](#2-readings-crud--clinical-validation)
  - [3. Analytical Reports & Visual Trends](#3-analytical-reports--visual-trends)
  - [Bonus Tasks Implemented](#bonus-tasks-implemented)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Database Migration & Seeding](#3-database-migration--seeding)
  - [4. Frontend Setup](#4-frontend-setup)
- [Running Automated Tests](#-running-automated-tests)
- [Running with Docker Compose](#-running-with-docker-compose)
- [Demo Credentials](#-demo-credentials)
- [Notes, Assumptions & Future Improvements](#-notes-assumptions--future-improvements)

---

## 🏛 Architecture & Tech Stack

```
sweety/
├── server/                 # Express REST API (Node.js)
│   ├── src/
│   │   ├── config/         # PostgreSQL connection pool configuration
│   │   ├── controllers/    # Auth, Readings CRUD, and Reports controllers
│   │   ├── db/             # DDL schema, migrations, and demo seed script
│   │   ├── middleware/     # JWT authentication & error handling
│   │   ├── routes/         # Express router endpoints
│   │   └── utils/          # Validation logic and date helpers
│   └── tests/              # Jest + Supertest integration test suite
├── client/                 # React SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/     # Navbar, ReadingFormModal, ReadingsTable, ReportCard, TrendChart
│   │   ├── context/        # AuthContext for session management
│   │   ├── pages/          # Login, Register, Dashboard, ReportsPage
│   │   ├── services/       # Axios API client with JWT interceptor
│   │   └── test/           # React Testing Library & Vitest unit tests
├── docker-compose.yml      # Multi-container orchestration (PostgreSQL + App)
└── README.md
```

- **Backend**: Node.js, Express.js, `pg` (node-postgres connection pooling), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`
- **Database**: PostgreSQL (relational schema, foreign keys, compound unique constraints, check constraints)
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts (visual trend charting)
- **Testing**: Jest + Supertest (Backend API integration), Vitest + React Testing Library (Frontend form tests)

---

## ✨ Features

### 1. Authentication & Security
- User registration with name, email, and password.
- Passwords securely hashed with **bcrypt** (cost factor 10) — passwords are never stored in plain text.
- Stateless authentication using **JSON Web Tokens (JWT)**.
- **Tenant Isolation**: Users only see, edit, and report on their own blood glucose readings.

### 2. Readings CRUD & Clinical Validation
Each reading has a **date**, a **time slot**, and a **value in mg/dl**.
The 4 allowable slots are:
- `Morning (fasting)`
- `After breakfast`
- `After lunch`
- `After dinner`

#### Exact Validation Rules Enforced (API & UI):
| Rule | Condition | Exact Error Message |
| :--- | :--- | :--- |
| **Value is required** | Empty / omitted value | `"Please enter a glucose value."` |
| **Value in range** | Non-integer, `< 40`, or `> 600` | `"Value must be between 40 and 600 mg/dl."` |
| **Unique slot per day** | Duplicate slot on selected date | `"You already have an After lunch reading for this date."` |
| **Maximum 4 per day** | Exceeding 4 slots on same date | `"You can add only 4 readings per day."` |
| **No future dates** | Date is after current local date | `"Date cannot be in the future."` |

*Note: The duplicate slot error dynamically uses the correct grammatical article (e.g. `an After lunch`, `a Morning (fasting)`).*

### 3. Analytical Reports & Visual Trends
For any selected reference date (defaulting to today), Sweety generates:
- **Daily Report**: Selected date's highest, lowest, average reading (rounded to 1 decimal place), count of readings, and an itemized breakdown of each reading with its slot.
- **Month-to-Date Report**: From the 1st of the month to the selected date (highest, lowest, average, and count).
- **Monthly Report**: The complete previous calendar month (e.g., 1 Sep – 30 Sep if 15 Oct is chosen) with highest, lowest, average, and count.
- **Empty States**: If no readings exist in the given range, friendly and informative empty states are displayed instead of blank screens or broken numbers.

### 🌟 Bonus Tasks Implemented
- ✅ **Pagination on `GET /api/readings`**: Supports `?page=1&limit=20` with page count and total records.
- ✅ **Interactive Charts**: Interactive month-to-date line chart with target glycemic boundary (70–140 mg/dl) rendered using Recharts.
- ✅ **Dockerized Environment**: `docker-compose.yml` that provisions PostgreSQL, Express API, and React client.
- ✅ **Frontend Component Testing**: React Testing Library + Vitest test suite for the `ReadingFormModal` form validations.
- ✅ **Realistic Seed Generator**: Script that creates realistic historical fasting and postprandial data spanning today, month-to-date, and previous month.

---

## 🛠 Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended; v20+ supported)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher) OR [Docker Desktop](https://www.docker.com/)

---

## 🚀 Quick Start Guide

### 1. Database Setup

Ensure PostgreSQL is running locally on port `5432`. Create the application database and test database:

```sql
CREATE DATABASE sweety_db;
CREATE DATABASE sweety_test_db;
```

*(If using the PostgreSQL CLI: `createdb sweety_db` and `createdb sweety_test_db`)*

### 2. Backend Setup

1. Open your terminal in the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file from the template:
   ```bash
   cp .env.example .env
   ```
   Configure your PostgreSQL credentials in `.env` if your local database uses a custom user or password:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=sweety_db
   DB_USER=postgres
   DB_PASSWORD=
   JWT_SECRET=sweety_super_secret_jwt_key_development_only_123456
   ```

### 3. Database Migration & Seeding

Run the automated migration and seed script to prepare tables and create demo patient data:

```bash
# Run schema migrations
npm run migrate

# Seed demo user and historical readings
npm run seed
```

Output:
```text
Running database migrations for sweety_db...
Database migration completed successfully.
Created demo user: demo@sweety.com (ID: 1)
Successfully seeded 78 readings for demo user.
Demo Credentials:
Email:    demo@sweety.com
Password: password123
```

### 4. Frontend Setup

1. In a new terminal, navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open your browser at **http://localhost:5173**!

---

## 🧪 Running Automated Tests

### Backend Test Suite (Jest + Supertest)
Runs full integration tests testing user authentication, password hashing, all 5 reading validation error messages, user data isolation, pagination, and reporting calculations:

```bash
cd server
npm test
```

### Frontend Test Suite (Vitest + React Testing Library)
Tests form rendering, empty value prevention, 40–600 mg/dl range validation, and future date rejection:

```bash
cd client
npm test
```

---

## 🐳 Running with Docker Compose

To start the entire application including PostgreSQL with a single command:

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:5000/api/health
- **PostgreSQL**: port 5432

---

## 🔑 Demo Credentials

A pre-populated demo patient is available for instant testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Demo Patient** | `demo@sweety.com` | `password123` |

*(Tip: On the login screen, click the **"Fill Demo User"** button to automatically populate credentials with one click.)*

---

## 📝 Notes, Assumptions & Future Improvements

### Assumptions Made
1. **Timezone & Date Storage**:
   Glucose readings are associated with calendar dates (`YYYY-MM-DD`). To prevent unintended timezone offsets (e.g. UTC converting midnight to previous day), dates are formatted and compared strictly in ISO date string format `YYYY-MM-DD`.
2. **Clinical Glucose Ranges**:
   Readings are categorized based on standard ADA (American Diabetes Association) guidelines:
   - `< 70 mg/dl`: Hypoglycemia (Blue / Caution)
   - `70 – 140 mg/dl`: Normal / Target (Emerald / In Range)
   - `141 – 199 mg/dl`: Elevated (Amber)
   - `≥ 200 mg/dl`: Hyperglycemia (Rose / High)
3. **Previous Month Date Boundaries**:
   For the Monthly report, the previous month is calculated dynamically based on the selected date. For example, selecting `15 Oct 2026` aggregates readings from `1 Sep 2026` to `30 Sep 2026`. If selecting `10 Jan 2026`, it seamlessly rolls back to `1 Dec 2025 – 31 Dec 2025`.
4. **Rounding**:
   Average glucose values are rounded to exactly 1 decimal place using PostgreSQL's numeric rounding (`ROUND(AVG(value)::numeric, 1)`), conforming strictly to medical reporting conventions.

### What I Would Improve With More Time
1. **Doctor / Clinician Portal (Bonus Feature)**:
   Implement a role-based access control (RBAC) system where clinicians can invite patients, monitor patient logs, set custom target thresholds, and receive alerts if a patient records recurrent hypoglycemic episodes (< 70 mg/dl).
2. **Export to PDF / CSV**:
   Add a one-click "Export for Physician" feature that formats the Daily and Monthly reports into a clean PDF summary with trend charts.
3. **Automated Reminders with BullMQ & Redis**:
   Schedule an end-of-day background job that sends a notification or email alert to patients who have logged fewer than 4 readings for the day.
4. **Offline PWA Support**:
   Enable Service Workers and IndexedDB caching so patients can log readings without an active internet connection, automatically synchronizing with the PostgreSQL backend when back online.
5. **HbA1c Estimation (eAG)**:
   Add an estimated Average Glucose (eAG) to HbA1c converter formula ($HbA1c = (eAG + 46.7) / 28.7$) to give patients long-term glycemic visibility.
