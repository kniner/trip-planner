import { useMemo, useState } from 'react';
import { itemsForPark, landsForPark, PARKS, WISHLIST_PARK_IDS } from '../data';
import type { ParkId } from '../lib/types';
import { ItemList } from './ItemList';
import { RideKey } from './RideKey';

/**
 * The tagging page: pick a park and tag its attractions as must / nice / avoid.
 * This is a per-park wishlist, independent of any scheduled day — you decide
 * *which day* to actually do things over on the Schedule page.
 */
export function TagView() {
  const [park, setPark] = useState<ParkId>('mk');

  const items = useMemo(() => itemsForPark(park), [park]);
  const lands = useMemo(() => landsForPark(park), [park]);

  return (
    <div className="space-y-4">
      {/* Sticky, horizontally-scrollable park picker so you keep context on mobile. */}
      <div className="sticky top-0 z-20 -mx-4 bg-white/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-0.5">
          {WISHLIST_PARK_IDS.map((p) => (
            <button
              key={p}
              onClick={() => setPark(p)}
              className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition ${
                park === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {PARKS[p].name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Tag what you want to do at {PARKS[park].name}. Halloween-party and Food & Wine
        items are included too — schedule them onto specific days next.
      </p>

      <RideKey />

      <ItemList items={items} lands={lands} showAddToRoute={false} />
    </div>
  );
}
