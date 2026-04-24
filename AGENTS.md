# AGENTS.md

## Scope
- Product code lives in `frontend/` and `backend/`.
- Ignore `.opencode/` and `external-skills/` unless you are intentionally changing OpenCode tooling or skill loading; `opencode.json` points at those directories.
- Treat `frontend/FEATURES.md` and `frontend/guidelines/Guidelines.md` as non-authoritative when they conflict with code or config.

## Structure
- There is no root workspace runner or root `package.json`; run npm commands inside `frontend/` or `backend/`.
- Backend entrypoints: `backend/src/server.ts` starts the process and loads BullMQ workers; `backend/src/app.ts` wires Express routes; `backend/prisma/schema.prisma` is the DB source of truth.
- Frontend entrypoints: `frontend/src/main.tsx` -> `frontend/src/app/App.tsx`; all route definitions are centralized in `frontend/src/app/routes.tsx`.

## Commands
- Infra only: run `docker-compose up -d` from the repo root to start Postgres on `5432` and Redis on `6379`.
- Full-stack helper: run `.\start.ps1` from the repo root. It kills ports `5000` and `5173`, starts Docker, then opens backend and frontend in new PowerShell windows.
- `start.ps1` runs the backend with `npx ts-node src/server.ts`, not `npm run dev`, so backend hot reload is not enabled there.
- Backend dev: from `backend/`, run `npm install` then `npm run dev`.
- From `backend/`, `npm run dev` uses `nodemon`, watches `src` and `.env`, and runs `npx kill-port 5000` before each start.
- Frontend dev: from `frontend/`, run `npm install` then `npm run dev`.
- Backend verification: from `backend/`, run `npm run build` (`tsc`, outputs to `dist/`).
- Frontend verification: from `frontend/`, run `npm run build` (`vite build`). There is no checked-in frontend lint, test, or typecheck script.
- Prisma tasks: from `backend/`, use `npm run db:migrate`, `npm run db:generate`, and `npm run db:studio`.
- There are no checked-in GitHub Actions workflows, pre-commit hooks, or root `test`/`lint` commands in this repo.

## Env And Services
- Backend startup hard-fails if `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `REDIS_URL`, `SUPABASE_URL`, or `SUPABASE_SERVICE_KEY` are missing (`backend/src/config/index.ts`). There is no committed backend `.env.example`.
- Prisma expects both `DATABASE_URL` and `DIRECT_URL` (`backend/prisma/schema.prisma`).
- Keep ports aligned: frontend API clients default to `http://localhost:5000/api`, but backend code defaults `PORT` to `4000` when unset. Set `PORT=5000` in backend env or override `VITE_API_URL` in frontend env.
- Redis is required for ordinary backend startup because `backend/src/server.ts` loads `backend/src/workers/*.ts` on boot.
- Google auth needs Firebase envs on both sides: frontend `VITE_FIREBASE_*`; backend `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- `frontend/.env.example` is incomplete for coach features: actual code reads `VITE_COACH_API_URL` and falls back to `http://localhost:8000` (`frontend/src/api/coach.api.ts`). That service is not started by `docker-compose.yml` or `start.ps1`.
- AI features are split: `/api/ai/*` goes through the Express backend, while `frontend/src/api/coach.api.ts` calls a separate service directly.

## Conventions
- Frontend routing imports come from `react-router`, not `react-router-dom`.
- Frontend auth stores the access token in memory and relies on an HTTP-only `refreshToken` cookie for refresh; do not assume token persistence in localStorage.
- `frontend/vite.config.ts` explicitly warns that both `@vitejs/plugin-react` and `@tailwindcss/vite` must stay enabled even if Tailwind looks unused.
- Follow the existing backend layering: `routes/` -> `controllers/` -> `models/` and `services/`, with `validators/` and `middlewares/` beside them.
- Edit source in `frontend/src/` and `backend/src/`; treat `frontend/dist/` and `backend/dist/` as build output.
