import { useMemo, useState } from 'react';
import { formatShortDate } from '../lib/dates';
import type { Collaborator, DiningReservation, Expense, InfoCategory } from '../lib/types';
import { useStore } from '../store/useStore';

const INFO_CATEGORIES: { value: InfoCategory; label: string }[] = [
  { value: 'lodging', label: '🏨 Lodging' },
  { value: 'tickets', label: '🎟️ Tickets' },
  { value: 'dining', label: '🍽️ Dining' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'contact', label: '📞 Contact' },
  { value: 'other', label: '📋 Other' },
];
function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Render a trip-info value: links and phone numbers become tappable. */
function InfoValue({ value }: { value: string }) {
  const v = value.trim();
  const isUrl = /^(https?:\/\/|www\.)/i.test(v);
  const isPhone = /^[+(]?[\d][\d\s().-]{6,}$/.test(v);
  const cls = 'break-words text-sm font-semibold';
  if (isUrl) {
    const href = v.startsWith('http') ? v : `https://${v}`;
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${cls} text-indigo-600 underline`}>
        {v}
      </a>
    );
  }
  if (isPhone) {
    return (
      <a href={`tel:${v.replace(/[^\d+]/g, '')}`} className={`${cls} text-indigo-600 underline`}>
        {v}
      </a>
    );
  }
  return <p className={cls}>{v}</p>;
}

export function TripView() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <InfoHub />
      <DiningList />
    </div>
  );
}

export function FinancesView() {
  return (
    <div className="mx-auto max-w-2xl">
      <Budget />
    </div>
  );
}

/* ------------------------------- Info hub ------------------------------- */

function InfoHub() {
  const tripInfo = useStore((s) => s.doc.tripInfo);
  const addInfoItem = useStore((s) => s.addInfoItem);
  const removeInfoItem = useStore((s) => s.removeInfoItem);

  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<InfoCategory>('lodging');

  const groups = useMemo(() => {
    const map = new Map<InfoCategory, typeof tripInfo>();
    for (const it of tripInfo) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return INFO_CATEGORIES.map((c) => ({ ...c, items: map.get(c.value) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [tripInfo]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Trip info</h2>
        <p className="text-xs text-slate-500">
          Confirmation numbers, addresses and contacts — shared with everyone, so
          no one's digging through email.
        </p>
      </div>

      {groups.map((g) => (
        <div key={g.value}>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{g.label}</h3>
          <ul className="space-y-1.5">
            {g.items.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">{it.label}</p>
                  <InfoValue value={it.value} />
                </div>
                <button
                  onClick={() => removeInfoItem(it.id)}
                  className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                  title="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {tripInfo.length === 0 && (
        <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
          Nothing yet — add your hotel confirmation, park ticket number, addresses…
        </p>
      )}

      <form
        className="space-y-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100"
        onSubmit={(e) => {
          e.preventDefault();
          addInfoItem(label, value, category);
          setLabel('');
          setValue('');
        }}
      >
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as InfoCategory)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            {INFO_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Hotel confirmation)"
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value (link, number, address, phone…)"
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={!label.trim() || !value.trim()}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </form>
    </section>
  );
}

/* --------------------------- Dining reservations ------------------------ */

function DiningList() {
  const dining = useStore((s) => s.doc.dining);
  const addDining = useStore((s) => s.addDining);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [cost, setCost] = useState('');

  const sorted = useMemo(
    () => [...dining].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [dining],
  );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Dining reservations</h2>
        <p className="text-xs text-slate-500">
          Log your ADRs — they show up on the matching day in the Schedule too. Add a
          cost to split it with the group now or later.
        </p>
      </div>

      <ul className="space-y-1.5">
        {sorted.map((r) => (
          <ReservationRow key={r.id} reservation={r} />
        ))}
        {dining.length === 0 && (
          <li className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
            No reservations yet.
          </li>
        )}
      </ul>

      <form
        className="space-y-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100"
        onSubmit={(e) => {
          e.preventDefault();
          addDining({
            name,
            date,
            time,
            partySize: partySize ? Number(partySize) : undefined,
            confirmation: confirmation.trim() || undefined,
            cost: Number(cost) > 0 ? Number(cost) : undefined,
          });
          setName('');
          setDate('');
          setTime('');
          setPartySize('');
          setConfirmation('');
          setCost('');
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Restaurant (e.g. 'Ohana)"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            placeholder="party"
            className="w-20 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Confirmation # (optional)"
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="$ cost"
            className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={!name.trim() || !date || !time}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </form>
    </section>
  );
}

/**
 * A single dining reservation. Shows its cost and split status, and lets the
 * owner "request a split" — pushing the cost to the group budget split among the
 * chosen people. Defaults to "split later" (cost recorded, not yet in budget).
 */
function ReservationRow({ reservation: r }: { reservation: DiningReservation }) {
  const collaborators = useStore((s) => s.doc.collaborators);
  const expenses = useStore((s) => s.doc.expenses);
  const removeDining = useStore((s) => s.removeDining);
  const splitDiningCost = useStore((s) => s.splitDiningCost);
  const unlinkDiningCost = useStore((s) => s.unlinkDiningCost);

  const linked = r.expenseId ? expenses.find((e) => e.id === r.expenseId) : undefined;
  const hasCost = !!r.cost && r.cost > 0;

  const [open, setOpen] = useState(false);
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSplitAmong((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const perPerson = hasCost ? r.cost! / (splitAmong.length || 1) : 0;

  return (
    <li className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{r.name}</p>
          <p className="text-xs text-slate-500">
            {formatShortDate(r.date) ?? r.date} · {r.time}
            {r.partySize ? ` · party of ${r.partySize}` : ''}
            {r.confirmation ? ` · #${r.confirmation}` : ''}
          </p>
          {hasCost && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-semibold text-slate-700">{money(r.cost!)}</span>
              {linked ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                  ✓ Split in budget
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                  Split later
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => removeDining(r.id)}
          className="shrink-0 text-xs text-slate-300 hover:text-red-500"
          title="Remove"
        >
          ✕
        </button>
      </div>

      {hasCost && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          {linked ? (
            <button
              onClick={() => unlinkDiningCost(r.id)}
              className="text-[11px] font-medium text-slate-500 hover:text-rose-600"
            >
              Undo split (remove from budget)
            </button>
          ) : collaborators.length === 0 ? (
            <p className="text-[11px] text-slate-400">Add people to the group to split this.</p>
          ) : !open ? (
            <button
              onClick={() => {
                setOpen(true);
                setSplitAmong(collaborators.map((c) => c.id));
              }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Request split →
            </button>
          ) : (
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
                  onClick={() => {
                    splitDiningCost(r.id, { paidBy: paidBy || undefined, splitAmong });
                    setOpen(false);
                  }}
                  disabled={splitAmong.length === 0}
                  className="rounded bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
                >
                  Add split to budget
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/* -------------------------------- Budget -------------------------------- */

interface Balance {
  collaborator: Collaborator;
  paid: number;
  owed: number;
  net: number; // paid - owed; positive = owed money, negative = owes
}

/** Greedy settle-up: who pays whom to zero everyone out. */
function settleUp(balances: Balance[]): { from: string; to: string; amount: number }[] {
  const debtors = balances.filter((b) => b.net < -0.01).map((b) => ({ name: b.collaborator.name, amt: -b.net }));
  const creditors = balances.filter((b) => b.net > 0.01).map((b) => ({ name: b.collaborator.name, amt: b.net }));
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    out.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.01) i += 1;
    if (creditors[j].amt < 0.01) j += 1;
  }
  return out;
}

function Budget() {
  const expenses = useStore((s) => s.doc.expenses);
  const collaborators = useStore((s) => s.doc.collaborators);
  const addExpense = useStore((s) => s.addExpense);
  const removeExpense = useStore((s) => s.removeExpense);

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [mode, setMode] = useState<'even' | 'custom' | 'percent'>('even');
  // Empty set = "everyone". Otherwise only these collaborators split the cost.
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  // Custom mode: per-collaborator dollar inputs (id -> string).
  const [shares, setShares] = useState<Record<string, string>>({});
  // Percent mode: per-collaborator percentage inputs (id -> string).
  const [percents, setPercents] = useState<Record<string, string>>({});

  const allIds = useMemo(() => collaborators.map((c) => c.id), [collaborators]);
  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  /** Who actually shares an expense (falls back to everyone). */
  const participantsOf = (e: Expense): string[] => {
    if (e.shares) return Object.keys(e.shares).filter((id) => allIds.includes(id));
    const chosen = (e.splitAmong ?? []).filter((id) => allIds.includes(id));
    return chosen.length > 0 ? chosen : allIds;
  };

  /** What one person owes for an expense (custom amount, else even share). */
  const owedBy = (e: Expense, id: string): number => {
    if (e.shares) return e.shares[id] ?? 0;
    const p = participantsOf(e);
    return p.includes(id) ? e.amount / p.length : 0;
  };

  const balances = useMemo<Balance[]>(
    () =>
      collaborators.map((c) => {
        const paid = expenses.filter((e) => e.paidBy === c.id).reduce((s, e) => s + e.amount, 0);
        const owed = expenses.reduce((s, e) => s + owedBy(e, c.id), 0);
        return { collaborator: c, paid, owed, net: paid - owed };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collaborators, expenses, allIds],
  );

  const settlements = useMemo(() => settleUp(balances), [balances]);
  const nameOf = (id?: string) => collaborators.find((c) => c.id === id)?.name ?? 'Someone';
  const toggleSplit = (id: string) =>
    setSplitAmong((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const customTotal = Object.values(shares).reduce((s, v) => s + (Number(v) || 0), 0);
  const percentTotal = Object.values(percents).reduce((s, v) => s + (Number(v) || 0), 0);
  const canSubmit =
    label.trim().length > 0 &&
    (mode === 'custom'
      ? customTotal > 0
      : mode === 'percent'
        ? Number(amount) > 0 && percentTotal > 0
        : Number(amount) > 0);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Group budget</h2>
        <p className="text-xs text-slate-500">
          Add what you paid and pick who shares each cost (default: everyone).
          Balances and settle-up update automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-4 text-white">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Total spent</p>
          <p className="text-lg font-bold">{money(total)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Expenses</p>
          <p className="text-lg font-bold">{expenses.length}</p>
        </div>
      </div>

      {collaborators.length > 0 && (
        <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Balances</h3>
          <ul className="space-y-1">
            {balances.map((b) => (
              <li key={b.collaborator.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.collaborator.color }} />
                  {b.collaborator.name}
                  <span className="text-[11px] text-slate-400">
                    paid {money(b.paid)} · share {money(b.owed)}
                  </span>
                </span>
                <span
                  className={`font-semibold ${
                    b.net > 0.01 ? 'text-emerald-600' : b.net < -0.01 ? 'text-rose-600' : 'text-slate-400'
                  }`}
                >
                  {b.net > 0.01
                    ? `gets back ${money(b.net)}`
                    : b.net < -0.01
                      ? `owes ${money(-b.net)}`
                      : 'even'}
                </span>
              </li>
            ))}
          </ul>
          {settlements.length > 0 && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Settle up</h3>
              <ul className="space-y-0.5 text-[13px] text-slate-600">
                {settlements.map((s, i) => (
                  <li key={i}>
                    <strong>{s.from}</strong> → <strong>{s.to}</strong>: {money(s.amount)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ul className="space-y-1.5">
        {expenses.map((e: Expense) => {
          const p = participantsOf(e);
          const splitLabel = e.shares
            ? `custom — ${p.map((id) => `${nameOf(id)} ${money(e.shares![id] ?? 0)}`).join(', ')}`
            : p.length === allIds.length
              ? `split evenly — everyone`
              : `split evenly — ${p.map((id) => nameOf(id)).join(', ')}`;
          return (
            <li
              key={e.id}
              className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{e.label}</p>
                <p className="text-[11px] text-slate-500">
                  paid by {nameOf(e.paidBy)} · {splitLabel}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">{money(e.amount)}</span>
              <button
                onClick={() => removeExpense(e.id)}
                className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                title="Remove"
              >
                ✕
              </button>
            </li>
          );
        })}
        {expenses.length === 0 && (
          <li className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
            No expenses logged yet.
          </li>
        )}
      </ul>

      <form
        className="space-y-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100"
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === 'custom') {
            const map: Record<string, number> = {};
            for (const c of collaborators) {
              const v = Number(shares[c.id]);
              if (v > 0) map[c.id] = Math.round(v * 100) / 100;
            }
            const sum = Object.values(map).reduce((s, v) => s + v, 0);
            if (sum <= 0) return;
            addExpense({ label, amount: sum, paidBy: paidBy || undefined, shares: map });
          } else if (mode === 'percent') {
            const tot = Number(amount);
            const pctSum = collaborators.reduce((s, c) => s + (Number(percents[c.id]) || 0), 0);
            if (!(tot > 0) || pctSum <= 0) return;
            const map: Record<string, number> = {};
            for (const c of collaborators) {
              const pct = Number(percents[c.id]) || 0;
              // Normalize by the entered total so shares always sum to `amount`,
              // even if the percentages don't add to exactly 100.
              if (pct > 0) map[c.id] = Math.round(((tot * pct) / pctSum) * 100) / 100;
            }
            const sum = Object.values(map).reduce((s, v) => s + v, 0);
            if (sum <= 0) return;
            addExpense({ label, amount: sum, paidBy: paidBy || undefined, shares: map });
          } else {
            addExpense({
              label,
              amount: Number(amount),
              paidBy: paidBy || undefined,
              // Only store a subset; full selection (or none) means "everyone".
              splitAmong:
                splitAmong.length > 0 && splitAmong.length < allIds.length ? splitAmong : undefined,
            });
          }
          setLabel('');
          setAmount('');
          setSplitAmong([]);
          setShares({});
          setPercents({});
        }}
      >
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What was it? (e.g. Groceries, gas, tickets)"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {mode !== 'custom' && (
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="$ total"
              className="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          )}
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Paid by…</option>
            {collaborators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
          {(['even', 'custom', 'percent'] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md px-2 py-1 font-semibold ${
                mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {m === 'even' ? 'Evenly' : m === 'custom' ? 'Amounts' : 'Percent'}
            </button>
          ))}
        </div>

        {collaborators.length > 0 && mode === 'even' && (
          <div>
            <p className="mb-1 text-[11px] text-slate-500">
              Split between{' '}
              {splitAmong.length === 0 ? <span className="font-medium">everyone</span> : `${splitAmong.length} selected`}:
            </p>
            <div className="flex flex-wrap gap-1">
              {collaborators.map((c) => {
                const on = splitAmong.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleSplit(c.id)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
              {splitAmong.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSplitAmong([])}
                  className="rounded-full px-2 py-0.5 text-[11px] text-slate-400 underline"
                >
                  reset to everyone
                </button>
              )}
            </div>
          </div>
        )}

        {collaborators.length > 0 && mode === 'custom' && (
          <div className="space-y-1">
            <p className="text-[11px] text-slate-500">
              Enter each person's share (leave blank for $0). Total:{' '}
              <span className="font-semibold text-slate-700">{money(customTotal)}</span>
            </p>
            {collaborators.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="text-xs text-slate-400">$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={shares[c.id] ?? ''}
                  onChange={(e) => setShares((p) => ({ ...p, [c.id]: e.target.value }))}
                  placeholder="0.00"
                  className="w-24 rounded border border-slate-300 px-2 py-1 text-right text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {collaborators.length > 0 && mode === 'percent' && (
          <div className="space-y-1">
            <p className="text-[11px] text-slate-500">
              Enter each person's percentage. Percentages total:{' '}
              <span
                className={`font-semibold ${
                  Math.abs(percentTotal - 100) < 0.01 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {percentTotal}%
              </span>
              {Math.abs(percentTotal - 100) >= 0.01 && ' (will be normalized to the total)'}
            </p>
            {collaborators.map((c) => {
              const pct = Number(percents[c.id]) || 0;
              const dollars = percentTotal > 0 ? (Number(amount) || 0) * (pct / percentTotal) : 0;
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  {pct > 0 && <span className="text-[11px] text-slate-400">{money(dollars)}</span>}
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={percents[c.id] ?? ''}
                    onChange={(e) => setPercents((p) => ({ ...p, [c.id]: e.target.value }))}
                    placeholder="0"
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add expense
        </button>
      </form>
    </section>
  );
}
