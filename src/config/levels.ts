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
  if (rank === 1) return 28;
  if (rank === 2) return 24;
  if (rank === 3) return 21;
  if (rank === 4) return 18;
  if (rank === 5) return 16;
  if (rank >= 6 && rank <= 10) return 13;
  if (rank >= 11 && rank <= 20) return 10;
  if (rank >= 21 && rank <= 30) return 7;
  if (rank >= 31 && rank <= 50) return 4;
  if (rank >= 51 && rank <= 70) return 2;
  if (rank >= 71 && rank <= 100) return 1;
  return 0; // 101+ (Extended List - no points)
}

// API base URL
export const API_BASE_URL = "https://api.narrowarrow.xyz";
