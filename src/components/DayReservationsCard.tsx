import { useMemo } from 'react';
import { useActiveDay, useStore } from '../store/useStore';

/**
 * Dining reservations (from the Trip tab) that fall on this day's date, with a
 * one-tap add onto the timeline as a pinned, fixed-time block.
 */
export function DayReservationsCard({ date }: { date?: string }) {
  const dining = useStore((s) => s.doc.dining);
  const addCustomStop = useStore((s) => s.addCustomStop);
  const removeStop = useStore((s) => s.removeStop);
  const day = useActiveDay();

  const todays = useMemo(
    () => (date ? dining.filter((r) => r.date === date).sort((a, b) => a.time.localeCompare(b.time)) : []),
    [dining, date],
  );

  if (!date || todays.length === 0) return null;

  const blockName = (name: string, time: string) => `Dining: ${name} (${time})`;
  const scheduledStopId = (name: string): string | undefined =>
    day.stops.find((s) => s.kind === 'custom' && s.custom?.name === name)?.id;

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Dining reservations this day
      </h3>
      <ul className="mt-2 space-y-1.5">
        {todays.map((r) => {
          const name = blockName(r.name, r.time);
          const stopId = scheduledStopId(name);
          return (
            <li key={r.id} className="flex items-center gap-2">
              <span className="shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                {r.time}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {r.name}
                {r.partySize ? <span className="text-[11px] text-slate-400"> · {r.partySize}</span> : null}
              </span>
              {stopId ? (
                <button
                  onClick={() => removeStop(stopId)}
                  className="shrink-0 rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  title="Remove from the day's timeline"
                >
                  ✓ Scheduled
                </button>
              ) : (
                <button
                  onClick={() => addCustomStop({ name, durationMin: 60 }, r.time)}
                  className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  title="Add to the timeline, pinned at the reservation time"
                >
                  + schedule
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
