import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchLevelDetails, fetchLeaderboard, LevelDetails, LeaderboardEntry } from "@/lib/api";
import { getPlayerProfile } from "@/config/profiles";

export interface LevelWithRank extends LevelDetails {
  rank: number;
  points: number;
  thumbnailUrl?: string;
  dbId?: string;
}

export interface PlayerStats {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  completions: { levelId: string; levelName: string; points: number; time: number }[];
}

interface DbLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
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
        // Fetch levels from database
        const { data: dbLevels, error: dbError } = await supabase
          .from("levels")
          .select("*")
          .order("rank_position", { ascending: true });

        if (dbError) throw dbError;

        if (!dbLevels || dbLevels.length === 0) {
          setLevels([]);
          setLoading(false);
          return;
        }

        // Fetch details from API for each level
        const levelPromises = dbLevels.map((dbLevel: DbLevel) =>
          fetchLevelDetails(dbLevel.level_id).then((details) => ({
            details,
            dbLevel,
          }))
        );

        const results = await Promise.all(levelPromises);
        
        const validLevels: LevelWithRank[] = results
          .filter((r) => r.details !== null)
          .map((r) => ({
            ...r.details!,
            // Override with DB values if available
            levelInfo: {
              ...r.details!.levelInfo,
              name: r.dbLevel.name || r.details!.levelInfo.name,
              author: r.dbLevel.author || r.details!.levelInfo.author,
            },
            rank: r.dbLevel.rank_position,
            points: r.dbLevel.points,
            thumbnailUrl: r.dbLevel.thumbnail_url || undefined,
            dbId: r.dbLevel.id,
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
  const [points, setPoints] = useState<number>(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      
      // Fetch from DB and API in parallel
      const [details, lb, dbResult] = await Promise.all([
        fetchLevelDetails(levelId),
        fetchLeaderboard(levelId),
        supabase
          .from("levels")
          .select("rank_position, points, name, author, thumbnail_url")
          .eq("level_id", levelId)
          .maybeSingle(),
      ]);

      if (details && dbResult.data) {
        setLevel({
          ...details,
          levelInfo: {
            ...details.levelInfo,
            name: dbResult.data.name || details.levelInfo.name,
            author: dbResult.data.author || details.levelInfo.author,
          },
        });
        setRank(dbResult.data.rank_position);
        setPoints(dbResult.data.points);
        setThumbnailUrl(dbResult.data.thumbnail_url);
      } else {
        setLevel(details);
      }
      
      setLeaderboard(lb);
      setLoading(false);
    }

    load();
  }, [levelId]);

  return { level, leaderboard, rank, points, thumbnailUrl, loading };
}

export function usePlayerLeaderboard() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayerStats() {
      setLoading(true);
      
      // Fetch from database first
      const { data: dbLevels } = await supabase
        .from("levels")
        .select("id, level_id, points, rank_position, name")
        .order("rank_position", { ascending: true });

      if (!dbLevels || dbLevels.length === 0) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      const playerMap = new Map<string, PlayerStats>();
      
      // Fetch leaderboards for all levels
      const leaderboardPromises = dbLevels.map((level) =>
        fetchLeaderboard(level.level_id).then((lb) => ({
          levelId: level.level_id,
          levelName: level.name || "Unknown Level",
          points: level.points,
          leaderboard: lb,
        }))
      );

      const results = await Promise.all(leaderboardPromises);

      // Aggregate player stats
      for (const { levelId, levelName, points, leaderboard } of results) {
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