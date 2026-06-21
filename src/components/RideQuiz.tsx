import { useState } from 'react';
import {
  DEFAULT_ANSWERS,
  recommendRides,
  type QuizAnswers,
  type RideStyle,
  type ThrillPref,
} from '../lib/rideQuiz';
import type { Attraction } from '../lib/types';
import { AttractionCard } from './AttractionCard';

const THRILLS: { value: ThrillPref; label: string }[] = [
  { value: 'chill', label: 'Chill' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'thrill', label: 'Big thrills' },
];

const STYLES: { value: RideStyle; label: string }[] = [
  { value: 'dark', label: 'Dark rides' },
  { value: 'water', label: 'Water rides' },
  { value: 'classic', label: 'Classic & nostalgic' },
  { value: 'immersive', label: 'Big & immersive' },
];

/**
 * A short quiz that recommends Magic Kingdom & EPCOT rides for the current
 * person. Results are shown as normal attraction cards, so the must/nice/avoid
 * tag buttons are right there — recommend, then tap to tag your wishlist.
 */
export function RideQuiz() {
  const [open, setOpen] = useState(false);
  const [ans, setAns] = useState<QuizAnswers>(DEFAULT_ANSWERS);
  const [results, setResults] = useState<Attraction[] | null>(null);

  const toggleStyle = (s: RideStyle) =>
    setAns((p) => ({
      ...p,
      styles: p.styles.includes(s) ? p.styles.filter((x) => x !== s) : [...p.styles, s],
    }));

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-bold text-indigo-900">
          🎢 Not sure what to ride? Take the quiz
        </span>
        <span className="text-indigo-400">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1 text-xs font-semibold text-indigo-900">How much thrill?</p>
            <div className="flex gap-1.5">
              {THRILLS.map((t) => (
                <Chip
                  key={t.value}
                  active={ans.thrill === t.value}
                  onClick={() => setAns((p) => ({ ...p, thrill: t.value }))}
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-indigo-900">
              Ride styles you love (optional)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((s) => (
                <Chip
                  key={s.value}
                  active={ans.styles.includes(s.value)}
                  onClick={() => toggleStyle(s.value)}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-indigo-900">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={ans.littleKids}
                onChange={(e) => setAns((p) => ({ ...p, littleKids: e.target.checked }))}
              />
              We have little kids
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={ans.motionSensitive}
                onChange={(e) => setAns((p) => ({ ...p, motionSensitive: e.target.checked }))}
              />
              I get motion sick easily
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={ans.spectacle}
                onChange={(e) => setAns((p) => ({ ...p, spectacle: e.target.checked }))}
              />
              Love big shows
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setResults(recommendRides(ans))}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Show my rides →
            </button>
            {results && (
              <button
                onClick={() => {
                  setResults(null);
                  setAns(DEFAULT_ANSWERS);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-600"
              >
                Reset
              </button>
            )}
          </div>

          {results && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-indigo-900">
                Your top matches — tap must / nice / avoid to add them to your wishlist:
              </p>
              {results.length === 0 ? (
                <p className="text-xs text-indigo-700/70">
                  No strong matches — try different answers.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((a) => (
                    <AttractionCard key={a.id} attraction={a} showAddToRoute={false} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100'
      }`}
    >
      {children}
    </button>
  );
}
