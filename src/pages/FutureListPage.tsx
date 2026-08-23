import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Clock, Search } from "lucide-react";
import { FutureLevelCard } from "@/components/FutureLevelCard";
import { fetchLevelDetails } from "@/lib/api";

interface FutureLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  creators: string[] | null;
  rank_position: number;
  sub_rank: number;
  points: number;
  thumbnail_url: string | null;
  created_at: string;
}

export default function FutureListPage() {
  const [futureLevels, setFutureLevels] = useState<FutureLevel[]>([]);
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadFutureLevels() {
      setLoading(true);
      const { data, error } = await supabase
        .from("future_levels")
        .select("*")
        .order("rank_position", { ascending: true })
        .order("sub_rank", { ascending: true });

      if (!error && data) {
        setFutureLevels(data as FutureLevel[]);
      }
      setLoading(false);
    }
    loadFutureLevels();
  }, []);

  // Throttled enrichment: batches of 5, 200ms delay
  useEffect(() => {
    if (futureLevels.length === 0) return;
    let cancelled = false;

    const enrich = async () => {
      const counts = new Map<string, number>();
      const BATCH = 5;
      for (let i = 0; i < futureLevels.length; i += BATCH) {
        if (cancelled) return;
        const batch = futureLevels.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map((l) => fetchLevelDetails(l.level_id))
        );
        results.forEach((r, idx) => {
          if (r?.levelInfo) counts.set(batch[idx].level_id, r.levelInfo.like_count);
        });
        if (!cancelled) setLikeCounts(new Map(counts));
        if (i + BATCH < futureLevels.length) {
          await new Promise((res) => setTimeout(res, 200));
        }
      }
    };
    enrich();
    return () => {
      cancelled = true;
    };
  }, [futureLevels]);

  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return futureLevels;
    const q = searchQuery.toLowerCase();
    return futureLevels.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.author?.toLowerCase().includes(q) ||
        l.creators?.some((c) => c.toLowerCase().includes(q)) ||
        l.level_id.toLowerCase().includes(q)
    );
  }, [futureLevels, searchQuery]);

  // How many levels share each estimated rank (drives the ~#5.1 / ~#5.2 display)
  const rankGroupSizes = useMemo(() => {
    const sizes = new Map<number, number>();
    for (const l of futureLevels) {
      sizes.set(l.rank_position, (sizes.get(l.rank_position) ?? 0) + 1);
    }
    return sizes;
  }, [futureLevels]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative pt-24 pb-12">
        <section className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent" />
                <h1 className="font-display text-2xl font-bold">Future List</h1>
              </div>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                {futureLevels.length} Levels
              </span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-72 rounded-xl bg-card border border-border animate-pulse" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLevels.map((level) => (
                <FutureLevelCard
                  key={level.id}
                  level={level}
                  likeCount={likeCounts.get(level.level_id)}
                  rankGroupSize={rankGroupSizes.get(level.rank_position) ?? 1}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
