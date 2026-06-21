import { useEffect, useMemo, useState } from 'react';
import { suggestedPacking } from '../data/packingSuggestions';
import { SAVE_MONEY_ITEMS, itemSavings, totalSavings } from '../data/saveMoney';
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
          Share with everyone <span className="text-slate-400">(otherwise private to you)</span>
        </label>
      )}
    </form>
  );
}

function addedByName(id: string | undefined, collaborators: Collaborator[]): string | null {
  if (!id) return null;
  return collaborators.find((c) => c.id === id)?.name ?? null;
}

/** Sort rank for group tasks: open (0) → signed up (1) → done (2, very bottom). */
function groupRank(item: GroupItem): number {
  if (item.done) return 2;
  const hasSignup = item.signups.length > 0 || (item.manualSignups?.length ?? 0) > 0;
  return hasSignup ? 1 : 0;
}

/**
 * A small inline "+ note" trigger, meant to live in an item's main row so a
 * blank note never takes up its own line. Editing state lives in the parent.
 */
function NoteAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Add a note"
      className="shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-50 active:text-slate-700"
    >
      📝 Note
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

/**
 * Click-to-edit item label: shows the text (tap to rename) and swaps to an
 * input while editing. Saves on Enter/blur, cancels on Escape. Empty edits are
 * ignored by the store so an item can't lose its label.
 */
function EditableText({ text, onSave }: { text: string; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onSave(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave(draft);
            setEditing(false);
          } else if (e.key === 'Escape') {
            setDraft(text);
            setEditing(false);
          }
        }}
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(text);
        setEditing(true);
      }}
      className="text-left hover:underline"
      title="Tap to edit"
    >
      {text}
    </button>
  );
}

function PersonalList() {
  const allItems = useStore((s) => s.doc.personalItems);
  const meId = useStore((s) => s.meId);
  const collaborators = useStore((s) => s.doc.collaborators);
  const myChecks = useStore((s) => (s.meId ? s.doc.personalChecks[s.meId] : undefined));
  const toggleChecked = useStore((s) => s.toggleChecked);
  const addPersonalItem = useStore((s) => s.addPersonalItem);
  const removePersonalItem = useStore((s) => s.removePersonalItem);
  const setPersonalItemText = useStore((s) => s.setPersonalItemText);
  const setPersonalItemNote = useStore((s) => s.setPersonalItemNote);
  const setPersonalItemQty = useStore((s) => s.setPersonalItemQty);

  // Private items only show for the person who added them; shared items show
  // for everyone.
  const items = allItems.filter((i) => !i.private || i.addedBy === meId);
  const checked = new Set(myChecks ?? []);
  const doneCount = items.filter((i) => checked.has(i.id)).length;

  // Collapsed by default to keep the page tidy; the open/closed choice is
  // remembered per person (keyed by their account id) across reloads.
  const prefKey = meId ? `mk-planner:checklist-open:${meId}` : null;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(prefKey ? localStorage.getItem(prefKey) === '1' : false);
  }, [prefKey]);
  const toggle = () =>
    setOpen((prev) => {
      const next = !prev;
      if (prefKey) localStorage.setItem(prefKey, next ? '1' : '0');
      return next;
    });

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">My checklist</h2>
        <p className="text-xs text-slate-500">
          Add shared suggestions (everyone sees them) or private items (just you).
          Your checkmarks are your own, synced across your devices.
        </p>
      </div>

      {/* The main checklist gets its own collapsible header. */}
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Items · {doneCount}/{items.length} done
        </span>
        <span className="shrink-0 text-slate-400">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <PersonalRow
              key={item.id}
              item={item}
              isChecked={checked.has(item.id)}
              who={addedByName(item.addedBy, collaborators)}
              onToggle={() => toggleChecked(item.id)}
              onRemove={() => removePersonalItem(item.id)}
              onSaveText={(t) => setPersonalItemText(item.id, t)}
              onSaveNote={(n) => setPersonalItemNote(item.id, n)}
              onSetQty={(q) => setPersonalItemQty(item.id, q)}
            />
          ))}
          {items.length === 0 && <Empty>No items yet — add your first.</Empty>}
        </ul>
      )}

      <PackingSuggestions items={allItems} />

      <SaveMoneyList items={allItems} />

      <AddRow onAdd={addPersonalItem} withPrivacy placeholder="Add a packing item…" />
    </section>
  );
}

function PersonalRow({
  item,
  isChecked,
  who,
  onToggle,
  onRemove,
  onSaveText,
  onSaveNote,
  onSetQty,
}: {
  item: ChecklistItem;
  isChecked: boolean;
  who: string | null;
  onToggle: () => void;
  onRemove: () => void;
  onSaveText: (t: string) => void;
  onSaveNote: (n: string) => void;
  onSetQty: (qty: number | undefined) => void;
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
          <EditableText text={item.text} onSave={onSaveText} />
          {item.private && (
            <span className="ml-1 rounded bg-indigo-50 px-1 text-[10px] font-medium text-indigo-500">
              private
            </span>
          )}
          {!item.private && who && (
            <span className="ml-1 text-[11px] text-slate-300">Added by: {who}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-slate-400">
          ×
          <input
            type="number"
            min={1}
            value={item.qty ?? ''}
            onChange={(e) => onSetQty(e.target.value === '' ? undefined : Number(e.target.value))}
            placeholder="1"
            className="w-10 rounded border border-slate-200 px-1 py-0.5 text-center text-[11px]"
            title="Quantity to pack"
          />
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

/**
 * Trip-aware packing suggestions: tap a chip to add it to your own (private)
 * packing list. Already-added items are marked. Derived from the trip's days
 * and headcount (water park, party night, kids, GF…).
 */
function PackingSuggestions({ items }: { items: ChecklistItem[] }) {
  const days = useStore((s) => s.doc.days);
  const meals = useStore((s) => s.doc.meals);
  const meId = useStore((s) => s.meId);
  const addPersonalItem = useStore((s) => s.addPersonalItem);
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => suggestedPacking(days, meals), [days, meals]);

  // What's already on my list (mine or shared), case-insensitively.
  const have = useMemo(() => {
    const mine = items.filter((i) => !i.private || i.addedBy === meId);
    return new Set(mine.map((i) => i.text.trim().toLowerCase()));
  }, [items, meId]);

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500"
      >
        <span>🎒 Suggested for your trip</span>
        <span className="text-slate-400">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => {
            const added = have.has(s.label.trim().toLowerCase());
            return (
              <button
                key={s.label}
                disabled={added}
                onClick={() => addPersonalItem(s.label, true)}
                title={s.reason}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  added
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {added ? '✓ ' : '+ '}
                {s.label}
              </button>
            );
          })}
        </div>
      )}
      {open && (
        <p className="mt-1.5 text-[10px] text-slate-400">
          Tap to add to your private list. Suggestions come from your trip's days
          (water park, party nights), kids and gluten-free needs.
        </p>
      )}
    </div>
  );
}

/**
 * "Bring it, don't buy it": curated things sold in the parks at a markup you
 * can pack from home. Tapping one adds it to your private packing list.
 */
function SaveMoneyList({ items }: { items: ChecklistItem[] }) {
  const meId = useStore((s) => s.meId);
  const meals = useStore((s) => s.doc.meals);
  const days = useStore((s) => s.doc.days);
  const addPersonalItem = useStore((s) => s.addPersonalItem);
  const [open, setOpen] = useState(false);

  // Use the trip's meal headcount + park-day count; default to 8 adults /
  // 3 kids / 4 park days when those aren't meaningfully set up yet.
  const adults = meals.adults > 0 ? meals.adults : 8;
  const kids = meals.kids > 0 ? meals.kids : 3;
  const realParkDays = days.filter((d) => d.kind !== 'other').length;
  const parkDays = realParkDays >= 2 ? realParkDays : 4;
  const total = useMemo(
    () => Math.round(totalSavings(adults, kids, parkDays)),
    [adults, kids, parkDays],
  );

  // What's already on my list (mine or shared), case-insensitively.
  const have = useMemo(() => {
    const mine = items.filter((i) => !i.private || i.addedBy === meId);
    return new Set(mine.map((i) => i.text.trim().toLowerCase()));
  }, [items, meId]);

  return (
    <div className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"
      >
        <span>💰 Bring it, don't buy it</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold normal-case text-emerald-700">
            save ~${total}
          </span>
          <span className="text-slate-400">{open ? '▾' : '▸'}</span>
        </span>
      </button>

      {open && (
        <>
          <p className="mt-1 text-[10px] text-slate-400">
            Sold in the parks at a markup — pack it instead. Estimated savings for{' '}
            {adults} adults + {kids} kids over {parkDays} park days; tap to add to your
            list.
          </p>
          <ul className="mt-2 space-y-2">
            {SAVE_MONEY_ITEMS.map((s) => {
              const added = have.has(s.label.trim().toLowerCase());
              const saved = Math.round(itemSavings(s, adults, kids, parkDays));
              return (
                <li key={s.label} className="flex items-start gap-2">
                  <button
                    disabled={added}
                    onClick={() => addPersonalItem(s.label, true)}
                    title={added ? 'On your list' : 'Add to your packing list'}
                    className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      added
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {added ? '✓' : '+'}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {s.label}
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Disney {s.parkPrice}
                      </span>
                      {saved > 0 && (
                        <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          save ~${saved}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] leading-snug text-slate-500">{s.tip}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function GroupList() {
  const items = useStore((s) => s.doc.groupItems);
  const addGroupItem = useStore((s) => s.addGroupItem);

  // Keep tasks that still need a volunteer up top: open items first, then ones
  // someone's signed up for, then done items at the very bottom. Stable sort
  // preserves the existing order within each group.
  const sorted = [...items].sort((a, b) => groupRank(a) - groupRank(b));

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Group sign-up</h2>
        <p className="text-xs text-slate-500">
          Shared tasks — sign up for what you'll handle, or add anyone by name
          (handy for people not using the app). Anyone can add items. Items with
          someone signed up drop to the bottom.
        </p>
      </div>

      <ul className="space-y-1.5">
        {sorted.map((item) => (
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
  const setGroupItemText = useStore((s) => s.setGroupItemText);
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
          <EditableText text={item.text} onSave={(t) => setGroupItemText(item.id, t)} />
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
