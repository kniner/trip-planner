import { useState } from 'react';
import { WARNING_KEY } from '../data/rideInfo';

const ICON: Record<string, string> = {
  heightMin: '📏',
  pregnancy: '🤰',
  motion: '🌀',
  bigTall: '📐',
};

/** Collapsible legend explaining the ride-safety badges on cards. */
export function RideKey() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg bg-white p-2 text-xs shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between font-semibold text-slate-600"
      >
        <span>Ride safety key</span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {WARNING_KEY.map((w) => (
            <li key={w.field} className="flex items-center gap-2 text-slate-600">
              <span className="w-5 text-center">{ICON[w.field]}</span>
              <span>{w.label}</span>
            </li>
          ))}
          <li className="flex items-center gap-2 text-emerald-700">
            <span className="w-5 text-center">🟢</span>
            <span>“GF available” = gluten-free options at that food/dining spot</span>
          </li>
          <li className="pt-1 text-[10px] text-slate-400">
            Planning reference only — always follow posted signage and ask cast members.
          </li>
        </ul>
      )}
    </div>
  );
}
