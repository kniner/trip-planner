import { useMemo, useState } from 'react';
import { formatShortDate } from '../lib/dates';
import type { Collaborator, Expense, InfoCategory } from '../lib/types';
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

export function TripView() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <InfoHub />
        <DiningList />
      </div>
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
                  <p className="break-words text-sm font-semibold">{it.value}</p>
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
            placeholder="Value (number, address, phone…)"
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
  const removeDining = useStore((s) => s.removeDining);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const sorted = useMemo(
    () => [...dining].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [dining],
  );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Dining reservations</h2>
        <p className="text-xs text-slate-500">
          Log your ADRs — they show up on the matching day in the Schedule too.
        </p>
      </div>

      <ul className="space-y-1.5">
        {sorted.map((r) => (
          <li
            key={r.id}
            className="flex items-start gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{r.name}</p>
              <p className="text-xs text-slate-500">
                {formatShortDate(r.date) ?? r.date} · {r.time}
                {r.partySize ? ` · party of ${r.partySize}` : ''}
                {r.confirmation ? ` · #${r.confirmation}` : ''}
              </p>
            </div>
            <button
              onClick={() => removeDining(r.id)}
              className="shrink-0 text-xs text-slate-300 hover:text-red-500"
              title="Remove"
            >
              ✕
            </button>
          </li>
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
          });
          setName('');
          setDate('');
          setTime('');
          setPartySize('');
          setConfirmation('');
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

/* -------------------------------- Budget -------------------------------- */

interface Balance {
  collaborator: Collaborator;
  paid: number;
  net: number; // paid - share; positive = owed money, negative = owes
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

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const share = collaborators.length > 0 ? total / collaborators.length : 0;

  const balances = useMemo<Balance[]>(
    () =>
      collaborators.map((c) => {
        const paid = expenses.filter((e) => e.paidBy === c.id).reduce((s, e) => s + e.amount, 0);
        return { collaborator: c, paid, net: paid - share };
      }),
    [collaborators, expenses, share],
  );

  const settlements = useMemo(() => settleUp(balances), [balances]);
  const nameOf = (id?: string) => collaborators.find((c) => c.id === id)?.name ?? 'Someone';

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Group budget</h2>
        <p className="text-xs text-slate-500">
          Shared costs split equally among the {collaborators.length} people in the
          app. Add what you paid; see who owes whom.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-4 text-white">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Total spent</p>
          <p className="text-lg font-bold">{money(total)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Per person</p>
          <p className="text-lg font-bold">{money(share)}</p>
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
                  <span className="text-[11px] text-slate-400">paid {money(b.paid)}</span>
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
        {expenses.map((e: Expense) => (
          <li
            key={e.id}
            className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{e.label}</p>
              <p className="text-[11px] text-slate-500">paid by {nameOf(e.paidBy)}</p>
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
        ))}
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
          addExpense({ label, amount: Number(amount), paidBy: paidBy || undefined });
          setLabel('');
          setAmount('');
        }}
      >
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What was it? (e.g. Groceries, gas, tickets)"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$ amount"
            className="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
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
          <button
            type="submit"
            disabled={!label.trim() || !(Number(amount) > 0)}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </form>
    </section>
  );
}
