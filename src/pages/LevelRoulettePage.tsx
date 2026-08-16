import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import {
  Dice5, Check, SkipForward, Flag, Save, Trash2, Play, RotateCcw, ExternalLink,
  Trophy, ChevronDown, ChevronUp, Undo2, Settings2,
} from "lucide-react";

type ListType = "main" | "extended" | "extra" | "future";

interface RouletteLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  listType: ListType;
}

type LevelStatus = "completed" | "skipped" | "pending";

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
  points?: number;
  durationMs?: number;
  levels: Array<{ level_id: string; name: string | null; rank: number; listType: ListType; status: LevelStatus }>;
}

interface RouletteSettings {
  levelCount: number;
  skipCount: number;
  rankMin: number;
  rankMax: number;
  lists: Record<ListType, boolean>;
  excludeCompleted: boolean;
  weighting: "uniform" | "harder" | "easier";
  skipMode: "discard" | "requeue";
  seed: string;
}

const RUNS_KEY = "narrowlist-level-roulette-runs";
const SETTINGS_KEY = "narrowlist-roulette-settings-v2";
const ACTIVE_KEY = "narrowlist-roulette-active-v2";

const LIST_LABELS: Record<ListType, string> = {
  main: "Main",
  extended: "Extended",
  extra: "Extra",
  future: "Future",
};

const DEFAULT_SETTINGS: RouletteSettings = {
  levelCount: 10,
  skipCount: 2,
  rankMin: 1,
  rankMax: 0, // 0 = auto (full range once data loads)
  lists: { main: true, extended: true, extra: false, future: false },
  excludeCompleted: false,
  weighting: "uniform",
  skipMode: "discard",
  seed: "",
};

function loadSavedRuns(): SavedRouletteRun[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RUNS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSettings(): RouletteSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SETTINGS };
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      lists: { ...DEFAULT_SETTINGS.lists, ...(parsed.lists || {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// Deterministic RNG so a seed can reproduce a run
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: string): () => number {
  if (!seed.trim()) return Math.random;
  let a = hashSeed(seed.trim());
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Weighted sampling without replacement. */
function pickLevels(pool: RouletteLevel[], count: number, weighting: RouletteSettings["weighting"], rng: () => number): RouletteLevel[] {
  const remaining = [...pool];
  const picked: RouletteLevel[] = [];
  const ranks = remaining.map((l) => l.rank_position);
  const minRank = Math.min(...ranks, 1);
  const maxRank = Math.max(...ranks, 1);
  const span = Math.max(1, maxRank - minRank);

  const weightOf = (level: RouletteLevel) => {
    if (weighting === "uniform") return 1;
    const t = (level.rank_position - minRank) / span; // 0 = hardest rank, 1 = easiest rank
    // 1..4 weight ramp
    return weighting === "harder" ? 1 + 3 * (1 - t) : 1 + 3 * t;
  };

  const target = Math.min(count, remaining.length);
  for (let i = 0; i < target; i++) {
    const weights = remaining.map(weightOf);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rng() * total;
    let index = weights.length - 1;
    for (let j = 0; j < weights.length; j++) {
      roll -= weights[j];
      if (roll <= 0) {
        index = j;
        break;
      }
    }
    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }
  return picked;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function LevelRoulettePage() {
  const { toast } = useToast();
  const { completedLevelIds, completedExtraLevelIds, isLoggedIn } = useUserCompletions();

  const [settings, setSettings] = useState<RouletteSettings>(loadSettings);
  const [runLevels, setRunLevels] = useState<RouletteLevel[]>([]);
  const [queue, setQueue] = useState<RouletteLevel[]>([]);
  const [statuses, setStatuses] = useState<Record<string, LevelStatus>>({});
  const [history, setHistory] = useState<Array<{ levelId: string; status: LevelStatus; requeued: boolean }>>([]);
  const [gaveUp, setGaveUp] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRouletteRun[]>(loadSavedRuns);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const restored = useRef(false);

  const update = <K extends keyof RouletteSettings>(key: K, value: RouletteSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const { data: allLevels = [], isLoading } = useQuery({
    queryKey: ["roulette-levels"],
    queryFn: async () => {
      const columns = "id, level_id, name, author, rank_position, points, thumbnail_url";
      const [mainResult, extraResult, futureResult] = await Promise.all([
        supabase.from("levels").select(columns).order("rank_position"),
        supabase.from("extended_levels").select(columns).order("rank_position"),
        supabase.from("future_levels").select(columns).order("rank_position"),
      ]);
      if (mainResult.error) throw mainResult.error;
      if (extraResult.error) throw extraResult.error;
      if (futureResult.error) throw futureResult.error;

      const main = (mainResult.data || []).map((level) => ({
        ...level,
        listType: (level.rank_position > 100 ? "extended" : "main") as ListType,
      })) as RouletteLevel[];
      const extra = (extraResult.data || []).map((level) => ({ ...level, listType: "extra" as ListType })) as RouletteLevel[];
      const future = (futureResult.data || []).map((level) => ({ ...level, listType: "future" as ListType })) as RouletteLevel[];

      return [...main, ...extra, ...future];
    },
    staleTime: 5 * 60 * 1000,
  });

  const dataReady = allLevels.length > 0;

  const maxAvailableRank = useMemo(() => {
    let max = 0;
    for (const level of allLevels) {
      if (!settings.lists[level.listType]) continue;
      if (level.rank_position > max) max = level.rank_position;
    }
    return max;
  }, [allLevels, settings.lists]);

  const effectiveMax = settings.rankMax > 0 ? settings.rankMax : maxAvailableRank || 1;

  // Only clamp once real data exists, so the range can never collapse to 1 on first load.
  useEffect(() => {
    if (!dataReady || maxAvailableRank === 0) return;
    setSettings((prev) => {
      const rankMax = prev.rankMax > 0 ? Math.min(prev.rankMax, maxAvailableRank) : maxAvailableRank;
      const rankMin = Math.min(Math.max(1, prev.rankMin), rankMax);
      if (rankMax === prev.rankMax && rankMin === prev.rankMin) return prev;
      return { ...prev, rankMax, rankMin };
    });
  }, [dataReady, maxAvailableRank]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const isCompletedLevel = useCallback(
    (level: RouletteLevel) =>
      level.listType === "extra"
        ? completedExtraLevelIds.has(level.level_id)
        : completedLevelIds.has(level.level_id),
    [completedLevelIds, completedExtraLevelIds],
  );

  const eligibleLevels = useMemo(() => {
    const min = Math.max(1, Math.min(settings.rankMin, effectiveMax));
    const max = Math.max(min, effectiveMax);
    return allLevels.filter((level) => {
      if (!settings.lists[level.listType]) return false;
      if (level.rank_position < min || level.rank_position > max) return false;
      if (settings.excludeCompleted && isLoggedIn && isCompletedLevel(level)) return false;
      return true;
    });
  }, [allLevels, settings.rankMin, effectiveMax, settings.lists, settings.excludeCompleted, isLoggedIn, isCompletedLevel]);

  const currentLevel = queue[0];
  const runActive = runLevels.length > 0 && !gaveUp && queue.length > 0;
  const runFinished = runLevels.length > 0 && (gaveUp || queue.length === 0);
  const skipsUsed = useMemo(
    () => history.filter((entry) => entry.status === "skipped").length,
    [history],
  );
  const completedCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "completed").length,
    [statuses],
  );
  const skippedCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "skipped").length,
    [statuses],
  );

  // Restore an in-progress run once
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved?.runLevels?.length) return;
      setRunLevels(saved.runLevels);
      setQueue(saved.queue || []);
      setStatuses(saved.statuses || {});
      setHistory(saved.history || []);
      setGaveUp(!!saved.gaveUp);
      setStartedAt(saved.startedAt || null);
      setFinishedAt(saved.finishedAt || null);
    } catch {
      /* ignore malformed state */
    }
  }, []);

  // Persist in-progress run
  useEffect(() => {
    if (!runLevels.length) {
      localStorage.removeItem(ACTIVE_KEY);
      return;
    }
    localStorage.setItem(
      ACTIVE_KEY,
      JSON.stringify({ runLevels, queue, statuses, history, gaveUp, startedAt, finishedAt }),
    );
  }, [runLevels, queue, statuses, history, gaveUp, startedAt, finishedAt]);

  // Mark finish time
  useEffect(() => {
    if (runFinished && !finishedAt) setFinishedAt(new Date().toISOString());
  }, [runFinished, finishedAt]);

  const startRun = () => {
    if (eligibleLevels.length === 0) {
      toast({ title: "No levels found", description: "Adjust the lists or rank range.", variant: "destructive" });
      return;
    }
    const rng = makeRng(settings.seed);
    const picked = pickLevels(eligibleLevels, settings.levelCount, settings.weighting, rng);
    if (picked.length < settings.levelCount) {
      toast({
        title: `Only ${picked.length} levels available`,
        description: "Your filters matched fewer levels than requested — starting with what's available.",
      });
    }
    setRunLevels(picked);
    setQueue(picked);
    setStatuses(Object.fromEntries(picked.map((l) => [l.id, "pending" as LevelStatus])));
    setHistory([]);
    setGaveUp(false);
    setStartedAt(new Date().toISOString());
    setFinishedAt(null);
  };

  const resetRun = () => {
    setRunLevels([]);
    setQueue([]);
    setStatuses({});
    setHistory([]);
    setGaveUp(false);
    setStartedAt(null);
    setFinishedAt(null);
  };

  const completeCurrentLevel = () => {
    if (!currentLevel) return;
    setStatuses((prev) => ({ ...prev, [currentLevel.id]: "completed" }));
    setQueue((prev) => prev.slice(1));
    setHistory((prev) => [...prev, { levelId: currentLevel.id, status: "completed", requeued: false }]);
  };

  const skipCurrentLevel = () => {
    if (!currentLevel || skipsUsed >= settings.skipCount) return;
    const requeue = settings.skipMode === "requeue";
    setStatuses((prev) => ({ ...prev, [currentLevel.id]: requeue ? "pending" : "skipped" }));
    setQueue((prev) => (requeue ? [...prev.slice(1), currentLevel] : prev.slice(1)));
    setHistory((prev) => [...prev, { levelId: currentLevel.id, status: "skipped", requeued: requeue }]);
  };

  const undoLast = () => {
    const last = history[history.length - 1];
    if (!last) return;
    const level = runLevels.find((l) => l.id === last.levelId);
    if (!level) return;
    setStatuses((prev) => ({ ...prev, [level.id]: "pending" }));
    setQueue((prev) => {
      const withoutRequeued = last.requeued ? prev.filter((l) => l.id !== level.id) : prev;
      return [level, ...withoutRequeued];
    });
    setHistory((prev) => prev.slice(0, -1));
    setGaveUp(false);
    setFinishedAt(null);
  };

  const giveUp = () => {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const level of queue) next[level.id] = "pending";
      return next;
    });
    setGaveUp(true);
  };

  const runPoints = useMemo(
    () => runLevels.filter((l) => statuses[l.id] === "completed").reduce((sum, l) => sum + (l.points || 0), 0),
    [runLevels, statuses],
  );
  const hardestCompleted = useMemo(() => {
    const done = runLevels.filter((l) => statuses[l.id] === "completed");
    if (!done.length) return null;
    return done.reduce((best, l) => (l.rank_position < best.rank_position ? l : best));
  }, [runLevels, statuses]);
  const runDurationMs = useMemo(() => {
    if (!startedAt) return 0;
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    return end - new Date(startedAt).getTime();
  }, [startedAt, finishedAt]);

  const saveRun = () => {
    const saved: SavedRouletteRun = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      completed: completedCount,
      skipped: skippedCount,
      total: runLevels.length,
      skipsAllowed: settings.skipCount,
      gaveUp,
      rankMin: settings.rankMin,
      rankMax: effectiveMax,
      points: runPoints,
      durationMs: runDurationMs,
      levels: runLevels.map((level) => ({
        level_id: level.level_id,
        name: level.name,
        rank: level.rank_position,
        listType: level.listType,
        status: statuses[level.id] || "pending",
      })),
    };
    const next = [saved, ...savedRuns].slice(0, 50);
    localStorage.setItem(RUNS_KEY, JSON.stringify(next));
    setSavedRuns(next);
    toast({ title: "Saved", description: "Roulette run saved on this device." });
  };

  const clearSavedRuns = () => {
    if (!confirm("Delete ALL saved roulette runs?")) return;
    localStorage.removeItem(RUNS_KEY);
    setSavedRuns([]);
  };

  const deleteSavedRun = (id: string) => {
    const next = savedRuns.filter((r) => r.id !== id);
    localStorage.setItem(RUNS_KEY, JSON.stringify(next));
    setSavedRuns(next);
    if (expandedRunId === id) setExpandedRunId(null);
  };

  const lifetime = useMemo(() => {
    const runs = savedRuns.length;
    const levels = savedRuns.reduce((sum, r) => sum + r.completed, 0);
    const points = savedRuns.reduce((sum, r) => sum + (r.points || 0), 0);
    const best = savedRuns.reduce<SavedRouletteRun | null>(
      (bestRun, r) => (!bestRun || r.completed > bestRun.completed ? r : bestRun),
      null,
    );
    return { runs, levels, points, best };
  }, [savedRuns]);

  const progress = runLevels.length
    ? Math.round(((completedCount + skippedCount) / runLevels.length) * 100)
    : 0;

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
            <p className="mt-2 text-sm text-muted-foreground">
              Fully customizable random challenge runs. Everything is stored on your device.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <span className="font-mono text-primary">{eligibleLevels.length}</span> eligible levels
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
          {/* Settings */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Settings2 className="h-4 w-4 text-primary" /> Run settings
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Levels</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.levelCount}
                  onChange={(e) => update("levelCount", Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Skips</Label>
                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={settings.skipCount}
                  onChange={(e) => update("skipCount", Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rank range</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  #{settings.rankMin} – #{effectiveMax}
                </span>
              </div>
              <Slider
                min={1}
                max={Math.max(2, maxAvailableRank || 2)}
                step={1}
                value={[settings.rankMin, Math.min(effectiveMax, Math.max(2, maxAvailableRank || 2))]}
                onValueChange={([min, max]) =>
                  setSettings((prev) => ({ ...prev, rankMin: Math.min(min, max), rankMax: Math.max(min, max) }))
                }
                disabled={!dataReady}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min={1}
                  max={maxAvailableRank || 1}
                  value={settings.rankMin}
                  onChange={(e) =>
                    update("rankMin", Math.min(effectiveMax, Math.max(1, Number(e.target.value) || 1)))
                  }
                />
                <Input
                  type="number"
                  min={1}
                  max={maxAvailableRank || 1}
                  value={effectiveMax}
                  onChange={(e) =>
                    update(
                      "rankMax",
                      Math.min(maxAvailableRank || 1, Math.max(settings.rankMin, Number(e.target.value) || 1)),
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lists</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(Object.keys(LIST_LABELS) as ListType[]).map((list) => (
                  <label key={list} className="flex items-center gap-2">
                    <Checkbox
                      checked={settings.lists[list]}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, lists: { ...prev.lists, [list]: checked === true } }))
                      }
                    />
                    {LIST_LABELS[list]}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Randomness</Label>
              <Select value={settings.weighting} onValueChange={(v) => update("weighting", v as RouletteSettings["weighting"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="uniform">Completely random</SelectItem>
                  <SelectItem value="harder">Weighted towards harder</SelectItem>
                  <SelectItem value="easier">Weighted towards easier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Skip behaviour</Label>
              <Select value={settings.skipMode} onValueChange={(v) => update("skipMode", v as RouletteSettings["skipMode"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="discard">Skip removes the level</SelectItem>
                  <SelectItem value="requeue">Skip moves it to the end</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="block">Hide completed levels</Label>
                <p className="text-xs text-muted-foreground">
                  {isLoggedIn ? "Uses your linked profile" : "Sign in to use this"}
                </p>
              </div>
              <Switch
                checked={settings.excludeCompleted && isLoggedIn}
                disabled={!isLoggedIn}
                onCheckedChange={(checked) => update("excludeCompleted", checked)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Seed (optional)</Label>
              <Input
                placeholder="Leave empty for pure random"
                value={settings.seed}
                onChange={(e) => update("seed", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Same seed + same settings = same run, shareable with friends.</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={startRun} disabled={isLoading || eligibleLevels.length === 0} className="flex-1 gap-2">
                <Play className="h-4 w-4" /> {runLevels.length ? "Restart run" : "Start run"}
              </Button>
              <Button variant="outline" onClick={() => setSettings({ ...DEFAULT_SETTINGS })} title="Reset settings">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Run area */}
          <div className="rounded-lg border border-border bg-card p-4 min-h-[360px]">
            {!runLevels.length ? (
              <div className="flex h-full min-h-[320px] items-center justify-center text-center text-muted-foreground">
                <div>
                  <Dice5 className="mx-auto mb-4 h-12 w-12 text-primary" />
                  <p className="font-display text-lg text-foreground">Ready for a roulette run</p>
                  <p className="mt-1 text-sm">Pick your settings and hit start.</p>
                </div>
              </div>
            ) : runActive && currentLevel ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Level {completedCount + skippedCount + 1} / {runLevels.length}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="rounded bg-primary/10 px-2 py-1 text-primary">{completedCount} completed</span>
                      <span className="rounded bg-secondary px-2 py-1 text-muted-foreground">
                        {skipsUsed}/{settings.skipCount} skips
                      </span>
                      <span className="rounded bg-secondary px-2 py-1 text-muted-foreground">{runPoints} pts</span>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
                  <div className="aspect-video overflow-hidden rounded-lg border border-border bg-secondary">
                    {currentLevel.thumbnail_url ? (
                      <img
                        src={currentLevel.thumbnail_url}
                        alt={currentLevel.name || currentLevel.level_id}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded bg-primary/10 px-2 py-1 text-primary">
                        #{currentLevel.rank_position} {LIST_LABELS[currentLevel.listType]}
                      </span>
                      <span className="rounded bg-accent/10 px-2 py-1 text-accent">{currentLevel.points} pts</span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold break-words">
                      {currentLevel.name || currentLevel.level_id}
                    </h2>
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
                  <Button
                    onClick={skipCurrentLevel}
                    disabled={skipsUsed >= settings.skipCount}
                    variant="outline"
                    className="gap-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    {skipsUsed >= settings.skipCount ? "No skips left" : `Skip (${settings.skipCount - skipsUsed} left)`}
                  </Button>
                  <Button onClick={undoLast} disabled={!history.length} variant="ghost" className="gap-2">
                    <Undo2 className="h-4 w-4" /> Undo
                  </Button>
                  <Button onClick={giveUp} variant="destructive" className="gap-2"><Flag className="h-4 w-4" /> Give up</Button>
                </div>

                <div className="border-t border-border pt-3 space-y-1">
                  {runLevels.map((level) => {
                    const status = statuses[level.id] || "pending";
                    const isCurrent = currentLevel.id === level.id;
                    return (
                      <div
                        key={level.id}
                        className={`flex items-center justify-between gap-2 rounded px-2 py-1 text-xs ${
                          isCurrent ? "bg-primary/10 text-foreground" : ""
                        }`}
                      >
                        <span className="truncate">
                          <span className="font-mono text-muted-foreground mr-2">
                            #{level.rank_position} {LIST_LABELS[level.listType]}
                          </span>
                          {level.name || level.level_id}
                        </span>
                        <span
                          className={
                            status === "completed"
                              ? "text-primary font-medium"
                              : status === "skipped"
                                ? "text-amber-500"
                                : "text-muted-foreground"
                          }
                        >
                          {isCurrent ? "current" : status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <Trophy className="h-7 w-7 text-primary" />
                  <h2 className="font-display text-2xl font-bold">Run stats</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <StatBox label="Completed" value={`${completedCount}/${runLevels.length}`} />
                  <StatBox
                    label="Completion rate"
                    value={`${runLevels.length ? Math.round((completedCount / runLevels.length) * 100) : 0}%`}
                  />
                  <StatBox label="Skipped" value={skippedCount} />
                  <StatBox label="Points" value={runPoints} />
                  <StatBox label="Time" value={formatDuration(runDurationMs)} />
                  <StatBox label="Finished" value={gaveUp ? "Gave up" : "Yes"} />
                </div>
                {hardestCompleted && (
                  <p className="text-sm text-muted-foreground">
                    Hardest completed:{" "}
                    <span className="text-foreground font-medium">
                      #{hardestCompleted.rank_position} {hardestCompleted.name || hardestCompleted.level_id}
                    </span>
                  </p>
                )}
                <div className="space-y-1 border-t border-border pt-3">
                  {runLevels.map((level) => {
                    const status = statuses[level.id] || "pending";
                    return (
                      <div key={level.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate">
                          <span className="font-mono text-muted-foreground mr-2">
                            #{level.rank_position} {LIST_LABELS[level.listType]}
                          </span>
                          {level.name || level.level_id}
                        </span>
                        <span
                          className={
                            status === "completed"
                              ? "text-primary font-medium"
                              : status === "skipped"
                                ? "text-amber-500"
                                : "text-muted-foreground"
                          }
                        >
                          {status === "pending" && gaveUp ? "not attempted" : status}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveRun} className="gap-2"><Save className="h-4 w-4" /> Save stats</Button>
                  <Button onClick={undoLast} disabled={!history.length} variant="ghost" className="gap-2">
                    <Undo2 className="h-4 w-4" /> Undo last
                  </Button>
                  <Button onClick={startRun} variant="outline" className="gap-2"><RotateCcw className="h-4 w-4" /> New run</Button>
                  <Button onClick={resetRun} variant="ghost">Clear</Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {savedRuns.length > 0 && (
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Saved runs</h2>
              <Button onClick={clearSavedRuns} size="sm" variant="outline" className="gap-2">
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatBox label="Runs played" value={lifetime.runs} />
              <StatBox label="Levels completed" value={lifetime.levels} />
              <StatBox label="Points earned" value={lifetime.points} />
              <StatBox label="Best run" value={lifetime.best ? `${lifetime.best.completed}/${lifetime.best.total}` : "—"} />
            </div>

            <div className="space-y-2">
              {savedRuns.map((run) => {
                const isOpen = expandedRunId === run.id;
                return (
                  <div key={run.id} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <button onClick={() => setExpandedRunId(isOpen ? null : run.id)} className="flex-1 text-left">
                        <div className="flex items-center gap-2 font-medium">
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {run.completed}/{run.total} completed
                          {run.gaveUp && <span className="text-xs text-destructive">(gave up)</span>}
                        </div>
                        <div className="ml-6 text-xs text-muted-foreground">
                          {new Date(run.savedAt).toLocaleString()} • {run.skipped}/{run.skipsAllowed} skips • ranks{" "}
                          {run.rankMin}-{run.rankMax}
                          {run.points ? ` • ${run.points} pts` : ""}
                          {run.durationMs ? ` • ${formatDuration(run.durationMs)}` : ""}
                        </div>
                      </button>
                      <Button
                        onClick={() => deleteSavedRun(run.id)}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        title="Delete this run"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {isOpen && (
                      <div className="mt-3 border-t border-border pt-3 space-y-1">
                        {run.levels.map((lv, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate">
                              <span className="font-mono text-muted-foreground mr-2">
                                #{lv.rank} {LIST_LABELS[lv.listType] || lv.listType}
                              </span>
                              {lv.name || lv.level_id}
                            </span>
                            <span
                              className={
                                lv.status === "completed"
                                  ? "text-primary font-medium"
                                  : lv.status === "skipped"
                                    ? "text-amber-500"
                                    : "text-muted-foreground"
                              }
                            >
                              {lv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-secondary p-3 min-w-0">
      <div className="text-xl font-bold truncate">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
