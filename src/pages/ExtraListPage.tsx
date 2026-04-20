import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, List, ChevronLeft, ChevronRight, Loader2, Trophy, User, Play, Copy, Shield, Heart, Check, Clock, ArrowUpDown, Star, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import { useAllLevelTags, LevelTag } from "@/hooks/useLevelTags";
import { LevelTagsList } from "@/components/LevelTagBadge";
import {
  useAllRatingsAggregate,
  useAllDifficultyAggregate,
  SORT_OPTIONS,
  LevelSortKey,
} from "@/hooks/useLevelAggregates";

interface ExtendedLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  creators: string[] | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  verifier_profile_id: string | null;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
}

interface WorldRecordInfo {
  username: string;
  completion_time: number;
}

const ITEMS_PER_PAGE = 25;

function formatTime(seconds: number): string {
  return `${seconds.toFixed(3)}s`;
}

function ExtendedLevelCard({ 
  level, 
  verifierUsername, 
  likeCount,
  worldRecord,
  isCompleted,
  showCompletionStatus,
  tags = [],
  avgRating,
  ratingCount,
  avgDifficulty,
  difficultyCount,
}: { 
  level: ExtendedLevel; 
  verifierUsername?: string;
  likeCount?: number;
  worldRecord?: WorldRecordInfo;
  isCompleted?: boolean;
  showCompletionStatus?: boolean;
  tags?: LevelTag[];
  avgRating?: number;
  ratingCount?: number;
  avgDifficulty?: number;
  difficultyCount?: number;
}) {
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

  // Display creators if available, otherwise author
  const displayCreator = level.creators && level.creators.length > 0 
    ? level.creators.join(", ")
    : level.author || "Unknown";

  // Filter tags for card display
  const cardTags = tags.filter(t => t.show_on_card);

  return (
    <Link to={`/level/${level.level_id}?extended=true`}>
      <div
        className={`group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${getRankBorder(level.rank_position)} ${
          showCompletionStatus && isCompleted ? "ring-2 ring-accent/30" : ""
        }`}
      >
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-secondary to-muted">
          {level.thumbnail_url ? (
            <img
              src={level.thumbnail_url}
              alt={level.name || ""}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl font-display font-bold text-primary/10">
                #{level.rank_position}
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          
          {/* Rank badge */}
          <div className="absolute top-3 left-3">
            <div className={`flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 ${level.rank_position <= 3 ? 'glow-gold' : ''}`}>
              <span className={`font-display font-bold text-lg ${getRankStyle(level.rank_position)}`}>
                #{level.rank_position}
              </span>
            </div>
          </div>

          {/* Points badge */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {showCompletionStatus && isCompleted && (
              <div className="flex items-center gap-1 rounded-full bg-accent/90 backdrop-blur-sm px-2 py-1" title="Completed">
                <Check className="w-3 h-3 text-accent-foreground" />
              </div>
            )}
            <div className="flex items-center gap-1 rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1">
              <Trophy className="w-3 h-3 text-accent-foreground" />
              <span className="font-mono font-bold text-sm text-accent-foreground">
                {level.points} pts
              </span>
            </div>
          </div>

          {/* Action buttons */}
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
              {level.name || "Unknown Level"}
            </h3>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="w-3 h-3" />
              {displayCreator}
            </p>
          </div>

          {/* Tags - emoji only with text on hover */}
          {cardTags.length > 0 && (
            <LevelTagsList tags={cardTags} variant="card" emojiOnly={true} />
          )}

          {/* Rating & Difficulty badges */}
          {((avgRating !== undefined && (ratingCount ?? 0) > 0) || (avgDifficulty !== undefined && (difficultyCount ?? 0) > 0)) && (
            <div className="flex items-center gap-2 flex-wrap">
              {avgRating !== undefined && (ratingCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium" title={`${ratingCount} rating${ratingCount === 1 ? "" : "s"}`}>
                  <Star className="w-3 h-3 fill-current" />
                  <span>{avgRating.toFixed(1)}</span>
                </div>
              )}
              {avgDifficulty !== undefined && (difficultyCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-medium" title={`${difficultyCount} difficulty vote${difficultyCount === 1 ? "" : "s"}`}>
                  <Gauge className="w-3 h-3" />
                  <span>D{avgDifficulty.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            {/* Like count */}
            {likeCount !== undefined && likeCount > 0 ? (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="w-3 h-3 text-destructive" />
                <span>{likeCount}</span>
              </div>
            ) : (
              <div />
            )}

            {/* World Record */}
            {worldRecord && (
              <div className="flex items-center gap-1 text-primary">
                <Clock className="w-3 h-3" />
                <span className="font-mono">
                  {formatTime(worldRecord.completion_time)}
                </span>
              </div>
            )}
          </div>

          {verifierUsername && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3 text-primary" />
                Verified by{" "}
                <Link 
                  to={`/player/${verifierUsername}`} 
                  className="text-primary font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {verifierUsername}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ExtendedListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<LevelSortKey>("rank");
  const { completedExtraLevelIds, isLoggedIn } = useUserCompletions();
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const { data: ratingsAgg } = useAllRatingsAggregate();
  const { data: difficultyAgg } = useAllDifficultyAggregate();

  // Fetch extended levels with verifier info
  const { data: levels = [], isLoading } = useQuery({
    queryKey: ["extended-levels-with-verifiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extended_levels")
        .select("*")
        .order("rank_position");
      
      if (error) throw error;
      return data as ExtendedLevel[];
    },
  });

  // Fetch all level tags
  const { data: allTags = [] } = useAllLevelTags();

  // Fetch profiles for verifier info
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-extended"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name");
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch like counts and world records from API for visible levels
  const [worldRecords, setWorldRecords] = useState<Record<string, WorldRecordInfo>>({});
  
  useEffect(() => {
    const fetchLevelData = async () => {
      const levelIds = levels.slice(0, 50).map(l => l.level_id);
      const counts: Record<string, number> = {};
      const wrs: Record<string, WorldRecordInfo> = {};
      
      // Batch in groups of 5 with delay to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < levelIds.length; i += batchSize) {
        const batch = levelIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (levelId) => {
            const response = await fetch(`https://api.narrowarrow.xyz/level-details/${levelId}?isCustomLevel=true`);
            if (!response.ok) return null;
            const data = await response.json();
            return { levelId, data };
          })
        );
        
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            const { levelId, data } = result.value;
            if (data?.levelInfo?.like_count !== undefined) {
              counts[levelId] = data.levelInfo.like_count;
            }
            if (data?.worldRecord) {
              wrs[levelId] = {
                username: data.worldRecord.username,
                completion_time: data.worldRecord.completion_time,
              };
            }
          }
        }
        
        // Delay between batches
        if (i + batchSize < levelIds.length) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
      
      setLikeCounts(counts);
      setWorldRecords(wrs);
    };

    if (levels.length > 0) {
      fetchLevelData();
    }
  }, [levels]);

  // Create map of profile id to username
  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach(p => {
      map.set(p.id, p.display_name || p.username);
    });
    return map;
  }, [profiles]);

  // Create map of level_id to tags
  const tagsByLevelId = useMemo(() => {
    const map = new Map<string, LevelTag[]>();
    allTags.forEach(tag => {
      if (tag.level_type === "extra") {
        const existing = map.get(tag.level_id) || [];
        existing.push(tag);
        map.set(tag.level_id, existing);
      }
    });
    return map;
  }, [allTags]);

  const filteredLevels = useMemo(() => {
    let result = levels;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.author?.toLowerCase().includes(q) ||
          l.creators?.some((c) => c.toLowerCase().includes(q)) ||
          l.level_id.toLowerCase().includes(q)
      );
    }
    const ratingKey: Record<string, "avg_overall" | "avg_enjoyment" | "avg_design" | "avg_decoration" | "avg_gameplay"> = {
      rating_overall: "avg_overall",
      rating_enjoyment: "avg_enjoyment",
      rating_design: "avg_design",
      rating_decoration: "avg_decoration",
      rating_gameplay: "avg_gameplay",
    };
    const sorted = [...result];
    if (sortKey === "rank") sorted.sort((a, b) => a.rank_position - b.rank_position);
    else if (sortKey === "rank_desc") sorted.sort((a, b) => b.rank_position - a.rank_position);
    else if (sortKey === "name") sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortKey === "points_desc") sorted.sort((a, b) => b.points - a.points);
    else if (sortKey === "votes")
      sorted.sort(
        (a, b) =>
          (ratingsAgg?.get(b.id)?.count || 0) - (ratingsAgg?.get(a.id)?.count || 0)
      );
    else if (sortKey === "difficulty_desc")
      sorted.sort(
        (a, b) =>
          (difficultyAgg?.get(b.id)?.avg_difficulty ?? -Infinity) -
          (difficultyAgg?.get(a.id)?.avg_difficulty ?? -Infinity)
      );
    else if (sortKey === "difficulty_asc")
      sorted.sort(
        (a, b) =>
          (difficultyAgg?.get(a.id)?.avg_difficulty ?? Infinity) -
          (difficultyAgg?.get(b.id)?.avg_difficulty ?? Infinity)
      );
    else {
      const k = ratingKey[sortKey];
      if (k)
        sorted.sort(
          (a, b) =>
            (ratingsAgg?.get(b.id)?.[k] ?? -Infinity) -
            (ratingsAgg?.get(a.id)?.[k] ?? -Infinity)
        );
    }
    return sorted;
  }, [levels, searchQuery, sortKey, ratingsAgg, difficultyAgg]);

  const totalPages = Math.ceil(filteredLevels.length / ITEMS_PER_PAGE);
  const paginatedLevels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLevels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLevels, currentPage]);

  const totalExtraPoints = useMemo(() => {
    // Sum up all extra points from extended levels
    return levels.reduce((sum, level) => sum + (level.points || 0), 0);
  }, [levels]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <main className="relative pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <List className="w-5 h-5 text-accent" />
                <h1 className="font-display text-2xl font-bold">Extra List</h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="bg-accent/10 text-accent px-2 py-1 rounded font-mono">
                  {levels.length} Levels
                </span>
                <span className="bg-accent/10 text-accent px-2 py-1 rounded font-mono">{totalExtraPoints} Extra Pts</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as LevelSortKey)}>
                <SelectTrigger className="h-9 w-auto min-w-[140px] gap-2 bg-secondary border-border">
                  <ArrowUpDown className="w-4 h-4" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search levels..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 bg-secondary border-border"
                />
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-6">
            Levels that used to be in the main list or don't quite meet main list standards. 
            Ranked separately. <strong>Note:</strong> Extra List levels award <span className="text-accent font-medium">Extra Points</span> — a separate point system tracked independently.
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-card border border-border animate-pulse"
                />
              ))}
            </div>
          ) : paginatedLevels.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <List className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">
                {searchQuery ? "No Results Found" : "No Extra Levels Yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term." : "Extra levels will appear here when added."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedLevels.map((level) => (
                  <div
                    key={level.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(level.rank_position % 25) * 50}ms` }}
                  >
                    <ExtendedLevelCard
                      level={level}
                      verifierUsername={level.verifier_profile_id ? profileMap.get(level.verifier_profile_id) : undefined}
                      likeCount={likeCounts[level.level_id]}
                      worldRecord={worldRecords[level.level_id]}
                      isCompleted={completedExtraLevelIds.has(level.level_id)}
                      showCompletionStatus={isLoggedIn}
                      tags={tagsByLevelId.get(level.id) || []}
                      avgRating={ratingsAgg?.get(level.id)?.avg_overall}
                      ratingCount={ratingsAgg?.get(level.id)?.count}
                      avgDifficulty={difficultyAgg?.get(level.id)?.avg_difficulty}
                      difficultyCount={difficultyAgg?.get(level.id)?.count}
                    />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}