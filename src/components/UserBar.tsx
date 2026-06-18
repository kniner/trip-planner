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
  const removeCollaborator = useStore((s) => s.removeCollaborator);
  const [name, setName] = useState('');
  const [managing, setManaging] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
        {collaborators.length > 0 && (
          <button
            onClick={() => {
              setManaging((v) => !v);
              setConfirmId(null);
            }}
            className="ml-1 text-xs text-slate-400 underline hover:text-slate-600"
          >
            {managing ? 'done' : 'manage'}
          </button>
        )}
      </div>

      {managing && (
        <div className="w-full space-y-1 border-t border-slate-100 pt-2">
          <p className="text-[11px] text-slate-400">
            Remove a person (also clears their tags, sign-ups and group assignments).
          </p>
          {collaborators.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              <span className="flex-1">
                {c.name}
                {c.id === meId && <span className="ml-1 text-[11px] text-slate-400">(you)</span>}
              </span>
              {confirmId === c.id ? (
                <>
                  <span className="text-[11px] text-slate-500">Remove?</span>
                  <button
                    onClick={() => {
                      removeCollaborator(c.id);
                      setConfirmId(null);
                    }}
                    className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-[11px] text-slate-400"
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmId(c.id)}
                  className="text-xs text-slate-300 hover:text-red-500"
                  title="Remove person"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
