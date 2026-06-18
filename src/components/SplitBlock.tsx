import { itemsForDay, landsForDay } from '../data';
import type { EstimatedStop } from '../lib/estimator';
import { useActiveDay, useStore } from '../store/useStore';

interface Props {
  es: EstimatedStop;
}

/** Renders a parallel-split stop: each group's mini-route, side by side. */
export function SplitBlock({ es }: Props) {
  const day = useActiveDay();
  const splitId = es.stop.id;
  const addBranch = useStore((s) => s.addBranch);
  const removeBranch = useStore((s) => s.removeBranch);
  const renameBranch = useStore((s) => s.renameBranch);
  const addToBranch = useStore((s) => s.addToBranch);
  const addCustomToBranch = useStore((s) => s.addCustomToBranch);
  const removeFromBranch = useStore((s) => s.removeFromBranch);
  const moveWithinBranch = useStore((s) => s.moveWithinBranch);
  const setArrival = useStore((s) => s.setArrival);

  const items = itemsForDay(day.park, day.event);
  const lands = landsForDay(day.park, day.event);
  const branches = es.branches ?? [];
  const fixedMeetUp = !!es.stop.arrival;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span>
          Rejoin at <strong className="text-slate-700">~{es.leaveClock}</strong>
        </span>
        <label className="flex items-center gap-1">
          Meet up at
          <input
            type="time"
            value={es.stop.arrival ?? ''}
            onChange={(e) => setArrival(splitId, e.target.value)}
            className="rounded border border-slate-200 px-1.5 py-0.5 text-[11px]"
          />
        </label>
        {fixedMeetUp && (
          <button
            onClick={() => setArrival(splitId, undefined)}
            className="text-slate-400 underline hover:text-slate-600"
          >
            clear
          </button>
        )}
        {!fixedMeetUp && <span className="text-slate-400">(or longest group sets it)</span>}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {branches.map((branch) => {
          // Slack/late vs the rejoin time (es.duration is the block length).
          const diff = es.duration - branch.total;
          const late = diff < 0;
          return (
          <div
            key={branch.id}
            className={`rounded-lg border p-2 ${
              late
                ? 'border-red-300 bg-red-50'
                : branch.isLongest
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="mb-1.5 flex items-center gap-1">
              <input
                defaultValue={branch.name}
                onBlur={(e) => renameBranch(splitId, branch.id, e.target.value)}
                className="min-w-0 flex-1 rounded bg-transparent px-1 text-sm font-semibold focus:bg-white"
              />
              {branch.total > 0 && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    late
                      ? 'bg-red-200 text-red-800'
                      : diff > 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-200 text-amber-800'
                  }`}
                  title={`This group is busy until ~${branch.endClock}`}
                >
                  {late
                    ? `${-diff}m over`
                    : diff > 0
                      ? `${diff}m to spare`
                      : fixedMeetUp
                        ? 'on time'
                        : 'sets rejoin'}
                </span>
              )}
              {branches.length > 1 && (
                <button
                  onClick={() => removeBranch(splitId, branch.id)}
                  className="text-xs text-slate-300 hover:text-red-500"
                  title="Remove group"
                >
                  ✕
                </button>
              )}
            </div>

            {branch.stops.length === 0 ? (
              <p className="px-1 py-1 text-[11px] text-slate-400">No stops yet.</p>
            ) : (
              <ol className="space-y-1">
                {branch.stops.map((bs, i) => (
                  <li
                    key={bs.stop.id}
                    className="flex items-center gap-1.5 rounded bg-white px-2 py-1 text-xs ring-1 ring-slate-100"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{bs.label}</span>
                      <span className="text-[10px] text-slate-400">
                        ~{bs.arriveClock} · {bs.wait > 0 ? `wait ${bs.wait}m · ` : ''}
                        {bs.duration}m
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-0.5">
                      <MiniBtn
                        onClick={() => moveWithinBranch(splitId, branch.id, bs.stop.id, -1)}
                        disabled={i === 0}
                      >
                        ↑
                      </MiniBtn>
                      <MiniBtn
                        onClick={() => moveWithinBranch(splitId, branch.id, bs.stop.id, 1)}
                        disabled={i === branch.stops.length - 1}
                      >
                        ↓
                      </MiniBtn>
                      <MiniBtn onClick={() => removeFromBranch(splitId, branch.id, bs.stop.id)}>
                        ✕
                      </MiniBtn>
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addToBranch(splitId, branch.id, e.target.value);
                e.target.value = '';
              }}
              className="mt-1.5 w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-600"
            >
              <option value="">+ Add to this group…</option>
              {lands.map((land) => {
                const landItems = items.filter((it) => it.land === land);
                if (landItems.length === 0) return null;
                return (
                  <optgroup key={land} label={land}>
                    {landItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>

            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-400">Buffer:</span>
              {[10, 15, 30].map((min) => (
                <button
                  key={min}
                  onClick={() =>
                    addCustomToBranch(splitId, branch.id, {
                      name: 'Buffer / free time',
                      durationMin: min,
                    })
                  }
                  className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-white"
                >
                  +{min}m
                </button>
              ))}
            </div>
          </div>
          );
        })}
      </div>

      <button
        onClick={() => addBranch(splitId)}
        className="rounded border border-dashed border-slate-300 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
      >
        + Add group
      </button>
    </div>
  );
}

function MiniBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-[10px] text-slate-500 hover:bg-slate-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
