export interface SaveMoneyItem {
  /** What to pack. */
  label: string;
  /** Display string for the rough in-park price. */
  parkPrice: string;
  /** Why / how bringing it saves money. */
  tip: string;
  /** In-park cost per unit, used for the savings estimate. */
  parkUnit: number;
  /** Cost to bring per unit (cheap alternative / already owned). */
  bringUnit: number;
  /** How many units the group needs, given the headcount. */
  qty: (adults: number, kids: number) => number;
}

/**
 * Things commonly sold inside the parks at a big markup that you can bring from
 * home instead. Prices and quantities are rough planning figures, not exact;
 * the savings estimate scales with the trip's headcount.
 */
export const SAVE_MONEY_ITEMS: SaveMoneyItem[] = [
  {
    label: 'Rain ponchos',
    parkPrice: '~$12 each',
    tip: 'Florida storms roll in fast — pack $1 ponchos from a dollar store (one each).',
    parkUnit: 12,
    bringUnit: 1,
    qty: (a, k) => a + k,
  },
  {
    label: 'Refillable water bottles',
    parkPrice: 'bottled water ~$3.50',
    tip: 'Bring bottles and ask any quick-service counter for free cups of ice water (skips ~3 bottle buys each).',
    parkUnit: 3.5,
    bringUnit: 0,
    qty: (a, k) => (a + k) * 3,
  },
  {
    label: 'Sunscreen',
    parkPrice: '$15–20',
    tip: 'Buy beforehand; gift shops mark it up. A few bottles cover the group.',
    parkUnit: 17,
    bringUnit: 8,
    qty: (a, k) => Math.ceil((a + k) / 4),
  },
  {
    label: 'Portable phone charger',
    parkPrice: 'FuelRod rental ~$30',
    tip: 'Bring your own power banks instead of renting (about one per few adults).',
    parkUnit: 30,
    bringUnit: 0,
    qty: (a) => Math.ceil(a / 3),
  },
  {
    label: 'Glow / light-up toys',
    parkPrice: '$10–30',
    tip: 'Dollar-store glow sticks for the fireworks instead of light-up wands (kids).',
    parkUnit: 20,
    bringUnit: 2,
    qty: (_a, k) => k,
  },
  {
    label: 'Bubble wands',
    parkPrice: '~$8–12',
    tip: 'Character bubble wands are a markup — bring cheap ones from a party store (kids).',
    parkUnit: 10,
    bringUnit: 2,
    qty: (_a, k) => k,
  },
  {
    label: 'Electric bubble wands',
    parkPrice: '~$25–30',
    tip: 'The light-up motorized bubble blowers are pricey in-park — grab one online for much less (kids).',
    parkUnit: 28,
    bringUnit: 10,
    qty: (_a, k) => k,
  },
  {
    label: 'Autograph book & pen',
    parkPrice: '~$15',
    tip: 'A cheap notebook and a fat marker work great for character signatures (kids).',
    parkUnit: 15,
    bringUnit: 3,
    qty: (_a, k) => k,
  },
  {
    label: 'Snacks (granola bars, chips)',
    parkPrice: '$4–6 each',
    tip: 'Outside snacks are allowed — pack a couple each to skip pricey kiosks.',
    parkUnit: 5,
    bringUnit: 1,
    qty: (a, k) => (a + k) * 2,
  },
  {
    label: 'Stroller',
    parkPrice: 'in-park rental ~$15–31/day',
    tip: 'Bring your own or rent off-site — far less than a multi-day in-park rental.',
    parkUnit: 70,
    bringUnit: 0,
    qty: (_a, k) => Math.min(k, 2),
  },
  {
    label: 'Pain reliever & band-aids',
    parkPrice: 'gift-shop prices',
    tip: 'A small kit saves an expensive shop run for Advil and blister care.',
    parkUnit: 10,
    bringUnit: 0,
    qty: () => 1,
  },
  {
    label: 'Lanyard for pin trading',
    parkPrice: '$10–15',
    tip: 'Bring a lanyard and starter pins from home or online (kids who trade).',
    parkUnit: 12,
    bringUnit: 4,
    qty: (_a, k) => k,
  },
  {
    label: 'Hats & sunglasses',
    parkPrice: '$25–30',
    tip: 'Bring your own; park-branded versions carry a big markup.',
    parkUnit: 27,
    bringUnit: 0,
    qty: (a, k) => Math.ceil((a + k) / 3),
  },
  {
    label: 'Hand sanitizer & wipes',
    parkPrice: 'shop prices',
    tip: 'Cheaper by the bottle from home.',
    parkUnit: 6,
    bringUnit: 1,
    qty: () => 2,
  },
];

/** Estimated savings for one item at a given headcount (never negative). */
export function itemSavings(item: SaveMoneyItem, adults: number, kids: number): number {
  return Math.max(0, (item.parkUnit - item.bringUnit) * item.qty(adults, kids));
}

/** Estimated total savings from bringing everything, at a given headcount. */
export function totalSavings(adults: number, kids: number): number {
  return SAVE_MONEY_ITEMS.reduce((sum, i) => sum + itemSavings(i, adults, kids), 0);
}
