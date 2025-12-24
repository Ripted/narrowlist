import { usePlayerLeaderboard } from "@/hooks/useLevels";
import { PlayerCard } from "@/components/PlayerCard";
import { Navbar } from "@/components/Navbar";
import { Users } from "lucide-react";

export default function PlayersPage() {
  const { players, loading } = usePlayerLeaderboard();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold">
              <span className="gradient-text-accent">All</span> Players
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Browse all players who have completed levels on the hardest list.
            </p>
          </div>

          {/* Player grid */}
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-3">
              {loading ? (
                [...Array(12)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />
                ))
              ) : players.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No players found.
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
        </div>
      </main>
    </div>
  );
}
