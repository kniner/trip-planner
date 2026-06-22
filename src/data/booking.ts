import type { BookingTask } from '../lib/types';

/**
 * Default pre-trip booking/prep tasks for the organizer, with how many days
 * before the trip's first date each is typically due. Lightning Lane is omitted
 * (this group isn't using it). Done state + custom tasks live in the plan doc.
 */
export const DEFAULT_BOOKING_TASKS: BookingTask[] = [
  { id: 'bk-mde', text: 'Set up My Disney Experience & link the party', daysBefore: 75 },
  { id: 'bk-tickets', text: "Buy & link everyone's park tickets", daysBefore: 65 },
  { id: 'bk-dining', text: 'Book dining & character meals (ADRs open)', daysBefore: 60 },
  { id: 'bk-final-payment', text: 'Make final trip / package payment', daysBefore: 45 },
  { id: 'bk-stroller', text: 'Reserve an off-site stroller (if renting)', daysBefore: 21 },
  { id: 'bk-magicbands', text: 'Order MagicBands (they ship ~10 days out)', daysBefore: 14 },
  { id: 'bk-checkin-resort', text: 'Online check-in for your resort', daysBefore: 7 },
  { id: 'bk-grocery', text: 'Schedule grocery delivery to the rental', daysBefore: 3 },
  { id: 'bk-checkin-flight', text: 'Online check-in for your flights', daysBefore: 1 },
];
