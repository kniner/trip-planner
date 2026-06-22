import { useMemo, useState } from 'react';
import { DEFAULT_BOOKING_TASKS } from '../data/booking';
import { diffDays, formatShortDate, shiftISO, todayISO } from '../lib/dates';
import type { BookingTask } from '../lib/types';
import { useStore } from '../store/useStore';

/** The trip's first dated day, or null if no dates are set yet. */
function useTripStart(): string | null {
  const days = useStore((s) => s.doc.days);
  return useMemo(() => {
    const dates = days.map((d) => d.date).filter((d): d is string => !!d).sort();
    return dates[0] ?? null;
  }, [days]);
}

interface DueTask extends BookingTask {
  done: boolean;
  /** Days from today until due (negative = overdue); null if no trip date. */
  daysUntil: number | null;
  dueLabel: string | null;
}

function useBookingTasks(): DueTask[] {
  const bookingCustom = useStore((s) => s.doc.bookingCustom);
  const bookingDone = useStore((s) => s.doc.bookingDone);
  const start = useTripStart();
  const today = todayISO();

  return useMemo(() => {
    const all = [...DEFAULT_BOOKING_TASKS, ...bookingCustom];
    const done = new Set(bookingDone);
    return all
      .map((t) => {
        const dueISO = start ? shiftISO(start, -t.daysBefore) : null;
        const daysUntil = dueISO ? diffDays(today, dueISO) : null;
        return {
          ...t,
          done: done.has(t.id),
          daysUntil,
          dueLabel: dueISO ? formatShortDate(dueISO) : null,
        };
      })
      .sort((a, b) => b.daysBefore - a.daysBefore);
  }, [bookingCustom, bookingDone, start, today]);
}

/* -------------------------------- Dashboard ------------------------------- */

export function OrganizerDashboard() {
  const doc = useStore((s) => s.doc);
  const start = useTripStart();
  const tasks = useBookingTasks();
  const today = todayISO();

  const daysToTrip = start ? diffDays(today, start) : null;

  const notStarted = doc.collaborators.filter(
    (c) => !doc.tags.some((t) => t.userId === c.id),
  );

  const nextBooking = tasks.find((t) => !t.done && (t.daysUntil === null || t.daysUntil >= -3));

  const upcoming = useMemo(
    () =>
      [...doc.dining]
        .filter((r) => (diffDays(today, r.date) ?? -1) >= 0)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 3),
    [doc.dining, today],
  );

  const totalSpent = doc.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Organizer dashboard</h2>
        <p className="text-xs text-slate-500">Your private command center — only you see this.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Days to go" value={daysToTrip != null && daysToTrip > 0 ? `${daysToTrip}` : daysToTrip != null ? '🎉' : '—'} />
        <Stat label="Tagged wishlist" value={`${doc.collaborators.length - notStarted.length}/${doc.collaborators.length}`} />
        <Stat label="Reservations" value={`${doc.dining.length}`} />
        <Stat label="Budget logged" value={`$${Math.round(totalSpent)}`} />
      </div>

      <Card title="Next thing to book">
        {nextBooking ? (
          <p className="text-sm">
            <span className="font-semibold">{nextBooking.text}</span>
            {nextBooking.daysUntil != null && (
              <span className="text-slate-500">
                {' '}
                — {dueText(nextBooking.daysUntil)}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-400">All booking tasks are done. 🎉</p>
        )}
      </Card>

      <Card title="Waiting on wishlist tags">
        {notStarted.length === 0 ? (
          <p className="text-sm text-emerald-600">Everyone has started tagging. 🙌</p>
        ) : (
          <p className="text-sm text-slate-600">{notStarted.map((c) => c.name).join(', ')}</p>
        )}
      </Card>

      <Card title="Upcoming reservations">
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">None coming up.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {upcoming.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                <span className="text-slate-500">
                  {formatShortDate(r.date) ?? r.date} · {r.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900 p-3 text-white">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

/* ----------------------------- Booking timeline --------------------------- */

function dueText(daysUntil: number): string {
  if (daysUntil > 1) return `due in ${daysUntil} days`;
  if (daysUntil === 1) return 'due tomorrow';
  if (daysUntil === 0) return 'due today';
  return `⚠️ ${-daysUntil} day${daysUntil === -1 ? '' : 's'} overdue`;
}

export function BookingTimeline() {
  const tasks = useBookingTasks();
  const start = useTripStart();
  const toggle = useStore((s) => s.toggleBookingTask);
  const addTask = useStore((s) => s.addBookingTask);
  const removeTask = useStore((s) => s.removeBookingTask);

  const [text, setText] = useState('');
  const [days, setDays] = useState('30');

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Booking timeline</h2>
        <p className="text-xs text-slate-500">
          Time-sensitive pre-trip tasks, due relative to your trip date.{' '}
          {!start && <span className="text-amber-600">Set your trip dates to see deadlines.</span>}
        </p>
      </div>

      <ul className="divide-y divide-slate-100 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
              className="h-4 w-4 shrink-0 accent-emerald-600"
            />
            <span className={`min-w-0 flex-1 text-sm ${t.done ? 'text-slate-400 line-through' : ''}`}>
              {t.text}
            </span>
            <span
              className={`shrink-0 text-[11px] ${
                !t.done && t.daysUntil != null && t.daysUntil < 0
                  ? 'font-semibold text-rose-600'
                  : 'text-slate-400'
              }`}
            >
              {t.done
                ? '✓ done'
                : t.daysUntil != null
                  ? dueText(t.daysUntil)
                  : t.dueLabel ?? `${t.daysBefore}d before`}
            </span>
            {t.custom && (
              <button
                onClick={() => removeTask(t.id)}
                className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                title="Remove"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      <form
        className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
        onSubmit={(e) => {
          e.preventDefault();
          addTask(text, Number(days));
          setText('');
          setDays('30');
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          className="min-w-[140px] flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <label className="flex items-center gap-1 text-xs text-slate-500">
          <input
            type="number"
            min={0}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-16 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          days before
        </label>
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </section>
  );
}

/* -------------------------------- Notes ----------------------------------- */

export function OrganizerNotes() {
  const notes = useStore((s) => s.doc.organizerNotes);
  const setNotes = useStore((s) => s.setOrganizerNotes);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">My notes</h2>
        <p className="text-xs text-slate-500">
          A private scratchpad for you — ideas, reminders, things to ask. Only you see it.
        </p>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Jot anything down…"
        rows={12}
        className="w-full rounded-lg border border-slate-300 p-3 text-sm"
      />
    </section>
  );
}
