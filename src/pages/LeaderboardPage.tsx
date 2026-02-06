import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePlayerLeaderboard } from "@/hooks/useLevels";
import { PlayerCard } from "@/components/PlayerCard";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Search, Calendar, X, Hammer, Crown, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface HistoricalPlayerStats {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  completions: number;
}

interface CreatorStats {
  author: string;
  levelCount: number;
  totalPoints: number;
  avatarUrl?: string;
  levels: {
    id: string;
    level_id: string;
    name: string | null;
    rank_position: number;
    points: number;
    thumbnail_url: string | null;
  }[];
}

interface ExtraPointsPlayer {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  extra_points: number;
}

export default function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "players";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { players, loading } = usePlayerLeaderboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [historicalDate, setHistoricalDate] = useState<string | null>(null);
  const [historicalPlayers, setHistoricalPlayers] = useState<HistoricalPlayerStats[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  // Extra Points leaderboard data
  const { data: extraPointsPlayers = [], isLoading: loadingExtraPoints } = useQuery({
    queryKey: ["extra-points-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, extra_points")
        .gt("extra_points", 0)
        .order("extra_points", { ascending: false });
      
      if (error) throw error;
      return (data as ExtraPointsPlayer[]) || [];
    },
  });

  // Creator leaderboard data
  const { data: levels = [], isLoading: loadingCreators } = useQuery({
    queryKey: ["levels-for-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("levels")
        .select("id, level_id, name, author, creators, rank_position, points, thumbnail_url")
        .order("rank_position");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles for creator avatar matching
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url");
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
    setSearchQuery("");
  };

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter(
      (player) =>
        player.username.toLowerCase().includes(query) ||
        (player.displayName?.toLowerCase().includes(query))
    );
  }, [players, searchQuery]);

  // Load historical leaderboard when date is selected
  useEffect(() => {
    async function loadHistoricalData() {
      if (!historicalDate) {
        setHistoricalPlayers([]);
        return;
      }

      setLoadingHistorical(true);

      try {
        // Get all profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url");

        // Get all levels with points
        const { data: levels } = await supabase
          .from("levels")
          .select("id, points");

        // Get completions before the selected date
        const { data: completions } = await supabase
          .from("completions")
          .select("profile_id, level_id, completed_at")
          .lte("completed_at", historicalDate);

        // Get manual runs before the selected date
        const { data: manualRuns } = await supabase
          .from("manual_runs")
          .select("profile_id, level_id, completed_at")
          .lte("completed_at", historicalDate);

        if (!profiles || !levels) {
          setLoadingHistorical(false);
          return;
        }

        const levelPointsMap = new Map<string, number>();
        levels.forEach(l => levelPointsMap.set(l.id, l.points));

        const profileMap = new Map<string, { username: string; display_name: string | null; avatar_url: string | null }>();
        profiles.forEach(p => profileMap.set(p.id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }));

        // Calculate points for each player
        const playerStats = new Map<string, { totalPoints: number; completedLevels: Set<string> }>();

        // Process completions
        if (completions) {
          for (const c of completions) {
            if (!playerStats.has(c.profile_id)) {
              playerStats.set(c.profile_id, { totalPoints: 0, completedLevels: new Set() });
            }
            const stats = playerStats.get(c.profile_id)!;
            if (!stats.completedLevels.has(c.level_id)) {
              stats.completedLevels.add(c.level_id);
              stats.totalPoints += levelPointsMap.get(c.level_id) || 0;
            }
          }
        }

        // Process manual runs
        if (manualRuns) {
          for (const r of manualRuns) {
            if (!playerStats.has(r.profile_id)) {
              playerStats.set(r.profile_id, { totalPoints: 0, completedLevels: new Set() });
            }
            const stats = playerStats.get(r.profile_id)!;
            if (!stats.completedLevels.has(r.level_id)) {
              stats.completedLevels.add(r.level_id);
              stats.totalPoints += levelPointsMap.get(r.level_id) || 0;
            }
          }
        }

        // Convert to array and sort
        const historicalData: HistoricalPlayerStats[] = [];
        for (const [profileId, stats] of playerStats) {
          const profile = profileMap.get(profileId);
          if (profile && stats.totalPoints > 0) {
            historicalData.push({
              username: profile.username,
              displayName: profile.display_name || undefined,
              avatarUrl: profile.avatar_url || undefined,
              totalPoints: stats.totalPoints,
              completions: stats.completedLevels.size,
            });
          }
        }

        historicalData.sort((a, b) => b.totalPoints - a.totalPoints);
        setHistoricalPlayers(historicalData);
      } catch (error) {
        console.error("Error loading historical data:", error);
      } finally {
        setLoadingHistorical(false);
      }
    }

    loadHistoricalData();
  }, [historicalDate]);

  const displayPlayers = historicalDate ? historicalPlayers : filteredPlayers;
  const isLoading = historicalDate ? loadingHistorical : loading;

  const filteredHistoricalPlayers = useMemo(() => {
    if (!historicalDate || !searchQuery.trim()) return historicalPlayers;
    const query = searchQuery.toLowerCase();
    return historicalPlayers.filter(
      (player) =>
        player.username.toLowerCase().includes(query) ||
        (player.displayName?.toLowerCase().includes(query))
    );
  }, [historicalPlayers, searchQuery, historicalDate]);

  const finalDisplayPlayers = historicalDate ? filteredHistoricalPlayers : filteredPlayers;

  // Build profile lookup map
  const profileMap = useMemo(() => {
    const map = new Map<string, { avatarUrl?: string }>();
    profiles.forEach((p: any) => {
      map.set(p.username.toLowerCase(), { avatarUrl: p.avatar_url });
    });
    return map;
  }, [profiles]);

  // Creator stats calculation - handles both single author and multiple creators
  // FIXED: Sort by level count, not total points
  const creatorStats = useMemo(() => {
    const statsMap = new Map<string, CreatorStats>();
    
    levels.forEach((level: any) => {
      // Get all creators - from creators array or fall back to author field
      const creatorsList: string[] = [];
      
      if (level.creators && level.creators.length > 0) {
        creatorsList.push(...level.creators);
      } else if (level.author) {
        creatorsList.push(level.author);
      } else {
        creatorsList.push("Unknown");
      }
      
      // Add this level to each creator's stats
      creatorsList.forEach((creator: string) => {
        const existing = statsMap.get(creator);
        const levelData = {
          id: level.id,
          level_id: level.level_id,
          name: level.name,
          rank_position: level.rank_position,
          points: level.points,
          thumbnail_url: level.thumbnail_url,
        };
        
        // Find matching profile for avatar
        const profileInfo = profileMap.get(creator.toLowerCase());
        
        if (existing) {
          existing.levelCount++;
          existing.totalPoints += level.points;
          existing.levels.push(levelData);
        } else {
          statsMap.set(creator, {
            author: creator,
            levelCount: 1,
            totalPoints: level.points,
            avatarUrl: profileInfo?.avatarUrl,
            levels: [levelData],
          });
        }
      });
    });
    
    // Sort by level count (number of levels created), not by total points
    return Array.from(statsMap.values())
      .sort((a, b) => b.levelCount - a.levelCount);
  }, [levels, profileMap]);

  const filteredCreators = useMemo(() => {
    if (!searchQuery.trim()) return creatorStats;
    const query = searchQuery.toLowerCase();
    return creatorStats.filter(c => 
      c.author.toLowerCase().includes(query)
    );
  }, [creatorStats, searchQuery]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: "text-glow-gold", bg: "bg-glow-gold/10" };
    if (rank === 2) return { color: "text-glow-silver", bg: "bg-glow-silver/10" };
    if (rank === 3) return { color: "text-glow-bronze", bg: "bg-glow-bronze/10" };
    return { color: "text-muted-foreground", bg: "bg-muted/50" };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <TabsList className="bg-secondary/50 border border-border">
                <TabsTrigger value="players" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Trophy className="w-4 h-4" />
                  Players
                </TabsTrigger>
                <TabsTrigger value="extra" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Star className="w-4 h-4" />
                  Extra
                </TabsTrigger>
                <TabsTrigger value="creators" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Hammer className="w-4 h-4" />
                  Creators
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={activeTab === "players" ? "Search players..." : "Search creators..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary border-border h-9"
                  />
                </div>
                
                {activeTab === "players" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant={historicalDate ? "default" : "outline"} 
                        size="sm" 
                        className="gap-2 h-9 flex-shrink-0"
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">{historicalDate ? "Historical" : "View History"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4" align="end">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">View Historical Leaderboard</h4>
                        <p className="text-xs text-muted-foreground">See the leaderboard as it was on a specific date.</p>
                        <Input
                          type="datetime-local"
                          value={historicalDate || ""}
                          onChange={(e) => setHistoricalDate(e.target.value || null)}
                          className="h-9"
                        />
                        {historicalDate && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setHistoricalDate(null)}
                            className="w-full gap-2"
                          >
                            <X className="w-4 h-4" />
                            Clear / Show Current
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            
            {historicalDate && activeTab === "players" && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">Viewing leaderboard as of:</span>
                  <span className="text-foreground">{new Date(historicalDate).toLocaleString()}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setHistoricalDate(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Players Tab */}
            <TabsContent value="players" className="space-y-6 mt-0">
              {/* Stats */}
              {!isLoading && finalDisplayPlayers.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded font-mono">{finalDisplayPlayers.length} Players</span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono">{finalDisplayPlayers[0]?.totalPoints || 0} Top</span>
                </div>
              )}

              {/* Top 3 Podium - only show for current leaderboard */}
              {!isLoading && !historicalDate && players.length >= 3 && !searchQuery && (
                <div className="hidden md:flex items-end justify-center gap-4 mb-8">
                  {/* Second place */}
                  <Link to={`/player/${players[1].username}`} className="text-center animate-fade-in cursor-pointer group" style={{ animationDelay: "100ms" }}>
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-glow-silver overflow-hidden bg-gradient-to-br from-glow-silver/30 to-glow-silver/60 group-hover:scale-105 transition-transform">
                      {players[1].avatarUrl ? (
                        <img src={players[1].avatarUrl} alt={players[1].displayName || players[1].username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-foreground">
                          {(players[1].displayName || players[1].username).charAt(0)}
                        </div>
                      )}
                    </div>
                    <Medal className="w-6 h-6 mx-auto text-glow-silver mb-1" />
                    <div className="font-display font-bold text-foreground group-hover:text-primary transition-colors">{players[1].displayName || players[1].username}</div>
                    <div className="font-mono text-sm text-primary">{players[1].totalPoints} pts</div>
                    <div className="w-24 h-24 bg-gradient-to-t from-glow-silver/60 to-glow-silver/30 rounded-t-lg mt-2" />
                  </Link>

                  {/* First place */}
                  <Link to={`/player/${players[0].username}`} className="text-center animate-fade-in cursor-pointer group">
                    <div className="w-32 h-32 mx-auto mb-3 rounded-full border-4 border-glow-gold overflow-hidden bg-gradient-to-br from-glow-gold/30 to-glow-gold/60 glow-gold group-hover:scale-105 transition-transform">
                      {players[0].avatarUrl ? (
                        <img src={players[0].avatarUrl} alt={players[0].displayName || players[0].username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-foreground">
                          {(players[0].displayName || players[0].username).charAt(0)}
                        </div>
                      )}
                    </div>
                    <Trophy className="w-8 h-8 mx-auto text-glow-gold mb-1" />
                    <div className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{players[0].displayName || players[0].username}</div>
                    <div className="font-mono text-primary text-lg">{players[0].totalPoints} pts</div>
                    <div className="w-32 h-32 bg-gradient-to-t from-glow-gold/60 to-glow-gold/30 rounded-t-lg mt-2" />
                  </Link>

                  {/* Third place */}
                  <Link to={`/player/${players[2].username}`} className="text-center animate-fade-in cursor-pointer group" style={{ animationDelay: "200ms" }}>
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-glow-bronze overflow-hidden bg-gradient-to-br from-glow-bronze/30 to-glow-bronze/60 group-hover:scale-105 transition-transform">
                      {players[2].avatarUrl ? (
                        <img src={players[2].avatarUrl} alt={players[2].displayName || players[2].username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-foreground">
                          {(players[2].displayName || players[2].username).charAt(0)}
                        </div>
                      )}
                    </div>
                    <Medal className="w-5 h-5 mx-auto text-glow-bronze mb-1" />
                    <div className="font-display font-bold text-foreground group-hover:text-primary transition-colors">{players[2].displayName || players[2].username}</div>
                    <div className="font-mono text-sm text-primary">{players[2].totalPoints} pts</div>
                    <div className="w-20 h-16 bg-gradient-to-t from-glow-bronze/60 to-glow-bronze/30 rounded-t-lg mt-2" />
                  </Link>
                </div>
              )}

              {/* Player list */}
              <div className="max-w-3xl mx-auto space-y-2 sm:space-y-3">
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <div key={i} className="h-16 sm:h-20 rounded-xl bg-card border border-border animate-pulse" />
                  ))
                ) : finalDisplayPlayers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "No players found matching your search." : historicalDate ? "No players had completed levels by this date." : "No players have completed any levels yet."}
                  </div>
                ) : (
                  finalDisplayPlayers.map((player, index) => {
                    const originalRank = historicalDate 
                      ? index + 1 
                      : players.findIndex(p => p.username === player.username) + 1;
                    const completionCount = historicalDate 
                      ? (player as HistoricalPlayerStats).completions 
                      : (player as any).completions?.length || 0;
                    return (
                      <div
                        key={player.username}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <PlayerCard
                          username={player.username}
                          displayName={player.displayName}
                          avatarUrl={player.avatarUrl}
                          totalPoints={player.totalPoints}
                          rank={originalRank}
                          completions={completionCount}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Extra Points Tab */}
            <TabsContent value="extra" className="space-y-6 mt-0">
              {/* Stats */}
              {!loadingExtraPoints && extraPointsPlayers.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded font-mono">{extraPointsPlayers.length} Players</span>
                  <span className="bg-accent/10 text-accent px-2 py-1 rounded font-mono flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {extraPointsPlayers[0]?.extra_points || 0} Top
                  </span>
                </div>
              )}

              {/* Top 3 Podium for Extra Points */}
              {!loadingExtraPoints && extraPointsPlayers.length >= 3 && !searchQuery && (
                <div className="hidden md:flex items-end justify-center gap-4 mb-8">
                  {/* Second place */}
                  <Link to={`/player/${extraPointsPlayers[1].username}`} className="text-center animate-fade-in cursor-pointer group" style={{ animationDelay: "100ms" }}>
                    <div className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-glow-silver overflow-hidden bg-gradient-to-br from-glow-silver/30 to-glow-silver/60 group-hover:scale-105 transition-transform">
                      {extraPointsPlayers[1].avatar_url ? (
                        <img src={extraPointsPlayers[1].avatar_url} alt={extraPointsPlayers[1].display_name || extraPointsPlayers[1].username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-foreground">
                          {(extraPointsPlayers[1].display_name || extraPointsPlayers[1].username).charAt(0)}
                        </div>
                      )}
                    </div>
                    <Medal className="w-6 h-6 mx-auto text-glow-silver mb-1" />
                    <div className="font-display font-bold text-foreground group-hover:text-primary transition-colors">{extraPointsPlayers[1].display_name || extraPointsPlayers[1].username}</div>
                    <div className="font-mono text-sm text-accent flex items-center justify-center gap-1"><Star className="w-3 h-3" />{extraPointsPlayers[1].extra_points} pts</div>
                    <div className="w-24 h-24 bg-gradient-to-t from-glow-silver/60 to-glow-silver/30 rounded-t-lg mt-2" />
                  </Link>

                  {/* First place */}
                  <Link to={`/player/${extraPointsPlayers[0].username}`} className="text-center animate-fade-in cursor-pointer group">
                    <div className="w-32 h-32 mx-auto mb-3 rounded-full border-4 border-glow-gold glow-gold overflow-hidden bg-gradient-to-br from-glow-gold/30 to-glow-gold/60 group-hover:scale-105 transition-transform">
                      {extraPointsPlayers[0].avatar_url ? (
                        <img src={extraPointsPlayers[0].avatar_url} alt={extraPointsPlayers[0].display_name || extraPointsPlayers[0].username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-foreground">
                          {(extraPointsPlayers[0].display_name || extraPointsPlayers[0].username).charAt(0)}
                        </div>
                      )}
                    </div>
                    <Crown className="w-8 h-8 mx-auto text-glow-gold mb-1" />
                    <div className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{extraPointsPlayers[0].display_name || extraPointsPlayers[0].username}</div>
                    <div className="font-mono text-accent flex items-center justify-center gap-1"><Star className="w-4 h-4" />{extraPointsPlayers[0].extra_points} pts</div>
                    <div className="w-24 h-32 bg-gradient-to-t from-glow-gold/60 to-glow-gold/30 rounded-t-lg mt-2" />
                  </Link>

                  {/* Third place */}
                  <Link to={`/player/${extraPointsPlayers[2].username}`} className="text-center animate-fade-in cursor-pointer group" style={{ animationDelay: "200ms" }}>
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-glow-bronze overflow-hidden bg-gradient-to-br from-glow-bronze/30 to-glow-bronze/60 group-hover:scale-105 transition-transform">
                      {extraPointsPlayers[2].avatar_url ? (
                        <img src={extraPointsPlayers[2].avatar_url} alt={extraPointsPlayers[2].display_name || extraPointsPlayers[2].username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-foreground">
                          {(extraPointsPlayers[2].display_name || extraPointsPlayers[2].username).charAt(0)}
                        </div>
                      )}
                    </div>
                    <Medal className="w-5 h-5 mx-auto text-glow-bronze mb-1" />
                    <div className="font-display font-bold text-foreground group-hover:text-primary transition-colors">{extraPointsPlayers[2].display_name || extraPointsPlayers[2].username}</div>
                    <div className="font-mono text-sm text-accent flex items-center justify-center gap-1"><Star className="w-3 h-3" />{extraPointsPlayers[2].extra_points} pts</div>
                    <div className="w-24 h-16 bg-gradient-to-t from-glow-bronze/60 to-glow-bronze/30 rounded-t-lg mt-2" />
                  </Link>
                </div>
              )}

              {/* Extra Points Player list */}
              <div className="max-w-3xl mx-auto space-y-2 sm:space-y-3">
                {loadingExtraPoints ? (
                  [...Array(10)].map((_, i) => (
                    <div key={i} className="h-16 sm:h-20 rounded-xl bg-card border border-border animate-pulse" />
                  ))
                ) : extraPointsPlayers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No players have earned extra points yet. Complete levels from the Extra List to earn extra points!
                  </div>
                ) : (
                  extraPointsPlayers
                    .filter(player => {
                      if (!searchQuery.trim()) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        player.username.toLowerCase().includes(query) ||
                        player.display_name?.toLowerCase().includes(query)
                      );
                    })
                    .map((player, index) => {
                      const rank = index + 1;
                      const { color, bg } = getRankBadge(rank);
                      
                      return (
                        <Link
                          key={player.id}
                          to={`/player/${player.username}`}
                          className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`font-display font-bold ${color}`}>#{rank}</span>
                          </div>
                          
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {player.avatar_url ? (
                              <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-display font-bold text-foreground">
                                {(player.display_name || player.username).charAt(0)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-semibold truncate">{player.display_name || player.username}</div>
                            <div className="text-sm text-muted-foreground">@{player.username}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-mono font-bold text-accent flex items-center gap-1 justify-end">
                              <Star className="w-4 h-4" />
                              {player.extra_points}
                            </div>
                            <div className="text-xs text-muted-foreground">extra pts</div>
                          </div>
                        </Link>
                      );
                    })
                )}
              </div>
            </TabsContent>

            {/* Creators Tab */}
            <TabsContent value="creators" className="space-y-6 mt-0">
              {/* Stats */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="bg-muted px-2 py-1 rounded font-mono">{creatorStats.length} Creators</span>
                <span className="bg-accent/10 text-accent px-2 py-1 rounded font-mono flex items-center gap-1">
                  <Hammer className="w-3 h-3" />
                  {creatorStats.reduce((sum, c) => sum + c.totalPoints, 0)} Creator Points
                </span>
              </div>

              {loadingCreators ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Top 3 Creator Podium */}
                  {!searchQuery && filteredCreators.length >= 3 && (
                    <div className="hidden md:flex items-end justify-center gap-4 mb-8">
                      {[1, 0, 2].map((podiumIndex) => {
                        const creator = filteredCreators[podiumIndex];
                        if (!creator) return null;
                        const rank = podiumIndex === 1 ? 2 : podiumIndex === 0 ? 1 : 3;
                        const { color, bg } = getRankBadge(rank);
                        const size = rank === 1 ? "w-32 h-32" : rank === 2 ? "w-24 h-24" : "w-20 h-20";
                        const pedestal = rank === 1 ? "h-32" : rank === 2 ? "h-24" : "h-16";
                        
                        return (
                          <Link
                            key={creator.author}
                            to={`/player/${creator.author}?view=creator`}
                            className="text-center animate-fade-in cursor-pointer group"
                            style={{ animationDelay: `${podiumIndex * 100}ms` }}
                          >
                            <div className={`${size} mx-auto mb-3 rounded-full border-4 ${rank === 1 ? "border-glow-gold glow-gold" : rank === 2 ? "border-glow-silver" : "border-glow-bronze"} overflow-hidden ${bg} group-hover:scale-105 transition-transform`}>
                              {creator.avatarUrl ? (
                                <img src={creator.avatarUrl} alt={creator.author} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Hammer className={`w-1/2 h-1/2 ${color}`} />
                                </div>
                              )}
                            </div>
                            {rank === 1 && <Crown className="w-8 h-8 mx-auto text-glow-gold mb-1" />}
                            {rank === 2 && <Medal className="w-6 h-6 mx-auto text-glow-silver mb-1" />}
                            {rank === 3 && <Medal className="w-5 h-5 mx-auto text-glow-bronze mb-1" />}
                            <div className="font-display font-bold text-foreground group-hover:text-primary transition-colors">{creator.author}</div>
                            <div className="font-mono text-sm text-accent flex items-center justify-center gap-1">
                              <Hammer className="w-3 h-3" />
                              {creator.totalPoints}
                            </div>
                            <div className="text-xs text-muted-foreground">{creator.levelCount} levels</div>
                            <div className={`w-24 ${pedestal} ${rank === 1 ? "bg-gradient-to-t from-glow-gold/60 to-glow-gold/30" : rank === 2 ? "bg-gradient-to-t from-glow-silver/60 to-glow-silver/30" : "bg-gradient-to-t from-glow-bronze/60 to-glow-bronze/30"} rounded-t-lg mt-2`} />
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Creator list - show all including top 3 */}
                  <div className="max-w-3xl mx-auto space-y-2 sm:space-y-3">
                    {filteredCreators.map((creator, index) => {
                      const rank = index + 1;
                      const { color, bg } = getRankBadge(rank);
                      
                      return (
                        <Link
                          key={creator.author}
                          to={`/player/${creator.author}?view=creator`}
                          className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all"
                        >
                          <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`font-display font-bold ${color}`}>#{rank}</span>
                          </div>
                          
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {creator.avatarUrl ? (
                              <img src={creator.avatarUrl} alt={creator.author} className="w-full h-full object-cover" />
                            ) : (
                              <Hammer className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-semibold truncate">{creator.author}</div>
                            <div className="text-sm text-muted-foreground">
                              {creator.levelCount} level{creator.levelCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-mono font-bold text-accent flex items-center gap-1 justify-end">
                              <Hammer className="w-4 h-4" />
                              {creator.totalPoints}
                            </div>
                            <div className="text-xs text-muted-foreground">creator pts</div>
                          </div>
                        </Link>
                      );
                    })}

                    {filteredCreators.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        No creators found matching your search
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}