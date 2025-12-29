import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Trophy, Hammer, Crown } from "lucide-react";

interface CreatorStats {
  author: string;
  levelCount: number;
  totalPoints: number;
  levels: {
    id: string;
    level_id: string;
    name: string | null;
    rank_position: number;
    points: number;
    thumbnail_url: string | null;
  }[];
}

export default function CreatorLeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ["levels-for-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("levels")
        .select("id, level_id, name, author, rank_position, points, thumbnail_url")
        .order("rank_position");
      
      if (error) throw error;
      return data || [];
    },
  });

  const creatorStats = useMemo(() => {
    const statsMap = new Map<string, CreatorStats>();
    
    levels.forEach((level) => {
      const author = level.author || "Unknown";
      const existing = statsMap.get(author);
      
      if (existing) {
        existing.levelCount++;
        existing.totalPoints += level.points;
        existing.levels.push({
          id: level.id,
          level_id: level.level_id,
          name: level.name,
          rank_position: level.rank_position,
          points: level.points,
          thumbnail_url: level.thumbnail_url,
        });
      } else {
        statsMap.set(author, {
          author,
          levelCount: 1,
          totalPoints: level.points,
          levels: [{
            id: level.id,
            level_id: level.level_id,
            name: level.name,
            rank_position: level.rank_position,
            points: level.points,
            thumbnail_url: level.thumbnail_url,
          }],
        });
      }
    });
    
    return Array.from(statsMap.values())
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [levels]);

  const filteredCreators = useMemo(() => {
    if (!searchQuery.trim()) return creatorStats;
    const query = searchQuery.toLowerCase();
    return creatorStats.filter(c => 
      c.author.toLowerCase().includes(query)
    );
  }, [creatorStats, searchQuery]);

  const selectedCreatorData = useMemo(() => {
    if (!selectedCreator) return null;
    return creatorStats.find(c => c.author === selectedCreator);
  }, [creatorStats, selectedCreator]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Crown };
    if (rank === 2) return { color: "text-gray-300", bg: "bg-gray-300/10", icon: Trophy };
    if (rank === 3) return { color: "text-amber-600", bg: "bg-amber-600/10", icon: Trophy };
    return { color: "text-muted-foreground", bg: "bg-muted/50", icon: null };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <main className="relative pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Hammer className="w-8 h-8 text-primary" />
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text">
                  Creator Leaderboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {creatorStats.length} creators • {levels.length} total levels
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Creator List */}
              <div className="lg:col-span-2 space-y-3">
                {/* Top 3 Podium */}
                {!searchQuery && filteredCreators.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 0, 2].map((podiumIndex) => {
                      const creator = filteredCreators[podiumIndex];
                      if (!creator) return null;
                      const rank = podiumIndex === 1 ? 2 : podiumIndex === 0 ? 1 : 3;
                      const { color, bg } = getRankBadge(rank);
                      const height = rank === 1 ? "h-32" : rank === 2 ? "h-24" : "h-20";
                      
                      return (
                        <button
                          key={creator.author}
                          onClick={() => setSelectedCreator(creator.author)}
                          className={`flex flex-col items-center justify-end ${height} p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all ${selectedCreator === creator.author ? 'ring-2 ring-primary' : ''}`}
                        >
                          <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mb-2`}>
                            <span className={`font-display font-bold ${color}`}>{rank}</span>
                          </div>
                          <span className="font-semibold text-sm truncate max-w-full">{creator.author}</span>
                          <span className="text-xs text-muted-foreground">{creator.totalPoints} pts</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Full List */}
                {filteredCreators.slice(searchQuery ? 0 : 3).map((creator, index) => {
                  const rank = searchQuery ? index + 1 : index + 4;
                  const { color, bg } = getRankBadge(rank);
                  
                  return (
                    <button
                      key={creator.author}
                      onClick={() => setSelectedCreator(creator.author)}
                      className={`w-full flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all text-left ${selectedCreator === creator.author ? 'ring-2 ring-primary border-primary' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                        <span className={`font-display font-bold ${color}`}>#{rank}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-semibold truncate">{creator.author}</div>
                        <div className="text-sm text-muted-foreground">
                          {creator.levelCount} level{creator.levelCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-mono font-bold text-primary">{creator.totalPoints}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </button>
                  );
                })}

                {filteredCreators.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No creators found matching your search
                  </div>
                )}
              </div>

              {/* Creator Profile Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-card border border-border rounded-xl p-4">
                  {selectedCreatorData ? (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3">
                          <Hammer className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <h2 className="font-display text-xl font-bold">{selectedCreatorData.author}</h2>
                        <p className="text-sm text-muted-foreground">Level Creator</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-secondary/50 rounded-lg p-3 text-center">
                          <div className="font-mono text-2xl font-bold text-primary">
                            {selectedCreatorData.levelCount}
                          </div>
                          <div className="text-xs text-muted-foreground">Levels</div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3 text-center">
                          <div className="font-mono text-2xl font-bold text-accent">
                            {selectedCreatorData.totalPoints}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Pts</div>
                        </div>
                      </div>

                      <h3 className="font-display font-semibold mb-3">Levels by {selectedCreatorData.author}</h3>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {selectedCreatorData.levels
                          .sort((a, b) => a.rank_position - b.rank_position)
                          .map((level) => (
                            <Link
                              key={level.id}
                              to={`/level/${level.level_id}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                              {level.thumbnail_url ? (
                                <img 
                                  src={level.thumbnail_url} 
                                  alt={level.name || "Level"} 
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <Hammer className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {level.name || "Unknown Level"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  #{level.rank_position} • {level.points} pts
                                </div>
                              </div>
                            </Link>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Hammer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Select a creator to view their profile</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}