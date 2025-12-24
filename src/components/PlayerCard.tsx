import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";

interface PlayerCardProps {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  rank: number;
  completions?: number;
}

export function PlayerCard({
  username,
  displayName,
  avatarUrl,
  totalPoints,
  rank,
  completions = 0,
}: PlayerCardProps) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "text-muted-foreground";
  };

  const getRankGlow = (rank: number) => {
    if (rank === 1) return "glow-gold";
    if (rank === 2) return "border-glow-silver/50";
    if (rank === 3) return "border-glow-bronze/50";
    return "";
  };

  return (
    <Link to={`/player/${username}`}>
      <div
        className={`group relative flex items-center gap-4 p-4 rounded-xl border bg-card transition-all duration-300 hover:scale-[1.02] hover:bg-secondary/50 ${
          rank <= 3 ? getRankGlow(rank) : "border-border hover:border-primary/50"
        }`}
      >
        {/* Rank */}
        <div className="flex-shrink-0 w-12 text-center">
          <span className={`font-display font-bold text-2xl ${getRankStyle(rank)}`}>
            #{rank}
          </span>
        </div>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${
            rank <= 3 ? "border-primary" : "border-border"
          }`}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">
                  {(displayName || username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {rank <= 3 && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-primary flex items-center justify-center">
              <Trophy className={`w-3 h-3 ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-400" : "text-orange-400"}`} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
            {displayName || username}
          </h3>
          <p className="text-sm text-muted-foreground">
            {completions} completion{completions !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Points */}
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1.5 text-primary">
            <Trophy className="w-4 h-4" />
            <span className="font-mono font-bold text-xl">{totalPoints}</span>
          </div>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>
    </Link>
  );
}
