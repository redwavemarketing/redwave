# Redwave Backend (NestJS + Prisma)

The Redwave ERP/HRM backend: a **NestJS modular monolith** on **PostgreSQL** via **Prisma**.
This is the scaffold — only infrastructure (config, Prisma, health) is wired; the 12 domain
modules come later (see [`src/modules/README.md`](src/modules/README.md)).

## Setup

```sh
# From the repo root (npm workspaces): installs everything.
npm install

# Configure the DB connection — copy the template and edit with YOUR real password.
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
# Then set DATABASE_URL's password and ensure a `redwave` database exists.

# Generate the Prisma client (model set is currently empty — safe to run).
npm run prisma:generate
```

## Run

```sh
npm run start:dev      # watch mode on http://localhost:3000
```

Verify wiring: `GET http://localhost:3000/health` →

```json
{
  "status": "ok",
  "info": { "database": { "status": "up" } },
  "details": { "database": { "status": "up" } }
}
```

A reachable `redwave` DB returns **200**; an unreachable one returns **503** — the health
check pings the database with `SELECT 1`, so green proves backend ↔ Postgres end to end.

## Scripts

| Script                    | Does                                                |
| ------------------------- | --------------------------------------------------- |
| `npm run start:dev`       | NestJS in watch mode.                               |
| `npm run build`           | Compile to `dist/`.                                 |
| `npm run lint`            | ESLint over `src/`.                                 |
| `npm run test`            | Jest unit tests.                                    |
| `npm run prisma:generate` | Regenerate the Prisma client from the schema.       |
| `npm run prisma:migrate`  | Create + apply a dev migration (once models exist). |
| `npm run prisma:studio`   | Open Prisma Studio.                                 |

## Money convention (MANDATORY — `CLAUDE.md` §3 #1)

> **Money is exact-decimal, never floating point.**

- Every monetary Prisma field is declared `Decimal @db.Decimal(12, 2)` (Postgres `NUMERIC`),
  surfaced in TypeScript as **`Prisma.Decimal`** (decimal.js).
- **Never** use `Float` or the JS `number` type for money, and never do float arithmetic on it.
  Use `Prisma.Decimal` methods (`.plus`, `.minus`, `.times`, `.dividedBy`).
- Effective-dated config rows carry `effective_from` / `effective_to`; a change is a **new row**,
  never an in-place rewrite of a closed period (`CLAUDE.md` §3 #10).
- **Pay-run finalize** (§3 #8) and **import commit** run inside **Prisma interactive
  transactions** — `prisma.$transaction(async (tx) => { ... })` — so the write is atomic and an
  `Idempotency-Key` retry never double-pays or double-commits.
- Sale-item pay snapshots (`tier_at_payment`, `rate_applied`, `commission_paid`,
  `incentive_amount`) are **immutable** once paid (§3 #2) — corrections are new clawback/
  adjustment rows, never updates.

## Layout

```
src/
  main.ts            bootstrap (CORS for dev, PORT)
  app.module.ts      root module (Config + Prisma + Health)
  prisma/            PrismaService (global) + PrismaModule
  health/            GET /health with a real DB connectivity check
  modules/           the 12 domain modules (placeholder for now)
  common/            decimal utils, RBAC guard, audit interceptor (placeholder)
prisma/
  schema.prisma      datasource + generator; empty model set
```

> Migrations are Prisma-managed under [`prisma/migrations/`](prisma/) once models are added;
> see [`../db/README.md`](../db/README.md). The API gains its `/v1` prefix together with the
> OpenAPI contract in [`../contract/`](../contract/) in a later session.
