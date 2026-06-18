import { useState } from 'react';
import type { ChecklistItem, Collaborator, GroupItem } from '../lib/types';
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

function AddRow({
  onAdd,
  placeholder,
  withPrivacy,
}: {
  onAdd: (t: string, isPrivate?: boolean) => void;
  placeholder: string;
  /** When set, shows a "Share with everyone" toggle (items are private by default). */
  withPrivacy?: boolean;
}) {
  const [text, setText] = useState('');
  // Items are private to the adder by default; checking shares with everyone.
  const [isShared, setIsShared] = useState(false);
  return (
    <form
      className="space-y-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(text, withPrivacy ? !isShared : undefined);
        setText('');
      }}
    >
      <div className="flex gap-2">
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
      </div>
      {withPrivacy && (
        <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <input
            type="checkbox"
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            className="h-3.5 w-3.5 accent-emerald-600"
          />
          {isShared ? (
            <span className="font-medium text-emerald-600">
              Share with everyone
            </span>
          ) : (
            <span>
              Private <span className="text-slate-400">(default) — check to share with everyone</span>
            </span>
          )}
        </label>
      )}
    </form>
  );
}

function addedByName(id: string | undefined, collaborators: Collaborator[]): string | null {
  if (!id) return null;
  return collaborators.find((c) => c.id === id)?.name ?? null;
}

/**
 * A small inline "+ note" trigger, meant to live in an item's main row so a
 * blank note never takes up its own line. Editing state lives in the parent.
 */
function NoteAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 text-[11px] text-slate-400 active:text-slate-600"
    >
      + note
    </button>
  );
}

/**
 * The below-row note area: the editor while editing, otherwise the note
 * preview. Renders nothing when there's no note and we're not editing — so a
 * blank note adds no extra line.
 */
function NoteBody({
  note,
  editing,
  setEditing,
  onSave,
}: {
  note?: string;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onSave: (n: string) => void;
}) {
  const [draft, setDraft] = useState(note ?? '');

  if (editing) {
    return (
      <form
        className="flex gap-1 pl-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
          setEditing(false);
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note…"
          className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]"
        />
        <button type="submit" className="shrink-0 rounded bg-slate-700 px-2 py-1 text-[11px] font-medium text-white">
          Save
        </button>
      </form>
    );
  }

  if (note) {
    return (
      <button
        onClick={() => {
          setDraft(note);
          setEditing(true);
        }}
        className="block w-full whitespace-pre-wrap pl-6 text-left text-[11px] italic leading-snug text-slate-500 active:text-slate-700"
        title="Edit note"
      >
        {note}
      </button>
    );
  }

  return null;
}

function PersonalList() {
  const allItems = useStore((s) => s.doc.personalItems);
  const meId = useStore((s) => s.meId);
  const collaborators = useStore((s) => s.doc.collaborators);
  const myChecks = useStore((s) => (s.meId ? s.doc.personalChecks[s.meId] : undefined));
  const toggleChecked = useStore((s) => s.toggleChecked);
  const addPersonalItem = useStore((s) => s.addPersonalItem);
  const removePersonalItem = useStore((s) => s.removePersonalItem);
  const setPersonalItemNote = useStore((s) => s.setPersonalItemNote);

  // Private items only show for the person who added them; shared items show
  // for everyone.
  const items = allItems.filter((i) => !i.private || i.addedBy === meId);
  const checked = new Set(myChecks ?? []);
  const doneCount = items.filter((i) => checked.has(i.id)).length;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">My checklist</h2>
        <p className="text-xs text-slate-500">
          Add shared suggestions (everyone sees them) or private items (just you).
          Your checkmarks are your own, synced across your devices.{' '}
          {doneCount}/{items.length} done.
        </p>
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <PersonalRow
            key={item.id}
            item={item}
            isChecked={checked.has(item.id)}
            who={addedByName(item.addedBy, collaborators)}
            onToggle={() => toggleChecked(item.id)}
            onRemove={() => removePersonalItem(item.id)}
            onSaveNote={(n) => setPersonalItemNote(item.id, n)}
          />
        ))}
        {items.length === 0 && <Empty>No items yet — add your first.</Empty>}
      </ul>

      <AddRow
        onAdd={addPersonalItem}
        withPrivacy
        placeholder="Add a packing item…"
      />
    </section>
  );
}

function PersonalRow({
  item,
  isChecked,
  who,
  onToggle,
  onRemove,
  onSaveNote,
}: {
  item: ChecklistItem;
  isChecked: boolean;
  who: string | null;
  onToggle: () => void;
  onRemove: () => void;
  onSaveNote: (n: string) => void;
}) {
  const [noteEditing, setNoteEditing] = useState(false);
  return (
    <li className="space-y-1 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-emerald-600"
        />
        <span className={`min-w-0 flex-1 text-sm ${isChecked ? 'text-slate-400 line-through' : ''}`}>
          {item.text}
          {item.private && (
            <span className="ml-1 rounded bg-indigo-50 px-1 text-[10px] font-medium text-indigo-500">
              private
            </span>
          )}
          {!item.private && who && (
            <span className="ml-1 text-[11px] text-slate-300">Added by: {who}</span>
          )}
        </span>
        {!item.note && !noteEditing && <NoteAddButton onClick={() => setNoteEditing(true)} />}
        <button
          onClick={onRemove}
          className="shrink-0 text-xs text-slate-300 hover:text-red-500"
          title={item.private ? 'Remove' : 'Remove for everyone'}
        >
          ✕
        </button>
      </div>
      <NoteBody
        note={item.note}
        editing={noteEditing}
        setEditing={setNoteEditing}
        onSave={onSaveNote}
      />
    </li>
  );
}

function GroupList() {
  const items = useStore((s) => s.doc.groupItems);
  const addGroupItem = useStore((s) => s.addGroupItem);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Group sign-up</h2>
        <p className="text-xs text-slate-500">
          Shared tasks — sign up for what you'll handle, or add anyone by name
          (handy for people not using the app). Anyone can add items.
        </p>
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <GroupRow key={item.id} item={item} />
        ))}
        {items.length === 0 && <Empty>No group tasks yet — add one.</Empty>}
      </ul>

      <AddRow onAdd={addGroupItem} placeholder="Add a group task to sign up for…" />
    </section>
  );
}

function GroupRow({ item }: { item: GroupItem }) {
  const collaborators = useStore((s) => s.doc.collaborators);
  const meId = useStore((s) => s.meId);
  const toggleSignup = useStore((s) => s.toggleSignup);
  const toggleGroupDone = useStore((s) => s.toggleGroupDone);
  const setGroupItemNote = useStore((s) => s.setGroupItemNote);
  const removeGroupItem = useStore((s) => s.removeGroupItem);
  const addManualSignup = useStore((s) => s.addManualSignup);
  const removeManualSignup = useStore((s) => s.removeManualSignup);
  const [name, setName] = useState('');
  const [noteEditing, setNoteEditing] = useState(false);

  const signed = meId ? item.signups.includes(meId) : false;
  const who = addedByName(item.addedBy, collaborators);
  const signups = item.signups
    .map((id) => collaborators.find((c) => c.id === id))
    .filter((c): c is Collaborator => !!c);
  const manual = item.manualSignups ?? [];

  return (
    <li className="space-y-1.5 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!item.done}
          onChange={() => toggleGroupDone(item.id)}
          className="h-4 w-4 shrink-0 accent-emerald-600"
          title="Mark done"
        />
        <span className={`min-w-0 flex-1 text-sm ${item.done ? 'text-slate-400 line-through' : ''}`}>
          {item.text}
          {who && <span className="ml-1 text-[11px] text-slate-300">Added by: {who}</span>}
        </span>
        {!item.note && !noteEditing && <NoteAddButton onClick={() => setNoteEditing(true)} />}
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

      <NoteBody
        note={item.note}
        editing={noteEditing}
        setEditing={setNoteEditing}
        onSave={(n) => setGroupItemNote(item.id, n)}
      />

      {(signups.length > 0 || manual.length > 0) && (
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
          {manual.map((n) => (
            <span
              key={`m-${n}`}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
            >
              {n}
              <button
                onClick={() => removeManualSignup(item.id, n)}
                className="text-slate-300 hover:text-red-500"
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          addManualSignup(item.id, name);
          setName('');
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="+ add someone by name"
          className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]"
        />
        {name.trim() && (
          <button
            type="submit"
            className="shrink-0 rounded bg-slate-700 px-2 py-1 text-[11px] font-medium text-white"
          >
            Add
          </button>
        )}
      </form>
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-lg bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
      {children}
    </li>
  );
}
