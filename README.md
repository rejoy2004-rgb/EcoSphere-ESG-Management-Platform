# 🌿 EcoSphere — ESG Management Platform

EcoSphere is an integrated **Environmental, Social, and Governance (ESG) management platform** that plugs into day-to-day ERP operations. It replaces manual, disconnected ESG reporting with a unified system that measures carbon emissions, tracks employee participation and diversity, manages governance compliance, and drives engagement through gamification — all rolled up into a single, configurable Overall ESG Score.

---

## Table of Contents

- [Overview](#overview)
- [Core Modules](#core-modules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Business Workflow](#business-workflow)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Database Setup & Seeding](#database-setup--seeding)
- [Running the Project](#running-the-project)
- [Demo Credentials](#demo-credentials)
- [Core Business Rules](#core-business-rules)
- [Reports](#reports)
- [API Documentation](#api-documentation)
- [Role-Based Access Control](#role-based-access-control)
- [Troubleshooting](#troubleshooting)
- [Roadmap / Bonus Features](#roadmap--bonus-features)
- [License](#license)

---

## Overview

Organizations are expected to monitor carbon emissions, promote employee well-being, and maintain governance compliance — but most ERP systems treat ESG as an afterthought, collected manually and reviewed too late to act on. EcoSphere integrates ESG directly into daily operations by:

- Automatically calculating carbon emissions from operational records (Purchase, Manufacturing, Expenses, Fleet)
- Turning employee CSR participation, training, and diversity into measurable Social metrics
- Tracking policies, audits, and compliance issues for Governance
- Motivating participation through challenges, XP, badges, rewards, and leaderboards
- Rolling everything up into department-level and organization-wide ESG scores, visualized on live dashboards and exportable reports

---

## Core Modules

| Module | What It Covers |
|---|---|
| **Environmental** | Emission factors, carbon accounting, department carbon tracking, sustainability goals, environmental dashboard |
| **Social** | CSR activities, employee participation, diversity metrics, training completion |
| **Governance** | ESG policies, policy acknowledgements, audits, compliance issue tracking |
| **Gamification** | Challenges (full lifecycle), XP, badges (auto-awarded), redeemable rewards, leaderboards |
| **Reports** | Environmental, Social, Governance, ESG Summary, and a fully filterable Custom Report Builder — exportable as PDF / Excel / CSV |
| **Settings & Administration** | Departments, categories, ESG scoring configuration, notification settings, business-rule toggles |

---

## Tech Stack

**Backend**
- Node.js + TypeScript + Express
- PostgreSQL with Prisma ORM
- JWT authentication with role-based access control
- node-cron for scheduled jobs (overdue compliance checks, policy reminders, score recalculation)
- exceljs / puppeteer / native CSV for report exports

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS
- Recharts for dashboard visualizations
- React Router

**Infrastructure**
- Local or S3-compatible file storage for proof-of-evidence uploads
- Mock or SMTP-based email service for notifications

---

## Project Structure

```
ecosphere/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # full data model
│   │   └── seed.ts             # demo data seed script
│   ├── src/
│   │   ├── modules/
│   │   │   ├── environmental/
│   │   │   ├── social/
│   │   │   ├── governance/
│   │   │   ├── gamification/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── services/
│   │   │   ├── scoringEngine.ts
│   │   │   ├── badgeEngine.ts
│   │   │   └── notificationService.ts
│   │   ├── jobs/                # scheduled cron jobs
│   │   ├── middleware/          # auth, RBAC, validation
│   │   └── app.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Environmental/
│   │   │   ├── Social/
│   │   │   ├── Governance/
│   │   │   ├── Gamification/
│   │   │   ├── Reports/
│   │   │   └── Settings/
│   │   ├── components/          # DataTable, StatCard, FilterBar, etc.
│   │   └── api/                 # API client
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── ERD.md
│   ├── API.md
│   └── DEMO-SCRIPT.md
└── README.md
```

---

## Data Model

### Master Data

| Model | Purpose | Key Fields |
|---|---|---|
| Department | Organizational hierarchy and ESG ownership | Name, Code, Head, Parent Department, Employee Count, Status |
| Category | Shared category values for Social/Gamification | Name, Type (CSR Activity / Challenge), Status |
| Emission Factor | Carbon values used in calculations | Activity Type, Unit, CO2e Factor, Validity Range |
| Product ESG Profile | ESG information linked to products | Carbon Footprint, Sustainability Rating |
| Environmental Goal | Sustainability targets | Metric, Target, Current, Status |
| ESG Policy | Governance policies | Title, Category, Version, Status |
| Badge | Employee achievements | Name, Description, Unlock Rule, Icon |
| Reward | Redeemable incentives | Name, Description, Points Required, Stock, Status |

### Transactional Data

| Model | Purpose | Key Fields |
|---|---|---|
| Carbon Transaction | Calculated emissions from ERP operations | Department, Factor, Quantity, CO2e |
| CSR Activity | Social initiatives organized by the company | Title, Category, Department, Status |
| Employee Participation | Employee involvement in CSR Activities only | Employee, Activity, Proof, Approval Status, Points Earned |
| Challenge | Sustainability challenges | Title, Category, XP, Difficulty, Evidence Required, Status |
| Challenge Participation | Employee progress within Challenges only | Challenge, Employee, Progress, Proof, Approval, XP Awarded |
| Policy Acknowledgement | Employee policy acceptance | Employee, Policy, Status |
| Audit | Governance audits | Department, Auditor, Status |
| Compliance Issue | Governance violations | Audit, Severity, Owner, Due Date, Status |
| Department Score | Aggregated ESG performance per department | Environmental / Social / Governance / Total Score |

Full entity relationships are documented in [`docs/ERD.md`](docs/ERD.md).

---

## Business Workflow

```
Master Configuration
  (Departments · Categories · Emission Factors · Products · Goals · Policies · Challenges)
        │
        ▼
Daily Business Operations
  (Purchase · Manufacturing · Expenses · Fleet)
        │
        ▼
Carbon Transactions
        │
        ▼
Employee Participation (CSR) · Challenge Participation
Policy Acknowledgements · Audits
        │
        ▼
Environmental Score   Social Score   Governance Score
        │
        ▼
Department Total Score
        │
        ▼
Overall ESG Score
  (weighted average of Department Total Scores
   default: Environmental 40% / Social 30% / Governance 30% — configurable in Settings)
        │
        ▼
Organization Dashboard & Reports
```

---

## Prerequisites

- **Node.js** v18 or v20 (LTS)
- **PostgreSQL** v14+ (local install or Docker)
- **npm** (or yarn/pnpm, matching whatever the project was scaffolded with)
- **Git**

---

## Setup & Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ecosphere

# 2. Start PostgreSQL (Docker option)
docker run --name ecosphere-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ecosphere \
  -p 5432:5432 -d postgres:16

# 3. Install backend dependencies
cd backend
npm install

# 4. Install frontend dependencies
cd ../frontend
npm install
```

---

## Environment Variables

### Backend — `backend/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecosphere?schema=public"
JWT_SECRET="replace-with-a-long-random-string"
PORT=4000
FILE_STORAGE_PATH="./uploads"
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string used by Prisma |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `PORT` | Port the Express API runs on |
| `FILE_STORAGE_PATH` | Local folder for uploaded proof/evidence files |
| `SMTP_*` | Optional — real email delivery for notifications; leave blank to use the mock email sender |

### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL="http://localhost:4000/api"
```

Copy the example files before editing:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---

## Database Setup & Seeding

From `/backend`:

```bash
npx prisma generate          # generate the Prisma Client
npx prisma migrate dev --name init   # create all tables
npx prisma db seed           # populate demo data
```

The seed script creates:
- 5+ departments (with hierarchy)
- Users across all roles
- Emission factors, goals, and policies
- CSR activities, challenges, and participation records at varying approval states
- Badges, rewards, audits, and compliance issues (including overdue ones)
- Six months of carbon transaction history
- Pre-computed department ESG scores for trend charts

Inspect the seeded database visually:
```bash
npx prisma studio
```

---

## Running the Project

Open two terminal windows:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```
Runs at `http://localhost:4000`. Verify with `http://localhost:4000/api/health`.

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
Runs at `http://localhost:5173`.

Open `http://localhost:5173` in your browser and log in with one of the [demo credentials](#demo-credentials) below.

### Optional: run both with one command
From the project root, with a root `package.json` and `concurrently` installed:
```bash
npm run dev
```

---

## Demo Credentials

*(printed automatically at the end of `npx prisma db seed`)*

| Role | Email | Password |
|---|---|---|
| Admin | admin@ecosphere.demo | password123 |
| ESG Manager | manager@ecosphere.demo | password123 |
| Department Head | depthead1@ecosphere.demo | password123 |
| Employee | employee1@ecosphere.demo | password123 |

---

## Core Business Rules

These are implemented as first-class platform behavior, not optional extras:

- **Reward Redemption** — employees redeem Points/XP for catalog rewards, subject to stock; redemption deducts points and decrements stock atomically.
- **Notification System** — in-app and/or email notifications for new compliance issues, CSR/Challenge approval decisions, policy acknowledgement reminders, and badge unlocks (channels configurable in Settings).
- **Auto Emission Calculation** — when enabled, Carbon Transactions are generated automatically from linked operational records using the matching Emission Factor.
- **Evidence Requirement** — when enabled, CSR/Challenge participation cannot be approved without an attached proof file.
- **Badge Auto-Award** — when enabled, badges are assigned automatically the moment an employee's XP, completed-challenge count, or other tracked metric satisfies the badge's unlock rule.
- **Compliance Issue Ownership** — every Compliance Issue requires an Owner and Due Date; overdue open issues are automatically flagged and notified nightly.

All toggles live under **Settings → ESG Configuration**.

---

## Reports

Available reports, each filterable by **Department, Date Range, Module, Employee, Challenge, and ESG Category**, and exportable as **PDF / Excel / CSV**:

- Environmental Report
- Social Report
- Governance Report
- ESG Summary Report
- Custom Report Builder (combine any of the above filters freely)

---

## API Documentation

Full endpoint reference, request/response examples, and the role matrix live in [`docs/API.md`](docs/API.md). If Swagger/OpenAPI is enabled, it's available at:
```
http://localhost:4000/api/docs
```

---

## Role-Based Access Control

| Role | Access |
|---|---|
| **Admin** | Full access — master data, settings, all modules |
| **ESG Manager** | Approve CSR/Challenge participation, manage audits & compliance, view all reports |
| **Department Head** | Read access scoped to their department; can raise CSR activities/goals for their department |
| **Employee** | Manage own participation, view own XP/badges, view leaderboard, redeem rewards |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ECONNREFUSED` connecting to Postgres | Confirm Postgres/Docker container is running |
| Prisma migration fails | Check `DATABASE_URL`; as a last resort run `npx prisma migrate reset` (wipes data) |
| Frontend can't reach backend | Confirm `VITE_API_BASE_URL` and that the backend is running; check CORS config |
| Login fails with seeded credentials | Re-run `npx prisma db seed` |
| Dashboard shows all zeros | Trigger `POST /api/scoring/recalculate` manually |
| PDF export fails | Install Chromium for Puppeteer: `npx puppeteer browsers install chrome` |

---

## Roadmap / Bonus Features

- Department ESG rankings view
- Smart dashboard visualizations (heatmaps, radar charts)
- Mobile-responsive interface refinements

---

## License

Built for hackathon/demo purposes. Add your license of choice here (MIT recommended for open submission).
