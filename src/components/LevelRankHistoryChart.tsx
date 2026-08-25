import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, LineChart as LineChartIcon, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RankHistoryEntry {
  recorded_at: string;
  rank_position: number;
  points: number;
  previous_rank: number | null;
}

interface TimelineItem {
  recorded_at: string;
  rank: number;
  previousRank: number | null;
  delta: number | null; // positive = moved up, negative = moved down
  kind: "placed" | "up" | "down" | "pushed";
  causeName: string | null;
  causeMoved: boolean;
}

interface LevelRankHistoryChartProps {
  levelDbId: string;
}

const TS_KEY = (s: string) => new Date(s).toISOString();

export function LevelRankHistoryChart({ levelDbId }: LevelRankHistoryChartProps) {
  const [history, setHistory] = useState<RankHistoryEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"graph" | "list">(() => {
    const saved = localStorage.getItem("rank-history-view");
    return saved === "graph" || saved === "list" ? saved : "list";
  });

  const changeView = (v: "graph" | "list") => {
    setView(v);
    localStorage.setItem("rank-history-view", v);
  };

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);

      const { data, error } = await supabase
        .from("level_rank_history")
        .select("recorded_at, rank_position, points, previous_rank")
        .eq("level_id", levelDbId)
        .order("recorded_at", { ascending: true });

      // Dedupe identical rows — a legacy duplicate DB trigger wrote every
      // change twice, and older data still contains those duplicates.
      const seen = new Set<string>();
      const rows = ((data as unknown as RankHistoryEntry[]) || []).filter((r) => {
        const key = `${r.recorded_at}:${r.rank_position}:${r.previous_rank ?? "null"}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (error || rows.length === 0) {
        setHistory([]);
        setTimeline([]);
        setLoading(false);
        return;
      }

      setHistory(rows);

      // Fetch every history row that shares a timestamp with one of ours, so we can
      // work out which level caused each shift.
      const timestamps = [...new Set(rows.map((r) => r.recorded_at))];
      const { data: siblingsRaw } = await supabase
        .from("level_rank_history")
        .select("level_id, recorded_at, rank_position, previous_rank")
        .in("recorded_at", timestamps);

      const siblingSeen = new Set<string>();
      const siblings = ((siblingsRaw as unknown as (RankHistoryEntry & { level_id: string })[]) || [])
        .filter((s) => s.level_id !== levelDbId)
        .filter((s) => {
          const key = `${s.level_id}:${s.recorded_at}:${s.rank_position}:${s.previous_rank ?? "null"}`;
          if (siblingSeen.has(key)) return false;
          siblingSeen.add(key);
          return true;
        });

      // Levels that were added (inserted) at those exact moments also push levels down.
      const { data: addedLevels } = await supabase
        .from("levels")
        .select("id, name, rank_position, added_at")
        .in("added_at", timestamps);

      const levelIds = [...new Set(siblings.map((s) => s.level_id))];
      const nameMap = new Map<string, string>();
      if (levelIds.length > 0) {
        const { data: levelRows } = await supabase
          .from("levels")
          .select("id, name")
          .in("id", levelIds);
        (levelRows || []).forEach((l) => nameMap.set(l.id, l.name));
      }

      const items: TimelineItem[] = rows.map((row) => {
        const prev = row.previous_rank;
        const delta = prev === null ? null : prev - row.rank_position; // >0 up, <0 down
        let kind: TimelineItem["kind"] = "placed";
        if (delta !== null) kind = delta > 0 ? "up" : delta < 0 ? "down" : "placed";

        let causeName: string | null = null;
        let causeMoved = false;

        // A one-position drop is (almost always) caused by another level taking the slot.
        if (delta !== null && delta === -1) {
          const ts = TS_KEY(row.recorded_at);
          const candidates = siblings
            .filter(
              (s) =>
                TS_KEY(s.recorded_at) === ts &&
                s.rank_position <= row.rank_position &&
                (s.previous_rank === null || Math.abs(s.previous_rank - s.rank_position) !== 1)
            )
            .sort((a, b) => b.rank_position - a.rank_position);

          const inserted = (addedLevels || [])
            .filter(
              (l) =>
                l.added_at &&
                TS_KEY(l.added_at as string) === ts &&
                l.rank_position <= row.rank_position
            )
            .sort((a, b) => b.rank_position - a.rank_position);

          if (candidates.length > 0) {
            causeName = nameMap.get(candidates[0].level_id) || null;
            causeMoved = candidates[0].previous_rank !== null;
          } else if (inserted.length > 0) {
            causeName = inserted[0].name;
            causeMoved = false;
          }

          if (causeName) kind = "pushed";
        }

        return {
          recorded_at: row.recorded_at,
          rank: row.rank_position,
          previousRank: prev,
          delta,
          kind,
          causeName,
          causeMoved,
        };
      });

      setTimeline(items);
      setLoading(false);
    }

    if (levelDbId) {
      loadHistory();
    }
  }, [levelDbId]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Loading history...
      </div>
    );
  }

  if (history.length < 2) {
    return null; // Hide when no data
  }

  const formatDay = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatFull = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Chart data uses a real time axis so spacing reflects actual dates
  const chartData = history.map((entry) => ({
    time: new Date(entry.recorded_at).getTime(),
    rank: entry.rank_position,
    fullDate: formatFull(entry.recorded_at),
  }));

  const firstRank = history[0].previous_rank ?? history[0].rank_position;
  const lastRank = history[history.length - 1].rank_position;
  const rankChange = firstRank - lastRank;

  const getTrendIcon = () => {
    if (rankChange > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (rankChange < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (rankChange > 0) return `+${rankChange} positions`;
    if (rankChange < 0) return `${rankChange} positions`;
    return "No change";
  };

  const maxRank = Math.max(...history.map((h) => h.rank_position));
  const minRank = Math.min(...history.map((h) => h.rank_position));
  const padding = Math.max(1, Math.ceil((maxRank - minRank) * 0.15));
  const domainMin = Math.max(1, minRank - padding);
  const domainMax = maxRank + padding;

  // Integer-only ticks (ranks are whole numbers)
  const tickCount = Math.min(6, domainMax - domainMin + 1);
  const step = Math.max(1, Math.round((domainMax - domainMin) / Math.max(1, tickCount - 1)));
  const yTicks: number[] = [];
  for (let v = domainMin; v <= domainMax; v += step) yTicks.push(v);
  if (yTicks[yTicks.length - 1] !== domainMax) yTicks.push(domainMax);

  const reversedTimeline = [...timeline].reverse();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getTrendIcon()}
          <span>{getTrendText()}</span>
          <span className="text-xs">• {history.length} changes</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={view === "graph" ? "secondary" : "ghost"}
            className="h-7 px-2 text-xs"
            onClick={() => changeView("graph")}
          >
            <LineChartIcon className="w-3.5 h-3.5 mr-1" />
            Graph
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            className="h-7 px-2 text-xs"
            onClick={() => changeView("list")}
          >
            <List className="w-3.5 h-3.5 mr-1" />
            List
          </Button>
        </div>
      </div>

      {view === "graph" ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(v) => formatDay(new Date(v).toISOString())}
                minTickGap={28}
              />
              <YAxis
                reversed
                allowDecimals={false}
                domain={[domainMin, domainMax]}
                ticks={yTicks}
                width={40}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `#${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`#${value}`, "Rank"]}
                labelFormatter={(_, payload) =>
                  payload && payload[0] ? payload[0].payload.fullDate : ""
                }
              />
              <Line
                type="stepAfter"
                dataKey="rank"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
          {reversedTimeline.map((item, i) => {
            const isUp = item.kind === "up";
            const isDown = item.kind === "down";
            const rowBg = isUp
              ? "bg-emerald-500/10"
              : isDown
              ? "bg-red-500/10"
              : "bg-transparent";

            return (
              <div
                key={`${item.recorded_at}-${i}`}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm ${rowBg}`}
              >
                <div className="w-12 shrink-0 font-mono text-muted-foreground">#{item.rank}</div>

                <div className="w-14 shrink-0 flex items-center gap-1">
                  {item.delta !== null && item.delta !== 0 && (
                    <>
                      {item.delta > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span
                        className={`font-mono text-xs ${
                          item.delta > 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {Math.abs(item.delta)}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0 truncate">
                  {item.kind === "pushed" && item.causeName ? (
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{item.causeName}</span>{" "}
                      was {item.causeMoved ? "moved" : "placed"} above
                    </span>
                  ) : item.kind === "up" ? (
                    <span className="text-foreground">Moved up to #{item.rank}</span>
                  ) : item.kind === "down" ? (
                    <span className="text-foreground">Moved down to #{item.rank}</span>
                  ) : (
                    <span className="text-muted-foreground">Placed at #{item.rank}</span>
                  )}
                </div>

                <div className="shrink-0 text-xs text-muted-foreground font-mono">
                  {formatDay(item.recorded_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
