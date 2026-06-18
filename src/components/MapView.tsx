import { EVENT_LABELS, PARKS } from '../data';
import { useActiveDay } from '../store/useStore';
import { DayTabs } from './DayTabs';
import { ParkMap } from './ParkMap';

/** Dedicated map page: pick a day (sets the park) and explore the map. */
export function MapView() {
  const day = useActiveDay();

  return (
    <div className="space-y-4">
      <DayTabs />
      <div className="rounded-lg bg-white p-3 shadow-sm">
        <h2 className="text-lg font-bold">{PARKS[day.park].name} map</h2>
        <p className="text-xs text-slate-500">
          {day.name} · {EVENT_LABELS[day.event]}
        </p>
      </div>
      <ParkMap />
    </div>
  );
}
