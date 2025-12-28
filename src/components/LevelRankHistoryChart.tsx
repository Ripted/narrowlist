import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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
}

interface LevelRankHistoryChartProps {
  levelDbId: string;
}

export function LevelRankHistoryChart({ levelDbId }: LevelRankHistoryChartProps) {
  const [history, setHistory] = useState<RankHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const { data, error } = await supabase
        .from("level_rank_history")
        .select("recorded_at, rank_position, points")
        .eq("level_id", levelDbId)
        .order("recorded_at", { ascending: true });

      if (!error && data) {
        setHistory(data);
      }
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
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
        <Minus className="w-4 h-4 mr-2" />
        Not enough history data yet
      </div>
    );
  }

  // Format data for chart
  const chartData = history.map((entry) => ({
    date: new Date(entry.recorded_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    rank: entry.rank_position,
    points: entry.points,
    fullDate: new Date(entry.recorded_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  }));

  // Calculate trend
  const firstRank = history[0].rank_position;
  const lastRank = history[history.length - 1].rank_position;
  const rankChange = firstRank - lastRank; // Positive = moved up (better), negative = moved down

  const getTrendIcon = () => {
    if (rankChange > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rankChange < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (rankChange > 0) return `+${rankChange} positions`;
    if (rankChange < 0) return `${rankChange} positions`;
    return "No change";
  };

  // Calculate Y-axis domain (inverted for rank - lower is better)
  const maxRank = Math.max(...history.map((h) => h.rank_position));
  const minRank = Math.min(...history.map((h) => h.rank_position));
  const padding = Math.max(2, Math.ceil((maxRank - minRank) * 0.1));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getTrendIcon()}
          <span>{getTrendText()}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {history.length} data points
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
              reversed
              domain={[Math.max(1, minRank - padding), maxRank + padding]}
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
              labelFormatter={(_, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullDate;
                }
                return "";
              }}
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
    </div>
  );
}