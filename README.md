# ✨ Walt Disney World Planner

A collaborative web app for planning multiple days across **Magic Kingdom** and
**EPCOT** (Walt Disney World, Florida) — including special-event nights. Tag
attractions, build a route, and get a realistic time estimate for each day —
together.

## Features

- **Multi-day, multi-park.** Plan as many days as you want via day tabs. Each day
  is its own park + day-type with its own route and settings, so a Magic Kingdom
  morning, an **MNSSHP** (Mickey's Not-So-Scary Halloween Party) night, and an
  **EPCOT Food & Wine Festival** day all live side by side.
- **Event-aware content.** MNSSHP nights surface party exclusives (Boo-to-You
  Parade, Not-So-Spooky Spectacular, Hocus Pocus Villain Spelltacular, party-only
  villain & Jack/Sally meets, trick-or-treat trails). EPCOT Food & Wine days add
  the festival **Global Marketplaces** (booths around World Showcase). Regular
  rides still show on event days too.
- **Character dining** at both parks (Cinderella's Royal Table, The Crystal
  Palace, Garden Grill, Akershus) as bookable stops — modeled at a **90-minute**
  seating.
- **Custom timeline blocks.** Add non-attraction time to the route — *drive to
  park, parking & tram, security & bag check, rope drop, meal breaks* — with a
  name, address, and duration, so travel/logistics are part of your day's clock.
- **Tag every item** as **Must do**, **Nice to do**, or **Avoid**. Tags are
  per-person and attributed, with a group consensus shown on each card, and are
  shared across all days of the trip.
- **Collaborative.** Multiple people tag the same plan. Edits sync live across
  browser tabs/windows today via `BroadcastChannel`; the sync layer is a clean
  interface (`SyncProvider`) so a real backend (Supabase/Firebase) drops in
  without touching the UI.
- **Route builder.** Add stops, reorder them, and optionally **optimize walking**
  (nearest-neighbour ordering to cut total walking).
- **Walking-time estimates** between stops, computed from each attraction's
  position in the park and scaled by **group pace** — *Slow / with kids*,
  *Average*, or *Fast*.
- **Wait-time model toggle:** switch the whole estimate between **Average**
  (typical day), **Max** (peak/holiday), and **Live** (current waits pulled from
  [queue-times.com](https://queue-times.com) for both parks, with graceful
  fallback to averages when the feed is unavailable).
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
