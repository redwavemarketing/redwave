# `db/` — database migrations

Migrations are **Prisma-managed**. The schema lives at
[`../backend/prisma/schema.prisma`](../backend/prisma/schema.prisma), and Prisma emits
versioned, ordered SQL migrations under **`../backend/prisma/migrations/`** (created the first
time a migration is run — none exist yet, the model set is empty).

This `db/` directory is the documented **home/pointer** for the migration story so the repo
layout in `CLAUDE.md` §4 stays meaningful alongside Prisma's tooling conventions.

## Creating & applying migrations

```sh
# From the repo root:
npm run prisma:migrate          # = prisma migrate dev  (creates + applies a dev migration)

# Or directly in the backend workspace:
cd backend
npx prisma migrate dev --name <change_name>     # author a new migration
npx prisma migrate deploy                        # apply pending migrations (CI / production)
```

## Rules (CLAUDE.md §8, §10)

- Migrations are **versioned and ordered**; never hand-edit production schema.
- Go-live data (master + opening balances) loads through the **Import** module with the
  reconcile-before-commit gate — not via ad-hoc SQL.
- Schema integrity the migrations must enforce: exact-decimal money columns
  (`Decimal @db.Decimal`), effective-dated config, FK integrity, and **`rep_code` uniqueness
  including against terminated reps** (codes are never reused — §3 #11).
