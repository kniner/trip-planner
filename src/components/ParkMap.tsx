import { useEffect, useMemo, useRef, useState } from 'react';
import { ITEMS_BY_ID, itemsForDay } from '../data';
import { amenitiesForPark, type AmenityType } from '../data/amenities';
import { PARK_PATHS } from '../data/mapPaths';
import { TOT_PATH, TOT_STATIONS } from '../data/trickOrTreat';
import { summarizeTags, TAG_META } from '../lib/tags';
import type { Attraction, ParkId } from '../lib/types';
import { useActiveDay, useStore } from '../store/useStore';

const UNTAGGED = '#cbd5e1';
const PAD = 40;

const AMENITY_GLYPH: Record<AmenityType, string> = {
  restroom: '🚻',
  water: '🚰',
  photopass: '📷',
  photospot: '✨',
  landmark: '🏰',
  kids: '🧸',
  break: '🧊',
};
const AMENITY_LABEL: Record<AmenityType, string> = {
  restroom: 'Restroom',
  water: 'Water fountain',
  photopass: 'PhotoPass',
  photospot: 'Photo spot',
  landmark: 'Landmark',
  kids: 'Kids interactive',
  break: 'Indoor break',
};
/** Layers the user can toggle (landmarks are always shown). */
const AMENITY_TOGGLES: { type: AmenityType; label: string }[] = [
  { type: 'restroom', label: '🚻 Restrooms' },
  { type: 'water', label: '🚰 Water' },
  { type: 'photopass', label: '📷 PhotoPass' },
  { type: 'photospot', label: '✨ Photo spots' },
  { type: 'kids', label: '🧸 Kids' },
  { type: 'break', label: '🧊 Indoor breaks' },
];

type TypeCat = 'ride' | 'show' | 'attraction' | 'food';
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

/** Color a live wait by length: green (short) → amber → red (long). */
function waitColor(min: number): string {
  if (min <= 20) return '#16a34a';
  if (min <= 45) return '#d97706';
  return '#dc2626';
}
function typeCat(kind: Attraction['kind']): TypeCat {
  if (kind === 'ride') return 'ride';
  if (kind === 'show' || kind === 'entertainment') return 'show';
  if (kind === 'food' || kind === 'dining' || kind === 'festival') return 'food';
  return 'attraction';
}

const ZONES: Record<ParkId, { label: string; color: string; match: (land: string) => boolean }[]> = {
  mk: [
    { label: 'Main Street', color: '#fde68a', match: (l) => l === 'Main Street, U.S.A.' },
    { label: 'Adventureland', color: '#bbf7d0', match: (l) => l === 'Adventureland' },
    { label: 'Frontierland', color: '#fed7aa', match: (l) => l === 'Frontierland' },
    { label: 'Liberty Square', color: '#ddd6fe', match: (l) => l === 'Liberty Square' },
    { label: 'Fantasyland', color: '#fbcfe8', match: (l) => l === 'Fantasyland' },
    { label: 'Tomorrowland', color: '#bae6fd', match: (l) => l === 'Tomorrowland' },
  ],
  epcot: [
    { label: 'World Celebration', color: '#fde68a', match: (l) => l === 'World Celebration' },
    { label: 'World Discovery', color: '#bae6fd', match: (l) => l === 'World Discovery' },
    { label: 'World Nature', color: '#bbf7d0', match: (l) => l === 'World Nature' },
    { label: 'World Showcase', color: '#fbcfe8', match: (l) => l.startsWith('World Showcase') },
  ],
  // No schematic map for the LEGOLAND water park.
  legoland: [],
};

/**
 * Schematic, zoomable park map: land zones, walking paths, attractions (fill =
 * group tag, outline = type), the planned route, landmarks, and toggleable
 * amenity layers (restrooms/water/PhotoPass/photo spots/kids/breaks). Tap a
 * marker for details; pinch, mouse-wheel, or the +/−/reset buttons to zoom, and
 * drag to pan. Markers scale with zoom so they don't overlap.
 */
export function ParkMap() {
  const day = useActiveDay();
  const tags = useStore((s) => s.doc.tags);
  const collaborators = useStore((s) => s.doc.collaborators);
  const meId = useStore((s) => s.meId);
  const live = useStore((s) => s.live);
  const liveStatus = useStore((s) => s.liveStatus);
  const refreshLive = useStore((s) => s.refreshLive);
  const [showWaits, setShowWaits] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amenityInfo, setAmenityInfo] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<AmenityType, boolean>>({
    restroom: false,
    water: false,
    photopass: false,
    photospot: false,
    landmark: true,
    kids: false,
    break: false,
  });

  const items = useMemo(() => itemsForDay(day.park, day.event), [day.park, day.event]);
  const amenities = useMemo(() => amenitiesForPark(day.park), [day.park]);
  const paths = PARK_PATHS[day.park] ?? [];
  const isHalloween = day.park === 'mk' && day.event === 'mnsshp';
  const [showTot, setShowTot] = useState(true);

  const base = useMemo(() => {
    const xs = items.map((i) => i.coords.x);
    const ys = items.map((i) => i.coords.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const w = Math.max(...xs) - minX || 1;
    const h = Math.max(...ys) - minY || 1;
    return { x: minX - PAD, y: minY - PAD, w: w + PAD * 2, h: h + PAD * 2 };
  }, [items]);

  // Zoom + pan around a center point.
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => {
    // Reset view when the park changes.
    setZoom(1);
    setCenter(null);
  }, [day.park]);

  const zones = useMemo(() => {
    const P = 24;
    return (ZONES[day.park] ?? [])
      .map((z) => {
        const pts = items.filter((i) => z.match(i.land));
        if (pts.length === 0) return null;
        const xs = pts.map((p) => p.coords.x);
        const ys = pts.map((p) => p.coords.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        return {
          label: z.label,
          color: z.color,
          x: minX - P,
          y: minY - P,
          w: Math.max(...xs) - minX + P * 2,
          h: Math.max(...ys) - minY + P * 2,
        };
      })
      .filter((z): z is NonNullable<typeof z> => z !== null);
  }, [day.park, items]);

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

  const cx = center?.x ?? base.x + base.w / 2;
  const cy = center?.y ?? base.y + base.h / 2;
  const vbW = base.w / zoom;
  const vbH = base.h / zoom;
  const viewBox = `${cx - vbW / 2} ${cy - vbH / 2} ${vbW} ${vbH}`;
  // Markers are sized in viewBox units. We dampen by sqrt(zoom) rather than the
  // full zoom: markers still shrink relative to the map (less overlap as you
  // zoom in) but grow on screen enough to stay readable instead of pinning to a
  // tiny constant size.
  const s = 1 / Math.sqrt(zoom);

  const twoPointerDist = () => {
    const pts = [...pointers.current.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (pointers.current.size >= 2) {
      drag.current = null;
      pinch.current = { dist: twoPointerDist(), zoom };
    } else {
      drag.current = { x: e.clientX, y: e.clientY, cx, cy };
    }
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current && pointers.current.size >= 2) {
      const ratio = twoPointerDist() / (pinch.current.dist || 1);
      setZoom(Math.min(Math.max(pinch.current.zoom * ratio, 1), 6));
      return;
    }
    if (drag.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const dxView = ((e.clientX - drag.current.x) * vbW) / rect.width;
      const dyView = ((e.clientY - drag.current.y) * vbH) / rect.height;
      setCenter({ x: drag.current.cx - dxView, y: drag.current.cy - dyView });
    }
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
    } else {
      // A finger remains after a pinch — resume panning from it.
      const [p] = [...pointers.current.values()];
      drag.current = { x: p.x, y: p.y, cx, cy };
    }
  };
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    setZoom((z) => Math.min(Math.max(z * (e.deltaY < 0 ? 1.1 : 0.9), 1), 6));
  };

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
        <span className="ml-1 flex flex-wrap items-center gap-2">
          {AMENITY_TOGGLES.map((t) => (
            <label key={t.type} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={layers[t.type]}
                onChange={(e) => setLayers((p) => ({ ...p, [t.type]: e.target.checked }))}
                className="h-3 w-3 accent-slate-700"
              />
              {t.label}
            </label>
          ))}
          {isHalloween && (
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showTot}
                onChange={(e) => setShowTot(e.target.checked)}
                className="h-3 w-3 accent-orange-500"
              />
              🍬 Trick-or-treat
            </label>
          )}
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showWaits}
              onChange={(e) => {
                setShowWaits(e.target.checked);
                if (e.target.checked && liveStatus !== 'ok') void refreshLive();
              }}
              className="h-3 w-3 accent-rose-600"
            />
            ⏱ Live waits
          </label>
        </span>
      </div>

      {showWaits && (
        <p className="text-[10px]">
          {liveStatus === 'ok' && (
            <span className="text-slate-400">
              Live waits from queue-times.com ·{' '}
              <span className="font-medium text-emerald-600">≤20</span>{' '}
              <span className="font-medium text-amber-600">≤45</span>{' '}
              <span className="font-medium text-rose-600">45+</span> min ·{' '}
              <button onClick={() => void refreshLive()} className="underline">
                refresh
              </button>
            </span>
          )}
          {liveStatus === 'loading' && <span className="text-slate-400">Loading live waits…</span>}
          {liveStatus === 'unavailable' && (
            <span className="text-amber-600">
              Live feed unavailable right now — try{' '}
              <button onClick={() => void refreshLive()} className="underline">
                refresh
              </button>
              .
            </span>
          )}
        </p>
      )}

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="h-auto w-full touch-none select-none rounded-md bg-slate-50"
          style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
          role="img"
          aria-label={`Map of ${day.park === 'mk' ? 'Magic Kingdom' : 'EPCOT'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {/* Land zones */}
          {zones.map((z) => (
            <g key={z.label} pointerEvents="none">
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={16} fill={z.color} opacity={0.4} />
              <text x={z.x + z.w / 2} y={z.y + 15 * s} textAnchor="middle" fontSize={13 * s} fontWeight={700} fill="#334155" opacity={0.75}>
                {z.label}
              </text>
            </g>
          ))}

          {/* Walking paths */}
          {paths.map((p, i) => (
            <polyline
              key={`path-${i}`}
              points={p.map((pt) => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke="#ffffff"
              strokeWidth={7 * s}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
              pointerEvents="none"
            />
          ))}

          {/* Trick-or-treat trail (MNSSHP) */}
          {isHalloween && showTot && (
            <>
              <polyline
                points={TOT_PATH.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#f97316"
                strokeWidth={4 * s}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${2 * s} ${6 * s}`}
                opacity={0.8}
                pointerEvents="none"
              />
              {TOT_STATIONS.map((st) => (
                <g
                  key={st.id}
                  onClick={() => {
                    setAmenityInfo(`Trick-or-treat station · ${st.land}`);
                    setSelectedId(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={st.coords.x} cy={st.coords.y} r={11 * s} fill="transparent" />
                  <text x={st.coords.x} y={st.coords.y} dy="0.35em" textAnchor="middle" fontSize={14 * s}>
                    🍬
                    <title>Trick-or-treat station · {st.land}</title>
                  </text>
                </g>
              ))}
            </>
          )}

          {/* Route */}
          {routePoints.length > 1 && (
            <polyline
              points={routePoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#0f172a"
              strokeWidth={3 * s}
              strokeLinejoin="round"
              strokeDasharray={`${6 * s} ${5 * s}`}
              opacity={0.55}
              pointerEvents="none"
            />
          )}

          {/* Attractions */}
          {items.map((it) => {
            const consensus = summarizeTags(it.id, tags, collaborators, meId).consensus;
            const fill = consensus ? TAG_META[consensus].color : UNTAGGED;
            const isSel = it.id === selectedId;
            const lw = showWaits ? live[it.id] : undefined;
            const showBadge = !!lw && lw.isOpen;
            return (
              <g
                key={it.id}
                onClick={() => {
                  setSelectedId(isSel ? null : it.id);
                  setAmenityInfo(null);
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={it.coords.x} cy={it.coords.y} r={13 * s} fill="transparent" />
                <circle
                  cx={it.coords.x}
                  cy={it.coords.y}
                  r={(isSel ? 9 : 7) * s}
                  fill={fill}
                  stroke={OUTLINE[typeCat(it.kind)]}
                  strokeWidth={(isSel ? 4 : 2) * s}
                >
                  <title>{it.name}</title>
                </circle>
                {showBadge && (
                  <g pointerEvents="none">
                    <circle
                      cx={it.coords.x + 9 * s}
                      cy={it.coords.y - 9 * s}
                      r={7 * s}
                      fill={waitColor(lw!.wait)}
                      stroke="#fff"
                      strokeWidth={1.5 * s}
                    />
                    <text
                      x={it.coords.x + 9 * s}
                      y={it.coords.y - 9 * s}
                      dy="0.35em"
                      textAnchor="middle"
                      fontSize={7 * s}
                      fontWeight={700}
                      fill="#fff"
                    >
                      {lw!.wait}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Toggleable amenity markers */}
          {amenities
            .filter((a) => a.type !== 'landmark' && layers[a.type])
            .map((a) => {
              const caption = `${AMENITY_LABEL[a.type]} · ${a.land}${a.note ? ` — ${a.note}` : ''}`;
              return (
                <g
                  key={a.id}
                  onClick={() => {
                    setAmenityInfo(caption);
                    setSelectedId(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={a.coords.x} cy={a.coords.y} r={11 * s} fill="transparent" />
                  <text x={a.coords.x} y={a.coords.y} dy="0.35em" textAnchor="middle" fontSize={15 * s}>
                    {AMENITY_GLYPH[a.type]}
                    <title>{caption}</title>
                  </text>
                </g>
              );
            })}

          {/* Landmarks (always shown) */}
          {amenities
            .filter((a) => a.type === 'landmark')
            .map((a) => {
              const caption = `${a.land}${a.note ? ` — ${a.note}` : ''}`;
              return (
                <g
                  key={a.id}
                  onClick={() => {
                    setAmenityInfo(caption);
                    setSelectedId(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={a.coords.x} cy={a.coords.y} r={14 * s} fill="transparent" />
                  <text x={a.coords.x} y={a.coords.y} dy="0.35em" textAnchor="middle" fontSize={22 * s}>
                    {AMENITY_GLYPH.landmark}
                    <title>{caption}</title>
                  </text>
                </g>
              );
            })}

          {/* Route order numbers */}
          {routePoints.map((p) => (
            <g key={`r-${p.n}`} pointerEvents="none">
              <circle cx={p.x} cy={p.y} r={10 * s} fill="#0f172a" />
              <text x={p.x} y={p.y} dy="0.35em" textAnchor="middle" fontSize={11 * s} fontWeight="bold" fill="white">
                {p.n}
              </text>
            </g>
          ))}
        </svg>

        {/* Zoom controls */}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <ZoomBtn onClick={() => setZoom((z) => Math.min(z * 1.4, 6))}>+</ZoomBtn>
          <ZoomBtn onClick={() => setZoom((z) => Math.max(z / 1.4, 1))}>−</ZoomBtn>
          <ZoomBtn
            onClick={() => {
              setZoom(1);
              setCenter(null);
            }}
          >
            ⟳
          </ZoomBtn>
        </div>
      </div>

      {selected ? (
        <p className="text-[11px] text-slate-600">
          <strong>{selected.name}</strong> · {selected.land} · {TYPE_LABEL[typeCat(selected.kind)]}
          {(() => {
            const lw = live[selected.id];
            if (!lw) return null;
            return (
              <span style={{ color: lw.isOpen ? waitColor(lw.wait) : undefined }} className="ml-1 font-semibold">
                {' '}· {lw.isOpen ? `${lw.wait} min now` : 'closed'}
              </span>
            );
          })()}
          {selected.description && (
            <span className="mt-0.5 block text-slate-500">{selected.description}</span>
          )}
        </p>
      ) : amenityInfo ? (
        <p className="text-[11px] text-slate-600">{amenityInfo}</p>
      ) : (
        <p className="text-[10px] text-slate-400">
          Tap a marker for details · drag to pan · +/− to zoom. Schematic layout;
          white lines are walkways, dashed line is your route.
        </p>
      )}
    </section>
  );
}

function ZoomBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-sm font-bold text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white"
    >
      {children}
    </button>
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
