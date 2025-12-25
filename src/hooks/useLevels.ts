import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchLevelDetails, fetchLeaderboard, LevelDetails, LeaderboardEntry } from "@/lib/api";

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
  completions: { levelId: string; levelName: string; points: number; time: number; completedAt?: string }[];
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

interface DbProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Cache for profiles to avoid repeated queries
let profileCache: Map<string, DbProfile> | null = null;

async function getProfileCache(): Promise<Map<string, DbProfile>> {
  if (profileCache) return profileCache;
  
  const { data } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url");
  
  profileCache = new Map();
  if (data) {
    for (const p of data) {
      profileCache.set(p.username.toLowerCase(), p);
    }
  }
  return profileCache;
}

export function getPlayerProfile(username: string): DbProfile | undefined {
  return profileCache?.get(username.toLowerCase());
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
  const [levelDbId, setLevelDbId] = useState<string | null>(null);
  const [verifierProfileId, setVerifierProfileId] = useState<string | null>(null);
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
          .select("id, rank_position, points, name, author, thumbnail_url, verifier_profile_id")
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
        setLevelDbId(dbResult.data.id);
        setVerifierProfileId(dbResult.data.verifier_profile_id);
      } else {
        setLevel(details);
      }
      
      setLeaderboard(lb);
      setLoading(false);
    }

    load();
  }, [levelId]);

  return { level, leaderboard, rank, points, thumbnailUrl, levelDbId, verifierProfileId, loading };
}

export function usePlayerLeaderboard() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlayerStats() {
      setLoading(true);
      
      // Fetch profiles, levels, and completions in parallel
      const [profileCacheResult, levelsResult, completionsResult] = await Promise.all([
        getProfileCache(),
        supabase
          .from("levels")
          .select("id, level_id, points, rank_position, name")
          .order("rank_position", { ascending: true }),
        supabase
          .from("completions")
          .select("profile_id, level_id, completed_at, completion_time"),
      ]);

      const dbLevels = levelsResult.data;
      const completions = completionsResult.data;
      
      if (!dbLevels || dbLevels.length === 0) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      // Create maps: levelMapById maps UUID id to info (for completion lookups)
      // levelMapByLevelId maps string level_id to info
      const levelMapById = new Map<string, { level_id: string; name: string; points: number }>();
      const levelMapByLevelId = new Map<string, { id: string; name: string; points: number }>();
      for (const level of dbLevels) {
        levelMapById.set(level.id, { level_id: level.level_id, name: level.name || "Unknown Level", points: level.points });
        levelMapByLevelId.set(level.level_id, { id: level.id, name: level.name || "Unknown Level", points: level.points });
      }

      // Fetch all profiles to map profile_id to username
      const { data: profilesData } = await supabase.from("profiles").select("id, username, display_name, avatar_url");
      const profileIdMap = new Map<string, { username: string; display_name: string | null; avatar_url: string | null }>();
      if (profilesData) {
        for (const p of profilesData) {
          profileIdMap.set(p.id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url });
        }
      }

      const playerMap = new Map<string, PlayerStats>();

      // Use DB completions if available
      if (completions && completions.length > 0) {
        for (const completion of completions) {
          const profileInfo = profileIdMap.get(completion.profile_id);
          if (!profileInfo) continue;
          
          const username = profileInfo.username;
          // completion.level_id is the UUID (levels.id), so use levelMapById
          const levelInfo = levelMapById.get(completion.level_id);
          if (!levelInfo) continue;
          
          if (!playerMap.has(username)) {
            playerMap.set(username, {
              username,
              displayName: profileInfo.display_name || undefined,
              avatarUrl: profileInfo.avatar_url || undefined,
              totalPoints: 0,
              completions: [],
            });
          }

          const player = playerMap.get(username)!;
          
          // Only count each level once - use string level_id for dedup
          if (!player.completions.find((c) => c.levelId === levelInfo.level_id)) {
            player.totalPoints += levelInfo.points;
            player.completions.push({
              levelId: levelInfo.level_id,
              levelName: levelInfo.name,
              points: levelInfo.points,
              time: completion.completion_time,
              completedAt: completion.completed_at,
            });
          }
        }
      } else {
        // Fallback to API leaderboards if no DB completions
        const leaderboardPromises = dbLevels.map((level) =>
          fetchLeaderboard(level.level_id).then((lb) => ({
            levelId: level.level_id,
            levelName: level.name || "Unknown Level",
            points: level.points,
            leaderboard: lb,
          }))
        );

        const results = await Promise.all(leaderboardPromises);

        for (const { levelId, levelName, points, leaderboard } of results) {
          for (const entry of leaderboard) {
            const username = entry.username;
            const profile = profileCacheResult.get(username.toLowerCase());
            
            if (!playerMap.has(username)) {
              playerMap.set(username, {
                username,
                displayName: profile?.display_name || undefined,
                avatarUrl: profile?.avatar_url || undefined,
                totalPoints: 0,
                completions: [],
              });
            }

            const player = playerMap.get(username)!;
            if (profile) {
              player.displayName = profile.display_name || player.displayName;
              player.avatarUrl = profile.avatar_url || player.avatarUrl;
            }
            
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
