import { useState, useMemo } from "react";
import { useLevels } from "@/hooks/useLevels";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import { useAllLevelTags } from "@/hooks/useLevelTags";
import { LevelCard } from "@/components/LevelCard";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target, Search, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 25;

const ExtendedListPage = () => {
  const { levels, loading, error } = useLevels();
  const { completedLevelIds, isLoggedIn } = useUserCompletions();
  const { data: allTags = [] } = useAllLevelTags();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Only show levels ranked 101+
  const extendedLevels = useMemo(() => {
    return levels.filter(l => l.rank > 100);
  }, [levels]);

  // Group tags by level_id
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
    if (!searchQuery.trim()) return extendedLevels;
    const query = searchQuery.toLowerCase();
    return extendedLevels.filter(
      (level) =>
        level.levelInfo.name.toLowerCase().includes(query) ||
        level.levelInfo.author.toLowerCase().includes(query)
    );
  }, [extendedLevels, searchQuery]);

  const totalPages = Math.ceil(filteredLevels.length / ITEMS_PER_PAGE);
  const paginatedLevels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLevels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLevels, currentPage]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <main className="relative pt-24 pb-12">
        <section className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <h1 className="font-display text-2xl font-bold">Extended List</h1>
              </div>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                {extendedLevels.length} Levels
              </span>
            </div>
            
            <div className="relative w-full sm:w-64">
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

          <p className="text-muted-foreground text-sm mb-6">
            Levels ranked 101 and beyond — an extension of the main list. These levels are notable but don't 
            award any points. Rankings are continuous with the main list.
          </p>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : paginatedLevels.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Target className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">
                {searchQuery ? "No Results Found" : "No Extended Levels Yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term." : "Levels ranked 101+ will appear here."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedLevels.map((level) => (
                  <div
                    key={level.levelInfo.level_id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(level.rank % 25) * 50}ms` }}
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
        </section>
      </main>
    </div>
  );
};

export default ExtendedListPage;
