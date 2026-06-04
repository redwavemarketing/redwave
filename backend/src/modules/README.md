# `src/modules/` — domain modules

**Placeholder.** No domain modules exist yet — this directory only fixes the target layout.
Each of the 12 modules below is one NestJS module that **owns its own tables and endpoints**
and calls other modules only through their **defined interface** (never reaching into internals).
See [`docs/architecture.md`](../../../docs/architecture.md) §4 and `CLAUDE.md` §4 / §6.

One module per domain (build in this order — `CLAUDE.md` §8):

1. `auth/` — auth & RBAC + account/profile + theme. **Build first.**
2. `engine/` — the **Commission Engine** (pure, isolated, deterministic). Build against the
   `CLAUDE.md` §6 fixtures **before** anything depends on it.
3. `sales/`, `commission/`, `clients/`, `hrm/` — in parallel.
4. `payrun/`, `clawback/`, `expenses/`.
5. `billing/`, `documents/`, `import/`, `reporting/`.

> Invariants live in `CLAUDE.md` §3. Cite the BRD/SRS reference next to each business rule
> (`CLAUDE.md` §9). Money is exact-decimal (`Prisma.Decimal`) — never floats.
