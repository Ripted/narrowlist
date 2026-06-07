import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dice5, Check, SkipForward, Flag, Save, Trash2, Play, RotateCcw, ExternalLink, Trophy, ChevronDown, ChevronUp } from "lucide-react";

interface RouletteLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  listType: "main" | "extra";
}

interface SavedRouletteRun {
  id: string;
  savedAt: string;
  completed: number;
  skipped: number;
  total: number;
  skipsAllowed: number;
  gaveUp: boolean;
  rankMin: number;
  rankMax: number;
  levels: Array<{ level_id: string; name: string | null; rank: number; listType: "main" | "extra"; status: "completed" | "skipped" | "pending" }>;
}

const STORAGE_KEY = "narrowlist-level-roulette-runs";

function loadSavedRuns(): SavedRouletteRun[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function LevelRoulettePage() {
  const { toast } = useToast();
  const [levelCount, setLevelCount] = useState(10);
  const [skipCount, setSkipCount] = useState(1);
  const [rankMin, setRankMin] = useState(1);
  const [rankMax, setRankMax] = useState(100);
  const [includeMain, setIncludeMain] = useState(true);
  const [includeExtra, setIncludeExtra] = useState(true);
  const [runLevels, setRunLevels] = useState<RouletteLevel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [gaveUp, setGaveUp] = useState(false);
  const [savedRuns, setSavedRuns] = useState<SavedRouletteRun[]>(loadSavedRuns);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const { data: allLevels = [], isLoading } = useQuery({
    queryKey: ["roulette-levels"],
    queryFn: async () => {
      const [mainResult, extraResult] = await Promise.all([
        supabase.from("levels").select("id, level_id, name, author, rank_position, points, thumbnail_url").order("rank_position"),
        supabase.from("extended_levels").select("id, level_id, name, author, rank_position, points, thumbnail_url").order("rank_position"),
      ]);
      if (mainResult.error) throw mainResult.error;
      if (extraResult.error) throw extraResult.error;
      return [
        ...((mainResult.data || []).map((level) => ({ ...level, listType: "main" as const })) as RouletteLevel[]),
        ...((extraResult.data || []).map((level) => ({ ...level, listType: "extra" as const })) as RouletteLevel[]),
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Max possible rank across enabled lists (used to clamp Max rank input)
  const maxAvailableRank = useMemo(() => {
    let m = 0;
    for (const l of allLevels) {
      if (l.listType === "main" && !includeMain) continue;
      if (l.listType === "extra" && !includeExtra) continue;
      if (l.rank_position > m) m = l.rank_position;
    }
    return m || 1;
  }, [allLevels, includeMain, includeExtra]);

  // Clamp rankMax when list selection / available data changes
  useEffect(() => {
    if (rankMax > maxAvailableRank) setRankMax(maxAvailableRank);
  }, [maxAvailableRank]); // eslint-disable-line react-hooks/exhaustive-deps

  const eligibleLevels = useMemo(() => {
    const min = Math.max(1, Math.min(rankMin, rankMax));
    const max = Math.max(min, rankMax);
    return allLevels.filter((level) => {
      if (level.rank_position < min || level.rank_position > max) return false;
      if (level.listType === "main" && !includeMain) return false;
      if (level.listType === "extra" && !includeExtra) return false;
      return true;
    });
  }, [allLevels, rankMin, rankMax, includeMain, includeExtra]);

  const currentLevel = runLevels[currentIndex];
  const runActive = runLevels.length > 0 && !gaveUp && currentIndex < runLevels.length;
  const runFinished = runLevels.length > 0 && (gaveUp || currentIndex >= runLevels.length);
  const skipsUsed = skippedIds.size;

  const startRun = () => {
    const safeCount = Math.max(1, Math.min(levelCount, eligibleLevels.length));
    if (eligibleLevels.length === 0) {
      toast({ title: "No levels found", description: "Adjust the list or rank range settings.", variant: "destructive" });
      return;
    }
    setRunLevels(shuffle(eligibleLevels).slice(0, safeCount));
    setCurrentIndex(0);
    setCompletedIds(new Set());
    setSkippedIds(new Set());
    setGaveUp(false);
  };

  const completeCurrentLevel = () => {
    if (!currentLevel) return;
    setCompletedIds((prev) => new Set(prev).add(currentLevel.id));
    setCurrentIndex((prev) => prev + 1);
  };

  const skipCurrentLevel = () => {
    if (!currentLevel || skipsUsed >= skipCount) return;
    setSkippedIds((prev) => new Set(prev).add(currentLevel.id));
    setCurrentIndex((prev) => prev + 1);
  };

  const saveRun = () => {
    const saved: SavedRouletteRun = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      completed: completedIds.size,
      skipped: skippedIds.size,
      total: runLevels.length,
      skipsAllowed: skipCount,
      gaveUp,
      rankMin,
      rankMax,
      levels: runLevels.map((level) => ({
        level_id: level.level_id,
        name: level.name,
        rank: level.rank_position,
        listType: level.listType,
        status: completedIds.has(level.id) ? "completed" : skippedIds.has(level.id) ? "skipped" : "pending",
      })),
    };
    const next = [saved, ...savedRuns].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedRuns(next);
    toast({ title: "Saved", description: "Roulette run saved on this device." });
  };

  const clearSavedRuns = () => {
    if (!confirm("Delete ALL saved roulette runs?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setSavedRuns([]);
  };

  const deleteSavedRun = (id: string) => {
    const next = savedRuns.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSavedRuns(next);
    if (expandedRunId === id) setExpandedRunId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Dice5 className="h-6 w-6 text-primary" />
              <h1 className="font-display text-3xl font-bold">Level Roulette</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Random client-side challenge runs with custom level count, skips, and rank range.</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <span className="font-mono text-primary">{eligibleLevels.length}</span> eligible levels
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Levels</Label>
                <Input type="number" min={1} max={100} value={levelCount} onChange={(e) => setLevelCount(Number(e.target.value) || 1)} />
              </div>
              <div className="space-y-1.5">
                <Label>Skips</Label>
                <Input type="number" min={0} max={99} value={skipCount} onChange={(e) => setSkipCount(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div className="space-y-1.5">
                <Label>Min rank</Label>
                <Input type="number" min={1} value={rankMin} onChange={(e) => setRankMin(Number(e.target.value) || 1)} />
              </div>
              <div className="space-y-1.5">
                <Label>Max rank</Label>
                <Input type="number" min={1} value={rankMax} onChange={(e) => setRankMax(Number(e.target.value) || 1)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox checked={includeMain} onCheckedChange={(checked) => setIncludeMain(checked === true)} />
                Main
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={includeExtra} onCheckedChange={(checked) => setIncludeExtra(checked === true)} />
                Extra
              </label>
            </div>

            <Button onClick={startRun} disabled={isLoading || eligibleLevels.length === 0} className="w-full gap-2">
              <Play className="h-4 w-4" /> Start random run
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 min-h-[360px]">
            {!runLevels.length ? (
              <div className="flex h-full min-h-[320px] items-center justify-center text-center text-muted-foreground">
                <div>
                  <Dice5 className="mx-auto mb-4 h-12 w-12 text-primary" />
                  <p className="font-display text-lg text-foreground">Ready for a roulette run</p>
                </div>
              </div>
            ) : runActive && currentLevel ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">Level {currentIndex + 1} / {runLevels.length}</div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded bg-primary/10 px-2 py-1 text-primary">{completedIds.size} completed</span>
                    <span className="rounded bg-secondary px-2 py-1 text-muted-foreground">{skipsUsed}/{skipCount} skips</span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                  <div className="aspect-video overflow-hidden rounded-lg border border-border bg-secondary">
                    {currentLevel.thumbnail_url ? <img src={currentLevel.thumbnail_url} alt={currentLevel.name || currentLevel.level_id} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded bg-primary/10 px-2 py-1 text-primary">#{currentLevel.rank_position} {currentLevel.listType}</span>
                      <span className="rounded bg-accent/10 px-2 py-1 text-accent">{currentLevel.points} pts</span>
                    </div>
                    <h2 className="font-display text-3xl font-bold">{currentLevel.name || currentLevel.level_id}</h2>
                    <p className="mt-1 text-muted-foreground">{currentLevel.author || "Unknown"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="gap-2">
                        <a href={`https://narrowarrow.xyz/levelid=${currentLevel.level_id}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" /> Open level
                        </a>
                      </Button>
                      <Link to={`/level/${currentLevel.level_id}${currentLevel.listType === "extra" ? "?extended=1" : ""}`}>
                        <Button variant="outline">Details</Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={completeCurrentLevel} className="gap-2"><Check className="h-4 w-4" /> Completed</Button>
                  <Button onClick={skipCurrentLevel} disabled={skipsUsed >= skipCount} variant="outline" className="gap-2"><SkipForward className="h-4 w-4" /> Skip</Button>
                  <Button onClick={() => setGaveUp(true)} variant="destructive" className="gap-2"><Flag className="h-4 w-4" /> Give up</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <Trophy className="h-7 w-7 text-primary" />
                  <h2 className="font-display text-2xl font-bold">Run stats</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg bg-secondary p-3"><div className="text-2xl font-bold">{completedIds.size}</div><div className="text-xs text-muted-foreground">Completed</div></div>
                  <div className="rounded-lg bg-secondary p-3"><div className="text-2xl font-bold">{skippedIds.size}</div><div className="text-xs text-muted-foreground">Skipped</div></div>
                  <div className="rounded-lg bg-secondary p-3"><div className="text-2xl font-bold">{runLevels.length}</div><div className="text-xs text-muted-foreground">Picked</div></div>
                  <div className="rounded-lg bg-secondary p-3"><div className="text-2xl font-bold">{gaveUp ? "No" : "Yes"}</div><div className="text-xs text-muted-foreground">Finished</div></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveRun} className="gap-2"><Save className="h-4 w-4" /> Save stats</Button>
                  <Button onClick={startRun} variant="outline" className="gap-2"><RotateCcw className="h-4 w-4" /> New run</Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {savedRuns.length > 0 && (
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Saved runs</h2>
              <Button onClick={clearSavedRuns} size="sm" variant="outline" className="gap-2"><Trash2 className="h-4 w-4" /> Clear</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {savedRuns.map((run) => (
                <div key={run.id} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                  <div className="font-medium">{run.completed}/{run.total} completed</div>
                  <div className="text-xs text-muted-foreground">{new Date(run.savedAt).toLocaleString()} • {run.skipped}/{run.skipsAllowed} skips • ranks {run.rankMin}-{run.rankMax}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}