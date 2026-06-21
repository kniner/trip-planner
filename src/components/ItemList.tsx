import { useMemo, useState } from 'react';
import { summarizeTags, TAG_META } from '../lib/tags';
import type { Attraction, Tag } from '../lib/types';
import { useStore } from '../store/useStore';
import { AttractionCard } from './AttractionCard';

type Filter = 'all' | Tag | 'untagged';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'must', label: 'Must do' },
  { value: 'nice', label: 'Nice to do' },
  { value: 'avoid', label: 'Avoid' },
  { value: 'untagged', label: 'Untagged' },
];

type KindFilter = 'all' | 'ride' | 'show' | 'dining';

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'ride', label: 'Rides' },
  { value: 'show', label: 'Shows' },
  { value: 'dining', label: 'Dining' },
];

function matchesKind(a: Attraction, k: KindFilter): boolean {
  switch (k) {
    case 'all':
      return true;
    case 'ride':
      return a.kind === 'ride';
    case 'show':
      return a.kind === 'show' || a.kind === 'entertainment';
    case 'dining':
      return a.kind === 'dining' || a.kind === 'food';
  }
}

interface Props {
  items: Attraction[];
  lands: string[];
  /** Show each card's "+ Add to route" button. */
  showAddToRoute?: boolean;
}

/** Searchable, tag-filterable, land-grouped grid of attraction cards. */
export function ItemList({ items, lands, showAddToRoute = true }: Props) {
  const doc = useStore((s) => s.doc);
  const meId = useStore((s) => s.meId);
  const [filter, setFilter] = useState<Filter>('all');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (!matchesKind(a, kindFilter)) return false;
      if (
        q &&
        !a.name.toLowerCase().includes(q) &&
        !(a.description ?? '').toLowerCase().includes(q)
      )
        return false;
      if (filter === 'all') return true;
      const summary = summarizeTags(a.id, doc.tags, doc.collaborators, meId);
      if (filter === 'untagged') return summary.consensus === null;
      return summary.consensus === filter;
    });
  }, [items, filter, kindFilter, query, doc.tags, doc.collaborators, meId]);

  // Who in the group has started tagging anything yet (tagging page only).
  const groupProgress = useMemo(() => {
    if (showAddToRoute) return null;
    const tagged = new Set(doc.tags.map((t) => t.userId));
    return {
      started: doc.collaborators.filter((c) => tagged.has(c.id)),
      notStarted: doc.collaborators.filter((c) => !tagged.has(c.id)),
      total: doc.collaborators.length,
    };
  }, [showAddToRoute, doc.tags, doc.collaborators]);

  const diningItems = useMemo(() => visible.filter((a) => a.kind === 'dining'), [visible]);

  // On the tagging page, nudge intentional action: how many have I tagged here?
  const myTagged = useMemo(() => {
    if (showAddToRoute) return 0;
    const mine = new Set(
      doc.tags.filter((t) => t.userId === meId).map((t) => t.attractionId),
    );
    return items.filter((a) => mine.has(a.id)).length;
  }, [items, doc.tags, meId, showAddToRoute]);

  return (
    <section className="space-y-3">
      {!showAddToRoute && (
        <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">
          <span>
            You've tagged{' '}
            <strong>
              {myTagged} of {items.length}
            </strong>{' '}
            here
          </span>
          {myTagged < items.length && (
            <button
              onClick={() => setFilter(filter === 'untagged' ? 'all' : 'untagged')}
              className="rounded-full bg-white/15 px-2 py-0.5 font-semibold hover:bg-white/25"
            >
              {filter === 'untagged' ? 'Show all' : 'Show untagged'}
            </button>
          )}
        </div>
      )}

      {groupProgress && groupProgress.total > 1 && (
        <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">
            {groupProgress.started.length} of {groupProgress.total}
          </span>{' '}
          in the group have started tagging
          {groupProgress.notStarted.length > 0 && (
            <span className="text-slate-400">
              {' '}
              · waiting on {groupProgress.notStarted.map((c) => c.name).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Quick filter by type, alongside Search + tag filters below. */}
      <div className="flex flex-wrap gap-1.5">
        {KIND_FILTERS.map((k) => {
          const active = kindFilter === k.value;
          return (
            <button
              key={k.value}
              onClick={() => setKindFilter(k.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {k.label}
            </button>
          );
        })}
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

      {/* Scroll target for the onboarding "Tag your wishlist" button. */}
      {!showAddToRoute && <div id="wishlist-items" className="scroll-mt-4" aria-hidden />}

      {lands.map((land) => {
        // Character meals get their own dedicated section below.
        const landItems = visible.filter((a) => a.land === land && a.kind !== 'dining');
        if (landItems.length === 0) return null;
        return (
          <div key={land}>
            <h3 className="mb-2 mt-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              {land}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {landItems.map((a) => (
                <AttractionCard key={a.id} attraction={a} showAddToRoute={showAddToRoute} />
              ))}
            </div>
          </div>
        );
      })}

      {diningItems.length > 0 && (
        <div>
          <h3 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-rose-500">
            🍽 Character Meals
          </h3>
          {lands.map((land) => {
            const meals = diningItems.filter((a) => a.land === land);
            if (meals.length === 0) return null;
            return (
              <div key={land}>
                <h4 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {land}
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {meals.map((a) => (
                    <AttractionCard key={a.id} attraction={a} showAddToRoute={showAddToRoute} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">
          No items match this filter.
        </p>
      )}
    </section>
  );
}
