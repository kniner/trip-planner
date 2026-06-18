import { useMemo, useState } from 'react';
import { EVENT_LABELS, itemsForDay, landsForDay, PARKS } from '../data';
import { summarizeTags, TAG_META } from '../lib/tags';
import type { Tag } from '../lib/types';
import { useActiveDay, useStore } from '../store/useStore';
import { AttractionCard } from './AttractionCard';

type Filter = 'all' | Tag | 'untagged';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'must', label: 'Must do' },
  { value: 'nice', label: 'Nice to do' },
  { value: 'avoid', label: 'Avoid' },
  { value: 'untagged', label: 'Untagged' },
];

export function AttractionList() {
  const doc = useStore((s) => s.doc);
  const meId = useStore((s) => s.meId);
  const day = useActiveDay();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const dayItems = useMemo(
    () => itemsForDay(day.park, day.event),
    [day.park, day.event],
  );
  const lands = useMemo(
    () => landsForDay(day.park, day.event),
    [day.park, day.event],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dayItems.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q)) return false;
      if (filter === 'all') return true;
      const summary = summarizeTags(a.id, doc.tags, doc.collaborators, meId);
      if (filter === 'untagged') return summary.consensus === null;
      return summary.consensus === filter;
    });
  }, [dayItems, filter, query, doc.tags, doc.collaborators, meId]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">{PARKS[day.park].name}</h2>
        <p className="text-xs text-slate-500">
          {EVENT_LABELS[day.event]} · {dayItems.length} things to do
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="min-w-[180px] flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
        />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const color =
              f.value === 'must' || f.value === 'nice' || f.value === 'avoid'
                ? TAG_META[f.value].color
                : '#0f172a';
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={
                  active
                    ? { background: color, color: 'white', borderColor: color }
                    : { color, borderColor: '#cbd5e1' }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {lands.map((land) => {
        const items = visible.filter((a) => a.land === land);
        if (items.length === 0) return null;
        return (
          <div key={land}>
            <h3 className="mb-2 mt-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              {land}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((a) => (
                <AttractionCard key={a.id} attraction={a} />
              ))}
            </div>
          </div>
        );
      })}

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">
          No items match this filter.
        </p>
      )}
    </section>
  );
}
