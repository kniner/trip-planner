import { ONBOARDING_VERSION, useStore } from '../store/useStore';

interface Props {
  isOwner: boolean;
  onGoWishlist: () => void;
  onGoSchedule: () => void;
}

/**
 * A friendly, dismissible "start here" card for the first run. Each step
 * reflects real plan state and disappears once met; the whole card hides once
 * every step is done or the user dismisses it (remembered per device).
 */
export function FirstRunChecklist({ isOwner, onGoWishlist, onGoSchedule }: Props) {
  const collaborators = useStore((s) => s.doc.collaborators);
  const days = useStore((s) => s.doc.days);
  const tags = useStore((s) => s.doc.tags);
  const meId = useStore((s) => s.meId);
  const dismissedVersions = useStore((s) => s.doc.onboardingDismissed);
  const dismiss = useStore((s) => s.dismissOnboarding);

  const hasGroup = collaborators.length >= 2;
  const hasDates = days.some((d) => !!d.date);
  const hasTags = tags.length > 0;

  // Dismissal is per account and synced across devices. Bumping ONBOARDING_VERSION
  // re-shows it to everyone, since older dismissals fall below the current one.
  const dismissed = meId != null && (dismissedVersions[meId] ?? 0) >= ONBOARDING_VERSION;
  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-bold text-indigo-900">👋 Start with your wishlist</h2>
        <button
          onClick={dismiss}
          className="text-[11px] font-medium text-indigo-400 hover:text-indigo-600"
        >
          Dismiss
        </button>
      </div>

      {/* The wishlist is the main thing everyone should act on first. */}
      <div className="mb-2">
        <p className="mb-2 text-xs text-indigo-800/80">
          {hasTags
            ? "Your wishlist is where the whole group's picks come together — keep it up to date as plans change."
            : "Tag the rides, shows and meals you each want to do — must, nice-to-do, or avoid. It's how the whole group's picks come together."}
        </p>
        <button
          onClick={onGoWishlist}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {hasTags ? 'Open your wishlist →' : 'Tag your wishlist →'}
        </button>
      </div>

      <ul className="space-y-1.5">
        <Step done={hasTags} label="Tag your wishlist">
          <button onClick={onGoWishlist} className="font-semibold text-indigo-600 hover:underline">
            Open Wishlist →
          </button>
        </Step>
        <Step done={hasGroup} label="Add your travel group">
          <span className="text-indigo-700/70">Add everyone's names in the bar at the top.</span>
        </Step>
        <Step done={hasDates} label="Set your trip dates">
          {isOwner ? (
            <button onClick={onGoSchedule} className="font-semibold text-indigo-600 hover:underline">
              Open Schedule →
            </button>
          ) : (
            <span className="text-indigo-700/70">Your trip organizer sets these.</span>
          )}
        </Step>
      </ul>
    </div>
  );
}

function Step({
  done,
  label,
  children,
}: {
  done: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
          done ? 'bg-emerald-500 text-white' : 'border border-indigo-300 bg-white'
        }`}
      >
        {done ? '✓' : ''}
      </span>
      <span className={done ? 'text-slate-400 line-through' : 'font-medium text-indigo-900'}>
        {label}
      </span>
      {!done && <span className="text-[11px]">{children}</span>}
    </li>
  );
}
