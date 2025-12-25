import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { BarChart3, Users, Eye, Clock, TrendingUp, Activity, Calendar } from "lucide-react";

interface Props {
  totalLevels: number;
  totalFutureLevels: number;
  totalPlayers: number;
  totalManualRuns: number;
  changelogCount: number;
}

export function AdminStatistics({ totalLevels, totalFutureLevels, totalPlayers, totalManualRuns, changelogCount }: Props) {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "all">("all");
  
  // Mock visitor data - in a real app this would come from analytics
  const visitorData = useMemo(() => {
    const baseVisitors = 150;
    const days = timeFilter === "today" ? 1 : timeFilter === "week" ? 7 : 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Generate realistic-looking data with variance
      const visitors = Math.floor(baseVisitors + Math.random() * 80 - 40);
      const pageViews = Math.floor(visitors * (2 + Math.random()));
      const avgTime = Math.floor(3 + Math.random() * 5); // 3-8 minutes
      
      data.push({
        day: timeFilter === "today" ? "Today" : days <= 7 ? dayName : dateStr,
        visitors,
        pageViews,
        avgTime,
      });
    }
    
    return data;
  }, [timeFilter]);
  
  const totalVisitors = useMemo(() => visitorData.reduce((sum, d) => sum + d.visitors, 0), [visitorData]);
  const totalPageViews = useMemo(() => visitorData.reduce((sum, d) => sum + d.pageViews, 0), [visitorData]);
  const avgSessionTime = useMemo(() => {
    const avg = visitorData.reduce((sum, d) => sum + d.avgTime, 0) / visitorData.length;
    return Math.round(avg * 10) / 10;
  }, [visitorData]);
  
  // Page distribution data
  const pageDistribution = [
    { name: "Main List", value: 35, color: "hsl(var(--primary))" },
    { name: "Leaderboard", value: 25, color: "hsl(var(--accent))" },
    { name: "Profiles", value: 20, color: "hsl(var(--theme-tertiary))" },
    { name: "Recent Runs", value: 12, color: "hsl(var(--muted-foreground))" },
    { name: "Other", value: 8, color: "hsl(var(--border))" },
  ];
  
  // Activity summary cards
  const statsCards = [
    { 
      label: "Total Visitors", 
      value: totalVisitors.toLocaleString(), 
      icon: Users, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "Page Views", 
      value: totalPageViews.toLocaleString(), 
      icon: Eye, 
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    { 
      label: "Avg. Session", 
      value: `${avgSessionTime} min`, 
      icon: Clock, 
      color: "text-glow-gold",
      bgColor: "bg-glow-gold/10"
    },
    { 
      label: "Active Levels", 
      value: totalLevels.toString(), 
      icon: Activity, 
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Site Statistics</h2>
            <p className="text-sm text-muted-foreground">Overview of Narrowlist analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="all">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-card border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className={`font-display text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Visitors Chart */}
        <div className="rounded-lg bg-card border border-border p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Visitor Trends</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorData}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => [value, name === 'visitors' ? 'Visitors' : 'Page Views']}
                />
                <Area 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVisitors)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Page Distribution */}
        <div className="rounded-lg bg-card border border-border p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-accent" />
            <h3 className="font-display font-semibold">Page Distribution</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Traffic']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {pageDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Page Views Bar Chart */}
      <div className="rounded-lg bg-card border border-border p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">Daily Page Views</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visitorData}>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="pageViews" 
                fill="hsl(var(--accent))" 
                radius={[4, 4, 0, 0]}
                name="Page Views"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
          <div className="font-display text-2xl font-bold text-foreground">{totalLevels}</div>
          <div className="text-xs text-muted-foreground">Main List Levels</div>
        </div>
        <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
          <div className="font-display text-2xl font-bold text-foreground">{totalFutureLevels}</div>
          <div className="text-xs text-muted-foreground">Future Levels</div>
        </div>
        <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
          <div className="font-display text-2xl font-bold text-foreground">{totalPlayers}</div>
          <div className="text-xs text-muted-foreground">Linked Players</div>
        </div>
        <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
          <div className="font-display text-2xl font-bold text-foreground">{changelogCount}</div>
          <div className="text-xs text-muted-foreground">Admin Actions</div>
        </div>
      </div>
      
      {/* Note */}
      <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 text-center">
        📊 Analytics data shown is for demonstration purposes. Real-time visitor tracking requires integration with an analytics service.
      </div>
    </div>
  );
}