/** Normalise a name for case-insensitive duplicate detection (trim → collapse spaces → lowercase). */
export function normalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
