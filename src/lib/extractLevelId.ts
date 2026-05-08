/**
 * Strip a pasted URL down to the bare numeric level id.
 * Examples:
 *   "https://narrowarrow.xyz/levelid=1778255582064"  -> "1778255582064"
 *   "https://example.com/level/1234567890"            -> "1234567890"
 *   "1778255582064"                                   -> "1778255582064"
 */
export function extractLevelId(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Try common patterns first
  const patterns = [
    /levelid=(\d+)/i,
    /level_id=(\d+)/i,
    /[?&]id=(\d+)/i,
    /\/level\/(\d+)/i,
    /\/levels?\/(\d+)/i,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }

  // If it's already pure digits, keep it
  if (/^\d+$/.test(trimmed)) return trimmed;

  // Fallback: take the longest digit sequence
  const all = trimmed.match(/\d{5,}/g);
  if (all && all.length > 0) {
    return all.reduce((a, b) => (b.length > a.length ? b : a));
  }
  return trimmed;
}
