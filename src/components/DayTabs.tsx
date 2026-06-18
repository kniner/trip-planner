import { useState } from 'react';
import { EVENT_SHORT, PARK_IDS, PARKS } from '../data';
import { formatShortDate } from '../lib/dates';
import type { EventType, ParkId } from '../lib/types';
import { useStore } from '../store/useStore';

const EVENTS: { value: EventType; label: string }[] = [
  { value: 'regular', label: 'Regular day' },
  { value: 'mnsshp', label: "Mickey's Not-So-Scary Halloween Party" },
  { value: 'food-and-wine', label: 'Food & Wine Festival' },
];

/** Which events make sense for which park. */
function eventsForPark(park: ParkId): { value: EventType; label: string }[] {
  if (park === 'mk') return EVENTS.filter((e) => e.value !== 'food-and-wine');
  if (park === 'epcot') return EVENTS.filter((e) => e.value !== 'mnsshp');
  return EVENTS.filter((e) => e.value === 'regular'); // legoland & others: regular only
}

/** Short badge label per park. */
const PARK_BADGE: Record<ParkId, string> = {
  mk: 'MK',
  epcot: 'EPCOT',
  legoland: 'LEGOLAND',
};

const EVENT_BADGE: Record<EventType, string> = {
  regular: 'bg-slate-100 text-slate-500',
  mnsshp: 'bg-purple-100 text-purple-700',
  'food-and-wine': 'bg-amber-100 text-amber-700',
};

export function DayTabs() {
  const doc = useStore((s) => s.doc);
  const setActiveDay = useStore((s) => s.setActiveDay);
  const addDay = useStore((s) => s.addDay);
  const addOtherDay = useStore((s) => s.addOtherDay);
  const removeDay = useStore((s) => s.removeDay);
  const renameDay = useStore((s) => s.renameDay);

  const [adding, setAdding] = useState(false);
  const [dayKind, setDayKind] = useState<'park' | 'other'>('park');
  const [park, setPark] = useState<ParkId>('epcot');
  const [event, setEvent] = useState<EventType>('regular');
  const [otherName, setOtherName] = useState('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const validEvents = eventsForPark(park);
  const effectiveEvent = validEvents.some((e) => e.value === event)
    ? event
    : validEvents[0].value;

  // Show days in calendar order: dated days ascending, undated days kept last
  // in their original order (sort is stable). ISO dates compare chronologically.
  const orderedDays = [...doc.days].sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  return (
    <div className="rounded-lg bg-white p-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {orderedDays.map((day) => {
          const active = day.id === doc.activeDayId;
          const isEditing = editingId === day.id;
          return (
            <div
              key={day.id}
              className={`group flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${
                active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
              }`}
            >
              {isEditing ? (
                <input
                  autoFocus
                  defaultValue={day.name}
                  onBlur={(e) => {
                    renameDay(day.id, e.target.value);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="w-36 rounded bg-white px-1 text-sm text-slate-900"
                />
              ) : (
                <button
                  onClick={() => setActiveDay(day.id)}
                  onDoubleClick={() => setEditingId(day.id)}
                  className="text-sm font-semibold"
                  title="Double-click to rename"
                >
                  {day.name}
                </button>
              )}
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  active
                    ? 'bg-white/20 text-white'
                    : day.kind === 'other'
                      ? 'bg-teal-100 text-teal-700'
                      : EVENT_BADGE[day.event]
                }`}
              >
                {day.kind === 'other'
                  ? 'Off-park'
                  : `${PARK_BADGE[day.park]} · ${EVENT_SHORT[day.event]}`}
              </span>
              {day.date && (
                <span className={`text-[10px] ${active ? 'text-white/70' : 'text-slate-400'}`}>
                  {formatShortDate(day.date)}
                </span>
              )}
              {doc.days.length > 1 && (
                <button
                  onClick={() => removeDay(day.id)}
                  className={`text-xs ${active ? 'text-white/60 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}
                  title="Delete day"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            + Add day
          </button>
        )}
      </div>

      {adding && (
        <form
          className="mt-2 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (dayKind === 'other') {
              addOtherDay(otherName, date || undefined);
              setOtherName('');
            } else {
              addDay(park, effectiveEvent, undefined, date || undefined);
            }
            setDate('');
            setAdding(false);
          }}
        >
          <label className="text-xs text-slate-500">
            Kind
            <select
              value={dayKind}
              onChange={(e) => setDayKind(e.target.value as 'park' | 'other')}
              className="mt-0.5 block rounded border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="park">At a park</option>
              <option value="other">Off-park (travel, rest, resort…)</option>
            </select>
          </label>

          {dayKind === 'park' ? (
            <>
              <label className="text-xs text-slate-500">
                Park
                <select
                  value={park}
                  onChange={(e) => setPark(e.target.value as ParkId)}
                  className="mt-0.5 block rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  {PARK_IDS.map((p) => (
                    <option key={p} value={p}>
                      {PARKS[p].name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Day type
                <select
                  value={effectiveEvent}
                  onChange={(e) => setEvent(e.target.value as EventType)}
                  className="mt-0.5 block rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  {validEvents.map((ev) => (
                    <option key={ev.value} value={ev.value}>
                      {ev.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="text-xs text-slate-500">
              Name
              <input
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                placeholder="e.g. Travel day, Resort day"
                className="mt-0.5 block w-48 rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          )}

          <label className="text-xs text-slate-500">
            Date <span className="text-slate-400">(optional)</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-0.5 block rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="px-2 py-1.5 text-sm text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
