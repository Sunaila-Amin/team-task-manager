# Team Task Manager (Full-Stack)

A full-stack task management app with authentication, project/team management, RBAC (Admin/Member), task assignment, status tracking, and dashboard analytics.

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma ORM
- Auth: JWT + bcrypt
- Deployment: Railway

## Features Implemented
- Signup/Login with hashed passwords and JWT auth
- First registered account auto-promotes to system `ADMIN`
- Role-based access control (system roles + project roles)
- Project creation and team member management
- Task creation, assignment, and status updates
- Dashboard with totals, status split, and overdue counts
- Input validation using Zod
- Rate limiting, secure headers, CORS, and production static serving

## Project Structure
- `backend`: REST API, Prisma schema/migrations
- `frontend`: React dashboard UI

## Local Setup
1. Install dependencies:
   - `npm run install:all`
2. Configure backend env:
   - Copy `backend/.env.example` to `backend/.env`
3. Set a working PostgreSQL `DATABASE_URL` in `backend/.env`
4. Run migrations:
   - `npm run prisma:deploy --prefix backend`
5. Generate Prisma client:
   - `npm run prisma:generate --prefix backend`
6. Start apps in separate terminals:
   - Backend: `npm run dev:backend`
   - Frontend: `npm run dev:frontend`
7. Open: `http://localhost:5173`

## Production Readiness Checklist
- Set strong `JWT_SECRET` in `backend/.env` or Railway variables.
- Never commit `backend/.env` to GitHub.
- Keep `NODE_ENV=production` in Railway.
- Run `npm run lint` and `npm run build` before push.
- Rotate leaked credentials immediately if shared accidentally.

## API Endpoints
- Auth
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Projects
  - `POST /api/projects`
  - `GET /api/projects`
  - `POST /api/projects/:projectId/members`
- Tasks
  - `POST /api/tasks`
  - `GET /api/tasks/:projectId`
  - `PATCH /api/tasks/:projectId/:taskId/status`
- Dashboard
  - `GET /api/dashboard`

## Railway Deployment (Mandatory)
This repo is configured for Railway via `railway.toml`.

### Steps
1. Push this folder to GitHub.
2. In Railway, create a new project from that GitHub repo.
3. Add a PostgreSQL plugin/service in Railway.
4. Set environment variables in Railway service:
   - `DATABASE_URL` (from Railway Postgres)
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - Optional: `CLIENT_URL`
5. Deploy.

Railway build command runs:
- install backend/frontend deps
- frontend production build
- Prisma client generation
- Prisma migrations deployment

The backend serves frontend static files in production, so a single Railway service is enough.

## Upload to GitHub (Step-by-step)
From `team-task-manager` root:

1. Initialize git (if not already):
   - `git init`
2. Stage files:
   - `git add .`
3. Commit:
   - `git commit -m "Initial production-ready Team Task Manager"`
4. Create empty repo on GitHub (web UI), then connect remote:
   - `git remote add origin https://github.com/<your-username>/<repo-name>.git`
5. Push:
   - `git branch -M main`
   - `git push -u origin main`

After push, connect this GitHub repo in Railway and deploy.

## Default Roles
- `ADMIN`: full system access
- `MEMBER`: project-scoped access

## Validation & Relationships
- Relational models: User, Project, ProjectMembership, Task
- Constraints:
  - unique user email
  - unique project membership per user
  - task belongs to project
  - optional assignee must belong to project
