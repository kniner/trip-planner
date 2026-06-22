# Retargeting this app to a new trip

This is a collaborative group-trip planner. The core (join/owner, must/nice/avoid
tagging, packing & group lists, reservations + expense splitting, finances,
meals, onboarding, organizer tools, sync) is generic. The theme-park specifics
are isolated behind one config file + the data folder.

## 1. Branding + features — `src/trip.config.ts`
Edit one object:

- `name`, `shortName`, `tagline`, `logo` — title bar + PWA manifest.
- `ownerName` — the organizer, pinned by name (empty `''` = first to join owns it).
- `features` — flip these off to hide theme-park-only modules:
  - `waitTimes` — live/avg/max wait planning + queue-times.com.
  - `parkMap` — schematic map tab.
  - `rideQuiz` — the "what should I do?" quiz on the wishlist.
  - `characterDining` — the character-dining catalog/tab.
  - `events` — special event days (parties/festivals).
  - `meals`, `finances` — owner-only meal planner / expense splitting.

Turning a flag off hides its tab/section in the UI immediately.

## 2. The catalog — `src/data/`
The taggable items live here. Swap these for your trip:
- `magicKingdom.ts`, `epcot.ts`, `characterDining.ts`, `legolandWaterPark.ts` —
  the attraction/activity lists.
- `index.ts` — `PARKS` / `ParkId`: the "areas" (parks) shown in the wishlist picker.
- Disney-flavored extras: `rideVibes.ts` (quiz), `saveMoney.ts`, `packExtras.ts`,
  `booking.ts`, `checklist.ts` (seeded list/group/grocery items), `amenities.ts`,
  `mapPaths.ts`, `trickOrTreat.ts`, `descriptions.ts`, `rideInfo.ts`.

> Note: the catalog is still modeled as parks→lands→attractions with optional
> wait times. Fully abstracting it to generic "areas → activities" (and letting
> users add their own activities) is the natural next step — see below.

## 3. Misc one-time edits
- `index.html` `<title>`.
- `vite.config.ts` `base` — set to `/<your-repo-name>/` for GitHub Pages.
- `public/icons/*` — app icons.
- `.github/workflows/deploy.yml` / `e2e.yml` — set the branch name.

## 4. Sync (multi-device)
Set repo secrets for your own data store, or it falls back to local-per-device:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TRIP_ID`.

## Still theme-park-shaped (next steps to go fully neutral)
- Abstract the catalog to generic areas/activities + user-added activities.
- Rename `ParkId`/`PARKS` and the "park"/"ride" wording.
- Fully gate wait-time rendering behind `features.waitTimes` (the flag exists;
  some wait UI still renders).
