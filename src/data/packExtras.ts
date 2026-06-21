export interface PackExtra {
  label: string;
  reason: string;
}

/**
 * Handy things to pack that aren't about saving money (the parks don't really
 * sell them) — just easy to forget and very useful. Tapping one adds it to your
 * personal packing list.
 */
export const PACK_EXTRAS: PackExtra[] = [
  {
    label: 'Ziploc / gallon bags',
    reason: 'Phones in the rain, wet swimsuits, snacks, and loose pins.',
  },
  {
    label: 'Small blanket or seat pads',
    reason: 'For curb-sitting at the parade & fireworks.',
  },
  {
    label: "Kids' ear protection (headphones)",
    reason: 'Fireworks and loud shows can overwhelm little ones.',
  },
];
