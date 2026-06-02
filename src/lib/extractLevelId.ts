/**
 * Strip a pasted URL down to the bare level id.
 * Supports both legacy numeric IDs (e.g. 1778255582064) and new
 * alphanumeric/hex IDs (e.g. B9AC665B).
 *
 * Examples:
 *   "https://narrowarrow.xyz/levelid=1778255582064" -> "1778255582064"
 *   "https://narrowarrow.xyz/levelid=B9AC665B"       -> "B9AC665B"
 *   "B9AC665B"                                       -> "B9AC665B"
 */
export function extractLevelId(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const queryKeys = ["levelid", "levelId", "level_id", "id", "customLevelId", "custom_level_id"];
    for (const key of queryKeys) {
      const value = url.searchParams.get(key);
      if (value) return value.trim();
    }
    const pathToken = url.pathname.split("/").filter(Boolean).pop();
    if (pathToken && /^[A-Za-z0-9]+$/.test(pathToken)) return pathToken;
  } catch {
    // Not a full URL; fall through to pattern matching.
  }

  // Try common URL patterns first (alphanumeric IDs allowed)
  const patterns = [
    /(?:levelid|levelId|level_id|customLevelId|custom_level_id)=([A-Za-z0-9]+)/i,
    /[?&]id=([A-Za-z0-9]+)/i,
    /\/level\/([A-Za-z0-9]+)/i,
    /\/levels?\/([A-Za-z0-9]+)/i,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }

  // If it's already a pure id token (no slashes / query chars), keep it
  if (/^[A-Za-z0-9]+$/.test(trimmed)) return trimmed;

  // Fallback: take the last path-like segment of alphanumerics
  const all = trimmed.match(/[A-Za-z0-9]{4,}/g);
  if (all && all.length > 0) {
    return all[all.length - 1];
  }
  return trimmed;
}
