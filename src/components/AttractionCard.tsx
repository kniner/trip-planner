import { RIDE_WARNINGS } from '../data/rideInfo';
import { summarizeTags } from '../lib/tags';
import type { Attraction } from '../lib/types';
import { useActiveDay, useStore } from '../store/useStore';
import { TagControl } from './TagControl';

interface Props {
  attraction: Attraction;
  /** Show the "+ Add to route" button (hidden on the tagging page). */
  showAddToRoute?: boolean;
}

const KIND_LABEL: Record<Attraction['kind'], string> = {
  ride: 'Ride',
  show: 'Show',
  attraction: 'Attraction',
  dining: 'Character Dining',
  festival: 'Food & Wine',
  entertainment: 'Party Event',
  experience: 'Experience',
  food: 'Food',
};

const KIND_BADGE: Record<Attraction['kind'], string> = {
  ride: 'bg-slate-100 text-slate-500',
  show: 'bg-slate-100 text-slate-500',
  attraction: 'bg-slate-100 text-slate-500',
  dining: 'bg-rose-100 text-rose-600',
  festival: 'bg-amber-100 text-amber-700',
  entertainment: 'bg-purple-100 text-purple-700',
  experience: 'bg-fuchsia-100 text-fuchsia-700',
  food: 'bg-emerald-100 text-emerald-700',
};

/** Reservation-style items don't have queue waits. */
const RESERVATION_KINDS: Attraction['kind'][] = ['dining', 'experience'];

export function AttractionCard({ attraction, showAddToRoute = true }: Props) {
  const doc = useStore((s) => s.doc);
  const meId = useStore((s) => s.meId);
  const live = useStore((s) => s.live);
  const addStop = useStore((s) => s.addStop);
  const removeStop = useStore((s) => s.removeStop);
  const day = useActiveDay();

  const summary = summarizeTags(attraction.id, doc.tags, doc.collaborators, meId);
  const stop = day.stops.find((s) => s.attractionId === attraction.id);
  const liveWait = live[attraction.id];
  const isFood = attraction.kind === 'food';
  const showWaits = !RESERVATION_KINDS.includes(attraction.kind) && !isFood;
  const warning = RIDE_WARNINGS[attraction.id];

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight">{attraction.name}</h3>
          <span
            className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${KIND_BADGE[attraction.kind]}`}
          >
            {KIND_LABEL[attraction.kind]}
          </span>
        </div>
        {showAddToRoute && (
          <button
            onClick={() => (stop ? removeStop(stop.id) : addStop(attraction.id))}
            className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${
              stop
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {stop ? '✓ In route' : '+ Add'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {showWaits ? (
          <>
            <span>
              Avg <strong className="text-slate-700">{attraction.avgWait}m</strong>
            </span>
            <span>
              Max <strong className="text-slate-700">{attraction.maxWait}m</strong>
            </span>
            <span>
              {attraction.kind === 'ride' ? 'Ride' : 'Time'}{' '}
              <strong className="text-slate-700">{attraction.duration}m</strong>
            </span>
            {liveWait && (
              <span
                className={liveWait.isOpen ? 'text-emerald-600' : 'text-slate-400'}
                title="Live current wait from queue-times.com"
              >
                Live <strong>{liveWait.isOpen ? `${liveWait.wait}m` : 'closed'}</strong>
              </span>
            )}
          </>
        ) : isFood ? (
          <span>
            Food stop · <strong className="text-slate-700">~{attraction.duration}m</strong>
          </span>
        ) : (
          <span>
            Reservation · <strong className="text-slate-700">{attraction.duration}m</strong>
            {attraction.kind === 'dining' ? ' seated' : ' appointment'}
          </span>
        )}
        {attraction.gf && (
          <span
            className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700"
            title="Gluten-free options available"
          >
            GF available
          </span>
        )}
      </div>

      {warning && (
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {warning.heightMin && (
            <span
              className="rounded bg-slate-100 px-1.5 py-0.5"
              title={`Must be ${warning.heightMin}″ tall to ride`}
            >
              📏 {warning.heightMin}″
            </span>
          )}
          {warning.pregnancy && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5" title="Not recommended for expectant mothers">
              🤰 no
            </span>
          )}
          {warning.motion && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5" title="May cause motion sickness">
              🌀 motion
            </span>
          )}
          {warning.bigTall && (
            <span
              className="rounded bg-slate-100 px-1.5 py-0.5"
              title="May not fit larger or very tall guests (≈6′8″+)"
            >
              📐 fit
            </span>
          )}
        </div>
      )}

      {attraction.note && (
        <p className="text-[11px] italic text-slate-400">{attraction.note}</p>
      )}

      <TagControl attractionId={attraction.id} summary={summary} />
    </div>
  );
}
