/** Supported weight units. */
export type Unit = 'kg' | 'lb';

/** Convert kilograms to pounds. */
export function kgToLb(kg: number) {
  return kg * 2.2046226218;
}

/** Convert pounds to kilograms. */
export function lbToKg(lb: number) {
  return lb / 2.2046226218;
}

/** Format a weight value (stored in kg) for display in the user's preferred unit. */
export function formatWeight(kg: number, unit: Unit) {
  if (unit === 'kg') return kg.toFixed(1);
  return kgToLb(kg).toFixed(1);
}

/** Parse a user-entered weight string and convert to kg for storage. */
export function parseWeight(input: string, unit: Unit) {
  const val = parseFloat(input);
  if (Number.isNaN(val)) return null;
  return unit === 'kg' ? val : lbToKg(val);
}
