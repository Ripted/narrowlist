import { Heart, User, Calendar, Copy, Play, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FutureLevelCardProps {
  level: {
    id: string;
    level_id: string;
    name: string | null;
    author: string | null;
    creators?: string[] | null;
    rank_position: number;
    thumbnail_url: string | null;
    created_at: string;
  };
  likeCount?: number;
}

export function FutureLevelCard({ level, likeCount }: FutureLevelCardProps) {
  const { toast } = useToast();

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(level.level_id);
    toast({ title: "Copied!", description: `Level ID: ${level.level_id}` });
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://narrowarrow.xyz/levelid=${level.level_id}`, "_blank");
  };

  const authorDisplay =
    level.creators && level.creators.length > 0
      ? level.creators.join(", ")
      : level.author || "Unknown";

  const createdDate = new Date(level.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border hover:border-accent/50 bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-secondary to-muted">
        {level.thumbnail_url ? (
          <img
            src={level.thumbnail_url}
            alt={level.name || "Level"}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1">
            <span className="font-display font-bold text-lg text-accent">
              ~#{level.rank_position}
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1">
            <Calendar className="w-3 h-3 text-accent-foreground" />
            <span className="font-mono font-bold text-xs text-accent-foreground">
              {createdDate}
            </span>
          </div>
        </div>

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

      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1">
            {level.name || "Unnamed Level"}
          </h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
            <User className="w-3 h-3 flex-shrink-0" />
            {authorDisplay}
          </p>
        </div>

        {likeCount !== undefined && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Heart className="w-3 h-3 text-destructive" />
            <span>{likeCount.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
