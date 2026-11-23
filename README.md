# Sweety – Blood Glucose Tracker (MERN + PostgreSQL)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.x-22c55e)](https://recharts.org/)
[![Tests](https://img.shields.io/badge/Tests-46%20Passed-brightgreen)](https://jestjs.io/)

Sweety is a full-stack web application designed for diabetes patients to record up to 4 blood glucose readings a day across meal slots (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`) and view daily, month-to-date, and previous-month statistical reports with interactive charts.

Built for the **Kenpath Junior Full Stack Developer Assessment**.

---

## 📸 Overview & Features

### 1. Authentication & Security
- **User Registration & Login:** Patients register with name, email, and password.
- **Bcrypt Hashing:** Passwords are salted and hashed using `bcryptjs` via Sequelize model hooks. Passwords are never stored in plain text.
- **JWT Protection:** Secure stateless sessions with signed JSON Web Tokens (`Bearer <token>`).
- **Data Isolation:** Queries are strictly scoped to `req.user.id`. Patients can only view, edit, and delete their own readings.

### 2. Readings Management (CRUD & Strict Validations)
- **Meal Slots:** Exactly 4 standardized slots:
  - `Morning (fasting)`
  - `After breakfast`
  - `After lunch`
  - `After dinner`
- **Validation Rules (with exact user-facing feedback):**
  - **Value required:** `"Please enter a glucose value."`
  - **Range & Integer:** `"Value must be between 40 and 600 mg/dl."`
  - **Slot uniqueness per day:** Dynamic message: `"You already have an After lunch reading for this date."`
  - **Daily quota:** `"You can add only 4 readings per day."`
  - **No future records:** `"Date cannot be in the future."`
- **Slot Dashboard:** Top-of-page interactive cards showing completion status for today's 4 slots with one-click logging.
- **Readings History Table:** View, edit, and delete readings with status badges (Normal, Elevated, High) and pagination.

### 3. Reports & Analytics
- **Summary Metrics:** Every report computes **Highest**, **Lowest**, **Average** (rounded to 1 decimal place), and **Total Readings Count**.
- **Friendly Empty States:** Shows friendly empty-state prompt and quick-action buttons when no data is recorded for the chosen timeframe.
- **Three Core Reports:**
  1. **Daily Report:** Selected date metrics and a breakdown listing each reading with its slot name.
  2. **Month-to-Date Report:** Covers the 1st of the current month up to the selected date.
  3. **Monthly (Previous Month):** Covers the entire previous month (e.g., September 1–30 for an October date) with leap year and calendar boundary handling.
- **Visual Trends (Bonus):** Interactive line charts built with `Recharts` showing glucose fluctuations against clinical reference thresholds (target < 140 mg/dl).

### 4. Bonus Features Implemented
- ✅ **Pagination:** `GET /api/readings?page=1&limit=20` with page metadata.
- ✅ **Recharts Visualization:** Trend line chart with responsive container, customized tooltips, and target reference lines.
- ✅ **Docker Compose:** Complete `docker-compose.yml` for automated PostgreSQL 16 setup.
- ✅ **Automated Test Suites:** 42 backend integration tests (Jest + Supertest) and 4 frontend tests (React Testing Library + Vitest) = **46 total tests passing**.
- ✅ **Demo Seed Script:** Realistic seed script populating today's readings, Month-to-date data, and complete previous month data for immediate testing.

---

## 📁 Repository Structure

```text
├── Assignment.pdf              # Kenpath assignment requirements
├── docker-compose.yml          # PostgreSQL container definition
├── package.json                # Root orchestration scripts
├── .gitignore
├── README.md
│
├── server/                     # Express.js Backend API
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── config/             # Sequelize & database configuration
│   │   ├── controllers/        # Auth, Reading, and Report controllers
│   │   ├── middleware/         # JWT auth & input validation middleware
│   │   ├── models/             # User and Reading Sequelize models
│   │   ├── routes/             # Express API routes
│   │   ├── scripts/            # Database sync & demo seed scripts
│   │   ├── utils/              # JWT and date statistical helpers
│   │   ├── app.js              # Express app middleware configuration
│   │   └── server.js           # Server entry point (port 5000)
│   └── test/                   # Jest + Supertest API test suites
│
└── client/                     # React (Vite) Frontend
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── components/         # Modals, Navbar, Layout, Cards, Tables, Chart
        ├── context/            # AuthContext (login, register, session restore)
        ├── pages/              # Login, Register, Dashboard, Reports
        ├── services/           # Axios API client with auth interceptors
        ├── setupTests.js       # Jest DOM testing setup
        ├── App.jsx             # React Router and route definitions
        └── main.jsx            # Application entry point
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker Desktop](https://www.docker.com/) (optional, for running PostgreSQL via Docker) or any local/cloud PostgreSQL instance

---

### Step 1: Install Dependencies
Run the install command from the root directory to install all dependencies for root, server, and client:
```bash
npm run install:all
```

---

### Step 2: Database Setup

#### Option A: Using Docker (Recommended)
Start a local PostgreSQL container:
```bash
npm run docker:up
# Or: docker compose up -d
```

#### Option B: Using an Existing Local / Cloud PostgreSQL
Create a database named `sweety_db` and ensure your `server/.env` credentials match:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweety_db
DB_USER=postgres
DB_PASSWORD=postgrespassword
# Or full connection string:
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/sweety_db
```

---

### Step 3: Seed Demo Data
Populate the database with a ready-to-use demo account and realistic glucose readings across today, this month, and last month:
```bash
npm run seed
```

**Demo Credentials:**
- **Email:** `demo@sweety.com`
- **Password:** `password123`

---

### Step 4: Run the Application
Start both the backend server and frontend client concurrently:
```bash
npm run dev
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Running Tests

### Run All Tests (Backend + Frontend)
```bash
npm test
```

### Run Backend Tests Only (42 Tests with Jest & Supertest)
```bash
npm run test:server
```
Covers:
- `health.test.js`: Server health and root endpoints.
- `models.test.js`: Password hashing, uniqueness, slot constraints, glucose range validations, future date rejection.
- `auth.test.js`: Registration, login, duplicate rejection, and protected profile endpoint.
- `readings.test.js`: All 5 business validation rules, pagination, multi-tenant isolation, edit/delete.
- `reports.test.js`: Daily metrics + slot listing, Month-to-date calculation, Monthly calculation, and empty states.

### Run Frontend Tests Only (React Testing Library + Vitest)
```bash
npm run test:client
```
Covers:
- `ReadingModal.test.jsx`: Form rendering, empty value validation, min/max glucose boundary validations.

---

## 🌐 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new patient account | No |
| `POST` | `/api/auth/login` | Authenticate patient & receive JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated patient profile | Yes |

### Readings (`/api/readings`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/readings` | Create reading with validation checks | Yes |
| `GET` | `/api/readings` | List readings (supports `?page=1&limit=20&date=YYYY-MM-DD`) | Yes |
| `GET` | `/api/readings/:id` | Get single reading | Yes |
| `PUT` | `/api/readings/:id` | Update reading value/slot/date | Yes |
| `DELETE` | `/api/readings/:id` | Delete reading | Yes |

### Reports (`/api/reports`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Daily stats + slot listing | Yes |
| `GET` | `/api/reports/month-to-date?date=YYYY-MM-DD` | 1st of month to date stats | Yes |
| `GET` | `/api/reports/monthly?date=YYYY-MM-DD` | Whole previous month stats | Yes |
| `GET` | `/api/reports/summary?date=YYYY-MM-DD` | Combined summary for dashboard | Yes |

---

## 📝 Notes & Engineering Decisions

### Assumptions Made
1. **Timezone & Date Format:** All dates are formatted as ISO date strings (`YYYY-MM-DD`) across backend and frontend to eliminate timezone discrepancies between patient browsers and server UTC dates.
2. **Clinical Reference Targets:** Displayed targets follow clinical diabetes guidelines:
   - Fasting Target: 70–99 mg/dl
   - Post-Meal Target: < 140 mg/dl
   - Readings $\ge 140$ are highlighted as elevated; $\ge 200$ as high.
3. **Daily Limit Safeguard:** The maximum 4 readings per day limit is enforced both at the application logic layer (returning `"You can add only 4 readings per day."`) and guaranteed by the database composite unique index `(userId, date, slot)`.
4. **Automated Testing Environment:** Backend tests run against in-memory SQLite when `NODE_ENV=test`, allowing the full test suite to execute in under 5 seconds in CI/CD without requiring an external PostgreSQL instance, while PostgreSQL is used for development and production.

### What Would Be Improved With More Time
1. **Redis Caching:** Cache report calculations (`/api/reports/summary`) with a Redis key per user and date, automatically invalidated via a cache eviction hook whenever a reading is created, updated, or deleted.
2. **BullMQ Background Reminders:** Implement a daily cron queue with BullMQ and Redis that inspects patients who have logged fewer than 4 readings by 8:00 PM and queues a notification or email reminder.
3. **Doctor / Caregiver Role:** Add a `role` enum (`'patient' | 'doctor'`) and an assignment table allowing physicians to view assigned patient report dashboards, trends, and export CSV/PDF clinical summaries.
4. **PWA & Offline Logging:** Add Service Worker caching and IndexedDB queueing so patients can log readings without internet connectivity and sync automatically when reconnected.
