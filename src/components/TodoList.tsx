import { useMemo, useState } from 'react';
import { itemsForDay } from '../data';
import { summarizeTags, TAG_META, TAG_RANK } from '../lib/tags';
import { useActiveDay, useStore } from '../store/useStore';

type Scope = 'priority' | 'all';

/** Rank used for sorting; untagged sits between nice and avoid. */
const RANK_UNTAGGED = 2;

export function TodoList() {
  const doc = useStore((s) => s.doc);
  const meId = useStore((s) => s.meId);
  const addStop = useStore((s) => s.addStop);
  const removeStop = useStore((s) => s.removeStop);
  const day = useActiveDay();
  const [scope, setScope] = useState<Scope>('priority');

  // Which day names each item is currently scheduled on (across the trip).
  const scheduledOn = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of doc.days) {
      for (const s of d.stops) {
        if (!s.attractionId) continue;
        const list = map.get(s.attractionId) ?? [];
        list.push(d.name);
        map.set(s.attractionId, list);
      }
    }
    return map;
  }, [doc.days]);

  const rows = useMemo(() => {
    const items = itemsForDay(day.park, day.event);
    return items
      .map((item) => {
        const summary = summarizeTags(item.id, doc.tags, doc.collaborators, meId);
        const tag = summary.consensus;
        const rank = tag ? TAG_RANK[tag] : RANK_UNTAGGED;
        return { item, tag, rank };
      })
      .filter((r) => (scope === 'priority' ? r.tag === 'must' || r.tag === 'nice' : true))
      .sort((a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name));
  }, [day.park, day.event, doc.tags, doc.collaborators, meId, scope]);

  const inThisDay = (id: string) => day.stops.find((s) => s.attractionId === id);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">To-do list</h2>
          <p className="text-xs text-slate-500">
            Tagged picks for <strong>{day.name}</strong>, by priority — add them to
            this day's route.
          </p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
          <button
            onClick={() => setScope('priority')}
            className={`rounded-md px-2.5 py-1 font-semibold ${
              scope === 'priority' ? 'bg-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Must & nice
          </button>
          <button
            onClick={() => setScope('all')}
            className={`rounded-md px-2.5 py-1 font-semibold ${
              scope === 'all' ? 'bg-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Everything
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
          Nothing tagged for this park yet. Head to the <strong>Tag</strong> page to
          mark some must-dos and nice-to-dos.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ item, tag }) => {
            const stop = inThisDay(item.id);
            const elsewhere = (scheduledOn.get(item.id) ?? []).filter(
              (n) => n !== day.name,
            );
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100"
              >
                {tag ? (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: TAG_META[tag].color }}
                    title={TAG_META[tag].label}
                  />
                ) : (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-200" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="truncate text-[11px] text-slate-400">
                    {item.land}
                    {elsewhere.length > 0 && (
                      <span className="text-amber-600"> · already on {elsewhere.join(', ')}</span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => (stop ? removeStop(stop.id) : addStop(item.id))}
                  className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
                    stop
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {stop ? '✓ Added' : '+ Add'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
