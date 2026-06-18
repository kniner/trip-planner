import { useMemo, useState } from 'react';
import { ITEMS_BY_ID, itemsForDay } from '../data';
import { suggestNext } from '../lib/suggest';
import { TAG_META } from '../lib/tags';
import { useActiveDay, useStore } from '../store/useStore';

/** Recommends the best next thing to do from where you are, by walk + wait + priority. */
export function SuggestNext() {
  const day = useActiveDay();
  const live = useStore((s) => s.live);
  const tags = useStore((s) => s.doc.tags);
  const collaborators = useStore((s) => s.doc.collaborators);
  const meId = useStore((s) => s.meId);
  const addStop = useStore((s) => s.addStop);

  // Default "you're at" to the last located stop in the route.
  const lastItemId = useMemo(() => {
    for (let i = day.stops.length - 1; i >= 0; i--) {
      const s = day.stops[i];
      if (s.kind !== 'custom' && s.kind !== 'split' && s.attractionId) return s.attractionId;
    }
    return '';
  }, [day.stops]);

  const [fromId, setFromId] = useState<string>('');
  const effectiveFrom = fromId || lastItemId;
  const fromItem = effectiveFrom ? ITEMS_BY_ID[effectiveFrom] : undefined;

  const dayItems = useMemo(() => itemsForDay(day.park, day.event), [day.park, day.event]);

  const suggestions = useMemo(
    () => suggestNext({ day, live, tags, collaborators, meId }, fromItem, 5),
    [day, live, tags, collaborators, meId, fromItem],
  );

  return (
    <section className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Suggested next</h2>
        <label className="flex items-center gap-1 text-[11px] text-slate-500">
          You're at
          <select
            value={effectiveFrom}
            onChange={(e) => setFromId(e.target.value)}
            className="max-w-[150px] rounded border border-slate-300 px-1.5 py-0.5 text-[11px]"
          >
            <option value="">— park entrance —</option>
            {dayItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-[11px] text-slate-400">
          Nothing left to suggest — everything's scheduled or tagged avoid.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {suggestions.map((s, i) => (
            <li
              key={s.item.id}
              className="flex items-center gap-2 rounded-lg border border-slate-100 p-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.item.name}</p>
                <p className="text-[11px] text-slate-500">
                  {s.walk > 0 && <>walk {s.walk}m · </>}
                  wait {s.wait}m
                  {s.priority && (
                    <span className="ml-1 font-semibold" style={{ color: TAG_META[s.priority].color }}>
                      · {TAG_META[s.priority].short}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => addStop(s.item.id)}
                className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                + Add
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-slate-400">
        Ranked by walking time, {day.settings.waitMode} wait, and how much the group
        wants it.
      </p>
    </section>
  );
}
