# `contract/` — OpenAPI 3 contract

`openapi.yaml` is the **authoritative, machine-readable contract** for the Redwave API — the
stable seam the backend, the web frontend, and the future mobile app all build against
(see [`docs/architecture.md`](../docs/architecture.md) §5).

**Skeleton:** the spec currently has no endpoints (`paths: {}`). Endpoints are added
**deliberately, per module** and reviewed — the contract is **not** a side effect of a code
change (`CLAUDE.md` §8, contract-first).

## Workflow (when fleshing it out)

1. Add/modify paths + schemas in `openapi.yaml` (review the change).
2. Generate the typed TS client for the frontend (e.g. `openapi-typescript`) — wire this into
   the `generate` script (currently a placeholder no-op).
3. Regenerate whenever the contract changes; the frontend consumes the generated types.

## Conventions (architecture.md §5.1)

- All paths prefixed `/v1`; breaking changes → `/v2`.
- `Authorization: Bearer <jwt>` on every request; RBAC enforced server-side.
- Uniform error envelope `{ error: { code, message, details } }`.
- Paginated lists: `?page=&limit=` → `{ data: [...], meta: { total, page } }`.
- **Money in transit is exact decimal strings (or integer minor units) — never floats.**
- Money-moving actions (pay-run finalize, import commit) accept an `Idempotency-Key`.
