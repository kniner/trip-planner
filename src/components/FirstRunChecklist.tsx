import { ONBOARDING_VERSION, useStore } from '../store/useStore';

interface Props {
  onGoWishlist: () => void;
}

/**
 * A friendly, dismissible onboarding card. It only surfaces tasks each person
 * must do themselves — currently tagging their own wishlist. Trip-wide setup
 * (adding the group, setting dates) is the organizer's job and isn't shown.
 * Dismissal is per account and synced; bump ONBOARDING_VERSION to re-show it.
 */
export function FirstRunChecklist({ onGoWishlist }: Props) {
  const tags = useStore((s) => s.doc.tags);
  const meId = useStore((s) => s.meId);
  const dismissedVersions = useStore((s) => s.doc.onboardingDismissed);
  const dismiss = useStore((s) => s.dismissOnboarding);

  const dismissed = meId != null && (dismissedVersions[meId] ?? 0) >= ONBOARDING_VERSION;
  if (dismissed) return null;

  // Personal, not shared: whether *I* have tagged anything yet.
  const hasTags = meId != null && tags.some((t) => t.userId === meId);

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

      {hasTags ? (
        <p className="text-xs text-indigo-800/80">
          <span className="font-semibold text-emerald-600">✓ You've tagged your wishlist.</span>{' '}
          Keep it up to date as plans change —{' '}
          <button
            onClick={onGoWishlist}
            className="font-semibold text-indigo-600 hover:underline"
          >
            open your wishlist →
          </button>
        </p>
      ) : (
        <div>
          <p className="mb-2 text-xs text-indigo-800/80">
            Tag the rides, shows and meals you want to do — must, nice-to-do, or avoid.
            Everyone tags their own; it's how the group's picks come together.
          </p>
          <button
            onClick={onGoWishlist}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Tag your wishlist →
          </button>
        </div>
      )}
    </div>
  );
}
