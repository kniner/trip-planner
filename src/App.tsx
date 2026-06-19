import { useEffect, useState, type ReactNode } from 'react';
import { JoinGate } from './components/JoinGate';
import { ListsView } from './components/ListsView';
import { MapView } from './components/MapView';
import { MealsView } from './components/MealsView';
import { ScheduleView } from './components/ScheduleView';
import { TagView } from './components/TagView';
import { TripView } from './components/TripView';
import { UserBar } from './components/UserBar';
import { useStore } from './store/useStore';

type View = 'tag' | 'schedule' | 'map' | 'lists' | 'meals' | 'trip';

export default function App() {
  const init = useStore((s) => s.init);
  const ready = useStore((s) => s.ready);
  const meId = useStore((s) => s.meId);
  const collaborators = useStore((s) => s.doc.collaborators);
  const [view, setView] = useState<View>('tag');

  // "Joined" requires an identity that still exists in the shared plan. If the
  // plan was reset/cleared, a stale stored id no longer matches anyone, so the
  // device falls back to the join screen rather than acting as a ghost user.
  const joined = meId != null && collaborators.some((c) => c.id === meId);

  // The schedule owner (explicitly claimed, else the trip's first member) is the
  // only one who can see the Schedule page for now.
  const ownerId = useStore((s) => s.doc.ownerId) ?? collaborators[0]?.id;
  const claimOwnership = useStore((s) => s.claimOwnership);
  const isOwner = meId != null && ownerId === meId;
  const ownerName = collaborators.find((c) => c.id === ownerId)?.name;
  const effectiveView = view === 'schedule' && !isOwner ? 'tag' : view;

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  // Hard gate: no name, no app.
  if (!joined) return <JoinGate />;

  return (
    <div className="mx-auto max-w-7xl p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">
          ✨ Walt Disney World Planner
        </h1>
        <p className="text-sm text-slate-500">
          Tag what you want to do, then schedule it across your days — together.
        </p>
      </header>

      <div className="mb-4 space-y-3">
        <UserBar />

        <nav className="flex flex-wrap rounded-lg bg-slate-100 p-1">
          <ViewTab active={effectiveView === 'tag'} onClick={() => setView('tag')}>
            Wishlist
          </ViewTab>
          {isOwner && (
            <ViewTab active={effectiveView === 'schedule'} onClick={() => setView('schedule')}>
              Schedule
            </ViewTab>
          )}
          <ViewTab active={effectiveView === 'map'} onClick={() => setView('map')}>
            Map
          </ViewTab>
          <ViewTab active={effectiveView === 'lists'} onClick={() => setView('lists')}>
            Lists
          </ViewTab>
          <ViewTab active={effectiveView === 'meals'} onClick={() => setView('meals')}>
            Meals
          </ViewTab>
          <ViewTab active={effectiveView === 'trip'} onClick={() => setView('trip')}>
            Trip
          </ViewTab>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          <span>
            Schedule owner:{' '}
            <span className="font-semibold text-slate-700">
              {ownerName ?? 'unclaimed'}
            </span>
            {isOwner && ' (you)'}
          </span>
          {!isOwner && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    ownerName
                      ? `Take over schedule ownership from ${ownerName}? Only you will see the Schedule page.`
                      : 'Claim schedule ownership? Only you will see the Schedule page.',
                  )
                ) {
                  claimOwnership();
                }
              }}
              className="rounded-md bg-indigo-600 px-3 py-1 font-semibold text-white hover:bg-indigo-500"
            >
              Make me the owner
            </button>
          )}
        </div>
      </div>

      {effectiveView === 'tag' && <TagView />}
      {effectiveView === 'schedule' && isOwner && <ScheduleView />}
      {effectiveView === 'map' && <MapView />}
      {effectiveView === 'lists' && <ListsView />}
      {effectiveView === 'meals' && <MealsView />}
      {effectiveView === 'trip' && <TripView />}

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        Tag attractions per park, then schedule them onto specific days. Wait times
        are planning estimates; character dining assumes a 90-minute seating. Live
        data via queue-times.com when available. Plans sync across browser tabs on
        this device; swap the sync provider for cross-device collaboration.
      </footer>
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}
