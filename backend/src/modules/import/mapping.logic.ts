/**
 * Field mapping — PURE & deterministic (no I/O). Translates a raw source row into system fields
 * using a reusable column-to-field mapping (IMP-002), so new/changed file layouts are handled by
 * configuration, not code. With no mapping, the raw row is returned unchanged (identity). — SRS §15
 *
 * `mapping_json` shape: `{ <systemField>: <sourceColumn> }` — e.g. `{ mpu_id: "MPU #", amount: "Bal" }`.
 */
export type RawRow = Record<string, unknown>;

/** Apply a `{ systemField: sourceColumn }` mapping to a raw row. Null/empty mapping → identity. */
export function applyMapping(raw: RawRow, mappingJson: unknown): RawRow {
  if (!mappingJson || typeof mappingJson !== 'object') {
    return { ...raw };
  }
  const mapping = mappingJson as Record<string, string>;
  const keys = Object.keys(mapping);
  if (keys.length === 0) {
    return { ...raw };
  }
  const mapped: RawRow = {};
  for (const systemField of keys) {
    const sourceColumn = mapping[systemField];
    mapped[systemField] = raw[sourceColumn];
  }
  return mapped;
}
