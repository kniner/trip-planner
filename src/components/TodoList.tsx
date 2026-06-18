import { useMemo, useState } from 'react';
import { itemsForDay } from '../data';
import { summarizeTags, TAG_META } from '../lib/tags';
import { useActiveDay, useStore } from '../store/useStore';

type Scope = 'wishlist' | 'all';

export function TodoList() {
  const doc = useStore((s) => s.doc);
  const meId = useStore((s) => s.meId);
  const addStop = useStore((s) => s.addStop);
  const removeStop = useStore((s) => s.removeStop);
  const removeFromBranch = useStore((s) => s.removeFromBranch);
  const day = useActiveDay();
  const [scope, setScope] = useState<Scope>('wishlist');

  // Which day names each item is scheduled on (across the trip), counting both
  // the main route and any split-group sub-routes.
  const scheduledOn = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const mark = (id: string | undefined, dayName: string) => {
      if (!id) return;
      const set = map.get(id) ?? new Set<string>();
      set.add(dayName);
      map.set(id, set);
    };
    for (const d of doc.days) {
      for (const s of d.stops) {
        if (s.kind === 'split' && s.branches) {
          for (const b of s.branches) for (const bs of b.stops) mark(bs.attractionId, d.name);
        } else {
          mark(s.attractionId, d.name);
        }
      }
    }
    return map;
  }, [doc.days]);

  const rows = useMemo(() => {
    const items = itemsForDay(day.park, day.event);
    return items
      .map((item) => {
        const summary = summarizeTags(item.id, doc.tags, doc.collaborators, meId);
        // Wishlist score: a "must" counts double a "nice".
        const score = summary.counts.must * 2 + summary.counts.nice;
        const wishlisted = summary.counts.must > 0 || summary.counts.nice > 0;
        return { item, summary, score, wishlisted };
      })
      .filter((r) => (scope === 'wishlist' ? r.wishlisted : true))
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.summary.counts.must - a.summary.counts.must ||
          a.item.name.localeCompare(b.item.name),
      );
  }, [day.park, day.event, doc.tags, doc.collaborators, meId, scope]);

  // Find where an item sits in the active day: the main route, a split group,
  // or nowhere. Used so adding to a group also marks the to-do item as added.
  type Located =
    | { kind: 'stop'; stopId: string }
    | { kind: 'branch'; splitId: string; branchId: string; stopId: string; branchName: string }
    | null;
  const locate = (id: string): Located => {
    for (const s of day.stops) {
      if (s.kind === 'split' && s.branches) {
        for (const b of s.branches) {
          const bs = b.stops.find((st) => st.attractionId === id);
          if (bs) {
            return { kind: 'branch', splitId: s.id, branchId: b.id, stopId: bs.id, branchName: b.name };
          }
        }
      } else if (s.attractionId === id) {
        return { kind: 'stop', stopId: s.id };
      }
    }
    return null;
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Wishlist to-do</h2>
          <p className="text-xs text-slate-500">
            Everyone's picks for <strong>{day.name}</strong>, ranked by how much the
            group wants them. Add them into this day's route.
          </p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
          <button
            onClick={() => setScope('wishlist')}
            className={`rounded-md px-2.5 py-1 font-semibold ${
              scope === 'wishlist' ? 'bg-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Wishlisted
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
          Nothing wishlisted for this park yet. Ask the group to mark must-dos and
          nice-to-dos on the <strong>Tag</strong> page.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ item, summary, score }) => {
            const located = locate(item.id);
            const elsewhere = [...(scheduledOn.get(item.id) ?? [])].filter(
              (n) => n !== day.name,
            );
            return (
              <li
                key={item.id}
                className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex items-start gap-3">
                  {score > 0 && (
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
                      title="Group wishlist score (must = 2, nice = 1)"
                    >
                      {score}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {item.land}
                      {located?.kind === 'branch' && (
                        <span className="text-indigo-600"> · in {located.branchName}</span>
                      )}
                      {elsewhere.length > 0 && (
                        <span className="text-amber-600"> · also on {elsewhere.join(', ')}</span>
                      )}
                    </p>

                    {summary.entries.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {summary.entries.map(({ collaborator, tag }) => (
                          <span
                            key={collaborator.id}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px]"
                            title={`${collaborator.name}: ${TAG_META[tag].label}`}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: collaborator.color }}
                            />
                            <span className="text-slate-600">{collaborator.name}</span>
                            <span style={{ color: TAG_META[tag].color }}>
                              {TAG_META[tag].short}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!located) addStop(item.id);
                      else if (located.kind === 'stop') removeStop(located.stopId);
                      else removeFromBranch(located.splitId, located.branchId, located.stopId);
                    }}
                    className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
                      located
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {located ? '✓ Added' : '+ Add'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
