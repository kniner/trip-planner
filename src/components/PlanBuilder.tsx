import { useMemo, useState, type ReactNode } from 'react';
import { estimatePlan } from '../lib/estimator';
import { useActiveDay, useStore } from '../store/useStore';

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Quick presets for common non-attraction timeline blocks. */
const BLOCK_PRESETS: { name: string; durationMin: number }[] = [
  { name: 'Drive to park', durationMin: 30 },
  { name: 'Parking & tram', durationMin: 20 },
  { name: 'Security & bag check', durationMin: 15 },
  { name: 'Rope drop / entry', durationMin: 15 },
  { name: 'Meal break', durationMin: 60 },
];

export function PlanBuilder() {
  const live = useStore((s) => s.live);
  const removeStop = useStore((s) => s.removeStop);
  const moveStop = useStore((s) => s.moveStop);
  const setArrival = useStore((s) => s.setArrival);
  const reorder = useStore((s) => s.reorderToLandRoute);
  const addCustomStop = useStore((s) => s.addCustomStop);
  const day = useActiveDay();

  const estimate = useMemo(() => estimatePlan(day, live), [day, live]);

  const canOptimize =
    day.stops.length >= 3 && day.stops.every((s) => s.kind !== 'custom');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-4 text-white sm:grid-cols-4">
        <Stat label="Total" value={fmtDuration(estimate.totalMinutes)} />
        <Stat label="Walking" value={fmtDuration(estimate.totalWalk)} />
        <Stat label="In queues" value={fmtDuration(estimate.totalWait)} />
        <Stat label="Done by" value={estimate.endClock} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {day.name} · {day.stops.length} stops
        </h2>
        {canOptimize && (
          <button
            onClick={reorder}
            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            title="Reorder stops to minimize walking (nearest-neighbour)"
          >
            Optimize walking
          </button>
        )}
      </div>

      {day.stops.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
          No stops yet. Add attractions with <strong>+ Add</strong>, or drop in a
          time block below for travel, security and parking.
        </div>
      ) : (
        <ol className="space-y-2">
          {estimate.stops.map((es, i) => {
            const isCustom = es.stop.kind === 'custom';
            return (
              <li
                key={es.stop.id}
                className={`rounded-lg p-3 shadow-sm ring-1 ${
                  isCustom
                    ? 'bg-slate-50 ring-slate-200'
                    : 'bg-white ring-slate-100'
                }`}
              >
                {es.walk > 0 && (
                  <div className="mb-2 text-[11px] text-slate-400">↓ walk {es.walk}m</div>
                )}
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      isCustom ? 'bg-slate-400' : 'bg-slate-900'
                    }`}
                  >
                    {isCustom ? '⛌' : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{es.label}</p>
                        {isCustom && es.stop.custom?.address && (
                          <p className="truncate text-[11px] text-slate-400">
                            {es.stop.custom.address}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <IconBtn onClick={() => moveStop(es.stop.id, -1)} disabled={i === 0}>
                          ↑
                        </IconBtn>
                        <IconBtn
                          onClick={() => moveStop(es.stop.id, 1)}
                          disabled={i === estimate.stops.length - 1}
                        >
                          ↓
                        </IconBtn>
                        <IconBtn onClick={() => removeStop(es.stop.id)}>✕</IconBtn>
                      </div>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                      <span>arrive ~{es.arriveClock}</span>
                      {!isCustom && <span>wait {es.wait}m</span>}
                      <span>{isCustom ? 'takes' : 'takes'} {es.duration}m</span>
                      <span>leave ~{es.leaveClock}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-[11px] text-slate-400">Target arrival</label>
                      <input
                        type="time"
                        value={es.stop.arrival ?? ''}
                        onChange={(e) => setArrival(es.stop.id, e.target.value)}
                        className="rounded border border-slate-200 px-2 py-0.5 text-xs"
                      />
                      {es.arrivalDelta !== undefined && (
                        <span
                          className={`text-[11px] font-medium ${
                            es.arrivalDelta > 5
                              ? 'text-red-500'
                              : es.arrivalDelta < -5
                                ? 'text-blue-500'
                                : 'text-emerald-600'
                          }`}
                        >
                          {es.arrivalDelta === 0
                            ? 'on time'
                            : es.arrivalDelta > 0
                              ? `${es.arrivalDelta}m late`
                              : `${-es.arrivalDelta}m early`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <AddTimeBlock onAdd={addCustomStop} />
    </div>
  );
}

function AddTimeBlock({
  onAdd,
}: {
  onAdd: (entry: { name: string; durationMin: number; address?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(20);
  const [address, setAddress] = useState('');

  const submit = (n: string, d: number, a?: string) => {
    if (!n.trim() || d <= 0) return;
    onAdd({ name: n.trim(), durationMin: d, address: a?.trim() || undefined });
    setName('');
    setAddress('');
    setDuration(20);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
      >
        + Add time block (travel, parking, security, meal…)
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap gap-1">
        {BLOCK_PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => submit(p.name, p.durationMin)}
            className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
          >
            {p.name} · {p.durationMin}m
          </button>
        ))}
      </div>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(name, duration, address);
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What is it? (e.g. Drive from hotel)"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address / location (optional)"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Minutes</label>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="ml-auto rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Add block
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
