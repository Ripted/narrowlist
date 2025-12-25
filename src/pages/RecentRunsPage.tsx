import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Activity, Search, Clock, Trophy, CheckCircle } from "lucide-react";
import { formatTime } from "@/lib/api";

interface RecentRun {
  id: string;
  profile_id: string;
  level_id: string;
  completion_time: number;
  completed_at: string;
  arrow_name: string | null;
  run_id: number;
  // Joined data
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level_name: string | null;
  level_db_id: string;
  level_rank: number;
  is_verifier: boolean;
}

export default function RecentRunsPage() {
  const [runs, setRuns] = useState<RecentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadRecentRuns() {
      setLoading(true);

      // Fetch completions with profile and level data
      const { data: completions, error } = await supabase
        .from("completions")
        .select(`
          id,
          profile_id,
          level_id,
          completion_time,
          completed_at,
          arrow_name,
          run_id
        `)
        .order("completed_at", { ascending: false })
        .limit(100);

      if (error || !completions) {
        setLoading(false);
        return;
      }

      // Fetch profiles
      const profileIds = [...new Set(completions.map(c => c.profile_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", profileIds);

      // Fetch levels
      const levelIds = [...new Set(completions.map(c => c.level_id))];
      const { data: levels } = await supabase
        .from("levels")
        .select("id, name, rank_position, verifier_profile_id")
        .in("id", levelIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const levelMap = new Map(levels?.map(l => [l.id, l]) || []);

      // Map and add verifier info
      const mappedRuns: RecentRun[] = completions.map(c => {
        const profile = profileMap.get(c.profile_id);
        const level = levelMap.get(c.level_id);
        return {
          id: c.id,
          profile_id: c.profile_id,
          level_id: c.level_id,
          completion_time: c.completion_time,
          completed_at: c.completed_at,
          arrow_name: c.arrow_name,
          run_id: c.run_id,
          username: profile?.username || "Unknown",
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          level_name: level?.name || "Unknown Level",
          level_db_id: c.level_id,
          level_rank: level?.rank_position || 0,
          is_verifier: level?.verifier_profile_id === c.profile_id,
        };
      });

      setRuns(mappedRuns);
      setLoading(false);
    }

    loadRecentRuns();
  }, []);

  const filteredRuns = runs.filter(run => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      run.username.toLowerCase().includes(query) ||
      run.display_name?.toLowerCase().includes(query) ||
      run.level_name?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative pt-24 pb-12">
        <section className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <h1 className="font-display text-2xl font-bold">Recent Runs</h1>
              </div>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                {runs.length} Runs
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search runs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Activity className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">
                {searchQuery ? "No Results Found" : "No Recent Runs"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term." : "No runs have been recorded yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {filteredRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors ${
                      run.is_verifier ? "bg-primary/5 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    {/* Player Avatar */}
                    <Link to={`/player/${run.username}`} className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden border-2 border-border hover:border-primary transition-colors">
                        {run.avatar_url ? (
                          <img src={run.avatar_url} alt={run.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                            {(run.display_name || run.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Run Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/player/${run.username}`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {run.display_name || run.username}
                        </Link>
                        {run.is_verifier && (
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Verification
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Completed{" "}
                        <Link to={`/level/${run.level_db_id}`} className="text-primary hover:underline">
                          {run.level_name}
                        </Link>
                        <span className="text-xs ml-1">(#{run.level_rank})</span>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-primary font-mono">
                        <Clock className="w-4 h-4" />
                        {formatTime(run.completion_time)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(run.completed_at)}
                      </div>
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
