import { useEffect, useState, type ReactNode } from 'react';
import { FirstRunChecklist } from './components/FirstRunChecklist';
import { JoinGate } from './components/JoinGate';
import { ListsView } from './components/ListsView';
import { MapView } from './components/MapView';
import { MealsView } from './components/MealsView';
import { NowNext } from './components/NowNext';
import { ScheduleView } from './components/ScheduleView';
import { TagView } from './components/TagView';
import { TripCountdown } from './components/TripCountdown';
import { FinancesView, TripView } from './components/TripView';
import { UserBar } from './components/UserBar';
import { useStore } from './store/useStore';

/** Top-level groups. Schedule (owner-only) folds in the day Map; Trip folds in
 * the trip info, packing lists, meal plan and finances as sub-tabs. */
type Group = 'wishlist' | 'schedule' | 'trip';
type ScheduleSub = 'schedule' | 'map';
type TripSub = 'info' | 'lists' | 'meals' | 'finances';

export default function App() {
  const init = useStore((s) => s.init);
  const ready = useStore((s) => s.ready);
  const meId = useStore((s) => s.meId);
  const collaborators = useStore((s) => s.doc.collaborators);
  const [group, setGroup] = useState<Group>('wishlist');
  const [scheduleSub, setScheduleSub] = useState<ScheduleSub>('schedule');
  const [tripSub, setTripSub] = useState<TripSub>('info');

  // "Joined" requires an identity that still exists in the shared plan. If the
  // plan was reset/cleared, a stale stored id no longer matches anyone, so the
  // device falls back to the join screen rather than acting as a ghost user.
  const joined = meId != null && collaborators.some((c) => c.id === meId);

  // The schedule owner (explicitly claimed, else the trip's first member) is the
  // only one who can see the Schedule group for now.
  const ownerId = useStore((s) => s.doc.ownerId) ?? collaborators[0]?.id;
  const claimOwnership = useStore((s) => s.claimOwnership);
  const isOwner = meId != null && ownerId === meId;
  const ownerName = collaborators.find((c) => c.id === ownerId)?.name;
  const activeGroup: Group = group === 'schedule' && !isOwner ? 'wishlist' : group;

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
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">
          ✨ Walt Disney World Planner
        </h1>
        <p className="text-sm text-slate-500">
          Tag what you want to do, then schedule it across your days — together.
        </p>
      </header>

      <div className="mb-4 space-y-3">
        <UserBar />
        <TripCountdown />
        <NowNext isOwner={isOwner} />
        <FirstRunChecklist
          isOwner={isOwner}
          onGoWishlist={() => setGroup('wishlist')}
          onGoSchedule={() => setGroup('schedule')}
        />

        <nav className="flex flex-wrap rounded-lg bg-slate-100 p-1">
          <ViewTab active={activeGroup === 'wishlist'} onClick={() => setGroup('wishlist')}>
            Wishlist
          </ViewTab>
          {isOwner && (
            <ViewTab active={activeGroup === 'schedule'} onClick={() => setGroup('schedule')}>
              Schedule
            </ViewTab>
          )}
          <ViewTab active={activeGroup === 'trip'} onClick={() => setGroup('trip')}>
            Trip
          </ViewTab>
        </nav>

        {/* Non-owners get the ownership claim here; owners don't need the row. */}
        {!isOwner && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            <span>
              Schedule owner:{' '}
              <span className="font-semibold text-slate-700">{ownerName ?? 'unclaimed'}</span>
            </span>
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
          </div>
        )}
      </div>

      {activeGroup === 'wishlist' && <TagView />}

      {activeGroup === 'schedule' && isOwner && (
        <div className="space-y-4">
          <SubNav>
            <SubTab active={scheduleSub === 'schedule'} onClick={() => setScheduleSub('schedule')}>
              Schedule
            </SubTab>
            <SubTab active={scheduleSub === 'map'} onClick={() => setScheduleSub('map')}>
              Park map
            </SubTab>
          </SubNav>
          {scheduleSub === 'schedule' ? <ScheduleView /> : <MapView />}
        </div>
      )}

      {activeGroup === 'trip' && (
        <div className="space-y-4">
          <SubNav>
            <SubTab active={tripSub === 'info'} onClick={() => setTripSub('info')}>
              Info & dining
            </SubTab>
            <SubTab active={tripSub === 'lists'} onClick={() => setTripSub('lists')}>
              Lists
            </SubTab>
            <SubTab active={tripSub === 'meals'} onClick={() => setTripSub('meals')}>
              Meals
            </SubTab>
            <SubTab active={tripSub === 'finances'} onClick={() => setTripSub('finances')}>
              Finances
            </SubTab>
          </SubNav>
          {tripSub === 'info' && <TripView />}
          {tripSub === 'lists' && <ListsView />}
          {tripSub === 'meals' && <MealsView />}
          {tripSub === 'finances' && <FinancesView />}
        </div>
      )}

      <footer className="mt-10 text-center text-[11px] text-slate-400">
        Wait times are planning estimates; live data via queue-times.com when
        available.
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

/** Lighter secondary tab row used inside a group. */
function SubNav({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function SubTab({
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
      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}
