import { useMemo, type ReactNode } from 'react';
import { ATTRACTIONS_BY_ID } from '../data/attractions';
import { estimatePlan } from '../lib/estimator';
import { useStore } from '../store/useStore';

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function PlanBuilder() {
  const doc = useStore((s) => s.doc);
  const live = useStore((s) => s.live);
  const removeStop = useStore((s) => s.removeStop);
  const moveStop = useStore((s) => s.moveStop);
  const setArrival = useStore((s) => s.setArrival);
  const reorder = useStore((s) => s.reorderToLandRoute);

  const estimate = useMemo(() => estimatePlan(doc, live), [doc, live]);

  if (doc.stops.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
        No stops yet. Add attractions with <strong>+ Add</strong> to build your route.
      </div>
    );
  }

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
          Route · {doc.stops.length} stops
        </h2>
        {doc.stops.length >= 3 && (
          <button
            onClick={reorder}
            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            title="Reorder stops to minimize walking (nearest-neighbour)"
          >
            Optimize walking
          </button>
        )}
      </div>

      <ol className="space-y-2">
        {estimate.stops.map((es, i) => {
          const a = ATTRACTIONS_BY_ID[es.stop.attractionId];
          return (
            <li
              key={es.stop.id}
              className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100"
            >
              {es.walk > 0 && (
                <div className="mb-2 flex items-center gap-1 text-[11px] text-slate-400">
                  <span>↓ walk {es.walk}m</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{a?.name}</p>
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
                    <span>wait {es.wait}m</span>
                    <span>ride {es.duration}m</span>
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
