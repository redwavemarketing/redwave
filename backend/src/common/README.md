# `src/common/` — cross-cutting building blocks

**Placeholder.** No code yet — this directory only fixes the target layout for the shared,
cross-cutting pieces that domain modules depend on (`CLAUDE.md` §4):

- **decimal utils** — helpers around `Prisma.Decimal` for exact money math (never floats — §3 #1).
- **RBAC guard** — server-side `(module, action)` permission enforcement on every endpoint (§5).
- **audit interceptor** — append-only audit log of create/update/delete/approve on financial
  & config entities.
- **error envelope** — the uniform `{ error: { code, message, details } }` response shape.

These are built as the modules that need them come online (Auth & RBAC first).
