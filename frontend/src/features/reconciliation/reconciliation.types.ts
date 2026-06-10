/**
 * Reconciliation types — aliased to the generated schema. Finance's read-only tie-out: a statement total
 * ties to its lines + the live re-priced sales; a pay run ties to its lines. — SRS §12
 */
import type { components } from '../../api/generated/schema';

export type StatementTieOut = components['schemas']['StatementTieOutResponse'];
export type PayRunTieOut = components['schemas']['PayRunTieOutResponse'];
export type PayRunLineTieOut = components['schemas']['PayRunLineTieOutResponse'];
