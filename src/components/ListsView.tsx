import { useState } from 'react';
import type { Collaborator } from '../lib/types';
import { useStore } from '../store/useStore';

/** Two collaborative lists: a personal checklist and a group sign-up sheet. */
export function ListsView() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PersonalList />
      <GroupList />
    </div>
  );
}

function AddRow({ onAdd, placeholder }: { onAdd: (t: string) => void; placeholder: string }) {
  const [text, setText] = useState('');
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(text);
        setText('');
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
      >
        Add
      </button>
    </form>
  );
}

function addedByName(id: string | undefined, collaborators: Collaborator[]): string | null {
  if (!id) return null;
  return collaborators.find((c) => c.id === id)?.name ?? null;
}

function PersonalList() {
  const items = useStore((s) => s.doc.personalItems);
  const collaborators = useStore((s) => s.doc.collaborators);
  const myChecks = useStore((s) => (s.meId ? s.doc.personalChecks[s.meId] : undefined));
  const toggleChecked = useStore((s) => s.toggleChecked);
  const addPersonalItem = useStore((s) => s.addPersonalItem);
  const removePersonalItem = useStore((s) => s.removePersonalItem);

  const checked = new Set(myChecks ?? []);
  const doneCount = items.filter((i) => checked.has(i.id)).length;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">My checklist</h2>
        <p className="text-xs text-slate-500">
          Shared suggestions — anyone can add for everyone, and your checkmarks are
          your own (synced across your devices). {doneCount}/{items.length} done.
        </p>
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => {
          const isChecked = checked.has(item.id);
          const who = addedByName(item.addedBy, collaborators);
          return (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleChecked(item.id)}
                className="h-4 w-4 shrink-0 accent-emerald-600"
              />
              <span className={`min-w-0 flex-1 text-sm ${isChecked ? 'text-slate-400 line-through' : ''}`}>
                {item.text}
                {who && (
                  <span className="ml-1 text-[11px] text-slate-300">Added by: {who}</span>
                )}
              </span>
              <button
                onClick={() => removePersonalItem(item.id)}
                className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                title="Remove for everyone"
              >
                ✕
              </button>
            </li>
          );
        })}
        {items.length === 0 && <Empty>No items yet — add your first.</Empty>}
      </ul>

      <AddRow onAdd={addPersonalItem} placeholder="Add a personal item (shared as a suggestion)…" />
    </section>
  );
}

function GroupList() {
  const items = useStore((s) => s.doc.groupItems);
  const collaborators = useStore((s) => s.doc.collaborators);
  const meId = useStore((s) => s.meId);
  const toggleSignup = useStore((s) => s.toggleSignup);
  const addGroupItem = useStore((s) => s.addGroupItem);
  const removeGroupItem = useStore((s) => s.removeGroupItem);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Group sign-up</h2>
        <p className="text-xs text-slate-500">
          Shared tasks — sign up for what you'll handle. Anyone can add items.
        </p>
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => {
          const signed = meId ? item.signups.includes(meId) : false;
          const who = addedByName(item.addedBy, collaborators);
          const signups = item.signups
            .map((id) => collaborators.find((c) => c.id === id))
            .filter((c): c is Collaborator => !!c);
          return (
            <li
              key={item.id}
              className="space-y-1.5 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-sm">
                  {item.text}
                  {who && (
                  <span className="ml-1 text-[11px] text-slate-300">Added by: {who}</span>
                )}
                </span>
                <button
                  onClick={() => toggleSignup(item.id)}
                  className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${
                    signed
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {signed ? '✓ Signed up' : 'Sign up'}
                </button>
                <button
                  onClick={() => removeGroupItem(item.id)}
                  className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
              {signups.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {signups.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px]"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {items.length === 0 && <Empty>No group tasks yet — add one.</Empty>}
      </ul>

      <AddRow onAdd={addGroupItem} placeholder="Add a group task to sign up for…" />
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
      {children}
    </li>
  );
}
