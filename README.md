# ✨ Magic Kingdom Planner

A collaborative web app for planning a day at Magic Kingdom (Walt Disney World, Florida).
Tag attractions, build a route, and get a realistic time estimate for your day — together.

## Features

- **Tag every attraction** as **Must do**, **Nice to do**, or **Avoid**. Tags are
  per-person and attributed, with a group consensus shown on each card.
- **Collaborative.** Multiple people tag the same plan. Edits sync live across
  browser tabs/windows today via `BroadcastChannel`; the sync layer is a clean
  interface (`SyncProvider`) so a real backend (Supabase/Firebase) drops in
  without touching the UI.
- **Route builder.** Add attractions to your route, reorder them, and optionally
  **optimize walking** (nearest-neighbour ordering to cut total walking).
- **Walking-time estimates** between stops, computed from each attraction's
  position in the park and scaled by **group pace** — *Slow / with kids*,
  *Average*, or *Fast*.
- **Wait-time model toggle:** switch the whole estimate between **Average**
  (typical day), **Max** (peak/holiday), and **Live** (current waits pulled from
  [queue-times.com](https://queue-times.com), with graceful fallback to averages
  when the feed is unavailable).
- **Target arrival times** per stop, with the estimator flagging how early/late
  you'll be based on the running clock.
- **Day summary:** total time, time spent walking, time spent in queues, and your
  projected finish time.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand for state, with a pluggable sync provider
- Vitest for the estimation/walking math

## Develop

```bash
npm install
npm run dev      # start the dev server
npm test         # run unit tests
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Architecture notes

```
src/
  data/attractions.ts   Curated Magic Kingdom dataset (waits, durations, map coords)
  lib/
    types.ts            Shared domain types
    walking.ts          Distance + pace-scaled walking-time math
    estimator.ts        Full route time/clock estimation
    waitTimes.ts        Live wait overlay (queue-times.com) with fallback
    tags.ts             Tag aggregation / consensus
  store/
    sync.ts             SyncProvider interface + LocalSyncProvider (cross-tab)
    useStore.ts         Zustand store wiring sync, identity, and live data
  components/           UI
```

### Swapping in a real backend

`store/sync.ts` defines the `SyncProvider` interface:

```ts
interface SyncProvider {
  load(): Promise<PlanDoc | null>;
  save(doc: PlanDoc): Promise<void>;
  subscribe(cb: (doc: PlanDoc) => void): () => void;
}
```

The app only ever talks to a provider, never to storage directly. To enable
cross-device collaboration, implement this interface against Supabase realtime,
Firebase, or a WebSocket server, and swap the `provider` instance in
`store/useStore.ts`. No UI changes required.

### Wait-time data

Average and max waits are curated planning figures bundled in the dataset. The
**Live** mode overlays current waits from queue-times.com (Magic Kingdom park
id 6). If the network/CORS/feed is unavailable, the app silently falls back to
average waits so planning still works offline.
