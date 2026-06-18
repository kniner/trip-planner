import { useEffect, useState, type ReactNode } from 'react';
import { JoinGate } from './components/JoinGate';
import { ScheduleView } from './components/ScheduleView';
import { TagView } from './components/TagView';
import { UserBar } from './components/UserBar';
import { useStore } from './store/useStore';

type View = 'tag' | 'schedule';

export default function App() {
  const init = useStore((s) => s.init);
  const ready = useStore((s) => s.ready);
  const meId = useStore((s) => s.meId);
  const [view, setView] = useState<View>('tag');

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
  if (!meId) return <JoinGate />;

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

        <nav className="flex rounded-lg bg-slate-100 p-1">
          <ViewTab active={view === 'tag'} onClick={() => setView('tag')}>
            1 · Tag attractions
          </ViewTab>
          <ViewTab active={view === 'schedule'} onClick={() => setView('schedule')}>
            2 · Schedule your days
          </ViewTab>
        </nav>
      </div>

      {view === 'tag' ? <TagView /> : <ScheduleView />}

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
