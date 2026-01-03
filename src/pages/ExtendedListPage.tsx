import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, List, ChevronLeft, ChevronRight, Loader2, Trophy, User, Play, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtendedLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  creators: string[] | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
}

const ITEMS_PER_PAGE = 25;

function ExtendedLevelCard({ level }: { level: ExtendedLevel }) {
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

  return (
    <Link to={`/level/${level.level_id}?extended=true`}>
      <div className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
        <div className="w-12 text-center flex-shrink-0">
          <span className={`font-display font-bold text-lg ${getRankStyle(level.rank_position)}`}>
            #{level.rank_position}
          </span>
        </div>
        
        {level.thumbnail_url ? (
          <div className="w-20 h-12 rounded overflow-hidden flex-shrink-0">
            <img src={level.thumbnail_url} alt={level.name || ""} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-20 h-12 rounded bg-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-muted-foreground text-xs">No img</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{level.name || level.level_id}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" />
            {level.author || "Unknown"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-primary">
            <Trophy className="w-4 h-4" />
            <span className="font-mono font-bold">{level.points}pts</span>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleCopyId} title="Copy ID">
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handlePlay} title="Play">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ExtendedListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ["extended-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extended_levels")
        .select("*")
        .order("rank_position");
      
      if (error) throw error;
      return data as ExtendedLevel[];
    },
  });

  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return levels;
    const q = searchQuery.toLowerCase();
    return levels.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.author?.toLowerCase().includes(q) ||
        l.level_id.toLowerCase().includes(q)
    );
  }, [levels, searchQuery]);

  const totalPages = Math.ceil(filteredLevels.length / ITEMS_PER_PAGE);
  const paginatedLevels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLevels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLevels, currentPage]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <List className="w-8 h-8 text-primary" />
              <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text">
                Extended List
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Levels that used to be in the main list or don't quite meet main list standards. 
              Ranked separately from the main list.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search levels..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-card border-border"
              />
            </div>
            <div className="text-sm text-muted-foreground flex items-center">
              {filteredLevels.length} levels
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paginatedLevels.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              {searchQuery ? "No levels found matching your search." : "No extended levels yet."}
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {paginatedLevels.map((level) => (
                  <ExtendedLevelCard key={level.id} level={level} />
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
