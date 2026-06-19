import { EVENT_LABELS, PARKS } from '../data';
import { useActiveDay, useStore } from '../store/useStore';
import { DayMealsCard } from './DayMealsCard';
import { DayReservationsCard } from './DayReservationsCard';
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
  const setDayDate = useStore((s) => s.setDayDate);
  const isOther = day.kind === 'other';

  return (
    <div className="space-y-4">
      <DayTabs />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-sm">
        <div>
          <h2 className="text-lg font-bold">{isOther ? day.name : PARKS[day.park].name}</h2>
          <p className="text-xs text-slate-500">
            {isOther ? 'Off-park day · light schedule' : `${day.name} · ${EVENT_LABELS[day.event]}`}
          </p>
        </div>
        <label className="text-xs text-slate-500">
          Date
          <input
            type="date"
            value={day.date ?? ''}
            onChange={(e) => setDayDate(day.id, e.target.value || undefined)}
            className="mt-0.5 block rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
      </div>

      {isOther ? (
        // Off-park days are lightly scheduled: just a clock + free-form blocks.
        <div className="mx-auto max-w-xl space-y-4">
          <DayReservationsCard date={day.date} />
          <DayMealsCard date={day.date} />
          <EstimatorControls light />
          <PlanBuilder />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <main className="order-2 space-y-4 lg:order-1">
            <SuggestNext />
            <TodoList />
          </main>
          <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-4 lg:self-start">
            <DayReservationsCard date={day.date} />
            <DayMealsCard date={day.date} />
            <EstimatorControls />
            <PlanBuilder />
          </aside>
        </div>
      )}
    </div>
  );
}
