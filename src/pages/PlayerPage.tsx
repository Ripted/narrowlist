import { useParams, Link } from "react-router-dom";
import { usePlayerLeaderboard } from "@/hooks/useLevels";
import { getPlayerProfile } from "@/config/profiles";
import { formatTime } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Target, Clock, Medal } from "lucide-react";

export default function PlayerPage() {
  const { username } = useParams<{ username: string }>();
  const { players, loading } = usePlayerLeaderboard();
  
  const player = players.find(
    (p) => p.username.toLowerCase() === username?.toLowerCase()
  );
  const profile = username ? getPlayerProfile(username) : undefined;
  const rank = player ? players.indexOf(player) + 1 : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="font-display text-2xl font-bold text-destructive">Player Not Found</h1>
          <Link to="/players">
            <Button variant="ghost" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getRankStyle = (r: number) => {
    if (r === 1) return "rank-gold";
    if (r === 2) return "rank-silver";
    if (r === 3) return "rank-bronze";
    return "text-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Link to="/players">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Players
            </Button>
          </Link>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${rank && rank <= 3 ? "border-primary glow-primary" : "border-border"}`}>
                {profile?.avatarUrl || player.avatarUrl ? (
                  <img
                    src={profile?.avatarUrl || player.avatarUrl}
                    alt={player.displayName || player.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-foreground">
                      {(player.displayName || player.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {rank && rank <= 3 && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <Trophy className={`w-5 h-5 ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-400" : "text-orange-400"}`} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left space-y-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {player.displayName || player.username}
                </h1>
                {player.displayName && (
                  <p className="text-muted-foreground">@{player.username}</p>
                )}
                {profile?.bio && (
                  <p className="text-muted-foreground mt-2">{profile.bio}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-6">
                <div className="text-center">
                  <div className={`font-display text-3xl font-bold ${rank ? getRankStyle(rank) : ""}`}>
                    #{rank}
                  </div>
                  <div className="text-xs text-muted-foreground">Global Rank</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="font-display text-3xl font-bold text-primary">{player.totalPoints}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Total Points</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="font-display text-3xl font-bold text-foreground">
                    {player.completions.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Completions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Completions */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Completed Levels
              </h2>
            </div>

            {player.completions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No completions yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {player.completions.map((completion, index) => (
                  <Link
                    key={completion.levelId}
                    to={`/level/${completion.levelId}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Medal className="w-4 h-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {completion.levelName}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono">{formatTime(completion.time)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Trophy className="w-4 h-4" />
                        <span className="font-mono font-bold">+{completion.points}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
