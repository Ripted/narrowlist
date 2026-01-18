import { useState, useMemo } from "react";
import { useLevels } from "@/hooks/useLevels";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import { useAllLevelTags } from "@/hooks/useLevelTags";
import { LevelCard } from "@/components/LevelCard";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target, Search, Filter, History, Tag, X } from "lucide-react";
import { HistoricalListViewer } from "@/components/HistoricalListViewer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyUncompleted, setShowOnlyUncompleted] = useState(false);
  const [historicalLevels, setHistoricalLevels] = useState<HistoricalLevel[] | null>(null);
  const [historicalDate, setHistoricalDate] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleHistoricalData = (levels: HistoricalLevel[] | null, date: string | null) => {
    setHistoricalLevels(levels);
    setHistoricalDate(date);
  };

  // Calculate top 5 most used tags
  const topTags = useMemo(() => {
    const tagCounts = new Map<string, { emoji: string; text: string; count: number }>();
    allTags.forEach(tag => {
      const key = `${tag.emoji}|${tag.text}`;
      if (tagCounts.has(key)) {
        tagCounts.get(key)!.count++;
      } else {
        tagCounts.set(key, { emoji: tag.emoji, text: tag.text, count: 1 });
      }
    });
    return Array.from(tagCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
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
    let result = levels;
    
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

    // Filter by selected tag
    if (selectedTag) {
      const levelIdsWithTag = new Set(
        allTags
          .filter(tag => `${tag.emoji}|${tag.text}` === selectedTag)
          .map(tag => tag.level_id)
      );
      // Tags reference the database UUID id (dbId in our level objects)
      result = result.filter(level => level.dbId && levelIdsWithTag.has(level.dbId));
    }
    
    return result;
  }, [levels, searchQuery, showOnlyUncompleted, isLoggedIn, completedLevelIds, selectedTag, allTags]);

  const maxPoints = useMemo(() => {
    return levels.reduce((sum, level) => sum + (level.points || 0), 0);
  }, [levels]);

  return (
    <div className="min-h-screen bg-background">
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
                  onClick={() => setShowOnlyUncompleted(!showOnlyUncompleted)}
                  className="gap-2 flex-shrink-0"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Uncompleted</span>
                </Button>
              )}
              <div className="relative flex-1 sm:w-64">
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
          {!historicalLevels && topTags.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Filter by tag:
              </span>
              <TooltipProvider>
                {topTags.map((tag) => {
                  const tagKey = `${tag.emoji}|${tag.text}`;
                  const isSelected = selectedTag === tagKey;
                  return (
                    <Tooltip key={tagKey}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2 text-sm"
                          onClick={() => setSelectedTag(isSelected ? null : tagKey)}
                        >
                          {tag.emoji}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tag.emoji} {tag.text} ({tag.count})</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
              {selectedTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1"
                  onClick={() => setSelectedTag(null)}
                >
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              )}
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
                    <div
                      key={level.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="rounded-xl bg-card border border-border overflow-hidden hover:border-primary/50 transition-all">
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
                          <h3 className="font-display font-bold truncate">{level.name || "Unknown Level"}</h3>
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
                    </div>
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