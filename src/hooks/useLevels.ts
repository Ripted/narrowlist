import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchLevelDetails, fetchLeaderboard, LevelDetails, LeaderboardEntry } from "@/lib/api";

export interface LevelWithRank extends LevelDetails {
  rank: number;
  points: number;
  thumbnailUrl?: string;
  dbId?: string;
  verifierUsername?: string;
}

export interface PlayerCompletion {
  levelId: string;
  levelName: string;
  points: number;
  time: number;
  completedAt?: string;
  isManualRun?: boolean;
}

export interface PlayerStats {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  completions: PlayerCompletion[];
}

interface DbLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  verifier_profile_id: string | null;
}

interface DbProfile {
  id: string;
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
    .select("id, username, display_name, avatar_url");
  
  profileCache = new Map();
  if (data) {
    for (const p of data) {
      profileCache.set(p.username.toLowerCase(), p);
    }
  }
  return profileCache;
}

// Map profile IDs to profile data
let profileIdCache: Map<string, DbProfile> | null = null;

async function getProfileIdCache(): Promise<Map<string, DbProfile>> {
  if (profileIdCache) return profileIdCache;
  
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url");
  
  profileIdCache = new Map();
  if (data) {
    for (const p of data) {
      profileIdCache.set(p.id, p);
    }
  }
  return profileIdCache;
}

export function getPlayerProfile(username: string): DbProfile | undefined {
  return profileCache?.get(username.toLowerCase());
}

// Function to fetch levels data
async function fetchLevelsData(): Promise<LevelWithRank[]> {
  // Fetch levels from database and profile ID cache in parallel
  const [dbResult, profileIdCacheResult] = await Promise.all([
    supabase
      .from("levels")
      .select("*")
      .order("rank_position", { ascending: true }),
    getProfileIdCache(),
  ]);

  if (dbResult.error) throw dbResult.error;

  if (!dbResult.data || dbResult.data.length === 0) {
    return [];
  }

  // Fetch details from API in batches to avoid rate limiting
  const batchSize = 5;
  const results: { details: LevelDetails | null; dbLevel: DbLevel }[] = [];
  
  for (let i = 0; i < dbResult.data.length; i += batchSize) {
    const batch = dbResult.data.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((dbLevel: DbLevel) =>
        fetchLevelDetails(dbLevel.level_id).then((details) => ({
          details,
          dbLevel,
        }))
      )
    );
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
    
    // Small delay between batches
    if (i + batchSize < dbResult.data.length) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
  
  const validLevels: LevelWithRank[] = results
    .filter((r) => r.details !== null)
    .map((r) => {
      // Get verifier username from profile ID
      const verifierProfile = r.dbLevel.verifier_profile_id 
        ? profileIdCacheResult.get(r.dbLevel.verifier_profile_id)
        : null;
      
      // Use creators array if available, otherwise fall back to DB author, then API author
      const dbCreators = (r.dbLevel as any).creators as string[] | null;
      const displayAuthor = dbCreators && dbCreators.length > 0
        ? dbCreators.join(", ")
        : r.dbLevel.author || r.details!.levelInfo.author;
      
      return {
        ...r.details!,
        // Override with DB values if available
        levelInfo: {
          ...r.details!.levelInfo,
          name: r.dbLevel.name || r.details!.levelInfo.name,
          author: displayAuthor,
        },
        rank: r.dbLevel.rank_position,
        points: r.dbLevel.points,
        thumbnailUrl: r.dbLevel.thumbnail_url || undefined,
        dbId: r.dbLevel.id,
        verifierUsername: verifierProfile?.display_name || verifierProfile?.username,
      };
    });

  return validLevels;
}

export function useLevels() {
  const { data: levels = [], isLoading: loading, error } = useQuery({
    queryKey: ["levels"],
    queryFn: fetchLevelsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });

  return { 
    levels, 
    loading, 
    error: error ? "Failed to load levels" : null 
  };
}

export function useLevel(levelId: string, isExtended?: boolean) {
  const [level, setLevel] = useState<LevelDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [levelDbId, setLevelDbId] = useState<string | null>(null);
  const [verifierProfileId, setVerifierProfileId] = useState<string | null>(null);
  const [alternativeIds, setAlternativeIds] = useState<string[]>([]);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFromExtendedList, setIsFromExtendedList] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      
      // Fetch from API
      const [details, lb] = await Promise.all([
        fetchLevelDetails(levelId),
        fetchLeaderboard(levelId),
      ]);

      // Try main levels table first
      const dbResult = await supabase
        .from("levels")
        .select("id, rank_position, points, name, author, creators, thumbnail_url, verifier_profile_id, alternative_ids, description")
        .eq("level_id", levelId)
        .maybeSingle();

      let dbData = dbResult.data;
      let fromExtended = false;

      // If not found in main levels, check extended_levels
      if (!dbData && isExtended !== false) {
        const extendedResult = await supabase
          .from("extended_levels")
          .select("id, rank_position, points, name, author, creators, thumbnail_url, verifier_profile_id, alternative_ids, description")
          .eq("level_id", levelId)
          .maybeSingle();
        
        if (extendedResult.data) {
          dbData = extendedResult.data;
          fromExtended = true;
        }
      }

      setIsFromExtendedList(fromExtended);
      const altIds = dbData?.alternative_ids || [];
      setAlternativeIds(altIds);

      // Fetch leaderboards for alternative IDs if any
      let combinedLeaderboard = [...lb];
      
      if (altIds.length > 0) {
        const altLeaderboards = await Promise.all(
          altIds.map(altId => fetchLeaderboard(altId))
        );
        
        // Merge alternative leaderboards, avoiding duplicates by username
        const seenUsernames = new Set(lb.map(e => e.username.toLowerCase()));
        for (const altLb of altLeaderboards) {
          for (const entry of altLb) {
            if (!seenUsernames.has(entry.username.toLowerCase())) {
              seenUsernames.add(entry.username.toLowerCase());
              combinedLeaderboard.push(entry);
            }
          }
        }
        
        // Sort by completion time
        combinedLeaderboard.sort((a, b) => a.completion_time - b.completion_time);
      }

      if (details && dbData) {
        const dbCreators = (dbData as any).creators as string[] | null;
        const displayAuthor = dbCreators && dbCreators.length > 0
          ? dbCreators.join(", ")
          : dbData.name ? (dbData.author || details.levelInfo.author) : details.levelInfo.author;
        
        setLevel({
          ...details,
          levelInfo: {
            ...details.levelInfo,
            name: dbData.name || details.levelInfo.name,
            author: displayAuthor,
          },
        });
        setRank(dbData.rank_position);
        setPoints(dbData.points);
        setThumbnailUrl(dbData.thumbnail_url);
        setLevelDbId(dbData.id);
        setVerifierProfileId(dbData.verifier_profile_id);
        setDescription((dbData as any).description ?? null);
      } else if (details) {
        setLevel(details);
        setDescription(null);
      }
      
      setLeaderboard(combinedLeaderboard);
      setLoading(false);
    }

    load();
  }, [levelId, isExtended]);

  return { level, leaderboard, rank, points, thumbnailUrl, levelDbId, verifierProfileId, alternativeIds, description, loading, isFromExtendedList };
}

// Function to fetch player stats data
async function fetchPlayerStatsData(): Promise<PlayerStats[]> {
  // Fetch profiles, levels, completions, and manual runs in parallel
  const [profileCacheResult, levelsResult, completionsResult, manualRunsResult] = await Promise.all([
    getProfileCache(),
    supabase
      .from("levels")
      .select("id, level_id, points, rank_position, name")
      .order("rank_position", { ascending: true }),
    supabase
      .from("completions")
      .select("profile_id, level_id, completed_at, completion_time"),
    supabase
      .from("manual_runs")
      .select("profile_id, level_id, completed_at, completion_time"),
  ]);

  const dbLevels = levelsResult.data;
  const completions = completionsResult.data;
  const manualRuns = manualRunsResult.data;
  
  if (!dbLevels || dbLevels.length === 0) {
    return [];
  }

  // Create maps: levelMapById maps UUID id to info (for completion lookups)
  // levelMapByLevelId maps string level_id to info
  const levelMapById = new Map<string, { level_id: string; name: string; points: number; rank: number }>();
  const levelMapByLevelId = new Map<string, { id: string; name: string; points: number; rank: number }>();
  for (const level of dbLevels) {
    levelMapById.set(level.id, { level_id: level.level_id, name: level.name || "Unknown Level", points: level.points, rank: level.rank_position });
    levelMapByLevelId.set(level.level_id, { id: level.id, name: level.name || "Unknown Level", points: level.points, rank: level.rank_position });
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

  // Process DB completions
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
  }
  
  // Process manual runs (they also give points!)
  if (manualRuns && manualRuns.length > 0) {
    for (const run of manualRuns) {
      const profileInfo = profileIdMap.get(run.profile_id);
      if (!profileInfo) continue;
      
      const username = profileInfo.username;
      // manual_runs.level_id is the UUID (levels.id), so use levelMapById
      const levelInfo = levelMapById.get(run.level_id);
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
          time: run.completion_time,
          completedAt: run.completed_at,
          isManualRun: true,
        });
      }
    }
  }

  // Fallback to API leaderboards if no DB completions AND no manual runs
  if ((!completions || completions.length === 0) && (!manualRuns || manualRuns.length === 0)) {
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

  return sortedPlayers;
}

export function usePlayerLeaderboard() {
  const { data: players = [], isLoading: loading } = useQuery({
    queryKey: ["playerLeaderboard"],
    queryFn: fetchPlayerStatsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });

  return { players, loading };
}
