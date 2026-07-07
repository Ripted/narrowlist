import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLevel, getPlayerProfile } from "@/hooks/useLevels";
import { formatTime, formatDate, fetchRunDetails, RunDetails } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowIcon } from "@/components/ArrowIcon";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Clock, User, Heart, Calendar, Medal, CheckCircle, Hash, Shield, Info, ArrowUpDown, Copy, Play, Layers, TrendingUp, FileText, Package, Download } from "lucide-react";
import { LevelFeedbackButton } from "@/components/LevelFeedbackButton";
import { LevelRankHistoryChart } from "@/components/LevelRankHistoryChart";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getPersistedHistoricalDate, subscribeHistoricalDate } from "@/components/HistoricalListViewer";

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
  const searchParams = new URLSearchParams(window.location.search);
  const isExtended = searchParams.get('extended') === 'true';
  const { level, leaderboard, rank, points, thumbnailUrl, loading, levelDbId, verifierProfileId, alternativeIds, description, isFromExtendedList } = useLevel(levelId || "", isExtended);
  const { toast } = useToast();
  const [runDetails, setRunDetails] = useState<Map<number, RunDetails>>(new Map());
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, DbProfile>>(new Map());
  const [manualRuns, setManualRuns] = useState<ManualRunEntry[]>([]);
  const [sortMode, setSortMode] = useState<"time" | "date">("time");
  const [packsContaining, setPacksContaining] = useState<{ id: string; name: string; cover_url: string | null }[]>([]);
  const levelTags: any[] = [];
  const [historicalCutoff, setHistoricalCutoff] = useState<string | null>(getPersistedHistoricalDate());

  useEffect(() => {
    const unsub = subscribeHistoricalDate(setHistoricalCutoff);
    return unsub;
  }, []);

  // Fetch packs containing this level
  useEffect(() => {
    async function loadPacks() {
      if (!levelDbId) return;
      const levelType = isFromExtendedList ? "extended" : "main";
      const { data: itemRows } = await supabase
        .from("level_pack_items")
        .select("pack_id")
        .eq("level_id", levelDbId)
        .eq("level_type", levelType);
      const packIds = Array.from(new Set((itemRows || []).map((r: any) => r.pack_id)));
      if (packIds.length === 0) { setPacksContaining([]); return; }
      const { data: packs } = await supabase
        .from("level_packs")
        .select("id, name, cover_url")
        .in("id", packIds);
      setPacksContaining(packs || []);
    }
    loadPacks();
  }, [levelDbId, isFromExtendedList]);

  const handleDownloadThumbnail = async () => {
    if (!thumbnailUrl) return;
    try {
      const res = await fetch(thumbnailUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = (blob.type.split("/")[1] || "png").split("+")[0];
      a.download = `${(level?.levelInfo?.name || levelId || "level").replace(/[^a-z0-9-_]+/gi, "_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(thumbnailUrl, "_blank");
    }
  };

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

  // Get verifier profile from database profile ID
  const verifierProfile = useMemo(() => {
    if (verifierProfileId) {
      for (const [username, profile] of profiles) {
        if (profile.id === verifierProfileId) {
          return profile;
        }
      }
    }
    return null;
  }, [verifierProfileId, profiles]);

  // Get verifier username from database profile ID, or fallback to oldest completion
  const verifierUsername = useMemo(() => {
    // If we have a verifier set in the database, look up their username
    if (verifierProfile) {
      return verifierProfile.display_name || verifierProfile.username;
    }
    
    // Fallback: oldest completion (earliest timestamp) based on leaderboard/run timestamps
    let best: { username: string; ts: number } | null = null;
    for (const entry of leaderboard) {
      const details = runDetails.get(entry.run_id);
      const candidateDate = entry.created_at || entry.finishedAt || entry.finished_at || details?.finishedAt;
      if (!candidateDate) continue;
      const ts = Date.parse(candidateDate);
      if (Number.isNaN(ts)) continue;
      if (!best || ts < best.ts) best = { username: entry.username, ts };
    }
    return best?.username ?? null;
  }, [verifierProfile, leaderboard, runDetails]);

  // Find verifier run ID for highlighting in the list
  const verifierRunId = useMemo(() => {
    if (!verifierUsername) return null;
    const entry = leaderboard.find(e => e.username.toLowerCase() === verifierUsername.toLowerCase());
    return entry?.run_id ?? null;
  }, [verifierUsername, leaderboard]);

  // Combined and sorted list of all runs (manual + API) for proper ranking
  const combinedSortedRuns = useMemo(() => {
    // Convert manual runs to a common format
    const manualEntries = manualRuns.map(run => ({
      type: 'manual' as const,
      run_id: run.run_id,
      username: run.username,
      completion_time: run.completion_time,
      arrow_name: run.arrow_name,
      is_verifier: run.is_verifier,
      completed_at: run.completed_at,
      note: run.note,
    }));

    // Convert leaderboard entries to a common format
    const apiEntries = leaderboard.map(entry => {
      const details = runDetails.get(entry.run_id);
      return {
        type: 'api' as const,
        run_id: entry.run_id,
        username: entry.username,
        completion_time: entry.completion_time,
        arrow_name: entry.arrow_name,
        is_verifier: false,
        completed_at: entry.created_at || entry.finishedAt || entry.finished_at || details?.finishedAt || null,
        note: null,
        details,
        originalEntry: entry,
      };
    });

    // Combine
    let combined = [...manualEntries, ...apiEntries];

    // Historical cutoff: drop runs newer than the selected datetime
    if (historicalCutoff) {
      const cutoffMs = Date.parse(historicalCutoff);
      if (!Number.isNaN(cutoffMs)) {
        combined = combined.filter((r) => {
          if (!r.completed_at) return true; // keep unknown-date runs
          const ts = Date.parse(r.completed_at);
          return Number.isNaN(ts) || ts <= cutoffMs;
        });
      }
    }

    if (sortMode === "time") {
      combined.sort((a, b) => a.completion_time - b.completion_time);
    } else {
      // Sort by oldest completion date
      combined.sort((a, b) => {
        if (!a.completed_at && !b.completed_at) return 0;
        if (!a.completed_at) return 1;
        if (!b.completed_at) return -1;
        return Date.parse(a.completed_at) - Date.parse(b.completed_at);
      });
    }

    return combined;
  }, [manualRuns, leaderboard, runDetails, sortMode, historicalCutoff]);

  const handleCopyId = () => {
    if (levelId) {
      navigator.clipboard.writeText(levelId);
      toast({ title: "Copied!", description: `Level ID: ${levelId}` });
    }
  };

  const handlePlay = () => {
    if (levelId) {
      window.open(`https://narrowarrow.xyz/levelid=${levelId}`, "_blank");
    }
  };

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
          <Link to="/main">
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
          <Link to="/main">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Levels
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8 mb-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="flex items-start gap-3 sm:gap-4">
                {rank && (
                  <div className="flex-shrink-0">
                    <div className={`font-display text-3xl sm:text-5xl font-bold ${getRankStyle(rank)}`}>
                      #{rank}
                    </div>
                  </div>
                )}
                <div className="space-y-1 sm:space-y-2 min-w-0">
                  <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-foreground break-words">
                    {levelInfo.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      {levelInfo.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      {levelInfo.like_count}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(levelInfo.created_at)}
                    </span>
                  </div>
                  {/* Community tags removed */}
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
                <div className="rounded-lg bg-card border border-border p-2 sm:p-4 text-center">
                  <Trophy className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
                  <div className="font-display text-lg sm:text-2xl font-bold text-primary">
                    {points}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">{isFromExtendedList ? "Extra Pts" : "Points"}</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-2 sm:p-4 text-center">
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-accent" />
                  <div className="font-mono text-sm sm:text-lg font-bold text-foreground">
                    {worldRecord ? formatTime(worldRecord.completion_time) : "N/A"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">WR</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-2 sm:p-4 text-center">
                  <User className="w-4 h-4 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-muted-foreground" />
                  <div className="font-display text-lg sm:text-2xl font-bold text-foreground">
                    {combinedSortedRuns.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Completions</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-2 sm:p-4 text-center hidden sm:block">
                  <Medal className="w-6 h-6 mx-auto mb-2 text-glow-gold" />
                  {worldRecord?.username ? (
                    <Link to={`/player/${worldRecord.username}`} className="font-display text-lg font-bold text-foreground truncate block hover:text-primary transition-colors">
                      {worldRecord.username}
                    </Link>
                  ) : (
                    <div className="font-display text-lg font-bold text-foreground truncate">
                      N/A
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">WR Holder</div>
                </div>
                <div className="rounded-lg bg-card border border-border p-2 sm:p-4 text-center hidden sm:block">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  {verifierProfile ? (
                    <Link to={`/player/${verifierProfile.username}`} className="font-display text-lg font-bold text-foreground truncate block hover:text-primary transition-colors">
                      {verifierUsername}
                    </Link>
                  ) : (
                    <div className="font-display text-lg font-bold text-foreground truncate">
                      {verifierUsername || "N/A"}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">Verifier</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="relative aspect-video rounded-lg bg-secondary border border-border overflow-hidden group">
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
                {thumbnailUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDownloadThumbnail}
                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 backdrop-blur hover:bg-background"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>


          {/* Description */}
          {description && (
            <div className="rounded-lg bg-card border border-border p-4 mb-8">
              <h3 className="font-display text-sm font-bold flex items-center gap-2 mb-3 text-muted-foreground">
                <FileText className="w-4 h-4" />
                Description
              </h3>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Packs containing this level */}
          {packsContaining.length > 0 && (
            <div className="rounded-lg bg-card border border-border p-4 mb-8">
              <h3 className="font-display text-sm font-bold flex items-center gap-2 mb-3 text-muted-foreground">
                <Package className="w-4 h-4" />
                In Level Packs ({packsContaining.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {packsContaining.map((pack) => (
                  <Link
                    key={pack.id}
                    to={`/packs/${pack.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/70 border border-border text-sm transition"
                  >
                    {pack.cover_url ? (
                      <img src={pack.cover_url} alt="" className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{pack.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Level IDs Section */}
          {alternativeIds.length > 0 && (
            <div className="rounded-lg bg-card border border-border p-4 mb-8">
              <h3 className="font-display text-sm font-bold flex items-center gap-2 mb-3 text-muted-foreground">
                <Layers className="w-4 h-4" />
                Alternative Level IDs
              </h3>
              <div className="flex flex-wrap gap-2">
                {alternativeIds.map((altId) => (
                  <span
                    key={altId}
                    className="font-mono text-xs bg-secondary px-2 py-1 rounded text-foreground"
                  >
                    {altId}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Completions from these alternative versions also count for this level.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-card border border-border overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Completions
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {levelDbId && (
                  <WatchlistButton levelDbId={levelDbId} levelName={levelInfo.name} />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyId}
                  className="gap-2 text-xs sm:text-sm"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Copy ID</span>
                  <span className="sm:hidden">ID</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handlePlay}
                  className="gap-2 text-xs sm:text-sm"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                  Play
                </Button>
                <Button
                  variant={sortMode === "time" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSortMode(sortMode === "time" ? "date" : "time")}
                  className="gap-2 text-xs sm:text-sm"
                >
                  <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{sortMode === "time" ? "Fastest" : "Oldest"}</span>
                </Button>
                {levelDbId && rank && (
                  <LevelFeedbackButton levelDbId={levelDbId} levelRank={rank} />
                )}
              </div>
            </div>

            {combinedSortedRuns.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No completions yet. Be the first!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {combinedSortedRuns.map((run, index) => {
                  const profile = getProfile(run.username);
                  const isManualRun = run.type === 'manual';
                  const isVerifier = isManualRun 
                    ? run.is_verifier 
                    : (verifierRunId !== null && run.run_id === verifierRunId);
                  const details = isManualRun ? null : (run as any).details;
                  
                  return (
                    <Link
                      key={`${run.type}-${run.run_id}`}
                      to={`/player/${run.username}`}
                      className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-secondary/20 transition-colors ${
                        isVerifier ? "bg-primary/5 border-l-2 border-primary" : ""
                      } ${isManualRun && !isVerifier ? "bg-accent/5 border-l-2 border-accent" : ""}`}
                    >
                      <div className="w-6 sm:w-8 text-center flex-shrink-0">
                        {index < 3 ? (
                          <Medal className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto ${getMedalColor(index)}`} />
                        ) : (
                          <span className="font-mono text-xs sm:text-sm text-muted-foreground">{index + 1}</span>
                        )}
                      </div>

                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={run.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground text-xs sm:text-sm font-bold">
                            {run.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="font-medium text-sm sm:text-base text-foreground truncate">
                            {profile?.display_name || run.username}
                          </span>
                          {isVerifier && (
                            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-primary bg-primary/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">Verifier</span>
                              <span className="sm:hidden">V</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                          <ArrowIcon arrowName={run.arrow_name} className="w-3 h-3 sm:w-4 sm:h-4" />
                          {run.completed_at && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline">{formatDate(run.completed_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="font-mono text-xs sm:text-sm text-primary font-medium">
                          {formatTime(run.completion_time)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Community Ratings + Tag Votes + Difficulty */}
          {levelDbId && (
            <div className="mt-8 grid lg:grid-cols-2 gap-4 sm:gap-6">
              <LevelRatingPanel
                levelDbId={levelDbId}
                levelType={isFromExtendedList ? "extra" : "main"}
              />
              <DifficultyVotePanel
                levelDbId={levelDbId}
                levelType={isFromExtendedList ? "extra" : "main"}
              />
              <div className="lg:col-span-2">
                <CommunityTagsPanel
                  levelDbId={levelDbId}
                  levelType={isFromExtendedList ? "extra" : "main"}
                />
              </div>
            </div>
          )}

          {/* Rank History Chart - moved below completions, hidden for Extra List levels */}
          {levelDbId && !isFromExtendedList && (
            <div className="rounded-lg bg-card border border-border p-4 mt-8">
              <h3 className="font-display text-sm font-bold flex items-center gap-2 mb-4 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                Rank History
              </h3>
              <LevelRankHistoryChart levelDbId={levelDbId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
