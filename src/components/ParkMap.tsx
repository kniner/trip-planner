import { useMemo } from 'react';
import { ITEMS_BY_ID, itemsForDay } from '../data';
import { summarizeTags, TAG_META } from '../lib/tags';
import { useActiveDay, useStore } from '../store/useStore';

const UNTAGGED = '#cbd5e1';
const PAD = 40;

/**
 * Lightweight schematic map: plots the day's attractions by their grid
 * coordinates, colors them by group tag, and draws the planned route through
 * the scheduled stops in order. Approximate layout, not a real Disney map.
 */
export function ParkMap() {
  const day = useActiveDay();
  const tags = useStore((s) => s.doc.tags);
  const collaborators = useStore((s) => s.doc.collaborators);
  const meId = useStore((s) => s.meId);

  const items = useMemo(() => itemsForDay(day.park, day.event), [day.park, day.event]);

  const view = useMemo(() => {
    const xs = items.map((i) => i.coords.x);
    const ys = items.map((i) => i.coords.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const w = Math.max(...xs) - minX || 1;
    const h = Math.max(...ys) - minY || 1;
    return { x: minX - PAD, y: minY - PAD, w: w + PAD * 2, h: h + PAD * 2 };
  }, [items]);

  // Route = scheduled main-route item stops, in order (splits/custom skipped).
  const routePoints = useMemo(() => {
    const pts: { x: number; y: number; n: number }[] = [];
    let n = 0;
    for (const s of day.stops) {
      if (s.kind === 'custom' || s.kind === 'split' || !s.attractionId) continue;
      const a = ITEMS_BY_ID[s.attractionId];
      if (!a) continue;
      n += 1;
      pts.push({ x: a.coords.x, y: a.coords.y, n });
    }
    return pts;
  }, [day.stops]);

  if (items.length === 0) return null;

  return (
    <section className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Map</h2>
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
          <Legend color={TAG_META.must.color} label="Must" />
          <Legend color={TAG_META.nice.color} label="Nice" />
          <Legend color={TAG_META.avoid.color} label="Avoid" />
          <Legend color={UNTAGGED} label="Untagged" />
        </div>
      </div>

      <svg
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-auto w-full rounded-md bg-slate-50"
        role="img"
        aria-label={`Map of ${day.park === 'mk' ? 'Magic Kingdom' : 'EPCOT'} attractions and your route`}
      >
        {/* Route path */}
        {routePoints.length > 1 && (
          <polyline
            points={routePoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#0f172a"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeDasharray="6 5"
            opacity={0.7}
          />
        )}

        {/* Attraction dots */}
        {items.map((it) => {
          const consensus = summarizeTags(it.id, tags, collaborators, meId).consensus;
          const color = consensus ? TAG_META[consensus].color : UNTAGGED;
          return (
            <circle key={it.id} cx={it.coords.x} cy={it.coords.y} r={7} fill={color} opacity={0.9}>
              <title>{it.name}</title>
            </circle>
          );
        })}

        {/* Route order numbers */}
        {routePoints.map((p) => (
          <g key={`r-${p.n}`}>
            <circle cx={p.x} cy={p.y} r={10} fill="#0f172a" />
            <text
              x={p.x}
              y={p.y}
              dy="0.35em"
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="white"
            >
              {p.n}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-[10px] text-slate-400">
        Schematic layout (approximate positions); the dashed line is your route order.
      </p>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
