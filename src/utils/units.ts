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

/**
 * Format a weight value for display.
 * Weights are stored in the user's chosen unit (as-entered), so no conversion is needed.
 */
export function formatWeight(value: number, _unit?: Unit) {
  return value.toFixed(1);
}

/**
 * Parse a user-entered weight string.
 * Weights are stored as-entered in the user's chosen unit, so no conversion is applied.
 */
export function parseWeight(input: string, _unit?: Unit) {
  const val = parseFloat(input);
  if (Number.isNaN(val)) return null;
  return val;
}
