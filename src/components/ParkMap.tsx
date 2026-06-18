import { useMemo, useState } from 'react';
import { ITEMS_BY_ID, itemsForDay } from '../data';
import { amenitiesForPark } from '../data/amenities';
import { summarizeTags, TAG_META } from '../lib/tags';
import type { Attraction } from '../lib/types';
import { useActiveDay, useStore } from '../store/useStore';

const AMENITY_GLYPH = { restroom: '🚻', water: '🚰' } as const;

const UNTAGGED = '#cbd5e1';
const PAD = 40;

type TypeCat = 'ride' | 'show' | 'attraction' | 'food';

/** Outline color encodes the kind of place; dot fill encodes the group's tag. */
const OUTLINE: Record<TypeCat, string> = {
  ride: '#0f172a',
  show: '#7c3aed',
  attraction: '#0891b2',
  food: '#16a34a',
};
const TYPE_LABEL: Record<TypeCat, string> = {
  ride: 'Ride',
  show: 'Show',
  attraction: 'Attraction',
  food: 'Food',
};

function typeCat(kind: Attraction['kind']): TypeCat {
  if (kind === 'ride') return 'ride';
  if (kind === 'show' || kind === 'entertainment') return 'show';
  if (kind === 'food' || kind === 'dining' || kind === 'festival') return 'food';
  return 'attraction'; // attraction, experience
}

/**
 * Lightweight schematic map: plots the day's attractions by their grid
 * coordinates (fill = group tag, outline = type), draws the route through the
 * scheduled stops, and lets you tap a dot to see what it is. Approximate layout.
 */
export function ParkMap() {
  const day = useActiveDay();
  const tags = useStore((s) => s.doc.tags);
  const collaborators = useStore((s) => s.doc.collaborators);
  const meId = useStore((s) => s.meId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amenityInfo, setAmenityInfo] = useState<string | null>(null);
  const [showRestrooms, setShowRestrooms] = useState(false);
  const [showWater, setShowWater] = useState(false);

  const items = useMemo(() => itemsForDay(day.park, day.event), [day.park, day.event]);
  const amenities = useMemo(() => amenitiesForPark(day.park), [day.park]);

  const view = useMemo(() => {
    const xs = items.map((i) => i.coords.x);
    const ys = items.map((i) => i.coords.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const w = Math.max(...xs) - minX || 1;
    const h = Math.max(...ys) - minY || 1;
    return { x: minX - PAD, y: minY - PAD, w: w + PAD * 2, h: h + PAD * 2 };
  }, [items]);

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

  const selected = selectedId ? ITEMS_BY_ID[selectedId] : undefined;

  return (
    <section className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Map</h2>
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
          <Legend swatch={<Dot fill={TAG_META.must.color} />} label="Must" />
          <Legend swatch={<Dot fill={TAG_META.nice.color} />} label="Nice" />
          <Legend swatch={<Dot fill={UNTAGGED} />} label="Untagged" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
        <span className="text-slate-400">Outline:</span>
        {(Object.keys(OUTLINE) as TypeCat[]).map((t) => (
          <Legend key={t} swatch={<Dot fill="#fff" stroke={OUTLINE[t]} />} label={TYPE_LABEL[t]} />
        ))}
        <span className="ml-1 flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showRestrooms}
              onChange={(e) => setShowRestrooms(e.target.checked)}
              className="h-3 w-3 accent-slate-700"
            />
            🚻 Restrooms
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showWater}
              onChange={(e) => setShowWater(e.target.checked)}
              className="h-3 w-3 accent-slate-700"
            />
            🚰 Water
          </label>
        </span>
      </div>

      <svg
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-auto w-full rounded-md bg-slate-50"
        role="img"
        aria-label={`Map of ${day.park === 'mk' ? 'Magic Kingdom' : 'EPCOT'} attractions and your route`}
      >
        {routePoints.length > 1 && (
          <polyline
            points={routePoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#0f172a"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeDasharray="6 5"
            opacity={0.5}
          />
        )}

        {items.map((it) => {
          const consensus = summarizeTags(it.id, tags, collaborators, meId).consensus;
          const fill = consensus ? TAG_META[consensus].color : UNTAGGED;
          const isSel = it.id === selectedId;
          return (
            <g
              key={it.id}
              onClick={() => {
                setSelectedId(isSel ? null : it.id);
                setAmenityInfo(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* larger transparent hit target for easy tapping */}
              <circle cx={it.coords.x} cy={it.coords.y} r={13} fill="transparent" />
              <circle
                cx={it.coords.x}
                cy={it.coords.y}
                r={isSel ? 9 : 7}
                fill={fill}
                stroke={OUTLINE[typeCat(it.kind)]}
                strokeWidth={isSel ? 4 : 2}
              >
                <title>{it.name}</title>
              </circle>
            </g>
          );
        })}

        {amenities
          .filter((a) => (a.type === 'restroom' ? showRestrooms : showWater))
          .map((a) => (
            <g
              key={a.id}
              onClick={() => {
                setAmenityInfo(`${a.type === 'restroom' ? 'Restroom' : 'Water fountain'} · ${a.land}`);
                setSelectedId(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={a.coords.x} cy={a.coords.y} r={11} fill="transparent" />
              <text x={a.coords.x} y={a.coords.y} dy="0.35em" textAnchor="middle" fontSize={15}>
                {AMENITY_GLYPH[a.type]}
                <title>{a.type === 'restroom' ? 'Restroom' : 'Water fountain'} · {a.land}</title>
              </text>
            </g>
          ))}

        {routePoints.map((p) => (
          <g key={`r-${p.n}`} pointerEvents="none">
            <circle cx={p.x} cy={p.y} r={10} fill="#0f172a" />
            <text x={p.x} y={p.y} dy="0.35em" textAnchor="middle" fontSize={11} fontWeight="bold" fill="white">
              {p.n}
            </text>
          </g>
        ))}
      </svg>

      {selected ? (
        <p className="text-[11px] text-slate-600">
          <strong>{selected.name}</strong> · {selected.land} ·{' '}
          {TYPE_LABEL[typeCat(selected.kind)]}
        </p>
      ) : amenityInfo ? (
        <p className="text-[11px] text-slate-600">{amenityInfo}</p>
      ) : (
        <p className="text-[10px] text-slate-400">
          Tap a dot to see what it is. Toggle restrooms/water above. Schematic
          layout; dashed line is your route.
        </p>
      )}
    </section>
  );
}

function Dot({ fill, stroke }: { fill: string; stroke?: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: fill, border: stroke ? `2px solid ${stroke}` : undefined }}
    />
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {swatch}
      {label}
    </span>
  );
}
