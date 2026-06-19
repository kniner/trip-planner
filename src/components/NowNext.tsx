import { useMemo } from 'react';
import { PARKS } from '../data';
import { diffDays, todayISO } from '../lib/dates';
import { estimatePlan, parseClock } from '../lib/estimator';
import type { Day } from '../lib/types';
import { useActiveDay, useStore } from '../store/useStore';

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Day-of "Now / Next" banner. Visible to everyone once the trip is imminent
 * (the eve of the first day) through the last day; the owner can preview it any
 * time. Shows the current and upcoming stop for the live day based on the wall
 * clock, so people in the parks can glance at what's next.
 */
export function NowNext({ isOwner }: { isOwner: boolean }) {
  const days = useStore((s) => s.doc.days);
  const live = useStore((s) => s.live);
  const activeDay = useActiveDay();

  const plan = useMemo(() => {
    const today = todayISO();
    const dates = days.map((d) => d.date).filter((d): d is string => !!d).sort();
    const first = dates[0];
    const last = dates[dates.length - 1];
    const liveDay = days.find((d) => d.date === today);

    let target: Day | undefined;
    let mode: 'live' | 'tomorrow' | 'preview';
    if (liveDay) {
      target = liveDay;
      mode = 'live';
    } else if (first && diffDays(today, first) === 1) {
      target = days.find((d) => d.date === first);
      mode = 'tomorrow';
    } else if (isOwner) {
      target = activeDay;
      mode = 'preview';
    } else {
      return null;
    }
    if (!target) return null;

    // Non-owners only ever see it within the trip window (eve → last day).
    if (!isOwner && last) {
      const toLast = diffDays(today, last);
      const toFirst = first ? diffDays(today, first) : null;
      const within = toLast !== null && toLast >= 0 && toFirst !== null && toFirst <= 1;
      if (!within) return null;
    }

    return { target, mode };
  }, [days, activeDay, isOwner, live]);

  if (!plan) return null;
  const { target, mode } = plan;

  const estimate = estimatePlan(target, live);
  const stops = estimate.stops;

  let body: React.ReactNode;
  if (stops.length === 0) {
    body = <span className="text-slate-500">No stops planned for {target.name} yet.</span>;
  } else if (mode === 'live') {
    const now = nowMinutes();
    const withTimes = stops.map((es) => ({
      es,
      arrive: parseClock(es.arriveClock),
      leave: parseClock(es.leaveClock),
    }));
    const current = withTimes.find((w) => w.arrive <= now && now < w.leave);
    const next = withTimes.find((w) => w.arrive > now);
    if (now < withTimes[0].arrive) {
      body = (
        <span>
          Starting soon: <strong>{withTimes[0].es.label}</strong> ~{withTimes[0].es.arriveClock}
        </span>
      );
    } else if (!current && !next) {
      body = <span>That's a wrap on {target.name}! 🎆</span>;
    } else {
      body = (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {current && (
            <span>
              <span className="text-[10px] font-bold uppercase text-emerald-200">Now</span>{' '}
              <strong>{current.es.label}</strong>{' '}
              <span className="text-white/70">until ~{current.es.leaveClock}</span>
            </span>
          )}
          {next && (
            <span>
              <span className="text-[10px] font-bold uppercase text-indigo-200">Next</span>{' '}
              <strong>{next.es.label}</strong> ~{next.es.arriveClock}
            </span>
          )}
        </span>
      );
    }
  } else {
    // tomorrow / preview
    const firstStop = stops[0];
    const label = mode === 'tomorrow' ? 'Tomorrow' : 'Preview';
    body = (
      <span>
        <span className="text-[10px] font-bold uppercase text-white/70">{label}</span>{' '}
        <strong>{target.name}</strong>
        {target.kind !== 'other' && PARKS[target.park] ? ` · ${PARKS[target.park].shortName}` : ''} ·
        first up <strong>{firstStop.label}</strong> ~{firstStop.arriveClock}
      </span>
    );
  }

  return (
    <div className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-sm">
      <span className="mr-2">🕒</span>
      {body}
    </div>
  );
}
