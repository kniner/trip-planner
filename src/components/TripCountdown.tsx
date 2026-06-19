import { useMemo } from 'react';
import { diffDays, todayISO } from '../lib/dates';
import { useStore } from '../store/useStore';

/**
 * A small shared banner: days until the trip, or which day of the trip you're
 * on. Derived purely from the dates assigned to days — shows nothing until at
 * least one day has a date.
 */
export function TripCountdown() {
  const days = useStore((s) => s.doc.days);

  const message = useMemo(() => {
    const dates = days.map((d) => d.date).filter((d): d is string => !!d).sort();
    if (dates.length === 0) return null;
    const today = todayISO();
    const first = dates[0];
    const last = dates[dates.length - 1];

    const toFirst = diffDays(today, first);
    const toLast = diffDays(today, last);
    if (toFirst === null || toLast === null) return null;

    if (toFirst > 1) return `🏰 ${toFirst} days until the trip!`;
    if (toFirst === 1) return `🏰 Tomorrow's the day — trip starts tomorrow!`;
    if (toFirst <= 0 && toLast >= 0) {
      const dayNum = (diffDays(first, today) ?? 0) + 1;
      return `🎉 Day ${dayNum} of your trip — have a magical day!`;
    }
    return null; // trip is over
  }, [days]);

  if (!message) return null;

  return (
    <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm">
      {message}
    </div>
  );
}
