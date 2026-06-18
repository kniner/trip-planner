import { describe, expect, it } from 'vitest';
import { ITEMS_BY_ID } from '../data';
import { suggestNext } from './suggest';
import type { Collaborator, Day, TagEntry } from './types';

const day = (overrides: Partial<Day> = {}): Day => ({
  id: 'd',
  name: 'MK',
  park: 'mk',
  event: 'regular',
  stops: [],
  settings: { pace: 'average', waitMode: 'avg', startTime: '09:00', bufferPerStop: 0 },
  ...overrides,
});

const ctx = (tags: TagEntry[] = [], collaborators: Collaborator[] = []) => ({
  day: day(),
  live: {},
  tags,
  collaborators,
  meId: collaborators[0]?.id ?? null,
});

describe('suggestNext', () => {
  it('ranks closer/shorter-wait items higher with no priorities', () => {
    const from = ITEMS_BY_ID['space-mountain'];
    const res = suggestNext(ctx(), from, 5);
    expect(res.length).toBeGreaterThan(0);
    // Sorted ascending by score.
    for (let i = 1; i < res.length; i++) {
      expect(res[i].score).toBeGreaterThanOrEqual(res[i - 1].score);
    }
    // The starting item isn't suggested back to itself.
    expect(res.every((r) => r.item.id !== 'space-mountain')).toBe(true);
  });

  it('excludes avoid-tagged items and boosts must-dos', () => {
    const me: Collaborator = { id: 'u1', name: 'Me', color: '#000' };
    const tags: TagEntry[] = [
      { attractionId: 'haunted-mansion', userId: 'u1', tag: 'avoid' },
      { attractionId: 'big-thunder', userId: 'u1', tag: 'must' },
    ];
    const res = suggestNext(ctx(tags, [me]), ITEMS_BY_ID['space-mountain'], 30);
    expect(res.some((r) => r.item.id === 'haunted-mansion')).toBe(false);
    expect(res.find((r) => r.item.id === 'big-thunder')?.priority).toBe('must');
  });

  it('skips items already in the route', () => {
    const c = {
      ...ctx(),
      day: day({ stops: [{ id: 's1', kind: 'item', attractionId: 'jungle-cruise' }] }),
    };
    const res = suggestNext(c, ITEMS_BY_ID['space-mountain'], 30);
    expect(res.some((r) => r.item.id === 'jungle-cruise')).toBe(false);
  });
});
