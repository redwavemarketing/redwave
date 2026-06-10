# Commission Engine

The **pure, deterministic, isolated** commission calculator (`CommissionEngineService`). Given a
rep's activations for a period + the effective configuration (passed in as typed inputs), it returns
the tier, per-item amounts, gross commission, the 70/30 advance/holdback split, and — separately —
incentives; plus a pure clawback-amount calculation from a frozen snapshot.

**Invariants it enforces** (CLAUDE §3 / §6, arch §8):

- **Exact-decimal money, never float** — `decimal.js` throughout (#1).
- **Gross tally, never re-tier** — tier comes from the gross internet count **across all clients**
  and applies to every internet activation; the engine is stateless, so re-tiering is impossible (#5).
- **Greenfield excluded + flat-rated** — greenfield internet does not count toward the tally (#9).
- **Clawback is a flat, per-item recovery** — `rate + any incentive` from the snapshot; no date
  math, no re-tier, no effect on other items (#4, #6).
- **Incentives are separate from the 70/30 split** — gross (the split base) is tier+flat only;
  incentives are reported as `incentiveTotal` and paid in full. BOTH modes are applied, threshold-relative:
  `per_activation` (bonus beyond `targetCount`; null/0 = every activation) + `one_time` (a single bonus once
  the rep reaches `targetCount` matching activations, frozen onto the crossing one).

**Isolation:** imports only `decimal.js` + local files — no `@prisma/client`, no DB, no HTTP, no
other module. No constructor dependencies; tested by direct instantiation.

See `commission-engine.service.spec.ts` for the worked-example fixtures (the acceptance bar).
