# EcoSphere: ESG Management Platform

EcoSphere is a comprehensive Environmental, Social, and Governance (ESG) Management Platform featuring carbon accounting, policy tracking, compliance audits, and a gamification engine (badges, rewards, and leaderboards).

---

## Folder Structure

- `/backend`: Node.js + Express + TypeScript + Prisma ORM (Postgres)
- `/frontend`: React + TypeScript + Vite + Tailwind CSS
- `/docs`: Documentation guides and API specs

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v15.0.0 or higher (running on local port 5432)

---

## Quick Setup & Running Instructions

### 1. Installation
Install dependencies for all workspaces from the project root:
```bash
npm install
```

### 2. Environment Variables Setup

#### Backend (`/backend/.env`)
Create a `.env` file in the `/backend` folder:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecosphere?schema=public"
JWT_SECRET="secret12345"
PORT=4000
```

#### Frontend (`/frontend/.env`)
Create a `.env` file in the `/frontend` folder (if required):
```env
VITE_API_URL="http://localhost:4000"
```

### 3. Database Migration & Seeding
From the root directory, push the schema to the database and seed the mock dataset:
```bash
npm run db:migrate
npm run db:seed
```

### 4. Running the Development Loop
From the root directory, launch the backend and frontend servers in separate terminal panes:

- **Launch Backend (Port 4000)**:
  ```bash
  npm run dev:backend
  ```

- **Launch Frontend (Port 5173)**:
  ```bash
  npm run dev:frontend
  ```

---

## Demo Login Credentials

You can sign in using these mock accounts (password is `password123` for all accounts):

- **ADMIN Role**:
  - Email: `admin@ecosphere.local`
- **ESG_MANAGER Role**:
  - Email: `sarah.j@ecosphere.local`
- **EMPLOYEE Role**:
  - Email: `employee1@ecosphere.local`

---

## Judging Tour Guide (Platform Overview)

Use this guide to inspect each implemented feature within the application shell:

### 1. Authentication & Security
- **Path**: `/login` (Auth Shell)
- **Features**: Clean login forms with active input states and redirects. Protected routing restricts guest access and redirects them to the login screen.

### 2. Top Bar & XP points balance
- **Path**: Persistent Header
- **Features**: Displays the current employee's points balance in a visual XP pill next to the user menu. Refreshes live from ledger database writes. The top bar also hosts the active notification bell containing logs of compliance alerts and challenge completions.

### 3. Dashboard Rollups
- **Path**: `/` (Dashboard Tab)
- **Features**: Aggregates ESG indices, carbon transaction totals, active challenges counts, and compliance tickets. Displays interactive area trend charts over months and department performance tables.

### 4. ESG Policies & My Acknowledgements
- **Path**: `/governance` (Governance Tab)
- **Features**:
  - **ESG Policies**: Lists policies and versions. Admins/Managers can create policies and publish them (triggering automatic user acknowledgements). Features a progress drill-down tracking completed vs total employee acknowledgements.
  - **My Acknowledgements**: Displays employee-facing pending guidelines where users can submit immediate signature responses.

### 5. Audits & Compliance
- **Path**: `/governance` (Governance Tab)
- **Features**:
  - **Audits**: Audit log tables supporting planned schedules and status progression transitions.
  - **Compliance**: Tickets list showcasing severity color-coding, overdue highlights, and status resolve buttons. The forms enforce owner ID and due date validations.

### 6. Challenges & Approval Queue
- **Path**: `/gamification` (Gamification Tab)
- **Features**:
  - **Challenges**: Lists active green tasks. Employees can join active items and upload progress values alongside image/PDF proofs.
  - **Approval Queue**: Enables Managers/Admins to approve or reject pending participant proofs, transactionally writing XP deltas to the points ledger.

### 7. Achievements Badges & Store Rewards
- **Path**: `/gamification` (Gamification Tab)
- **Features**:
  - **My Badges**: Renders a grid showing unlocked badges colored and locked badges grayed out with a hover tooltip mapping rules.
  - **Rewards**: catalog displaying reward name, points, stock, and status. Includes redemption history logs.

### 8. Leaderboard Rankings
- **Path**: `/gamification` (Gamification Tab)
- **Features**:
  - Ranked user listing highlighting user row, supporting scope (org/dept) and period (weekly/monthly/quarterly/all-time) filters.
