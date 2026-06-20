import { useState } from 'react';
import { useStore } from '../store/useStore';

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

interface Props {
  /** Amount being split, used to preview the per-person share. */
  total: number;
  initialPaidBy?: string;
  /** Pre-selected sharers; empty/undefined defaults to everyone. */
  initialSplitAmong?: string[];
  submitLabel: string;
  onSubmit: (opts: { paidBy?: string; splitAmong: string[] }) => void;
  onCancel: () => void;
}

/**
 * Compact even-split editor shared by dining reservations and budget expenses:
 * choose who paid and who shares the cost. Reports the chosen payer + sharers;
 * callers decide how to persist (a subset, or empty for "everyone").
 */
export function SplitPicker({
  total,
  initialPaidBy,
  initialSplitAmong,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const collaborators = useStore((s) => s.doc.collaborators);
  const [paidBy, setPaidBy] = useState(initialPaidBy ?? '');
  const [splitAmong, setSplitAmong] = useState<string[]>(
    initialSplitAmong && initialSplitAmong.length > 0
      ? initialSplitAmong
      : collaborators.map((c) => c.id),
  );

  const toggle = (id: string) =>
    setSplitAmong((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const perPerson = total / (splitAmong.length || 1);

  return (
    <div className="space-y-2">
      <label className="block text-[11px] text-slate-500">
        Paid by
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="mt-0.5 block rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="">— who paid —</option>
          {collaborators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div>
        <p className="mb-1 text-[11px] text-slate-500">
          Split among{splitAmong.length ? ` · ${money(perPerson)} each` : ''}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {collaborators.map((c) => {
            const on = splitAmong.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={
                  on
                    ? { background: c.color, color: 'white', borderColor: c.color }
                    : { color: c.color, borderColor: '#cbd5e1' }
                }
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSubmit({ paidBy: paidBy || undefined, splitAmong })}
          disabled={splitAmong.length === 0}
          className="rounded bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
