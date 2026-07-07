/**
 * Folder (expense report) status — PURE & deterministic (no I/O). — EXP-001a
 *
 * A folder has NO independent approval state: its status is the DERIVED aggregate of its items' statuses
 * (Meeting 3 decision). The priority reflects "what needs attention first":
 *   needs_attention (a returned item to fix) > draft (not fully submitted) > pending (awaiting approval) >
 *   approved (all resolved, at least one approved) > rejected (all rejected) > empty (no items).
 */
export type FolderStatus = 'empty' | 'needs_attention' | 'draft' | 'pending' | 'approved' | 'rejected';

/** Derive the folder's aggregate status from its items' statuses. */
export function deriveFolderStatus(itemStatuses: string[]): FolderStatus {
  if (itemStatuses.length === 0) return 'empty';
  if (itemStatuses.includes('sent_back')) return 'needs_attention'; // a returned item — rep must fix + resubmit
  if (itemStatuses.includes('draft')) return 'draft'; // not everything is submitted yet
  if (itemStatuses.includes('submitted')) return 'pending'; // awaiting approval (may be partially approved)
  if (itemStatuses.includes('approved')) return 'approved'; // all resolved, ≥1 approved
  return 'rejected'; // every item rejected
}
