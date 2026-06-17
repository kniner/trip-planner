import { TAG_META, TAG_ORDER, type TagSummary } from '../lib/tags';
import type { Tag } from '../lib/types';
import { useStore } from '../store/useStore';

interface Props {
  attractionId: string;
  summary: TagSummary;
}

/** Per-user must/nice/avoid toggle plus a readout of everyone's tags. */
export function TagControl({ attractionId, summary }: Props) {
  const meId = useStore((s) => s.meId);
  const setTag = useStore((s) => s.setTag);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {TAG_ORDER.map((tag: Tag) => {
          const active = summary.mine === tag;
          const meta = TAG_META[tag];
          return (
            <button
              key={tag}
              disabled={!meId}
              onClick={() => setTag(attractionId, active ? null : tag)}
              className="flex-1 rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
              style={
                active
                  ? { background: meta.color, color: 'white', borderColor: meta.color }
                  : { color: meta.color, borderColor: meta.color }
              }
              title={meId ? meta.label : 'Join to tag'}
            >
              {meta.short}
              {summary.counts[tag] > 0 && (
                <span className={active ? 'opacity-90' : 'opacity-70'}>
                  {' '}
                  · {summary.counts[tag]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {summary.entries.length > 0 && (
        <div className="flex flex-wrap gap-1">
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
              <span style={{ color: TAG_META[tag].color }}>{TAG_META[tag].short}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
