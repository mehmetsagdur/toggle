# Feature Flag Management System

Demo Admin Dashboard: https://toggle-frontend.yms.dev

Multi-tenant feature flag management system built with NestJS, Next.js, Prisma, and Redis.

## Tech Stack

| Layer           | Technology                |
| --------------- | ------------------------- |
| Backend         | NestJS 10, TypeScript 5.7 |
| Frontend        | Next.js 15, React 19      |
| Database        | PostgreSQL 16             |
| Cache           | Redis 7                   |
| ORM             | Prisma 6                  |
| Package Manager | pnpm 9                    |
| Deployment      | Dokku + GitHub Actions    |

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm (`corepack enable`)

### A. Full Stack (Docker Compose)

Run the entire stack (Postgres, Redis, Backend, Frontend) with one command. Ideal for checking the production build locally.

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### B. Hybrid Development (Recommended)

Run databases in Docker, but code locally for hot-reloading.

```bash
# 1. Start Databases (Postgres + Redis)
pnpm docker:up

# 2. Install Dependencies
pnpm install

# 3. Setup Database (Migrate & Seed)
pnpm db:migrate
pnpm db:seed

# 4. Run Services
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Prisma Studio: `pnpm db:studio`

## Deployment Architecture

We use **Dokku** for PAAS-like deployment, orchestrated by **GitHub Actions**.

### Architecture Overview

- **Separate Apps**: Frontend (`toggle-frontend`) and Backend (`toggle-api`) are deployed as separate Dokku apps.
- **Managed Services**: Postgres and Redis are managed via Dokku plugins and linked to the Backend.
- **CI/CD**: `master.yml` handles building Docker images, pushing to GHCR, and deploying to Dokku.

## Project Structure

```
.
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── prisma/       # Database schema & migrations
│   │   └── src/
│   └── frontend/         # Next.js Admin UI
│       └── src/app/      # App Router pages
├── .github/workflows/    # CI/CD Pipelines
├── docker-compose.yml    # Local Full-Stack simulation
└── pnpm-workspace.yaml   # Monorepo configuration
```

## Environment Variables

| Variable              | Description                  | Default                  |
| --------------------- | ---------------------------- | ------------------------ |
| `DATABASE_URL`        | PostgreSQL connection string | `postgresql://...`       |
| `REDIS_URL`           | Redis connection string      | `redis://localhost:6379` |
| `JWT_SECRET`          | Secret for JWT signing       | —                        |
| `BACKEND_PORT`        | Backend server port          | `3001`                   |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend     | -                        |
