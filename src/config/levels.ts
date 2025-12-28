// Level IDs configuration
// The order determines the ranking - first ID is #1 (hardest), second is #2, etc.
// Simply add or remove level IDs to modify the list

export const LEVEL_IDS: string[] = [
  "1743661104278", // Example: Tower of hell
  // Add more level IDs here in order of difficulty (hardest first)
  // "1234567890123",
  // "9876543210987",
];

// Points calculation based on ranking position
export function getPointsForRank(rank: number): number {
  if (rank === 1) return 30;
  if (rank === 2) return 24;
  if (rank === 3) return 20;
  if (rank === 4) return 16;
  if (rank === 5) return 13;
  if (rank >= 6 && rank <= 10) return 9;
  if (rank >= 11 && rank <= 25) return 6;
  if (rank >= 26 && rank <= 50) return 2;
  return 1; // 51+
}

// API base URL
export const API_BASE_URL = "https://api.narrowarrow.xyz";
