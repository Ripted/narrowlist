import { ReactNode } from "react";
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
  Flame,
  Percent,
  Globe,
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
  LineChart,
  Line,
  Legend,
} from "recharts";

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

// Shared chart styling
const tooltipStyle: React.CSSProperties = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
};
// Subtle hover highlight instead of recharts' default white band
const barCursor = { fill: "hsl(var(--muted) / 0.4)" };
const axisTick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };
const axisLine = { stroke: "hsl(var(--border))" };

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="p-2 rounded-lg bg-secondary border border-border shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ChartCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  badge,
  className,
  children,
}: {
  icon: React.ElementType;
  iconClassName?: string;
  title: string;
  description?: string;
  badge?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden min-w-0 ${className ?? ""}`}>
      <div className="flex items-center gap-2 px-4 py-4 sm:px-6 border-b border-border bg-secondary/30">
        <Icon className={`w-5 h-5 shrink-0 ${iconClassName ?? "text-primary"}`} />
        <div className="min-w-0">
          <h3 className="font-display text-base sm:text-lg font-bold truncate">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {badge && (
          <span className="text-xs text-muted-foreground ml-auto shrink-0 hidden sm:inline">
            {badge}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

function ListCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  empty,
  emptyText,
  children,
}: {
  icon: React.ElementType;
  iconClassName?: string;
  title: string;
  description?: string;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden min-w-0">
      <div className="flex items-center gap-2 px-4 py-4 sm:px-6 border-b border-border bg-secondary/30">
        <Icon className={`w-5 h-5 shrink-0 ${iconClassName ?? "text-primary"}`} />
        <div className="min-w-0">
          <h3 className="font-display text-base sm:text-lg font-bold truncate">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {empty ? <p className="text-sm text-muted-foreground">{emptyText}</p> : children}
      </div>
    </div>
  );
}

function RankedRow({
  index,
  label,
  value,
  valueClassName,
}: {
  index: number;
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2.5 min-w-0">
        <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
          {index + 1}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <span className={`shrink-0 font-mono ${valueClassName ?? "text-primary"}`}>{value}</span>
    </li>
  );
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
        supabase.from("manual_runs_public").select("id", { count: "exact", head: true }),
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

  // Fetch hardest levels (fewest completions, main list only)
  const { data: hardestLevels = [] } = useQuery({
    queryKey: ["stats-hardest-levels"],
    queryFn: async () => {
      const { data: completions } = await supabase
        .from("completions")
        .select("level_id");

      const { data: levels } = await supabase
        .from("levels")
        .select("id, name, rank_position");

      if (!completions || !levels) return [];

      const counts: { [key: string]: number } = {};
      completions.forEach((c) => {
        counts[c.level_id] = (counts[c.level_id] || 0) + 1;
      });

      return levels
        .map((level) => ({
          name: level.name || `#${level.rank_position}`,
          rank: level.rank_position,
          completions: counts[level.id] || 0,
        }))
        .sort((a, b) => a.completions - b.completions || a.rank - b.rank)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
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

  // Fetch Main vs Extra completion comparison over time
  const { data: mainVsExtraTrend = [] } = useQuery({
    queryKey: ["stats-main-vs-extra-trend"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get main level IDs
      const { data: mainLevels } = await supabase
        .from("levels")
        .select("id");
      const mainLevelIds = new Set((mainLevels || []).map(l => l.id));

      // Get extra level IDs
      const { data: extraLevels } = await supabase
        .from("extended_levels")
        .select("id");
      const extraLevelIds = new Set((extraLevels || []).map(l => l.id));

      // Get completions
      const { data: completions } = await supabase
        .from("completions")
        .select("completed_at, level_id")
        .gte("completed_at", thirtyDaysAgo.toISOString())
        .order("completed_at");

      // Group by day and list type
      const mainGrouped: { [key: string]: number } = {};
      const extraGrouped: { [key: string]: number } = {};
      
      completions?.forEach((c) => {
        const date = new Date(c.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (mainLevelIds.has(c.level_id)) {
          mainGrouped[date] = (mainGrouped[date] || 0) + 1;
        } else if (extraLevelIds.has(c.level_id)) {
          extraGrouped[date] = (extraGrouped[date] || 0) + 1;
        }
      });

      // Generate all dates for last 30 days
      const result: { date: string; main: number; extra: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        result.push({ 
          date: dateStr, 
          main: mainGrouped[dateStr] || 0,
          extra: extraGrouped[dateStr] || 0
        });
      }
      return result;
    },
  });

  // ===== Additional stats =====



  // Top verifiers
  const { data: topVerifiers = [] } = useQuery({
    queryKey: ["stats-top-verifiers"],
    queryFn: async () => {
      const [{ data: mains }, { data: extras }, { data: profiles }] = await Promise.all([
        supabase.from("levels").select("verifier_profile_id"),
        supabase.from("extended_levels").select("verifier_profile_id"),
        supabase.from("profiles").select("id, username, display_name, avatar_url"),
      ]);
      const counts: Record<string, number> = {};
      [...(mains || []), ...(extras || [])].forEach(l => {
        if (l.verifier_profile_id) counts[l.verifier_profile_id] = (counts[l.verifier_profile_id] || 0) + 1;
      });
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return Object.entries(counts)
        .map(([id, count]) => ({ profile: profileMap.get(id), count }))
        .filter(x => x.profile)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Most active players (last 30 days)
  const { data: mostActivePlayers = [] } = useQuery({
    queryKey: ["stats-most-active"],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const [{ data: comps }, { data: profiles }] = await Promise.all([
        supabase.from("completions").select("profile_id, completed_at").gte("completed_at", cutoff.toISOString()),
        supabase.from("profiles").select("id, username, display_name, avatar_url"),
      ]);
      const counts: Record<string, number> = {};
      comps?.forEach(c => { counts[c.profile_id] = (counts[c.profile_id] || 0) + 1; });
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return Object.entries(counts)
        .map(([id, count]) => ({ profile: profileMap.get(id), count }))
        .filter(x => x.profile)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Country distribution
  const { data: countryDist = [] } = useQuery({
    queryKey: ["stats-countries"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("country_code");
      const counts: Record<string, number> = {};
      data?.forEach(p => {
        if (p.country_code) counts[p.country_code] = (counts[p.country_code] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Recent records (last 10 fastest completions, last 7 days)
  const { data: recentRecords = [] } = useQuery({
    queryKey: ["stats-recent-records"],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const { data } = await supabase
        .from("completions")
        .select("id, profile_id, level_id, completion_time, completed_at")
        .gte("completed_at", cutoff.toISOString())
        .order("completed_at", { ascending: false })
        .limit(10);
      if (!data || data.length === 0) return [];
      const profileIds = [...new Set(data.map(d => d.profile_id))];
      const levelIds = [...new Set(data.map(d => d.level_id))];
      const [{ data: profiles }, { data: levels }] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name").in("id", profileIds),
        supabase.from("levels").select("id, name, rank_position").in("id", levelIds),
      ]);
      const pm = new Map((profiles || []).map(p => [p.id, p]));
      const lm = new Map((levels || []).map(l => [l.id, l]));
      return data.map(d => ({
        ...d,
        profile: pm.get(d.profile_id),
        level: lm.get(d.level_id),
      })).filter(r => r.profile && r.level);
    },
    staleTime: 60_000,
  });


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
      subtitle: `${levelsData?.main || 0} Main • ${levelsData?.extra || 0} Extra • ${levelsData?.future || 0} Future`,
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative pt-24 pb-12">
        <div className="container mx-auto px-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 shrink-0">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl md:text-3xl font-bold">Global Statistics</h1>
              <p className="text-sm text-muted-foreground">Overview of Narrowlist activity and trends</p>
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <div
                key={stat.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg animate-fade-in opacity-0"
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

          {/* ===== Activity ===== */}
          <SectionHeader
            icon={Activity}
            title="Activity"
            description="How the community has been playing and how the lists have been moving."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              icon={Activity}
              title="Completions Trend"
              description="Daily completions across all lists over the last 30 days."
              badge="Last 30 days"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={completionsTrend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <defs>
                      <linearGradient id="completionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={axisTick}
                      tickLine={axisLine}
                      axisLine={axisLine}
                      interval="preserveStartEnd"
                      minTickGap={24}
                    />
                    <YAxis tick={axisTick} tickLine={axisLine} axisLine={axisLine} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
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
            </ChartCard>

            <ChartCard
              icon={TrendingUp}
              iconClassName="text-accent"
              title="Rank Changes"
              description="How often levels moved rank each day — spikes usually mean a batch rerate or new placements."
              badge="Last 30 days"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rankHistoryData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <defs>
                      <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={axisTick}
                      tickLine={axisLine}
                      axisLine={axisLine}
                      interval="preserveStartEnd"
                      minTickGap={24}
                    />
                    <YAxis tick={axisTick} tickLine={axisLine} axisLine={axisLine} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
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
            </ChartCard>
          </div>

          <ChartCard
            icon={TrendingUp}
            title="Main vs Extra List Completions"
            description="Daily completions split by list — shows whether players focus on progression (Main) or grinding extras."
            badge="Last 30 days"
          >
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mainVsExtraTrend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={axisTick}
                    tickLine={axisLine}
                    axisLine={axisLine}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis tick={axisTick} tickLine={axisLine} axisLine={axisLine} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-foreground text-sm">
                        {value === "main" ? "Main List" : "Extra List"}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="main"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="extra"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* ===== Leaderboards ===== */}
          <SectionHeader
            icon={Trophy}
            title="Leaderboards"
            description="The players at the top of the Main and Extra lists."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              icon={Award}
              iconClassName="text-glow-gold"
              title="Top Players"
              description="Highest total points on the main list."
              badge="By total points"
            >
              {topPlayers.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                  No player data yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPlayers.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={axisTick} tickLine={axisLine} axisLine={axisLine} />
                      <YAxis
                        type="category"
                        dataKey="username"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={barCursor}
                        formatter={(value: number) => [`${value} points`, "Total"]}
                      />
                      <Bar
                        dataKey="total_points"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              icon={Star}
              iconClassName="text-accent"
              title="Top Extra Points"
              description="Players with the most points on the Extra List."
              badge="By extra points"
            >
              {topExtraPlayers.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                  No extra points data yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topExtraPlayers} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={axisTick} tickLine={axisLine} axisLine={axisLine} />
                      <YAxis
                        type="category"
                        dataKey="username"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={barCursor}
                        formatter={(value: number) => [`${value} extra pts`, "Total"]}
                      />
                      <Bar
                        dataKey="extra_points"
                        fill="hsl(var(--accent))"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          {/* ===== Levels ===== */}
          <SectionHeader
            icon={Target}
            title="Levels"
            description="Which levels get beaten the most — and which barely anyone has beaten."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              icon={Flame}
              iconClassName="text-orange-500"
              title="Most Completed Levels"
              description="The main-list levels beaten the most — a rough proxy for the most approachable top levels."
            >
              {mostCompletedLevels.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                  No completion data yet
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mostCompletedLevels} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={axisTick} tickLine={axisLine} axisLine={axisLine} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={barCursor}
                        formatter={(value: number) => [`${value} completions`, "Total"]}
                      />
                      <Bar
                        dataKey="completions"
                        fill="hsl(var(--accent))"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              icon={Percent}
              title="Completions by Difficulty"
              description="Total vs average completions per rank tier. Higher tiers should average fewer completions if the list is well-ordered."
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionByTier} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="tier" tick={axisTick} tickLine={axisLine} axisLine={axisLine} />
                    <YAxis tick={axisTick} tickLine={axisLine} axisLine={axisLine} allowDecimals={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={barCursor}
                      formatter={(value: number, name: string) => [
                        `${value}`,
                        name === "completions" ? "Total Completions" : "Avg per Level",
                      ]}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-foreground text-sm">
                          {value === "completions" ? "Total" : "Avg/Level"}
                        </span>
                      )}
                    />
                    <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="avgPerLevel" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListCard
              icon={Flame}
              iconClassName="text-orange-500"
              title="Hardest Levels"
              description="Main-list levels with the fewest completions."
              empty={hardestLevels.length === 0}
              emptyText="No data yet."
            >
              <ol className="space-y-2.5">
                {hardestLevels.map((l, i) => (
                  <RankedRow
                    key={l.rank}
                    index={i}
                    label={<span>#{l.rank} {l.name}</span>}
                    value={`${l.completions} ${l.completions === 1 ? "completion" : "completions"}`}
                    valueClassName="text-orange-500"
                  />
                ))}
              </ol>
            </ListCard>

            <ListCard
              icon={Award}
              title="Top Verifiers"
              description="Players who have verified the most levels."
              empty={topVerifiers.length === 0}
              emptyText="No verifiers yet."
            >
              <ol className="space-y-2.5">
                {topVerifiers.map((v, i) => (
                  <RankedRow
                    key={v.profile!.id}
                    index={i}
                    label={v.profile!.display_name || v.profile!.username}
                    value={`${v.count} verified`}
                  />
                ))}
              </ol>
            </ListCard>
          </div>

          {/* ===== Community ===== */}
          <SectionHeader
            icon={Users}
            title="Community"
            description="Who is playing, where they're from, and what they've beaten lately."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ListCard
              icon={Activity}
              iconClassName="text-accent"
              title="Most Active (30d)"
              empty={mostActivePlayers.length === 0}
              emptyText="No recent activity."
            >
              <ol className="space-y-2.5">
                {mostActivePlayers.map((p, i) => (
                  <RankedRow
                    key={p.profile!.id}
                    index={i}
                    label={p.profile!.display_name || p.profile!.username}
                    value={`${p.count} runs`}
                    valueClassName="text-accent"
                  />
                ))}
              </ol>
            </ListCard>

            <ListCard
              icon={Globe}
              title="Country Distribution"
              empty={countryDist.length === 0}
              emptyText="No country data yet."
            >
              <div className="flex flex-wrap gap-2">
                {countryDist.map((c) => (
                  <span key={c.code} className="px-2.5 py-1 rounded-md bg-secondary text-xs font-mono">
                    {c.code} <span className="text-muted-foreground">×{c.count}</span>
                  </span>
                ))}
              </div>
            </ListCard>

            <ListCard
              icon={Clock}
              title="Recent Runs (7d)"
              empty={recentRecords.length === 0}
              emptyText="No runs in the last 7 days."
            >
              <ol className="space-y-2.5">
                {recentRecords.map((r, i) => (
                  <RankedRow
                    key={r.id}
                    index={i}
                    label={
                      <span>
                        {r.profile!.display_name || r.profile!.username}{" "}
                        <span className="text-xs text-muted-foreground">
                          on #{r.level!.rank_position} {r.level!.name}
                        </span>
                      </span>
                    }
                    value={`${Number(r.completion_time).toFixed(3)}s`}
                  />
                ))}
              </ol>
            </ListCard>
          </div>

          {/* More stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
              <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Manual Runs</p>
                <p className="font-display font-bold text-lg">{completionsData?.manual.toLocaleString() || "0"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
              <Zap className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">API Synced</p>
                <p className="font-display font-bold text-lg">{completionsData?.api.toLocaleString() || "0"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
              <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Future Levels</p>
                <p className="font-display font-bold text-lg">{levelsData?.future.toLocaleString() || "0"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
              <Activity className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
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
