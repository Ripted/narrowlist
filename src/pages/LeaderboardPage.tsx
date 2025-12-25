import { useState, useMemo, useEffect } from "react";
import { usePlayerLeaderboard } from "@/hooks/useLevels";
import { PlayerCard } from "@/components/PlayerCard";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Trophy, Medal, Search } from "lucide-react";

export default function LeaderboardPage() {
  const { players, loading } = usePlayerLeaderboard();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter(
      (player) =>
        player.username.toLowerCase().includes(query) ||
        (player.displayName?.toLowerCase().includes(query))
    );
  }, [players, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-primary" />
                <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
              </div>
              {!loading && players.length > 0 && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded font-mono">{players.length} Players</span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono">{players[0]?.totalPoints || 0} Top Score</span>
                </div>
              )}
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
          </div>

          {/* Top 3 Podium */}
          {!loading && players.length >= 3 && !searchQuery && (
            <div className="hidden md:flex items-end justify-center gap-4 mb-12">
              {/* Second place */}
              <div className="text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
                <div className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-glow-silver overflow-hidden bg-gradient-to-br from-glow-silver/30 to-glow-silver/60">
                  {players[1].avatarUrl ? (
                    <img src={players[1].avatarUrl} alt={players[1].displayName || players[1].username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-foreground">
                      {(players[1].displayName || players[1].username).charAt(0)}
                    </div>
                  )}
                </div>
                <Medal className="w-6 h-6 mx-auto text-glow-silver mb-1" />
                <div className="font-display font-bold text-foreground">{players[1].displayName || players[1].username}</div>
                <div className="font-mono text-sm text-primary">{players[1].totalPoints} pts</div>
                <div className="w-24 h-24 bg-gradient-to-t from-glow-silver/60 to-glow-silver/30 rounded-t-lg mt-2" />
              </div>

              {/* First place */}
              <div className="text-center animate-fade-in">
                <div className="w-32 h-32 mx-auto mb-3 rounded-full border-4 border-glow-gold overflow-hidden bg-gradient-to-br from-glow-gold/30 to-glow-gold/60 glow-gold">
                  {players[0].avatarUrl ? (
                    <img src={players[0].avatarUrl} alt={players[0].displayName || players[0].username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-foreground">
                      {(players[0].displayName || players[0].username).charAt(0)}
                    </div>
                  )}
                </div>
                <Trophy className="w-8 h-8 mx-auto text-glow-gold mb-1" />
                <div className="font-display font-bold text-lg text-foreground">{players[0].displayName || players[0].username}</div>
                <div className="font-mono text-primary text-lg">{players[0].totalPoints} pts</div>
                <div className="w-32 h-32 bg-gradient-to-t from-glow-gold/60 to-glow-gold/30 rounded-t-lg mt-2" />
              </div>

              {/* Third place */}
              <div className="text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-glow-bronze overflow-hidden bg-gradient-to-br from-glow-bronze/30 to-glow-bronze/60">
                  {players[2].avatarUrl ? (
                    <img src={players[2].avatarUrl} alt={players[2].displayName || players[2].username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-foreground">
                      {(players[2].displayName || players[2].username).charAt(0)}
                    </div>
                  )}
                </div>
                <Medal className="w-5 h-5 mx-auto text-glow-bronze mb-1" />
                <div className="font-display font-bold text-foreground">{players[2].displayName || players[2].username}</div>
                <div className="font-mono text-sm text-primary">{players[2].totalPoints} pts</div>
                <div className="w-20 h-16 bg-gradient-to-t from-glow-bronze/60 to-glow-bronze/30 rounded-t-lg mt-2" />
              </div>
            </div>
          )}

          {/* Player list */}
          <div className="max-w-3xl mx-auto space-y-3">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
              ))
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No players found matching your search." : "No players have completed any levels yet."}
              </div>
            ) : (
              filteredPlayers.map((player, index) => {
                const originalRank = players.findIndex(p => p.username === player.username) + 1;
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
                      completions={player.completions.length}
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
