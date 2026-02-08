export type Unit = 'kg' | 'lb';

export function kgToLb(kg: number) {
  return kg * 2.2046226218;
}

export function lbToKg(lb: number) {
  return lb / 2.2046226218;
}

export function formatWeight(kg: number, unit: Unit) {
  if (unit === 'kg') return kg.toFixed(1);
  return kgToLb(kg).toFixed(1);
}

export function parseWeight(input: string, unit: Unit) {
  const val = parseFloat(input);
  if (Number.isNaN(val)) return null;
  return unit === 'kg' ? val : lbToKg(val);
}
