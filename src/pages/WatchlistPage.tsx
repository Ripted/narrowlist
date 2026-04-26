import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, ArrowLeft, Trophy, Clock, User, Trash2, Play, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/api";

interface WatchlistLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  watchlist_id: string;
  created_at: string;
}

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { watchlist, loading: watchlistLoading, removeFromWatchlist } = useWatchlist();
  const [levels, setLevels] = useState<WatchlistLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchWatchlistLevels() {
      if (watchlistLoading || !watchlist.length) {
        setLevels([]);
        setLoading(false);
        return;
      }

      const levelIds = watchlist.map(w => w.level_id);
      
      const { data } = await supabase
        .from("levels")
        .select("id, level_id, name, author, rank_position, points, thumbnail_url")
        .in("id", levelIds)
        .order("rank_position");

      if (data) {
        const levelsWithWatchlist = data.map(level => {
          const watchlistItem = watchlist.find(w => w.level_id === level.id);
          return {
            ...level,
            watchlist_id: watchlistItem?.id || "",
            created_at: watchlistItem?.created_at || "",
          };
        });
        setLevels(levelsWithWatchlist);
      }
      setLoading(false);
    }

    fetchWatchlistLevels();
  }, [watchlist, watchlistLoading]);

  const handleRemove = async (levelDbId: string, levelName: string | null) => {
    const success = await removeFromWatchlist(levelDbId);
    if (success) {
      toast({
        title: "Removed from watchlist",
        description: levelName ? `${levelName} removed` : undefined,
      });
    }
  };

  const handleCopyId = (levelId: string) => {
    navigator.clipboard.writeText(levelId);
    toast({ title: "Copied!", description: `Level ID: ${levelId}` });
  };

  const handlePlay = (levelId: string) => {
    window.open(`https://narrowarrow.xyz/levelid=${levelId}`, "_blank");
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "text-muted-foreground";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/main">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Levels
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <Bookmark className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">My Watchlist</h1>
          </div>

          {levels.length === 0 ? (
            <div className="text-center py-16 rounded-lg bg-card border border-border">
              <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="font-display text-xl font-semibold mb-2">No levels in watchlist</h2>
              <p className="text-muted-foreground mb-6">
                Bookmark levels you want to complete from the level pages
              </p>
              <Link to="/main">
                <Button>Browse Levels</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {levels.length} level{levels.length !== 1 ? "s" : ""} in your watchlist
              </p>
              
              <div className="grid gap-4">
                {levels.map((level) => (
                  <div
                    key={level.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <Link to={`/level/${level.level_id}`} className="flex-shrink-0">
                      <div className="w-20 h-14 rounded-lg bg-secondary overflow-hidden">
                        {level.thumbnail_url ? (
                          <img 
                            src={level.thumbnail_url} 
                            alt={level.name || "Level"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className={`font-display font-bold text-lg ${getRankStyle(level.rank_position)}`}>
                              #{level.rank_position}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/level/${level.level_id}`}>
                        <h3 className="font-display font-semibold text-foreground hover:text-primary transition-colors truncate">
                          {level.name || `Level ${level.level_id}`}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className={`font-display font-bold ${getRankStyle(level.rank_position)}`}>
                          #{level.rank_position}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {level.author || "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-primary" />
                          {level.points} pts
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyId(level.level_id)}
                        title="Copy Level ID"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePlay(level.level_id)}
                        title="Play Level"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Link to={`/level/${level.level_id}`}>
                        <Button variant="ghost" size="icon" title="View Level">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(level.id, level.name)}
                        className="text-destructive hover:text-destructive"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
