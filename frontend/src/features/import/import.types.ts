/**
 * Data Import types — RESPONSE shapes hand-written (the backend declares no response schema, so generated
 * types are `never`). Mirrors `backend/src/modules/import/`. The backend stages + matches + gates + commits
 * ATOMICALLY; this UI presents the staged rows and reconciles — it does NO matching/commit logic. The
 * generated `rows`/`mapped_data` are a broken `Record<string,never>` (swagger quirk), so the REQUEST bodies
 * are HAND-WRITTEN with `Record<string,unknown>` and cast at the API boundary.
 */
export type ImportSourceType = 'client_report' | 'master_migration' | 'balance_migration';
export type ImportType = 'reps' | 'clients' | 'products' | 'sales' | 'holdback' | 'clawback' | 'mixed';
export type ImportBatchStatus = 'staged' | 'committed' | 'failed' | 'cancelled';
export type MatchStatus = 'matched' | 'unmatched' | 'duplicate' | 'error' | 'ignored';
export type ReconcileAction = 'match' | 'edit' | 'ignore';

export interface ImportRow {
  id: string;
  import_batch_id: string;
  row_number: number;
  raw_data: Record<string, unknown>;
  mapped_data: Record<string, unknown> | null;
  match_status: MatchStatus;
  matched_entity_id: string | null;
  issue: string | null;
  resolved_by: string | null;
}

export interface ImportBatch {
  id: string;
  source_type: ImportSourceType;
  import_type: ImportType;
  status: ImportBatchStatus;
  client_id: string | null;
  field_mapping_id: string | null;
  source_file_url: string;
  total_rows: number;
  matched_rows: number;
  error_rows: number;
  reconcile_total: string | null;
  error_summary: Record<string, number> | null;
  run_by: string;
  created_at: string;
  committed_at: string | null;
  import_rows?: ImportRow[]; // present on detail; absent on the list
}

export interface ImportFilters {
  status?: ImportBatchStatus;
  source_type?: ImportSourceType;
  import_type?: ImportType;
}

// Request bodies — HAND-WRITTEN (the generated `rows`/`mapped_data` are broken `Record<string,never>`).
export interface CreateImportBody {
  source_type: ImportSourceType;
  import_type: ImportType;
  client_id?: string;
  field_mapping_id?: string;
  reconcile_total?: string;
  rows: Record<string, unknown>[];
}
export interface RowResolutionBody {
  row_id: string;
  action: ReconcileAction;
  matched_entity_id?: string;
  mapped_data?: Record<string, unknown>;
}
export interface ReconcileBody {
  resolutions: RowResolutionBody[];
}

// ── The 3 supported kinds (friendly → pairing). The UI offers ONLY these, so an unsupported pairing can't be
//    staged from the screen. Each carries an editable JSON template for the rows editor. ──────────────────
export type ImportKind = 'bulk_validation' | 'billing_rate' | 'opening_holdback';

export interface KindDef {
  kind: ImportKind;
  label: string;
  description: string;
  source_type: ImportSourceType;
  import_type: ImportType;
  needsClient: boolean;
  needsReconcileTotal: boolean;
  template: Record<string, unknown>[];
  /** What the commit applies (shown in the commit confirm). */
  commitEffect: string;
}

export const KINDS: KindDef[] = [
  {
    kind: 'bulk_validation',
    label: 'Bulk sales validation (client report)',
    description: 'Match a client report to entered sales by MPU ID and validate the matched sales.',
    source_type: 'client_report',
    import_type: 'sales',
    needsClient: true,
    needsReconcileTotal: false,
    template: [{ mpu_id: 'MPU-001' }, { mpu_id: 'MPU-002' }],
    commitEffect: 'validates each matched sale (entered → validated), in one transaction',
  },
  {
    kind: 'billing_rate',
    label: 'Historical billing rates (migration)',
    description: 'Load back-dated client billing rates (the sanctioned migration path; bypasses the live back-date guard).',
    source_type: 'master_migration',
    import_type: 'clients',
    needsClient: false,
    needsReconcileTotal: false,
    template: [{ client_id: '<client-uuid>', rate_kind: 'product', product_id: '<product-uuid>', amount: '60.00', effective_from: '2025-01-01' }],
    commitEffect: 'writes each back-dated client billing rate, in one transaction',
  },
  {
    kind: 'opening_holdback',
    label: 'Opening holdback balances (migration)',
    description: 'Load opening 30% holdback balances for reps against a closed/paid period. Requires a reconcile total.',
    source_type: 'balance_migration',
    import_type: 'holdback',
    needsClient: false,
    needsReconcileTotal: true,
    template: [{ rep_id: '<rep-uuid>', origin_pay_period_id: '<closed-period-uuid>', amount_held: '993.00' }],
    commitEffect: 'writes each opening holdback ledger entry, in one transaction',
  },
];

export function kindOf(batch: { source_type: ImportSourceType; import_type: ImportType }): KindDef | undefined {
  return KINDS.find((k) => k.source_type === batch.source_type && k.import_type === batch.import_type);
}
