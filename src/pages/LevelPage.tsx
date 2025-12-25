import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLevel, getPlayerProfile } from "@/hooks/useLevels";
import { formatTime, formatDate, fetchRunDetails, RunDetails } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowIcon } from "@/components/ArrowIcon";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Clock, User, Heart, Calendar, Medal, CheckCircle, Hash, Shield, Info } from "lucide-react";

interface DbProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ManualRunEntry {
  isManual: true;
  run_id: number;
  completion_time: number;
  username: string;
  arrow_name: string;
  is_verifier: boolean;
  completed_at: string;
  note: string | null;
}

export default function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { level, leaderboard, rank, points, thumbnailUrl, loading, levelDbId } = useLevel(levelId || "");
  const [runDetails, setRunDetails] = useState<Map<number, RunDetails>>(new Map());
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, DbProfile>>(new Map());
  const [manualRuns, setManualRuns] = useState<ManualRunEntry[]>([]);

  // Fetch profiles from DB
  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url");
      
      if (data) {
        const map = new Map<string, DbProfile>();
        for (const p of data) {
          map.set(p.username.toLowerCase(), p);
        }
        setProfiles(map);
      }
    }
    loadProfiles();
  }, []);

  // Fetch manual runs for this level
  useEffect(() => {
    async function loadManualRuns() {
      if (!levelDbId) return;
      
      const { data } = await supabase
        .from("manual_runs")
        .select("*, profiles(username)")
        .eq("level_id", levelDbId);
      
      if (data) {
        const runs: ManualRunEntry[] = data.map((run, idx) => ({
          isManual: true,
          run_id: -1000 - idx, // Negative ID to differentiate
          completion_time: Number(run.completion_time),
          username: (run.profiles as any)?.username || "Unknown",
          arrow_name: run.arrow_name,
          is_verifier: run.is_verifier,
          completed_at: run.completed_at,
          note: run.note,
        }));
        setManualRuns(runs);
      }
    }
    loadManualRuns();
  }, [levelDbId]);

  useEffect(() => {
    if (leaderboard.length > 0) {
      setLoadingRuns(true);
      Promise.all(
        leaderboard.map((entry) =>
          fetchRunDetails(entry.run_id).then((details) => ({
            runId: entry.run_id,
            details,
          }))
        )
      ).then((results) => {
        const map = new Map<number, RunDetails>();
        results.forEach(({ runId, details }) => {
          if (details) map.set(runId, details);
        });
        setRunDetails(map);
        setLoadingRuns(false);
      });
    }
  }, [leaderboard]);

  // Find verifier - check for verified boolean field on each run
  // The run with verified=true indicates this person verified the level
  const verifierEntry = useMemo(() => {
    for (const entry of leaderboard) {
      const details = runDetails.get(entry.run_id);
      // Use verified field - if true, this person is the verifier
      if (details?.verified === true) {
        return { ...entry, details };
      }
    }
    return null;
  }, [leaderboard, runDetails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="font-display text-2xl font-bold text-destructive">Level Not Found</h1>
          <Link to="/">
            <Button variant="ghost" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Levels
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { levelInfo, worldRecord } = level;

  const getRankStyle = (r: number) => {
    if (r === 1) return "rank-gold";
    if (r === 2) return "rank-silver";
    if (r === 3) return "rank-bronze";
    return "text-foreground";
  };

  const getMedalColor = (position: number) => {
    if (position === 0) return "text-glow-gold";
    if (position === 1) return "text-glow-silver";
    if (position === 2) return "text-glow-bronze";
    return "text-muted-foreground";
  };

  const getProfile = (username: string) => profiles.get(username.toLowerCase());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Levels
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start gap-4">
                {rank && (
                  <div className="flex-shrink-0">
                    <div className={`font-display text-5xl font-bold ${getRankStyle(rank)}`}>
                      #{rank}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    {levelInfo.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {levelInfo.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-destructive" />
                      {levelInfo.like_count} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(levelInfo.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-lg bg-card border border-border p-4 text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="font-display text-2xl font-bold text-primary">{points}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <div className="font-mono text-lg font-bold text-foreground">
                    {worldRecord ? formatTime(worldRecord.completion_time) : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">World Record</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-4 text-center">
                  <User className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="font-display text-2xl font-bold text-foreground">
                    {leaderboard.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Completions</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-4 text-center">
                  <Medal className="w-6 h-6 mx-auto mb-2 text-glow-gold" />
                  <div className="font-display text-lg font-bold text-foreground truncate">
                    {worldRecord?.username || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">WR Holder</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-4 text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="font-display text-lg font-bold text-foreground truncate">
                    {verifierEntry?.username || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Verifier</div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="aspect-video rounded-lg bg-secondary border border-border overflow-hidden">
                {thumbnailUrl ? (
                  <img 
                    src={thumbnailUrl} 
                    alt={levelInfo.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl font-display font-bold text-muted-foreground/20">
                      #{rank || "?"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Completions
              </h2>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No completions yet. Be the first!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leaderboard.map((entry, index) => {
                  const profile = getProfile(entry.username);
                  const details = runDetails.get(entry.run_id);
                  const isVerifier = details?.verified === true;
                  
                  return (
                    <Link
                      key={entry.run_id}
                      to={`/player/${entry.username}`}
                      className={`flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors ${
                        isVerifier ? "bg-primary/5 border-l-2 border-primary" : ""
                      }`}
                    >
                      <div className="w-8 text-center flex-shrink-0">
                        {index < 3 ? (
                          <Medal className={`w-5 h-5 mx-auto ${getMedalColor(index)}`} />
                        ) : (
                          <span className="font-mono text-muted-foreground">{index + 1}</span>
                        )}
                      </div>

                      <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground font-bold">
                            {entry.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {profile?.display_name || entry.username}
                          </span>
                          {isVerifier && (
                            <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Verifier
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <ArrowIcon arrowName={entry.arrow_name} className="w-4 h-4" />
                          {details?.finishedAt && (
                            <>
                              <span>•</span>
                              <span>{formatDate(details.finishedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {details?.input_count !== undefined && (
                          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                            <Hash className="w-3 h-3" />
                            <span>{details.input_count} inputs</span>
                          </div>
                        )}
                        <div className="font-mono text-primary font-medium">
                          {formatTime(entry.completion_time)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
