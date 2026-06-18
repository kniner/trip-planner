import { EVENT_LABELS, PARKS } from '../data';
import { useActiveDay } from '../store/useStore';
import { DayTabs } from './DayTabs';
import { EstimatorControls } from './EstimatorControls';
import { PlanBuilder } from './PlanBuilder';
import { SuggestNext } from './SuggestNext';
import { TodoList } from './TodoList';

/**
 * The scheduling page: pick a day (tab), pull tagged picks from the to-do list
 * into that day's route, and watch the time/walking estimate update.
 */
export function ScheduleView() {
  const day = useActiveDay();

  return (
    <div className="space-y-4">
      <DayTabs />

      <div className="rounded-lg bg-white p-3 shadow-sm">
        <h2 className="text-lg font-bold">{PARKS[day.park].name}</h2>
        <p className="text-xs text-slate-500">
          {day.name} · {EVENT_LABELS[day.event]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <main className="order-2 space-y-4 lg:order-1">
          <SuggestNext />
          <TodoList />
        </main>
        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          <EstimatorControls />
          <PlanBuilder />
        </aside>
      </div>
    </div>
  );
}
