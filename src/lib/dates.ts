/** Format an ISO "YYYY-MM-DD" date as a short local label like "Sat, Sep 6". */
export function formatShortDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  // Construct in local time (no Z) so the calendar date never shifts by a day.
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
