/**
 * Effective-dated billing-rate helpers for Clients & Products.
 *
 * The pure logic now lives in `common/effective-dating.ts` (shared with Commission Config); this
 * module re-exports it under the same names so existing imports/tests are unchanged. A billing-rate
 * scope is (client_id, product_id, rate_kind). — CLAUDE §3 #10, SRS CLNT-004
 */
export {
  dateOnly,
  toUtcDateOnly,
  previousDay,
  deriveStatus,
  selectEffectiveRate,
  planSupersession,
} from '../../common/effective-dating';
export type { RateRow, RateStatus, SupersessionPlan } from '../../common/effective-dating';
