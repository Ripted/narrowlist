import { Link } from "react-router-dom";
import { LevelDetails, formatTime } from "@/lib/api";
import { getPointsForRank } from "@/config/levels";
import { Trophy, User, Clock, Heart, Copy, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LevelCardProps {
  level: LevelDetails;
  rank: number;
  thumbnailUrl?: string;
}

export function LevelCard({ level, rank, thumbnailUrl }: LevelCardProps) {
  const { toast } = useToast();
  const points = getPointsForRank(rank);
  const { levelInfo, worldRecord } = level;

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "text-muted-foreground";
  };

  const getRankBorder = (rank: number) => {
    if (rank === 1) return "border-glow-gold/50 hover:border-glow-gold";
    if (rank === 2) return "border-glow-silver/50 hover:border-glow-silver";
    if (rank === 3) return "border-glow-bronze/50 hover:border-glow-bronze";
    return "border-border hover:border-primary/50";
  };

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(levelInfo.level_id);
    toast({ title: "Copied!", description: `Level ID: ${levelInfo.level_id}` });
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://narrowarrow.xyz/levelid=${levelInfo.level_id}`, "_blank");
  };

  return (
    <Link to={`/level/${levelInfo.level_id}`}>
      <div
        className={`group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${getRankBorder(rank)}`}
        style={{ animationDelay: `${rank * 50}ms` }}
      >
        {/* Thumbnail */}
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-secondary to-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={levelInfo.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl font-display font-bold text-primary/10">
                #{rank}
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Rank badge */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 ${rank <= 3 ? 'glow-gold' : ''}`}>
              <span className={`font-display font-bold text-lg ${getRankStyle(rank)}`}>
                #{rank}
              </span>
            </div>
          </div>

          {/* Points badge */}
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur-sm px-3 py-1">
              <Trophy className="w-3 h-3 text-primary-foreground" />
              <span className="font-mono font-bold text-sm text-primary-foreground">
                {points}pts
              </span>
            </div>
          </div>

          {/* Action buttons - appear on hover */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-background/90 backdrop-blur-sm hover:bg-background"
              onClick={handleCopyId}
              title="Copy Level ID"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="default"
              className="h-8 w-8 p-0"
              onClick={handlePlay}
              title="Play Level"
            >
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {levelInfo.name}
            </h3>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="w-3 h-3" />
              {levelInfo.author}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="w-3 h-3 text-destructive" />
              <span>{levelInfo.like_count}</span>
            </div>

            {worldRecord && (
              <div className="flex items-center gap-1 text-primary">
                <Clock className="w-3 h-3" />
                <span className="font-mono">
                  {formatTime(worldRecord.completion_time)}
                </span>
              </div>
            )}
          </div>

          {worldRecord && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Verified by{" "}
                <span className="text-primary font-medium">
                  {worldRecord.username}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
