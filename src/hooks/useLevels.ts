import { useState, useEffect } from "react";
import { LEVEL_IDS, getPointsForRank } from "@/config/levels";
import { fetchLevelDetails, fetchLeaderboard, LevelDetails, LeaderboardEntry } from "@/lib/api";
import { getPlayerProfile } from "@/config/profiles";

export interface LevelWithRank extends LevelDetails {
  rank: number;
  points: number;
  thumbnailUrl?: string;
}

export interface PlayerStats {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  completions: { levelId: string; levelName: string; points: number; time: number }[];
}

export function useLevels() {
  const [levels, setLevels] = useState<LevelWithRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLevels() {
      setLoading(true);
      setError(null);
      
      try {
        const levelPromises = LEVEL_IDS.map((id, index) =>
          fetchLevelDetails(id).then((details) => ({
            details,
            rank: index + 1,
          }))
        );

        const results = await Promise.all(levelPromises);
        
        const validLevels: LevelWithRank[] = results
          .filter((r) => r.details !== null)
          .map((r) => ({
            ...r.details!,
            rank: r.rank,
            points: getPointsForRank(r.rank),
          }));

        setLevels(validLevels);
      } catch (err) {
        setError("Failed to load levels");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadLevels();
  }, []);

  return { levels, loading, error };
}

export function useLevel(levelId: string) {
  const [level, setLevel] = useState<LevelDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      
      const [details, lb] = await Promise.all([
        fetchLevelDetails(levelId),
        fetchLeaderboard(levelId),
      ]);

      setLevel(details);
      setLeaderboard(lb);
      
      const rankIndex = LEVEL_IDS.indexOf(levelId);
      setRank(rankIndex >= 0 ? rankIndex + 1 : null);
      
      setLoading(false);
    }

    load();
  }, [levelId]);

  return { level, leaderboard, rank, loading };
}

export function usePlayerLeaderboard() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayerStats() {
      setLoading(true);
      
      const playerMap = new Map<string, PlayerStats>();
      
      // Fetch leaderboards for all levels
      const leaderboardPromises = LEVEL_IDS.map((id, index) =>
        fetchLeaderboard(id).then((lb) => ({
          levelId: id,
          rank: index + 1,
          leaderboard: lb,
        }))
      );

      const results = await Promise.all(leaderboardPromises);

      // Also fetch level names
      const levelDetailsPromises = LEVEL_IDS.map((id) => fetchLevelDetails(id));
      const levelDetails = await Promise.all(levelDetailsPromises);
      const levelNameMap = new Map<string, string>();
      levelDetails.forEach((d) => {
        if (d) levelNameMap.set(d.levelInfo.level_id, d.levelInfo.name);
      });

      // Aggregate player stats
      for (const { levelId, rank, leaderboard } of results) {
        const points = getPointsForRank(rank);
        const levelName = levelNameMap.get(levelId) || "Unknown Level";

        for (const entry of leaderboard) {
          const username = entry.username;
          const profile = getPlayerProfile(username);
          
          if (!playerMap.has(username)) {
            playerMap.set(username, {
              username,
              displayName: profile?.displayName,
              avatarUrl: profile?.avatarUrl,
              totalPoints: 0,
              completions: [],
            });
          }

          const player = playerMap.get(username)!;
          // Only count each level once (first completion)
          if (!player.completions.find((c) => c.levelId === levelId)) {
            player.totalPoints += points;
            player.completions.push({
              levelId,
              levelName,
              points,
              time: entry.completion_time,
            });
          }
        }
      }

      // Sort by total points
      const sortedPlayers = Array.from(playerMap.values()).sort(
        (a, b) => b.totalPoints - a.totalPoints
      );

      setPlayers(sortedPlayers);
      setLoading(false);
    }

    loadPlayerStats();
  }, []);

  return { players, loading };
}
