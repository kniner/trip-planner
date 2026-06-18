import { useState } from 'react';
import { isSupabaseConfigured } from '../store/sync';
import { useStore } from '../store/useStore';

const CLOUD_SYNC = isSupabaseConfigured();

/** Identity + presence: who you are on this client, and who else is collaborating. */
export function UserBar() {
  const { collaborators } = useStore((s) => s.doc);
  const meId = useStore((s) => s.meId);
  const join = useStore((s) => s.join);
  const leave = useStore((s) => s.leave);
  const [name, setName] = useState('');

  const me = collaborators.find((c) => c.id === meId);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
      {me ? (
        <>
          <span className="text-sm text-slate-500">You are</span>
          <span
            className="rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ background: me.color }}
          >
            {me.name}
          </span>
          <button
            onClick={leave}
            className="text-xs text-slate-400 underline hover:text-slate-600"
          >
            switch
          </button>
        </>
      ) : (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) join(name);
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name to start tagging"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Join
          </button>
        </form>
      )}

      <span
        className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
          CLOUD_SYNC ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}
        title={
          CLOUD_SYNC
            ? 'Shared live with everyone on this trip'
            : 'Local only — shared across tabs on this device'
        }
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${CLOUD_SYNC ? 'bg-emerald-500' : 'bg-slate-400'}`}
        />
        {CLOUD_SYNC ? 'Group sync' : 'This device only'}
      </span>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-400">Collaborators:</span>
        {collaborators.length === 0 && (
          <span className="text-xs text-slate-400">none yet</span>
        )}
        {collaborators.map((c) => (
          <span
            key={c.id}
            title={c.name}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white"
            style={{ background: c.color }}
          >
            {c.name.slice(0, 1).toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
