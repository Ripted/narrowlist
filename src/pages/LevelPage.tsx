import { useParams, Link } from "react-router-dom";
import { useLevel } from "@/hooks/useLevels";
import { getPointsForRank } from "@/config/levels";
import { getPlayerProfile } from "@/config/profiles";
import { formatTime, formatDate } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Clock, User, Heart, Calendar, Medal } from "lucide-react";

export default function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { level, leaderboard, rank, loading } = useLevel(levelId || "");

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

  if (!level) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="font-display text-2xl font-bold text-destructive">Level Not Found</h1>
          <Link to="/">
            <Button variant="ghost" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Levels
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { levelInfo, worldRecord } = level;
  const points = rank ? getPointsForRank(rank) : 0;

  const getRankStyle = (r: number) => {
    if (r === 1) return "rank-gold";
    if (r === 2) return "rank-silver";
    if (r === 3) return "rank-bronze";
    return "text-foreground";
  };

  const getMedalColor = (position: number) => {
    if (position === 0) return "text-yellow-400";
    if (position === 1) return "text-gray-400";
    if (position === 2) return "text-orange-400";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Levels
            </Button>
          </Link>

          {/* Header */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Level info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start gap-4">
                {rank && (
                  <div className="flex-shrink-0">
                    <div className={`font-display text-5xl font-bold ${getRankStyle(rank)}`}>
                      #{rank}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    {levelInfo.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {levelInfo.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-destructive" />
                      {levelInfo.like_count} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(levelInfo.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl bg-card border border-border p-4 text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="font-display text-2xl font-bold text-primary">{points}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <div className="font-mono text-lg font-bold text-foreground">
                    {worldRecord ? formatTime(worldRecord.completion_time) : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">World Record</div>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 text-center">
                  <User className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="font-display text-2xl font-bold text-foreground">
                    {leaderboard.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Completions</div>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 text-center">
                  <Medal className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                  <div className="font-display text-lg font-bold text-foreground truncate">
                    {worldRecord?.username || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">WR Holder</div>
                </div>
              </div>
            </div>

            {/* Thumbnail placeholder */}
            <div className="hidden lg:block">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-secondary to-muted border border-border flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-6xl font-display font-bold text-primary/20">
                    #{rank || "?"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Completions
              </h2>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No completions yet. Be the first!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leaderboard.map((entry, index) => {
                  const profile = getPlayerProfile(entry.username);
                  return (
                    <Link
                      key={entry.run_id}
                      to={`/player/${entry.username}`}
                      className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                    >
                      {/* Position */}
                      <div className="w-8 text-center flex-shrink-0">
                        {index < 3 ? (
                          <Medal className={`w-5 h-5 mx-auto ${getMedalColor(index)}`} />
                        ) : (
                          <span className="font-mono text-muted-foreground">{index + 1}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex-shrink-0">
                        {profile?.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt={profile.displayName || entry.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-foreground font-bold">
                            {entry.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {profile?.displayName || entry.username}
                        </div>
                        <div className="text-xs text-muted-foreground">{entry.arrow_name}</div>
                      </div>

                      {/* Time */}
                      <div className="font-mono text-primary font-medium">
                        {formatTime(entry.completion_time)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
