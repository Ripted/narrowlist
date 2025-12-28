import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePlayerLeaderboard } from "@/hooks/useLevels";
import { PlayerCard } from "@/components/PlayerCard";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trophy, Medal, Search, Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HistoricalPlayerStats {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  completions: number;
}

export default function LeaderboardPage() {
  const { players, loading } = usePlayerLeaderboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [historicalDate, setHistoricalDate] = useState<string | null>(null);
  const [historicalPlayers, setHistoricalPlayers] = useState<HistoricalPlayerStats[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
                </div>
                {!isLoading && finalDisplayPlayers.length > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span className="bg-muted px-2 py-1 rounded font-mono">{finalDisplayPlayers.length} Players</span>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono">{finalDisplayPlayers[0]?.totalPoints || 0} Top</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary border-border h-9"
                  />
                </div>
                
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
              </div>
            </div>
            
            {historicalDate && (
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
          </div>

          {/* Top 3 Podium - only show for current leaderboard */}
          {!isLoading && !historicalDate && players.length >= 3 && !searchQuery && (
            <div className="hidden md:flex items-end justify-center gap-4 mb-12">
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
        </div>
      </main>
    </div>
  );
}
