/**
 * businessWeek — the MONDAY→SUNDAY business week containing a date, as 'YYYY-MM-DD' bounds. Used to pre-fill
 * a new report folder's week (a label hint only; items keep their own pay period). Pure, UTC, no date lib.
 * — EXP-001 (report-as-folder)
 */
export function businessWeek(iso: string): { week_start: string; week_end: string } {
  const d = new Date(`${iso}T00:00:00.000Z`);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // back up to Monday (Sun=0 → 6 days back)
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { week_start: monday.toISOString().slice(0, 10), week_end: sunday.toISOString().slice(0, 10) };
}
