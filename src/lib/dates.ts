function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Today's local date as ISO "YYYY-MM-DD". */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from ISO date `a` to ISO date `b` (b - a); null if unparseable. */
export function diffDays(a: string, b: string): number | null {
  const ma = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a);
  const mb = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b);
  if (!ma || !mb) return null;
  const da = Date.UTC(Number(ma[1]), Number(ma[2]) - 1, Number(ma[3]));
  const db = Date.UTC(Number(mb[1]), Number(mb[2]) - 1, Number(mb[3]));
  return Math.round((db - da) / 86_400_000);
}

/** Format an ISO "YYYY-MM-DD" date as a short local label like "Sat, Sep 6". */
export function formatShortDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  // Construct in local time (no Z) so the calendar date never shifts by a day.
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
