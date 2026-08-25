import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLevels } from "@/hooks/useLevels";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import { useAllLevelTags } from "@/hooks/useLevelTags";
import { useLevelCompletionCounts } from "@/hooks/useLevelCompletionCounts";
import {
  useAllRatingsAggregate,
  useAllDifficultyAggregate,
} from "@/hooks/useLevelAggregates";
import { useListViewPrefs } from "@/hooks/useListViewPrefs";
import { SortControls } from "@/components/SortControls";
import { LevelCard } from "@/components/LevelCard";
import { Navbar } from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target, Search, Filter, History, Tag, X, ChevronDown } from "lucide-react";
import { HistoricalListViewer } from "@/components/HistoricalListViewer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoricalLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
}

const Index = () => {
  const { levels, loading, error } = useLevels();
  const { completedLevelIds, isLoggedIn } = useUserCompletions();
  const { data: allTags = [] } = useAllLevelTags();
  const { data: ratingsAgg } = useAllRatingsAggregate();
  const { data: difficultyAgg } = useAllDifficultyAggregate();
  const { data: victorCounts } = useLevelCompletionCounts();
  const [historicalLevels, setHistoricalLevels] = useState<HistoricalLevel[] | null>(null);
  const [historicalDate, setHistoricalDate] = useState<string | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    showOnlyUncompleted,
    toggleUncompleted,
    selectedTags,
    setSelectedTags,
    tagMatchMode,
    setTagMatchMode,
    sortField,
    setSort,
    sortDirection,
  } = useListViewPrefs({ storageKey: "narrowlist-view-main", withTags: true });

  const handleHistoricalData = (levels: HistoricalLevel[] | null, date: string | null) => {
    setHistoricalLevels(levels);
    setHistoricalDate(date);
  };

  // Calculate all unique tags with counts (alphabetical for consistent UI)
  const allTagOptions = useMemo(() => {
    const tagCounts = new Map<string, { emoji: string; text: string; count: number }>();
    allTags.forEach(tag => {
      const key = `${tag.emoji}|${tag.text}`;
      if (tagCounts.has(key)) {
        tagCounts.get(key)!.count++;
      } else {
        tagCounts.set(key, { emoji: tag.emoji, text: tag.text, count: 1 });
      }
    });
    return Array.from(tagCounts.values()).sort((a, b) => b.count - a.count);
  }, [allTags]);

  // Group tags by level_id for display on cards
  const tagsByLevelId = useMemo(() => {
    const map = new Map();
    allTags.forEach(tag => {
      if (!map.has(tag.level_id)) {
        map.set(tag.level_id, []);
      }
      map.get(tag.level_id).push(tag);
    });
    return map;
  }, [allTags]);

  const filteredLevels = useMemo(() => {
    // Only show levels ranked 1-100 (Main List)
    let result = levels.filter(l => l.rank <= 100);
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (level) =>
          level.levelInfo.name.toLowerCase().includes(query) ||
          level.levelInfo.author.toLowerCase().includes(query)
      );
    }
    
    // Filter by uncompleted only
    if (showOnlyUncompleted && isLoggedIn) {
      result = result.filter(
        (level) => !completedLevelIds.has(level.levelInfo.level_id)
      );
    }

    // Filter by selected tags (multi)
    if (selectedTags.size > 0) {
      // Build map: levelDbId -> set of tagKeys present
      const levelTagMap = new Map<string, Set<string>>();
      allTags.forEach(tag => {
        const key = `${tag.emoji}|${tag.text}`;
        if (!selectedTags.has(key)) return;
        if (!levelTagMap.has(tag.level_id)) levelTagMap.set(tag.level_id, new Set());
        levelTagMap.get(tag.level_id)!.add(key);
      });
      result = result.filter(level => {
        if (!level.dbId) return false;
        const present = levelTagMap.get(level.dbId);
        if (!present) return false;
        if (tagMatchMode === "all") {
          for (const t of selectedTags) if (!present.has(t)) return false;
          return true;
        }
        return present.size > 0;
      });
    }
    
    // Sort
    const ratingKey: Record<string, "avg_overall" | "avg_enjoyment" | "avg_design" | "avg_decoration" | "avg_gameplay"> = {
      rating_overall: "avg_overall",
      rating_enjoyment: "avg_enjoyment",
      rating_design: "avg_design",
      rating_decoration: "avg_decoration",
      rating_gameplay: "avg_gameplay",
    };
    const dirMul = sortDirection === "asc" ? 1 : -1;
    const sorted = [...result];
    if (sortField === "rank") sorted.sort((a, b) => (a.rank - b.rank) * dirMul);
    else if (sortField === "name")
      sorted.sort((a, b) => a.levelInfo.name.localeCompare(b.levelInfo.name) * dirMul);
    else if (sortField === "points") sorted.sort((a, b) => (a.points - b.points) * dirMul);
    else if (sortField === "votes")
      sorted.sort(
        (a, b) =>
          ((ratingsAgg?.get(a.dbId || "")?.count || 0) -
            (ratingsAgg?.get(b.dbId || "")?.count || 0)) * dirMul
      );
    else if (sortField === "completions")
      sorted.sort(
        (a, b) =>
          ((victorCounts?.get(a.dbId || "") || 0) -
            (victorCounts?.get(b.dbId || "") || 0)) * dirMul
      );
    else if (sortField === "difficulty")
      sorted.sort((a, b) => {
        const av = difficultyAgg?.get(a.dbId || "")?.avg_difficulty;
        const bv = difficultyAgg?.get(b.dbId || "")?.avg_difficulty;
        const aFallback = sortDirection === "asc" ? Infinity : -Infinity;
        return ((av ?? aFallback) - (bv ?? aFallback)) * dirMul;
      });
    else {
      const k = ratingKey[sortField];
      if (k)
        sorted.sort((a, b) => {
          const av = ratingsAgg?.get(a.dbId || "")?.[k];
          const bv = ratingsAgg?.get(b.dbId || "")?.[k];
          const aFallback = sortDirection === "asc" ? Infinity : -Infinity;
          return ((av ?? aFallback) - (bv ?? aFallback)) * dirMul;
        });
    }

    return sorted;
  }, [levels, searchQuery, showOnlyUncompleted, isLoggedIn, completedLevelIds, selectedTags, tagMatchMode, allTags, sortField, sortDirection, ratingsAgg, difficultyAgg, victorCounts]);

  const maxPoints = useMemo(() => {
    return levels.filter(l => l.rank <= 100).reduce((sum, level) => sum + (level.points || 0), 0);
  }, [levels]);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Main List" description="The top 100 hardest levels in Narrow Arrow. Each level awards points based on its ranking position." />
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <main className="relative pt-24 pb-12">
        {/* Levels Grid */}
        <section className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <h1 className="font-display text-2xl font-bold">
                  {historicalDate ? (
                    <span className="flex items-center gap-2">
                      <History className="w-5 h-5 text-yellow-500" />
                      List on {historicalDate}
                    </span>
                  ) : "Main List"}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                  {historicalLevels ? historicalLevels.length : levels.length} Levels
                </span>
                <span className="bg-accent/10 text-accent px-2 py-1 rounded font-mono">{maxPoints} Max Points</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <HistoricalListViewer onHistoricalData={handleHistoricalData} />
              {isLoggedIn && !historicalLevels && (
                <Button
                  variant={showOnlyUncompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleUncompleted()}
                  className="gap-2 flex-shrink-0"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Uncompleted</span>
                </Button>
              )}
              {!historicalLevels && (
                <SortControls
                  field={sortField}
                  direction={sortDirection}
                  onChange={(f, d) => setSort(f, d)}
                />
              )}
              <div className="relative w-full basis-full sm:basis-auto sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search levels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary border-border"
                />
              </div>
            </div>
          </div>

          {/* Tag Filters */}
          {!historicalLevels && allTagOptions.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tags:
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
                    {selectedTags.size > 0 ? `${selectedTags.size} selected` : "Choose tags"}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-0 bg-popover border-border">
                  <div className="p-3 border-b border-border flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Filter by tags</span>
                    <div className="flex gap-1">
                      <Button
                        variant={tagMatchMode === "any" ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => setTagMatchMode("any")}
                      >
                        Any
                      </Button>
                      <Button
                        variant={tagMatchMode === "all" ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => setTagMatchMode("all")}
                      >
                        All
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-80">
                    <div className="p-2 space-y-0.5">
                      {allTagOptions.map((tag) => {
                        const tagKey = `${tag.emoji}|${tag.text}`;
                        const checked = selectedTags.has(tagKey);
                        return (
                          <label
                            key={tagKey}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary cursor-pointer text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                setSelectedTags(prev => {
                                  const next = new Set(prev);
                                  if (v) next.add(tagKey); else next.delete(tagKey);
                                  return next;
                                });
                              }}
                            />
                            <span className="flex-1 truncate">
                              {tag.emoji} {tag.text}
                            </span>
                            <span className="text-xs text-muted-foreground">{tag.count}</span>
                          </label>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  {selectedTags.size > 0 && (
                    <div className="p-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 gap-1 text-xs"
                        onClick={() => setSelectedTags(new Set())}
                      >
                        <X className="w-3 h-3" />
                        Clear all
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {/* Selected tag chips */}
              {Array.from(selectedTags).map((tagKey) => {
                const opt = allTagOptions.find(t => `${t.emoji}|${t.text}` === tagKey);
                if (!opt) return null;
                return (
                  <Button
                    key={tagKey}
                    variant="default"
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs"
                    onClick={() =>
                      setSelectedTags(prev => {
                        const next = new Set(prev);
                        next.delete(tagKey);
                        return next;
                      })
                    }
                  >
                    {opt.emoji} {opt.text}
                    <X className="w-3 h-3" />
                  </Button>
                );
              })}
            </div>
          )}

          {loading && !historicalLevels ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-card border border-border animate-pulse"
                />
              ))}
            </div>
          ) : error && !historicalLevels ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : historicalLevels ? (
            // Historical view
            historicalLevels.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <History className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold">No Data Available</h3>
                <p className="text-muted-foreground">
                  No historical data found for this date.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {historicalLevels
                  .filter(level => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    return (level.name?.toLowerCase().includes(query) || 
                            level.author?.toLowerCase().includes(query));
                  })
                  .map((level, index) => (
                    <Link
                      key={level.id}
                      to={`/level/${level.level_id}`}
                      className="animate-fade-in group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="rounded-xl bg-card border border-border overflow-hidden hover:border-primary/50 hover:scale-[1.02] transition-all">
                        <div className="aspect-video bg-secondary relative">
                          {level.thumbnail_url ? (
                            <img src={level.thumbnail_url} alt={level.name || ""} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl font-display font-bold text-muted-foreground/20">#{level.rank_position}</span>
                            </div>
                          )}
                          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-background/80 text-primary font-display font-bold text-sm">
                            #{level.rank_position}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-display font-bold truncate group-hover:text-primary transition-colors">{level.name || "Unknown Level"}</h3>
                          <p className="text-sm text-muted-foreground">{level.author || "Unknown"}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{level.points} pts</span>
                            <span className="text-yellow-500 flex items-center gap-1">
                              <History className="w-3 h-3" />
                              Historical
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )
          ) : filteredLevels.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Target className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">
                {searchQuery ? "No Results Found" : "No Levels Yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try a different search term."
                  : "Add level IDs in the admin panel to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLevels.map((level) => (
                <div
                  key={level.levelInfo.level_id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${level.rank * 50}ms` }}
                >
                  <LevelCard
                    level={level}
                    rank={level.rank}
                    thumbnailUrl={level.thumbnailUrl}
                    verifierUsername={level.verifierUsername}
                    isCompleted={completedLevelIds.has(level.levelInfo.level_id)}
                    showCompletionStatus={isLoggedIn}
                    tags={level.dbId ? (tagsByLevelId.get(level.dbId) || []).filter((t: any) => t.show_on_card) : []}
                    avgRating={level.dbId ? ratingsAgg?.get(level.dbId)?.avg_overall : undefined}
                    ratingCount={level.dbId ? ratingsAgg?.get(level.dbId)?.count : undefined}
                    avgDifficulty={level.dbId ? difficultyAgg?.get(level.dbId)?.avg_difficulty : undefined}
                    difficultyCount={level.dbId ? difficultyAgg?.get(level.dbId)?.count : undefined}
                    levelDbId={level.dbId}
                    victorCount={level.dbId ? victorCounts?.get(level.dbId) : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;