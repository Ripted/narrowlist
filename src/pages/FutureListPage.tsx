import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Search, Target, Play } from "lucide-react";

interface FutureLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
}

export default function FutureListPage() {
  const [futureLevels, setFutureLevels] = useState<FutureLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadFutureLevels() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("future_levels")
        .select("*")
        .order("rank_position", { ascending: true });
      
      if (!error && data) {
        setFutureLevels(data);
      }
      setLoading(false);
    }
    
    loadFutureLevels();
  }, []);

  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return futureLevels;
    const query = searchQuery.toLowerCase();
    return futureLevels.filter(
      (level) =>
        (level.name?.toLowerCase().includes(query)) ||
        (level.author?.toLowerCase().includes(query))
    );
  }, [futureLevels, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <main className="relative pt-24 pb-12">
        <section className="container mx-auto px-4 mb-12">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary mb-4">
              <Clock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              <span className="gradient-text-accent text-glow-accent">Future</span>
              <span className="text-foreground"> List</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Levels that have been rated but not yet beaten. Once completed, they'll move to the main list.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-accent" />
              <h2 className="font-display text-2xl font-bold">Upcoming Levels</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {futureLevels.length} levels
              </span>
            </div>
            
            <div className="relative w-64">
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
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : filteredLevels.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">
                {searchQuery ? "No Results Found" : "No Future Levels"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term." : "All rated levels have been beaten!"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {filteredLevels.map((level) => (
                  <div
                    key={level.id}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="w-16 text-center flex-shrink-0">
                      <span className="font-display font-bold text-xl text-accent">
                        ~#{level.rank_position}
                      </span>
                    </div>
                    
                    <div className="w-16 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                      {level.thumbnail_url ? (
                        <img src={level.thumbnail_url} alt={level.name || "Level"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {level.name || "Unnamed Level"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        By: {level.author || "Unknown"} • {level.points} pts
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(`https://narrowarrow.xyz/levelid=${level.level_id}`, "_blank");
                        }}
                        title="Play Level"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground bg-accent/10 text-accent px-2 py-1 rounded">
                        Unbeaten
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
