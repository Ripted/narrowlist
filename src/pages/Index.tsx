import { useLevels } from "@/hooks/useLevels";
import { LevelCard } from "@/components/LevelCard";
import { Navbar } from "@/components/Navbar";
import { Trophy, Zap, Target } from "lucide-react";

const Index = () => {
  const { levels, loading, error } = useLevels();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <main className="relative pt-24 pb-12">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-12">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-2 text-sm text-primary">
              <Zap className="w-4 h-4" />
              <span>The Ultimate Challenge</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
              <span className="gradient-text text-glow">NARROW</span>
              <span className="text-foreground">LIST</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              The definitive ranking of the most challenging levels.
            </p>

            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-primary">{levels.length}</div>
                <div className="text-sm text-muted-foreground">Levels</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-accent">
                  {levels.reduce((sum, level) => sum + (level.points || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Max Points</div>
              </div>
            </div>
          </div>
        </section>

        {/* Levels Grid */}
        <section className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">Level Rankings</h2>
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
          ) : levels.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Target className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">No Levels Yet</h3>
              <p className="text-muted-foreground">
                Add level IDs to <code className="text-primary">src/config/levels.ts</code> to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {levels.map((level) => (
                <div
                  key={level.levelInfo.level_id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${level.rank * 50}ms` }}
                >
                  <LevelCard
                    level={level}
                    rank={level.rank}
                    thumbnailUrl={level.thumbnailUrl}
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
