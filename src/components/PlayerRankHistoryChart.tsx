import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PlayerRankHistoryChartProps {
  profileId: string;
  currentRank: number;
}

interface RankSnapshot {
  date: string;
  rank: number;
  points: number;
}

export function PlayerRankHistoryChart({ profileId, currentRank }: PlayerRankHistoryChartProps) {
  const [history, setHistory] = useState<RankSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateRankHistory() {
      // Get all level rank history
      const { data: levelHistory, error: levelError } = await supabase
        .from("level_rank_history")
        .select("level_id, rank_position, points, recorded_at")
        .order("recorded_at", { ascending: true });

      if (levelError || !levelHistory) {
        setLoading(false);
        return;
      }

      // Get this player's completions with their dates
      const { data: completions, error: compError } = await supabase
        .from("completions")
        .select("level_id, completed_at")
        .eq("profile_id", profileId);

      const { data: manualRuns, error: manualError } = await supabase
        .from("manual_runs")
        .select("level_id, completed_at")
        .eq("profile_id", profileId);

      if (compError || manualError) {
        setLoading(false);
        return;
      }

      // Combine completions
      const allCompletions = [
        ...(completions || []).map(c => ({ level_id: c.level_id, completed_at: c.completed_at })),
        ...(manualRuns || []).map(r => ({ level_id: r.level_id, completed_at: r.completed_at })),
      ];

      // Get unique level IDs (player only gets points once per level)
      const uniqueLevelIds = new Set<string>();
      const uniqueCompletions = allCompletions.filter(c => {
        if (uniqueLevelIds.has(c.level_id)) return false;
        uniqueLevelIds.add(c.level_id);
        return true;
      });

      if (uniqueCompletions.length === 0) {
        setLoading(false);
        return;
      }

      // Get all unique dates from level history
      const uniqueDates = [...new Set(levelHistory.map(h => 
        new Date(h.recorded_at).toISOString().split('T')[0]
      ))].sort();

      // For each date, calculate what points this player would have had
      const snapshots: RankSnapshot[] = [];

      for (const dateStr of uniqueDates) {
        const dateEnd = new Date(dateStr);
        dateEnd.setHours(23, 59, 59, 999);

        // Get level points as of this date
        const levelPointsMap = new Map<string, number>();
        for (const h of levelHistory) {
          if (new Date(h.recorded_at) <= dateEnd) {
            levelPointsMap.set(h.level_id, h.points);
          }
        }

        // Calculate player points: sum of points for levels they had completed by this date
        let totalPoints = 0;
        for (const comp of uniqueCompletions) {
          const compDate = new Date(comp.completed_at);
          if (compDate <= dateEnd) {
            const levelPoints = levelPointsMap.get(comp.level_id);
            if (levelPoints !== undefined) {
              totalPoints += levelPoints;
            }
          }
        }

        if (totalPoints > 0) {
          snapshots.push({
            date: dateStr,
            rank: 0, // Will calculate after we have all snapshots
            points: totalPoints,
          });
        }
      }

      // Add current state
      const today = new Date().toISOString().split('T')[0];
      if (!snapshots.find(s => s.date === today)) {
        // Calculate current points
        const { data: currentLevels } = await supabase
          .from("levels")
          .select("id, points");
        
        const currentPointsMap = new Map(currentLevels?.map(l => [l.id, l.points]) || []);
        let currentPoints = 0;
        for (const comp of uniqueCompletions) {
          currentPoints += currentPointsMap.get(comp.level_id) || 0;
        }

        snapshots.push({
          date: today,
          rank: currentRank,
          points: currentPoints,
        });
      }

      setHistory(snapshots);
      setLoading(false);
    }

    if (profileId) {
      calculateRankHistory();
    }
  }, [profileId, currentRank]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Loading rank history...
      </div>
    );
  }

  if (history.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
        <Minus className="w-4 h-4 mr-2" />
        Not enough history data yet
      </div>
    );
  }

  // Format data for chart
  const chartData = history.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    points: entry.points,
    fullDate: new Date(entry.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  }));

  // Calculate trend
  const firstPoints = history[0].points;
  const lastPoints = history[history.length - 1].points;
  const pointsChange = lastPoints - firstPoints;

  const getTrendIcon = () => {
    if (pointsChange > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (pointsChange < 0) return <TrendingDown className="w-4 h-4 text-muted-foreground" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (pointsChange > 0) return `+${pointsChange} points`;
    if (pointsChange < 0) return `${pointsChange} points`;
    return "No change";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getTrendIcon()}
          <span>{getTrendText()}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {history.length} snapshots
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`${value} pts`, "Points"]}
              labelFormatter={(_, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullDate;
                }
                return "";
              }}
            />
            <Line
              type="monotone"
              dataKey="points"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}