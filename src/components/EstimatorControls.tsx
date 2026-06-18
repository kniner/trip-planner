import type { Pace, WaitMode } from '../lib/types';
import { PACE_LABELS } from '../lib/walking';
import { useActiveDay, useStore } from '../store/useStore';

const PACES: Pace[] = ['slow', 'average', 'fast'];

const WAIT_MODES: { value: WaitMode; label: string; hint: string }[] = [
  { value: 'avg', label: 'Average', hint: 'Typical waits — a normal day' },
  { value: 'max', label: 'Max', hint: 'Peak waits — worst case / holidays' },
  { value: 'live', label: 'Live', hint: 'Current waits from queue-times.com' },
];

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
            value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EstimatorControls({ light = false }: { light?: boolean } = {}) {
  const settings = useActiveDay().settings;
  const liveStatus = useStore((s) => s.liveStatus);
  const setPace = useStore((s) => s.setPace);
  const setWaitMode = useStore((s) => s.setWaitMode);
  const setStartTime = useStore((s) => s.setStartTime);
  const setBuffer = useStore((s) => s.setBuffer);
  const refreshLive = useStore((s) => s.refreshLive);

  // Off-park days don't involve queues or park walking, so only the day's start
  // time is relevant — hide the wait model, pace and buffer controls.
  if (light) {
    return (
      <div className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Day starts
        </label>
        <input
          type="time"
          value={settings.startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Wait-time model
        </label>
        <Segmented
          value={settings.waitMode}
          onChange={setWaitMode}
          options={WAIT_MODES.map((m) => ({ value: m.value, label: m.label }))}
        />
        <p className="mt-1 text-[11px] text-slate-400">
          {WAIT_MODES.find((m) => m.value === settings.waitMode)?.hint}
        </p>
        {settings.waitMode === 'live' && (
          <p className="mt-1 text-[11px]">
            {liveStatus === 'ok' && (
              <span className="text-emerald-600">Live data connected.</span>
            )}
            {liveStatus === 'loading' && <span className="text-slate-400">Loading live waits…</span>}
            {liveStatus === 'unavailable' && (
              <span className="text-amber-600">
                Live feed unavailable — using averages.{' '}
                <button onClick={() => void refreshLive()} className="underline">
                  retry
                </button>
              </span>
            )}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Group pace
        </label>
        <Segmented
          value={settings.pace}
          onChange={setPace}
          options={PACES.map((p) => ({ value: p, label: PACE_LABELS[p] }))}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Day starts
        </label>
        <input
          type="time"
          value={settings.startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Buffer per stop
        </label>
        <Segmented
          value={String(settings.bufferPerStop ?? 0)}
          onChange={(v) => setBuffer(Number(v))}
          options={[
            { value: '0', label: 'None' },
            { value: '5', label: '5m' },
            { value: '10', label: '10m' },
            { value: '15', label: '15m' },
          ]}
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Slack added to every attraction for bathroom breaks, snacks and dawdling.
        </p>
      </div>
    </div>
  );
}
