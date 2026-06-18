import { useState } from 'react';
import { useStore } from '../store/useStore';

/**
 * Blocking entry screen: until you enter a name and join, the rest of the app
 * is hidden. This guarantees every tag and edit is attributed to a person, so
 * collaborative wishlists make sense.
 */
export function JoinGate() {
  const join = useStore((s) => s.join);
  const collaborators = useStore((s) => s.doc.collaborators);
  const [name, setName] = useState('');
  const canJoin = name.trim().length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            ✨ Walt Disney World Planner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your name to start. Everything you tag is shared with the group
            and labeled with your name.
          </p>
        </div>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canJoin) join(name);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base"
          />
          <button
            type="submit"
            disabled={!canJoin}
            className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Join
          </button>
        </form>

        {collaborators.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-1.5 text-xs text-slate-400">Already planning:</p>
            <div className="flex flex-wrap gap-1.5">
              {collaborators.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
