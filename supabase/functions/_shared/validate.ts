/** Shared validation helpers for data coming from the external Narrow Arrow API. */

export function isValidUsername(username: unknown): username is string {
  return (
    typeof username === "string" &&
    username.trim().length >= 1 &&
    username.trim().length <= 50
  );
}

export function isValidName(name: unknown, max = 200): name is string {
  return typeof name === "string" && name.trim().length > 0 && name.length <= max;
}

export function isValidCompletionTime(time: unknown): time is number {
  const value = Number(time);
  return Number.isFinite(value) && value > 0 && value < 100000;
}

export function isValidHttpUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeText(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}
