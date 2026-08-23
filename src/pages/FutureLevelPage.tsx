import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchLevelDetails, formatDate } from "@/lib/api";
import { formatFutureRank, isVideoFileUrl } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Trophy, Heart, Calendar, User, Copy, Play,
  Download, FileText, Hourglass, Info, Hash,
} from "lucide-react";

interface FutureLevelRow {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  creators: string[] | null;
  description: string | null;
  rank_position: number;
  sub_rank: number;
  points: number;
  thumbnail_url: string | null;
  added_at: string;
  created_at: string;
}

export default function FutureLevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { toast } = useToast();
  const [level, setLevel] = useState<FutureLevelRow | null>(null);
  const [rankGroupSize, setRankGroupSize] = useState(1);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [levelCreatedAt, setLevelCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!levelId) return;
      setLoading(true);
      const { data } = await supabase
        .from("future_levels")
        .select("*")
        .eq("level_id", levelId)
        .maybeSingle();

      if (data) {
        const row = data as FutureLevelRow;
        setLevel(row);

        const { count } = await supabase
          .from("future_levels")
          .select("id", { count: "exact", head: true })
          .eq("rank_position", row.rank_position);
        setRankGroupSize(count ?? 1);

        const details = await fetchLevelDetails(levelId);
        if (details?.levelInfo) {
          setLikeCount(details.levelInfo.like_count);
          setLevelCreatedAt(details.levelInfo.created_at);
        }
      }
      setLoading(false);
    }
    load();
  }, [levelId]);

  const handleCopyId = () => {
    if (levelId) {
      navigator.clipboard.writeText(levelId);
      toast({ title: "Copied!", description: `Level ID: ${levelId}` });
    }
  };

  const handlePlay = () => {
    if (levelId) {
      window.open(`https://narrowarrow.xyz/levelid=${levelId}`, "_blank");
    }
  };

  const handleDownloadThumbnail = async () => {
    if (!level?.thumbnail_url) return;
    try {
      const res = await fetch(level.thumbnail_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = (blob.type.split("/")[1] || "png").split("+")[0];
      a.download = `${(level.name || levelId || "level").replace(/[^a-z0-9-_]+/gi, "_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(level.thumbnail_url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
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
          <p className="text-muted-foreground mt-2">This level is not on the Future List.</p>
          <Link to="/future-list">
            <Button variant="ghost" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Future List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const creatorDisplay =
    level.creators && level.creators.length > 0
      ? level.creators.join(", ")
      : level.author || "Unknown";
  const rankLabel = formatFutureRank(level.rank_position, level.sub_rank, rankGroupSize);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/future-list">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Future List
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8 mb-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="font-display text-3xl sm:text-5xl font-bold text-accent">
                    {rankLabel}
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2 min-w-0">
                  <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-foreground break-words">
                    {level.name || "Unnamed Level"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      {creatorDisplay}
                    </span>
                    {likeCount !== null && (
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        {likeCount.toLocaleString()}
                      </span>
                    )}
                    {levelCreatedAt && (
                      <span className="hidden sm:flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(levelCreatedAt)}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/30 px-2 py-0.5 text-[11px] font-medium text-accent">
                    <Hourglass className="w-3 h-3" />
                    Future List — estimated placement
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="rounded-lg bg-card border border-border p-2 sm:p-4 text-center">
                  <Trophy className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
                  <div className="font-display text-lg sm:text-2xl font-bold text-primary">
                    {level.points}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Est. Points</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-2 sm:p-4 text-center">
                  <Hash className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-accent" />
                  <div className="font-display text-lg sm:text-2xl font-bold text-foreground">
                    {rankGroupSize > 1 ? `${level.sub_rank} of ${rankGroupSize}` : "—"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {rankGroupSize > 1 ? `Tied at ~#${level.rank_position}` : "No rank tie"}
                  </div>
                </div>
                <div className="rounded-lg bg-card border border-border p-2 sm:p-4 text-center">
                  <Calendar className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
                  <div className="font-display text-sm sm:text-lg font-bold text-foreground">
                    {formatDate(level.added_at || level.created_at)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Added</div>
                </div>
              </div>

              <div className="rounded-lg bg-card border border-border p-4 flex items-start gap-3">
                <Info className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This level is unbeaten and placed on the Future List with an estimated rank of{" "}
                  <span className="text-foreground font-medium">{rankLabel}</span>.
                  {rankGroupSize > 1 && (
                    <>
                      {" "}It shares estimated rank ~#{level.rank_position} with{" "}
                      {rankGroupSize - 1} other {rankGroupSize - 1 === 1 ? "level" : "levels"} — the
                      decimal orders levels within the same estimate.
                    </>
                  )}
                  {" "}Once it is verified, it moves to the Main List and completions appear here.
                </p>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="relative aspect-video rounded-lg bg-secondary border border-border overflow-hidden group">
                {level.thumbnail_url ? (
                  isVideoFileUrl(level.thumbnail_url) ? (
                    <video
                      src={level.thumbnail_url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={level.thumbnail_url}
                      alt={level.name || "Level"}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl font-display font-bold text-muted-foreground/20">
                      {rankLabel}
                    </div>
                  </div>
                )}
                {level.thumbnail_url && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDownloadThumbnail}
                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 backdrop-blur hover:bg-background"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {level.description && (
            <div className="rounded-lg bg-card border border-border p-4 mb-8">
              <h3 className="font-display text-sm font-bold flex items-center gap-2 mb-3 text-muted-foreground">
                <FileText className="w-4 h-4" />
                Description
              </h3>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {level.description}
              </p>
            </div>
          )}

          <div className="rounded-lg bg-card border border-border p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Level ID: <span className="font-mono text-foreground">{level.level_id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyId}
                className="gap-2 text-xs sm:text-sm"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Copy ID</span>
                <span className="sm:hidden">ID</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePlay}
                className="gap-2 text-xs sm:text-sm"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                Play
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
