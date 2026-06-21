export interface SaveMoneyItem {
  /** What to pack. */
  label: string;
  /** Roughly what it costs to buy in the parks. */
  parkPrice: string;
  /** Why / how bringing it saves money. */
  tip: string;
}

/**
 * Things commonly sold inside the parks at a big markup that you can bring from
 * home instead. Prices are rough planning figures, not exact. Tapping one adds
 * it to your personal packing list.
 */
export const SAVE_MONEY_ITEMS: SaveMoneyItem[] = [
  {
    label: 'Rain ponchos',
    parkPrice: '~$12 each',
    tip: 'Florida storms roll in fast — pack $1 ponchos from a dollar store.',
  },
  {
    label: 'Refillable water bottles',
    parkPrice: 'bottled water ~$3.50',
    tip: 'Bring bottles and ask any quick-service counter for free cups of ice water.',
  },
  {
    label: 'Sunscreen',
    parkPrice: '$15–20',
    tip: 'Buy a bottle beforehand; in-park gift shops mark it way up.',
  },
  {
    label: 'Portable phone charger',
    parkPrice: 'FuelRod rental ~$30',
    tip: 'Bring your own power bank instead of renting one in the park.',
  },
  {
    label: 'Glow / light-up toys',
    parkPrice: '$10–30',
    tip: 'Dollar-store glow sticks for the fireworks instead of light-up wands.',
  },
  {
    label: 'Autograph book & pen',
    parkPrice: '~$15',
    tip: 'A cheap notebook and a fat marker work great for character signatures.',
  },
  {
    label: 'Snacks (granola bars, chips)',
    parkPrice: '$4–6 each',
    tip: 'Outside snacks are allowed — pack a day’s worth to skip pricey kiosks.',
  },
  {
    label: 'Stroller',
    parkPrice: 'in-park rental ~$15–31/day',
    tip: 'Bring your own or rent off-site (a local company) for far less.',
  },
  {
    label: 'Pain reliever & band-aids',
    parkPrice: 'gift-shop prices',
    tip: 'A small kit saves an expensive shop run for Advil and blister care.',
  },
  {
    label: 'Lanyard for pin trading',
    parkPrice: '$10–15',
    tip: 'Bring a lanyard and starter pins from home or online.',
  },
  {
    label: 'Hats & sunglasses',
    parkPrice: '$25–30',
    tip: 'Bring your own; park-branded versions carry a big markup.',
  },
  {
    label: 'Hand sanitizer & wipes',
    parkPrice: 'shop prices',
    tip: 'Cheaper by the bottle from home.',
  },
];
