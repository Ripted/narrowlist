import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock,
  Zap,
  Award,
  Activity,
  Calendar,
  Star,
  Crown,
  Flame,
  Percent
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

export default function StatisticsPage() {
  // Fetch total players
  const { data: playersCount = 0 } = useQuery({
    queryKey: ["stats-players"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  // Fetch total levels
  const { data: levelsData } = useQuery({
    queryKey: ["stats-levels"],
    queryFn: async () => {
      const [mainLevels, extraLevels, futureLevels] = await Promise.all([
        supabase.from("levels").select("*", { count: "exact", head: true }),
        supabase.from("extended_levels").select("*", { count: "exact", head: true }),
        supabase.from("future_levels").select("*", { count: "exact", head: true }),
      ]);
      return {
        main: mainLevels.count || 0,
        extra: extraLevels.count || 0,
        future: futureLevels.count || 0,
        total: (mainLevels.count || 0) + (extraLevels.count || 0) + (futureLevels.count || 0),
      };
    },
  });

  // Fetch total completions
  const { data: completionsData } = useQuery({
    queryKey: ["stats-completions"],
    queryFn: async () => {
      const [apiCompletions, manualRuns] = await Promise.all([
        supabase.from("completions").select("*", { count: "exact", head: true }),
        supabase.from("manual_runs").select("*", { count: "exact", head: true }),
      ]);
      return {
        api: apiCompletions.count || 0,
        manual: manualRuns.count || 0,
        total: (apiCompletions.count || 0) + (manualRuns.count || 0),
      };
    },
  });

  // Fetch completions over time (last 30 days)
  const { data: completionsTrend = [] } = useQuery({
    queryKey: ["stats-completions-trend"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: completions } = await supabase
        .from("completions")
        .select("completed_at")
        .gte("completed_at", thirtyDaysAgo.toISOString())
        .order("completed_at");

      // Group by day
      const grouped: { [key: string]: number } = {};
      completions?.forEach((c) => {
        const date = new Date(c.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        grouped[date] = (grouped[date] || 0) + 1;
      });

      // Generate all dates for last 30 days
      const result: { date: string; completions: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        result.push({ date: dateStr, completions: grouped[dateStr] || 0 });
      }
      return result;
    },
  });

  // Fetch top players by points
  const { data: topPlayers = [] } = useQuery({
    queryKey: ["stats-top-players"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, total_points")
        .not("total_points", "is", null)
        .order("total_points", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Fetch top players by extra points
  const { data: topExtraPlayers = [] } = useQuery({
    queryKey: ["stats-top-extra-players"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, extra_points")
        .not("extra_points", "is", null)
        .gt("extra_points", 0)
        .order("extra_points", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  // Fetch rank history for chart
  const { data: rankHistoryData = [] } = useQuery({
    queryKey: ["stats-rank-history"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from("level_rank_history")
        .select("recorded_at")
        .gte("recorded_at", thirtyDaysAgo.toISOString());

      // Group by day to count rank changes
      const grouped: { [key: string]: number } = {};
      data?.forEach((r) => {
        const date = new Date(r.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        grouped[date] = (grouped[date] || 0) + 1;
      });

      const result: { date: string; changes: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        result.push({ date: dateStr, changes: grouped[dateStr] || 0 });
      }
      return result;
    },
  });

  // Fetch recent activity count (last 7 days)
  const { data: recentActivity } = useQuery({
    queryKey: ["stats-recent-activity"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [newCompletions, newProfiles] = await Promise.all([
        supabase
          .from("completions")
          .select("*", { count: "exact", head: true })
          .gte("completed_at", sevenDaysAgo.toISOString()),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
      ]);

      return {
        completions: newCompletions.count || 0,
        newPlayers: newProfiles.count || 0,
      };
    },
  });

  // Fetch most completed levels
  const { data: mostCompletedLevels = [] } = useQuery({
    queryKey: ["stats-most-completed"],
    queryFn: async () => {
      const { data: completions } = await supabase
        .from("completions")
        .select("level_id");
      
      const { data: levels } = await supabase
        .from("levels")
        .select("id, name, rank_position");
      
      if (!completions || !levels) return [];
      
      // Count completions per level
      const counts: { [key: string]: number } = {};
      completions.forEach((c) => {
        counts[c.level_id] = (counts[c.level_id] || 0) + 1;
      });
      
      // Map to level names
      const result = levels
        .map((level) => ({
          name: level.name || `#${level.rank_position}`,
          rank: level.rank_position,
          completions: counts[level.id] || 0,
        }))
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 8);
      
      return result;
    },
  });

  // Fetch arrow distribution
  const { data: arrowDistribution = [] } = useQuery({
    queryKey: ["stats-arrow-distribution"],
    queryFn: async () => {
      const { data: completions } = await supabase
        .from("completions")
        .select("arrow_name");
      
      const { data: manualRuns } = await supabase
        .from("manual_runs")
        .select("arrow_name");
      
      const allRuns = [...(completions || []), ...(manualRuns || [])];
      const counts: { [key: string]: number } = {};
      
      allRuns.forEach((run) => {
        const arrow = run.arrow_name || "Unknown";
        counts[arrow] = (counts[arrow] || 0) + 1;
      });
      
      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        color: name === "Energy Arrow" ? "hsl(var(--primary))" 
             : name === "Speedy Arrow" ? "hsl(var(--accent))"
             : name === "Narrow Arrow" ? "hsl(45, 90%, 55%)"
             : "hsl(var(--muted-foreground))"
      }));
    },
  });

  // Fetch completion rate by rank tier
  const { data: completionByTier = [] } = useQuery({
    queryKey: ["stats-completion-by-tier"],
    queryFn: async () => {
      const { data: levels } = await supabase
        .from("levels")
        .select("id, rank_position");
      
      const { data: completions } = await supabase
        .from("completions")
        .select("level_id");
      
      if (!levels || !completions) return [];
      
      // Define tiers
      const tiers = [
        { name: "Top 5", min: 1, max: 5 },
        { name: "#6-10", min: 6, max: 10 },
        { name: "#11-25", min: 11, max: 25 },
        { name: "#26-50", min: 26, max: 50 },
        { name: "#51+", min: 51, max: 999 },
      ];
      
      return tiers.map((tier) => {
        const tierLevelIds = levels
          .filter((l) => l.rank_position >= tier.min && l.rank_position <= tier.max)
          .map((l) => l.id);
        
        const tierCompletions = completions.filter((c) => tierLevelIds.includes(c.level_id)).length;
        const avgCompletions = tierLevelIds.length > 0 ? Math.round(tierCompletions / tierLevelIds.length) : 0;
        
        return {
          tier: tier.name,
          completions: tierCompletions,
          avgPerLevel: avgCompletions,
        };
      });
    },
  });

  // Level distribution data for pie chart
  const levelDistribution = useMemo(() => {
    if (!levelsData) return [];
    return [
      { name: "Main List", value: levelsData.main, color: "hsl(var(--primary))" },
      { name: "Extra List", value: levelsData.extra, color: "hsl(var(--accent))" },
      { name: "Future List", value: levelsData.future, color: "hsl(45, 90%, 55%)" },
    ].filter(item => item.value > 0);
  }, [levelsData]);

  const statCards: StatCard[] = [
    {
      title: "Total Players",
      value: playersCount.toLocaleString(),
      subtitle: recentActivity ? `+${recentActivity.newPlayers} this week` : undefined,
      icon: Users,
      color: "text-primary",
      gradient: "from-primary/20 to-primary/5",
    },
    {
      title: "Total Levels",
      value: levelsData?.total.toLocaleString() || "0",
      subtitle: `${levelsData?.main || 0} Main • ${levelsData?.extra || 0} Extra`,
      icon: Target,
      color: "text-accent",
      gradient: "from-accent/20 to-accent/5",
    },
    {
      title: "Total Completions",
      value: completionsData?.total.toLocaleString() || "0",
      subtitle: recentActivity ? `+${recentActivity.completions} this week` : undefined,
      icon: Trophy,
      color: "text-glow-gold",
      gradient: "from-glow-gold/20 to-glow-gold/5",
    },
    {
      title: "Average Completions",
      value: levelsData?.main && completionsData?.total 
        ? Math.round(completionsData.total / levelsData.main).toLocaleString()
        : "0",
      subtitle: "Per main list level",
      icon: BarChart3,
      color: "text-glow-silver",
      gradient: "from-glow-silver/20 to-glow-silver/5",
    },
  ];

  const CHART_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(45, 90%, 55%)",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <main className="relative pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Global Statistics</h1>
              <p className="text-sm text-muted-foreground">Overview of Narrowlist activity and trends</p>
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <div
                key={stat.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                    <p className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid - Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Completions Trend */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Completions Trend</h2>
                <span className="text-xs text-muted-foreground ml-auto">Last 30 days</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={completionsTrend}>
                    <defs>
                      <linearGradient id="completionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      tickLine={{ stroke: "hsl(var(--border))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      tickLine={{ stroke: "hsl(var(--border))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completions"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#completionsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Level Distribution Pie */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-accent" />
                <h2 className="font-display text-lg font-bold">Level Distribution</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    >
                      {levelDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Grid - Row 2: Most Completed & Arrow Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Most Completed Levels */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 p-6 border-b border-border bg-secondary/30">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="font-display text-lg font-bold">Most Completed Levels</h2>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mostCompletedLevels} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis 
                        type="number" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number) => [`${value} completions`, "Total"]}
                      />
                      <Bar 
                        dataKey="completions" 
                        fill="hsl(var(--accent))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Arrow Distribution */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 p-6 border-b border-border bg-secondary/30">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Arrow Usage</h2>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={arrowDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      >
                        {arrowDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke="hsl(var(--card))"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number) => [`${value} runs`, "Count"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid - Row 3: Top Players & Rank Changes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Players */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 p-6 border-b border-border bg-secondary/30">
                <Award className="w-5 h-5 text-glow-gold" />
                <h2 className="font-display text-lg font-bold">Top Players</h2>
                <span className="text-xs text-muted-foreground ml-auto">By total points</span>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPlayers.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis 
                        type="number" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="username"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number) => [`${value} points`, "Total"]}
                      />
                      <Bar 
                        dataKey="total_points" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Rank Changes Activity */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 p-6 border-b border-border bg-secondary/30">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h2 className="font-display text-lg font-bold">Rank Changes</h2>
                <span className="text-xs text-muted-foreground ml-auto">Last 30 days</span>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rankHistoryData}>
                      <defs>
                        <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="changes"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        fill="url(#rankGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid - Row 4: Completion by Tier & Extra Points Leaders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Completion by Difficulty Tier */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 p-6 border-b border-border bg-secondary/30">
                <Percent className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Completions by Difficulty</h2>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionByTier}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="tier" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={{ stroke: "hsl(var(--border))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number, name: string) => [
                          `${value}`,
                          name === "completions" ? "Total Completions" : "Avg per Level"
                        ]}
                      />
                      <Legend 
                        formatter={(value) => (
                          <span className="text-foreground text-sm">
                            {value === "completions" ? "Total" : "Avg/Level"}
                          </span>
                        )}
                      />
                      <Bar 
                        dataKey="completions" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="avgPerLevel" 
                        fill="hsl(var(--accent))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Extra Points Players */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 p-6 border-b border-border bg-secondary/30">
                <Star className="w-5 h-5 text-accent" />
                <h2 className="font-display text-lg font-bold">Top Extra Points</h2>
              </div>
              <div className="p-4">
                {topExtraPlayers.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No extra points data yet
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topExtraPlayers} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis 
                          type="number" 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          tickLine={{ stroke: "hsl(var(--border))" }}
                          axisLine={{ stroke: "hsl(var(--border))" }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="username"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number) => [`${value} extra pts`, "Total"]}
                        />
                        <Bar 
                          dataKey="extra_points" 
                          fill="hsl(var(--accent))" 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Manual Runs</p>
                <p className="font-display font-bold text-lg">{completionsData?.manual.toLocaleString() || "0"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">API Synced</p>
                <p className="font-display font-bold text-lg">{completionsData?.api.toLocaleString() || "0"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Future Levels</p>
                <p className="font-display font-bold text-lg">{levelsData?.future.toLocaleString() || "0"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Weekly Completions</p>
                <p className="font-display font-bold text-lg">{recentActivity?.completions.toLocaleString() || "0"}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}