// Hardcoded jam events — there is intentionally no admin page for events.
// To add a new jam: copy the entry below, update the times/database windows in
// supabase/migrations (jam_submission_open / jam_voting_open) and append it here.

export interface JamEventConfig {
  /** Matches jam_id in the database. */
  id: string;
  /** URL slug: /events/:slug */
  slug: string;
  name: string;
  host: string;
  tagline: string;
  description: string;
  rules: string[];
  /** Epoch ms — submissions open + theme reveal. */
  startsAt: number;
  /** Epoch ms — submissions close (startsAt + 96h). */
  endsAt: number;
  /** Epoch ms — voting closes (endsAt + 7 days). */
  votingEndsAt: number;
  /** base64-encoded so it can't be grepped out of the bundle before the reveal. */
  themeEncoded: string;
}

export const LEVEL_JAM: JamEventConfig = {
  id: "level-jam-1",
  slug: "level-jam",
  name: "Level Jam",
  host: "Narrowlist",
  tagline: "Build a level in 96 hours, then rate the competition.",
  description:
    "The first Narrowlist Level Jam. When the jam starts, a theme is revealed — build a brand new level around it within 96 hours. After the jam ends, everyone rates the entries in the categories Enjoyment, Creativity and Design. Participants can rate every level, everyone else rates levels from their personal queue.",
  rules: [
    "Build a level that fits the theme — the theme is revealed the moment the jam starts.",
    "You have exactly 96 hours: Thursday 21:00 to Monday 21:00 (UTC+2).",
    "You can submit up to 5 levels. Each must be uploaded on the account your Narrowlist profile is linked to.",
    "Team up: add collaborators (up to 15 per level) from their entry page. Collaborators count as participants.",
    "Your level must be new — built during the jam.",
    "After the jam ends, voting runs for 7 days in the categories Enjoyment, Creativity and Design.",
    "Participants can rate any level (except ones they worked on). Everyone else rates levels from the queue — after 5 ratings, free voting unlocks.",
  ],
  // Thursday August 27th 2026, 21:00 UTC+2 (discord: t:1787857200)
  startsAt: Date.UTC(2026, 7, 27, 19, 0, 0),
  // 96 hours later — Monday August 31st 2026, 21:00 UTC+2
  endsAt: Date.UTC(2026, 7, 31, 19, 0, 0),
  // Voting closes 7 days after the jam — Monday September 7th 2026, 21:00 UTC+2
  votingEndsAt: Date.UTC(2026, 8, 7, 19, 0, 0),
  themeEncoded: "TWlzdGVyeQ==",
};

export const JAM_EVENTS: JamEventConfig[] = [LEVEL_JAM];

export const JAM_RATING_CATEGORIES = [
  { key: "enjoyment", label: "Enjoyment" },
  { key: "creativity", label: "Creativity" },
  { key: "design", label: "Design" },
] as const;

export type JamRatingCategory = (typeof JAM_RATING_CATEGORIES)[number]["key"];

export type JamPhase = "upcoming" | "active" | "voting" | "ended";

export function getJamPhase(jam: JamEventConfig, now: number): JamPhase {
  if (now < jam.startsAt) return "upcoming";
  if (now < jam.endsAt) return "active";
  if (now < jam.votingEndsAt) return "voting";
  return "ended";
}

export type EventFilter = "active" | "future" | "past";

export function jamMatchesFilter(phase: JamPhase, filter: EventFilter): boolean {
  if (filter === "future") return phase === "upcoming";
  if (filter === "past") return phase === "ended";
  return phase === "active" || phase === "voting";
}

/** The theme is only revealed once the jam starts. Before that this returns null. */
export function getRevealedTheme(jam: JamEventConfig, now: number): string | null {
  if (now < jam.startsAt) return null;
  try {
    return atob(jam.themeEncoded);
  } catch {
    return null;
  }
}

export function findJamBySlug(slug: string | undefined): JamEventConfig | undefined {
  return JAM_EVENTS.find((j) => j.slug === slug);
}
