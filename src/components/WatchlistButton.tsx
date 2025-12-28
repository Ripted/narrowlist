import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface WatchlistButtonProps {
  levelDbId: string;
  levelName?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "outline" | "ghost" | "default";
}

export function WatchlistButton({ 
  levelDbId, 
  levelName,
  size = "sm",
  variant = "outline"
}: WatchlistButtonProps) {
  const { user } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);

  const inWatchlist = isInWatchlist(levelDbId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use watchlist",
        variant: "destructive",
      });
      return;
    }

    setToggling(true);
    const success = await toggleWatchlist(levelDbId);
    setToggling(false);

    if (success) {
      toast({
        title: inWatchlist ? "Removed from watchlist" : "Added to watchlist",
        description: levelName 
          ? `${levelName} ${inWatchlist ? "removed from" : "added to"} your watchlist`
          : undefined,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      });
    }
  };

  if (toggling) {
    return (
      <Button variant={variant} size={size} disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {size !== "icon" && <span className="hidden sm:inline">Loading...</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={inWatchlist ? "default" : variant}
      size={size}
      onClick={handleToggle}
      className={`gap-2 ${inWatchlist ? "bg-primary" : ""}`}
      title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
    >
      {inWatchlist ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      {size !== "icon" && (
        <span className="hidden sm:inline">
          {inWatchlist ? "Saved" : "Watchlist"}
        </span>
      )}
    </Button>
  );
}
