import { summarizeTags } from '../lib/tags';
import type { Attraction } from '../lib/types';
import { useStore } from '../store/useStore';
import { TagControl } from './TagControl';

interface Props {
  attraction: Attraction;
}

const KIND_LABEL: Record<Attraction['kind'], string> = {
  ride: 'Ride',
  show: 'Show',
  attraction: 'Attraction',
};

export function AttractionCard({ attraction }: Props) {
  const doc = useStore((s) => s.doc);
  const meId = useStore((s) => s.meId);
  const live = useStore((s) => s.live);
  const addStop = useStore((s) => s.addStop);
  const removeStop = useStore((s) => s.removeStop);

  const summary = summarizeTags(attraction.id, doc.tags, doc.collaborators, meId);
  const stop = doc.stops.find((s) => s.attractionId === attraction.id);
  const liveWait = live[attraction.id];

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold leading-tight">{attraction.name}</h3>
          <p className="text-xs text-slate-400">{KIND_LABEL[attraction.kind]}</p>
        </div>
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
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>
          Avg <strong className="text-slate-700">{attraction.avgWait}m</strong>
        </span>
        <span>
          Max <strong className="text-slate-700">{attraction.maxWait}m</strong>
        </span>
        <span>
          Ride <strong className="text-slate-700">{attraction.duration}m</strong>
        </span>
        {liveWait && (
          <span
            className={liveWait.isOpen ? 'text-emerald-600' : 'text-slate-400'}
            title="Live current wait from queue-times.com"
          >
            Live{' '}
            <strong>{liveWait.isOpen ? `${liveWait.wait}m` : 'closed'}</strong>
          </span>
        )}
      </div>

      <TagControl attractionId={attraction.id} summary={summary} />
    </div>
  );
}
