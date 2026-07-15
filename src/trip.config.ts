/**
 * Per-trip configuration — the one file to edit when retargeting this app to a
 * different trip. Change the branding, owner, and feature flags here, swap the
 * catalog data in `src/data`, and you have a new trip planner with no logic
 * changes. Disney-specific modules are gated by the feature flags below.
 */
export interface TripFeatures {
  /** Live wait times + avg/max wait planning model (theme-park specific). */
  waitTimes: boolean;
  /** Schematic park/area map. */
  parkMap: boolean;
  /** "Not sure what to do?" suggestion quiz on the wishlist. */
  rideQuiz: boolean;
  /** Character-dining catalog in the wishlist. */
  characterDining: boolean;
  /** Special event days (parties / festivals). */
  events: boolean;
  /** Owner-only meal & grocery planner. */
  meals: boolean;
  /** Owner-only expense splitting. */
  finances: boolean;
}

export interface TripConfig {
  /** Full app + PWA name. */
  name: string;
  /** Short name (home screen / tabs). */
  shortName: string;
  /** One-line tagline under the title. */
  tagline: string;
  /** Emoji/logo shown before the title. */
  logo: string;
  /**
   * Designated owner/organizer, matched by name (case-insensitive). Leave empty
   * ('') to let the first person who joins become the owner.
   */
  ownerName: string;
  features: TripFeatures;
}

export const TRIP_CONFIG: TripConfig = {
  name: 'Our Trip',
  shortName: 'Our Trip',
  tagline: 'Everything for our trip in one place.',
  logo: '📍',
  ownerName: 'Kate',
  features: {
    waitTimes: true,
    parkMap: true,
    rideQuiz: true,
    characterDining: true,
    events: true,
    meals: true,
    finances: true,
  },
};
