# Redwave ERP / HRM Platform

A custom ERP/HRM platform for **Redwave Marketing Inc.** — a single-stack TypeScript modular
monolith. This repository is a **monorepo** managed with **npm workspaces**.

> Read [`CLAUDE.md`](CLAUDE.md) first — it carries the invariants (exact-decimal money,
> immutable snapshots, separated rate streams, server-side RBAC) that every change must uphold.
> The authoritative specs live in [`docs/`](docs/).

## Repository layout

| Path        | What it is                                                                        |
| ----------- | --------------------------------------------------------------------------------- |
| `backend/`  | NestJS app (TypeScript). Prisma ORM → PostgreSQL. Owns the API and migrations.    |
| `frontend/` | React + Vite SPA (TypeScript). Consumes the API via the generated contract.       |
| `contract/` | OpenAPI 3 spec — the stable seam between backend, web, and the future mobile app. |
| `db/`       | Database migrations home (Prisma-managed — see [`db/README.md`](db/README.md)).   |
| `docs/`     | Canonical specs: BRD, SRS, data model, architecture, design system.               |

> This session scaffolds the **skeleton and plumbing only** — no domain modules, no data-model
> entities, no UI components yet. Those are built in later sessions per the CLAUDE.md build order.

## Prerequisites

- **Node.js ≥ 20** (developed on v24) and **npm ≥ 10**.
- A running **PostgreSQL** instance with a database named **`redwave`**.

## First-time setup

```sh
# 1. Install all workspace dependencies (one hoisted install at the root).
npm install

# 2. Configure the backend database connection.
#    Copy the template, then edit backend/.env with YOUR real Postgres password.
#    Keep the database name `redwave`. Create it if it does not exist:
#       (in psql)  CREATE DATABASE redwave;
cp backend/.env.example backend/.env      # PowerShell: Copy-Item backend/.env.example backend/.env

# 3. Generate the Prisma client (safe to run now; the model set is empty).
npm run prisma:generate
```

## Running

```sh
# Backend — boots NestJS on http://localhost:3000
npm run dev:backend

# Verify end-to-end wiring (backend ↔ Postgres):
#   GET http://localhost:3000/health  → 200  { "status": "ok", ... "database": { "status": "up" } }
#   If the DB is unreachable you get 503 — proving the check is real.

# Frontend — boots the Vite dev server on http://localhost:5173
npm run dev:frontend
```

## Common scripts (run from the repo root)

| Script                    | Does                                              |
| ------------------------- | ------------------------------------------------- |
| `npm run dev:backend`     | Start NestJS in watch mode.                       |
| `npm run dev:frontend`    | Start the Vite dev server.                        |
| `npm run build`           | Build backend, then frontend.                     |
| `npm run lint`            | ESLint across both apps.                          |
| `npm run format`          | Prettier-format the repo.                         |
| `npm run prisma:generate` | Regenerate the Prisma client from the schema.     |
| `npm run prisma:migrate`  | Create/apply a dev migration (once models exist). |
| `npm run prisma:studio`   | Open Prisma Studio.                               |

## Tech stack

TypeScript end to end — **NestJS** backend, **React + Vite** frontend, **Prisma** ORM on
**PostgreSQL**, a **REST/OpenAPI 3** contract, and JWT + server-side RBAC. See
[`docs/architecture.md`](docs/architecture.md) for the full picture.
