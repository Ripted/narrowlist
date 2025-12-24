import { usePlayerLeaderboard } from "@/hooks/useLevels";
import { PlayerCard } from "@/components/PlayerCard";
import { Navbar } from "@/components/Navbar";
import { Trophy, Medal } from "lucide-react";

export default function LeaderboardPage() {
  const { players, loading } = usePlayerLeaderboard();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold">
              <span className="gradient-text">Global</span> Leaderboard
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The best players ranked by total points earned from completing the hardest levels.
            </p>
          </div>

          {/* Stats */}
          {!loading && players.length > 0 && (
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-foreground">{players.length}</div>
                <div className="text-sm text-muted-foreground">Players</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-primary">
                  {players[0]?.totalPoints || 0}
                </div>
                <div className="text-sm text-muted-foreground">Top Score</div>
              </div>
            </div>
          )}

          {/* Top 3 Podium */}
          {!loading && players.length >= 3 && (
            <div className="hidden md:flex items-end justify-center gap-4 mb-12">
              {/* Second place */}
              <div className="text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
                <div className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-gray-400 overflow-hidden bg-gradient-to-br from-gray-300 to-gray-500">
                  {players[1].avatarUrl ? (
                    <img src={players[1].avatarUrl} alt={players[1].displayName || players[1].username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                      {(players[1].displayName || players[1].username).charAt(0)}
                    </div>
                  )}
                </div>
                <Medal className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <div className="font-display font-bold text-foreground">{players[1].displayName || players[1].username}</div>
                <div className="font-mono text-sm text-primary">{players[1].totalPoints} pts</div>
                <div className="w-24 h-24 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg mt-2" />
              </div>

              {/* First place */}
              <div className="text-center animate-fade-in">
                <div className="w-32 h-32 mx-auto mb-3 rounded-full border-4 border-yellow-400 overflow-hidden bg-gradient-to-br from-yellow-300 to-yellow-600 glow-gold">
                  {players[0].avatarUrl ? (
                    <img src={players[0].avatarUrl} alt={players[0].displayName || players[0].username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                      {(players[0].displayName || players[0].username).charAt(0)}
                    </div>
                  )}
                </div>
                <Trophy className="w-8 h-8 mx-auto text-yellow-400 mb-1" />
                <div className="font-display font-bold text-lg text-foreground">{players[0].displayName || players[0].username}</div>
                <div className="font-mono text-primary text-lg">{players[0].totalPoints} pts</div>
                <div className="w-32 h-32 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg mt-2" />
              </div>

              {/* Third place */}
              <div className="text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="w-20 h-20 mx-auto mb-3 rounded-full border-4 border-orange-400 overflow-hidden bg-gradient-to-br from-orange-300 to-orange-600">
                  {players[2].avatarUrl ? (
                    <img src={players[2].avatarUrl} alt={players[2].displayName || players[2].username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                      {(players[2].displayName || players[2].username).charAt(0)}
                    </div>
                  )}
                </div>
                <Medal className="w-5 h-5 mx-auto text-orange-400 mb-1" />
                <div className="font-display font-bold text-foreground">{players[2].displayName || players[2].username}</div>
                <div className="font-mono text-sm text-primary">{players[2].totalPoints} pts</div>
                <div className="w-20 h-16 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg mt-2" />
              </div>
            </div>
          )}

          {/* Player list */}
          <div className="max-w-3xl mx-auto space-y-3">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
              ))
            ) : players.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No players have completed any levels yet.
              </div>
            ) : (
              players.map((player, index) => (
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
                    rank={index + 1}
                    completions={player.completions.length}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
