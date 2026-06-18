import { useEffect } from 'react';
import { AttractionList } from './components/AttractionList';
import { DayTabs } from './components/DayTabs';
import { EstimatorControls } from './components/EstimatorControls';
import { PlanBuilder } from './components/PlanBuilder';
import { UserBar } from './components/UserBar';
import { useStore } from './store/useStore';

export default function App() {
  const init = useStore((s) => s.init);
  const ready = useStore((s) => s.ready);

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

  return (
    <div className="mx-auto max-w-7xl p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">
          ✨ Walt Disney World Planner
        </h1>
        <p className="text-sm text-slate-500">
          Plan every day across Magic Kingdom & EPCOT — tag rides, build routes,
          and estimate your time, together.
        </p>
      </header>

      <div className="mb-4 space-y-3">
        <UserBar />
        <DayTabs />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <main className="order-2 lg:order-1">
          <AttractionList />
        </main>

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          <EstimatorControls />
          <PlanBuilder />
        </aside>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        Wait times are planning estimates; character dining assumes a 90-minute
        seating. Live data via queue-times.com when available. Plans sync across
        browser tabs on this device; swap the sync provider for cross-device
        collaboration.
      </footer>
    </div>
  );
}
