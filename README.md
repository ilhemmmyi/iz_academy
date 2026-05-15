# IZ Academy 🎓

A full-stack e-learning platform with role-based dashboards for students, teachers, and admins. Built with React, Node.js/Express, PostgreSQL (via Prisma), and Redis.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Routes Reference](#routes-reference)
- [Architecture Overview](#architecture-overview)
- [Contributing](#contributing)

---

## Features

### Student
- Browse and enroll in courses
- Watch video lessons with progress tracking (resumable)
- Take quizzes to unlock the next lesson
- Submit GitHub project links for teacher review
- Download and share completion certificates (auto-generated as PDF)
- Message teachers directly
- Career coach AI — personalized course recommendations based on a CV + questionnaire
- Activity feed and watch-time statistics

### Teacher
- Create and manage courses with modules, lessons, and quizzes
- Upload video lessons and attach resources/links per lesson
- Review student project submissions and leave feedback
- Message enrolled students

### Admin
- Full user management (create, edit, deactivate, reset passwords)
- Approve or reject enrollment requests
- Manage courses, categories, and payments
- View reports and moderate lesson comments / messages
- Dashboard with revenue and enrollment charts

### Platform
- Google OAuth + email/password authentication
- Optional two-factor authentication (TOTP / QR code)
- Role-based access control (Student / Teacher / Admin)
- BullMQ async queues for email dispatch and certificate generation
- Redis caching for course listings
- Sentry error tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4, Radix UI (shadcn), Recharts, Motion |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Cache / Queues | Redis (ioredis), BullMQ |
| Storage | Supabase Storage (videos, images, files) |
| Auth | JWT (access + refresh tokens), Firebase (Google OAuth), Speakeasy (2FA) |
| Email | Resend |
| Monitoring | Sentry |
| Infrastructure | Docker Compose (Postgres + Redis) |

---

## Project Structure

```
iz_academy/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (source of truth)
│   │   └── migrations/            # Migration history
│   ├── src/
│   │   ├── config/                # Redis, Prisma, Firebase, app config
│   │   ├── controllers/           # Route handlers
│   │   ├── middlewares/           # Auth, RBAC, error, upload, validation
│   │   ├── models/                # Prisma query abstractions
│   │   ├── queues/                # BullMQ queue definitions
│   │   ├── routes/                # Express routers
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # JWT, email, certificate generation, cache
│   │   ├── validators/            # Zod schemas
│   │   ├── workers/               # BullMQ workers (email, certificate)
│   │   ├── app.ts                 # Express app setup
│   │   └── server.ts              # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # Typed API client functions
│   │   ├── app/
│   │   │   ├── components/        # Shared components (Navbar, layouts, UI)
│   │   │   ├── pages/             # Route pages (admin/, teacher/, student/)
│   │   │   ├── App.tsx
│   │   │   └── routes.tsx         # Centralized route definitions
│   │   ├── context/               # AuthContext
│   │   ├── config/                # Firebase client config
│   │   └── styles/
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml             # Postgres + Redis for local dev
└── start.ps1                      # Windows quick-start helper
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop (for local Postgres and Redis)
- A [Supabase](https://supabase.com) project (storage + database connection strings)
- A [Firebase](https://firebase.google.com) project (Google OAuth)
- A [Resend](https://resend.com) account (email)
- A [Sentry](https://sentry.io) project (optional but recommended)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/iz-academy.git
cd iz-academy
```

### 2. Start infrastructure

```bash
docker-compose up -d
# Starts Postgres on :5432 and Redis on :6379
```

### 3. Configure environment variables

Copy the examples and fill in your values (see [Environment Variables](#environment-variables)):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Install dependencies and migrate the database

```bash
# Backend
cd backend
npm install
npm run db:generate    # generate Prisma client
npm run db:migrate     # run all migrations

# Frontend
cd ../frontend
npm install
```

### 5. Seed an admin user (optional)

```bash
cd backend
node seed-admin.js
```

### 6. Start development servers

**Option A — Windows quick-start:**
```powershell
.\start.ps1
```

**Option B — manual (two terminals):**
```bash
# Terminal 1 — backend (with hot reload)
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api  
Prisma Studio: `cd backend && npm run db:studio`

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Firebase Admin (Google OAuth)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=iz-academy

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# AI (optional)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx
HUGGINGFACE_MODEL=microsoft/Phi-3.5-mini-instruct

# Quiz
QUIZ_PASS_THRESHOLD=80
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api

# Firebase Client (Google OAuth)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Available Scripts

### Backend

```bash
npm run dev          # start with nodemon hot-reload
npm run build        # compile TypeScript → dist/
npm start            # run compiled output (production)
npm run db:migrate   # run Prisma migrations
npm run db:generate  # regenerate Prisma client
npm run db:studio    # open Prisma Studio GUI
```

### Frontend

```bash
npm run dev          # start Vite dev server
npm run build        # production build → dist/
```

---

## Routes Reference

### Public

| Route | Description |
|---|---|
| `/` | Landing page |
| `/courses` | Course catalogue |
| `/course/:id` | Course detail |
| `/login` | Login |
| `/register` | Register |
| `/faq` | FAQ |
| `/contact` | Contact form |

### Student (`/student/*`)

| Route | Description |
|---|---|
| `/student` | Dashboard |
| `/student/courses` | My enrolled courses |
| `/student/course/:id` | Course viewer (video + quiz) |
| `/student/certificates` | My certificates |
| `/student/projects` | My project submissions |
| `/student/messages` | Messages with teachers |
| `/student/career` | AI career coach |

### Teacher (`/teacher/*`)

| Route | Description |
|---|---|
| `/teacher` | Dashboard |
| `/teacher/courses` | My courses |
| `/teacher/course/:id` | Course management view |
| `/teacher/students` | Enrolled students + progress |
| `/teacher/projects` | Review student submissions |
| `/teacher/messages` | Messages with students |

### Admin (`/admin/*`)

| Route | Description |
|---|---|
| `/admin` | Dashboard with charts |
| `/admin/users` | User management |
| `/admin/courses` | Course management |
| `/admin/enrollment-requests` | Approve / reject enrollments |
| `/admin/categories` | Manage categories |
| `/admin/payments` | Payment records |
| `/admin/reports` | Content reports |
| `/admin/settings` | Platform settings |

---

## Architecture Overview

```
Browser
  └── React SPA (Vite, code-split per route)
        ├── Public pages
        ├── Student dashboard
        ├── Teacher dashboard
        └── Admin dashboard

Express API (Node.js)
  ├── Middleware: Helmet, CORS, Rate limit, Auth (JWT), RBAC
  ├── Routes → Controllers → Services → Models (Prisma)
  ├── Redis cache (withCache helper, 5min TTL)
  ├── BullMQ queues
  │     ├── Email worker (Resend)
  │     └── Certificate worker (PDFKit → Supabase)
  └── Sentry error tracking

PostgreSQL (via Supabase / Prisma)
  └── 20+ models: User, Course, Module, Lesson, Enrollment,
      Payment, Quiz, Certificate, Message, Report, Activity ...

Redis
  ├── Course listing cache
  └── BullMQ job persistence

Supabase Storage
  └── Videos, images, PDFs, lesson resources
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow the existing layering convention: `routes/ → controllers/ → services/ → models/`
4. Run `npm run build` in both `backend/` and `frontend/` to verify no TypeScript errors
5. Open a pull request with a clear description of the change

---

## License

MIT