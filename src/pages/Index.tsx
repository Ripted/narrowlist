import { useState, useMemo } from "react";
import { useLevels } from "@/hooks/useLevels";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import { LevelCard } from "@/components/LevelCard";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Target, Search } from "lucide-react";

const Index = () => {
  const { levels, loading, error } = useLevels();
  const { completedLevelIds, isLoggedIn } = useUserCompletions();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return levels;
    const query = searchQuery.toLowerCase();
    return levels.filter(
      (level) =>
        level.levelInfo.name.toLowerCase().includes(query) ||
        level.levelInfo.author.toLowerCase().includes(query)
    );
  }, [levels, searchQuery]);

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
                <h1 className="font-display text-2xl font-bold">Main List</h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono">{levels.length} Levels</span>
                <span className="bg-accent/10 text-accent px-2 py-1 rounded font-mono">{maxPoints} Max Points</span>
              </div>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search levels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-card border border-border animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
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