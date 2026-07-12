# EcoSphere: ESG Management Platform Monorepo Skeleton

This monorepo contains the scaffolding skeleton for the EcoSphere ESG Platform.

## Folder Structure
- `/backend`: Node.js + Express + TypeScript + Prisma ORM (PostgreSQL)
- `/frontend`: React + TypeScript + Vite + Tailwind CSS
- `/docs`: Empty folder for ERD and API documents

---

## Setup & Running Instructions

### 1. Installation
Install dependencies for all workspaces from the project root:
```bash
npm install
```

### 2. Environment Variables Setup
Create `.env` files in both the `/backend` and `/frontend` folders using the respective `.env.example` templates.

- **Backend `.env`**:
  Configure `DATABASE_URL` (PostgreSQL), `JWT_SECRET`, and `PORT` (default `4000`).

### 3. Database Migration & Seeding
Configure your PostgreSQL instance and database URL, then run migrations:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Running the Dev Loop
From the root directory, you can run both services:
- Run Backend REST API (Port `4000`):
  ```bash
  npm run dev:backend
  ```
- Run Frontend Dashboard (Port `5173`):
  ```bash
  npm run dev:frontend
  ```
The frontend automatically proxies `/api/*` requests to the backend server.
