import type { Collaborator, Tag, TagEntry } from './types';

export const TAG_META: Record<Tag, { label: string; color: string; short: string }> = {
  must: { label: 'Must do', color: '#16a34a', short: 'Must' },
  nice: { label: 'Nice to do', color: '#2563eb', short: 'Nice' },
  avoid: { label: 'Avoid', color: '#dc2626', short: 'Avoid' },
};

export const TAG_ORDER: Tag[] = ['must', 'nice', 'avoid'];

/** Rank for sorting attractions by collective interest (must first). */
export const TAG_RANK: Record<Tag, number> = { must: 0, nice: 1, avoid: 3 };

export interface TagSummary {
  /** Every collaborator's tag for this attraction. */
  entries: { collaborator: Collaborator; tag: Tag }[];
  counts: Record<Tag, number>;
  /** The current user's tag, if any. */
  mine: Tag | null;
  /** Group consensus: the most-applied tag, or null if untagged. */
  consensus: Tag | null;
}

export function summarizeTags(
  attractionId: string,
  tags: TagEntry[],
  collaborators: Collaborator[],
  meId: string | null,
): TagSummary {
  const byId = new Map(collaborators.map((c) => [c.id, c]));
  const counts: Record<Tag, number> = { must: 0, nice: 0, avoid: 0 };
  const entries: TagSummary['entries'] = [];
  let mine: Tag | null = null;

  for (const t of tags) {
    if (t.attractionId !== attractionId) continue;
    counts[t.tag] += 1;
    if (t.userId === meId) mine = t.tag;
    const collaborator = byId.get(t.userId);
    if (collaborator) entries.push({ collaborator, tag: t.tag });
  }

  let consensus: Tag | null = null;
  let best = 0;
  for (const tag of TAG_ORDER) {
    if (counts[tag] > best) {
      best = counts[tag];
      consensus = tag;
    }
  }

  return { entries, counts, mine, consensus };
}
