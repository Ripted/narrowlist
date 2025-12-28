import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitCompare, Search, X, Plus, Trophy, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number | null;
}

interface CompletionData {
  level_id: string;
  level_string_id: string;
  level_name: string | null;
  level_rank: number;
  level_points: number;
  completion_time: number;
  completed_at: string;
}

interface PlayerData extends Profile {
  completions: CompletionData[];
}

const PLAYER_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22c55e", "#f59e0b"];

export default function ComparePage() {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingPlayer, setLoadingPlayer] = useState(false);

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, total_points")
        .order("total_points", { ascending: false });
      if (data) setAllProfiles(data);
      setLoading(false);
    }
    loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return allProfiles.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return allProfiles.filter(
      p =>
        p.username.toLowerCase().includes(query) ||
        p.display_name?.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [allProfiles, searchQuery]);

  const addPlayer = async (profile: Profile) => {
    if (selectedPlayers.some(p => p.id === profile.id)) return;
    if (selectedPlayers.length >= 4) return;

    setLoadingPlayer(true);

    const { data: completions } = await supabase
      .from("completions")
      .select("level_id, completion_time, completed_at")
      .eq("profile_id", profile.id);

    const levelIds = [...new Set(completions?.map(c => c.level_id) || [])];
    const { data: levels } = await supabase
      .from("levels")
      .select("id, level_id, name, rank_position, points")
      .in("id", levelIds);

    const levelMap = new Map(levels?.map(l => [l.id, l]) || []);

    const playerData: PlayerData = {
      ...profile,
      completions: (completions || []).map(c => ({
        level_id: c.level_id,
        level_string_id: levelMap.get(c.level_id)?.level_id || "",
        level_name: levelMap.get(c.level_id)?.name || "Unknown",
        level_rank: levelMap.get(c.level_id)?.rank_position || 0,
        level_points: levelMap.get(c.level_id)?.points || 0,
        completion_time: c.completion_time,
        completed_at: c.completed_at,
      })).sort((a, b) => a.level_rank - b.level_rank),
    };

    setSelectedPlayers(prev => [...prev, playerData]);
    setSearchQuery("");
    setLoadingPlayer(false);
  };

  const removePlayer = (id: string) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== id));
  };

  const allLevels = useMemo(() => {
    const levelSet = new Map<string, { id: string; stringId: string; name: string; rank: number }>();
    selectedPlayers.forEach(player => {
      player.completions.forEach(c => {
        if (!levelSet.has(c.level_id)) {
          levelSet.set(c.level_id, { id: c.level_id, stringId: c.level_string_id, name: c.level_name || "", rank: c.level_rank });
        }
      });
    });
    return Array.from(levelSet.values()).sort((a, b) => a.rank - b.rank);
  }, [selectedPlayers]);

  // Chart data: completions count comparison
  const completionsChartData = useMemo(() => {
    return selectedPlayers.map((player, index) => ({
      name: player.display_name || player.username,
      completions: player.completions.length,
      fill: PLAYER_COLORS[index],
    }));
  }, [selectedPlayers]);

  // Chart data: points comparison
  const pointsChartData = useMemo(() => {
    return selectedPlayers.map((player, index) => ({
      name: player.display_name || player.username,
      points: player.total_points || 0,
      fill: PLAYER_COLORS[index],
    }));
  }, [selectedPlayers]);

  // Chart data: level difficulty distribution (how many levels completed per rank range)
  const difficultyDistribution = useMemo(() => {
    const ranges = [
      { label: "Top 10", min: 1, max: 10 },
      { label: "11-25", min: 11, max: 25 },
      { label: "26-50", min: 26, max: 50 },
      { label: "51-100", min: 51, max: 100 },
      { label: "100+", min: 101, max: 9999 },
    ];

    return ranges.map(range => {
      const data: Record<string, number | string> = { range: range.label };
      selectedPlayers.forEach((player, index) => {
        const count = player.completions.filter(
          c => c.level_rank >= range.min && c.level_rank <= range.max
        ).length;
        data[player.display_name || player.username] = count;
      });
      return data;
    });
  }, [selectedPlayers]);

  // Chart data: points over time (cumulative)
  const pointsOverTime = useMemo(() => {
    if (selectedPlayers.length === 0) return [];

    // Get all completion dates across all players
    const allDates = new Set<string>();
    selectedPlayers.forEach(player => {
      player.completions.forEach(c => {
        const date = new Date(c.completed_at).toISOString().split('T')[0];
        allDates.add(date);
      });
    });

    const sortedDates = Array.from(allDates).sort();
    
    // Calculate cumulative points for each player at each date
    return sortedDates.map(date => {
      const data: Record<string, number | string> = { date };
      selectedPlayers.forEach(player => {
        const cumulativePoints = player.completions
          .filter(c => new Date(c.completed_at).toISOString().split('T')[0] <= date)
          .reduce((sum, c) => sum + c.level_points, 0);
        data[player.display_name || player.username] = cumulativePoints;
      });
      return data;
    });
  }, [selectedPlayers]);

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(3)}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <main className="relative pt-24 pb-12">
        <section className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <GitCompare className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold">Compare Players</h1>
            </div>
          </div>

          {/* Player Selection */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-3 mb-4">
              {selectedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ backgroundColor: `${PLAYER_COLORS[index]}20` }}
                >
                  <div 
                    className="w-6 h-6 rounded-full overflow-hidden"
                    style={{ border: `2px solid ${PLAYER_COLORS[index]}` }}
                  >
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-muted">
                        {(player.display_name || player.username).charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{player.display_name || player.username}</span>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedPlayers.length < 4 && (
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Add player to compare..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background"
                      disabled={loadingPlayer}
                    />
                  </div>
                  {searchQuery && (
                    <div className="absolute z-10 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      {filteredProfiles
                        .filter(p => !selectedPlayers.some(sp => sp.id === p.id))
                        .map(profile => (
                          <button
                            key={profile.id}
                            onClick={() => addPlayer(profile)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-secondary transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                                  {(profile.display_name || profile.username).charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{profile.display_name || profile.username}</div>
                              <div className="text-xs text-muted-foreground">{profile.total_points || 0} pts</div>
                            </div>
                            <Plus className="w-4 h-4 ml-auto text-muted-foreground" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Select up to 4 players to compare their completions</p>
          </div>

          {/* Stats Summary */}
          {selectedPlayers.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {selectedPlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className="bg-card border border-border rounded-lg p-4 text-center"
                  style={{ borderColor: `${PLAYER_COLORS[index]}40` }}
                >
                  <Link to={`/player/${player.username}`}>
                    <div 
                      className="w-16 h-16 rounded-full bg-secondary mx-auto mb-3 overflow-hidden transition-colors"
                      style={{ border: `3px solid ${PLAYER_COLORS[index]}` }}
                    >
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                          {(player.display_name || player.username).charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-foreground hover:text-primary transition-colors">
                      {player.display_name || player.username}
                    </div>
                  </Link>
                  <div className="flex items-center justify-center gap-1 mt-1" style={{ color: PLAYER_COLORS[index] }}>
                    <Trophy className="w-4 h-4" />
                    <span className="font-mono">{player.total_points || 0} pts</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {player.completions.length} completions
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts Section */}
          {selectedPlayers.length >= 2 && (
            <div className="space-y-6 mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Statistics Comparison</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Points Comparison Bar Chart */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-4 text-center">Total Points</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={pointsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                        {pointsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Completions Comparison Bar Chart */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-4 text-center">Total Completions</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={completionsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="completions" radius={[4, 4, 0, 0]}>
                        {completionsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Difficulty Distribution */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-4 text-center">Completions by Difficulty</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={difficultyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      {selectedPlayers.map((player, index) => (
                        <Bar 
                          key={player.id} 
                          dataKey={player.display_name || player.username} 
                          fill={PLAYER_COLORS[index]}
                          radius={[2, 2, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Points Over Time */}
                {pointsOverTime.length > 1 && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-4 text-center">Points Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={pointsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Legend />
                        {selectedPlayers.map((player, index) => (
                          <Line 
                            key={player.id}
                            type="monotone"
                            dataKey={player.display_name || player.username}
                            stroke={PLAYER_COLORS[index]}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparison Table */}
          {selectedPlayers.length >= 2 && allLevels.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Level-by-Level Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">Level</th>
                      {selectedPlayers.map((player, index) => (
                        <th 
                          key={player.id} 
                          className="text-center p-4 font-medium min-w-[120px]"
                          style={{ color: PLAYER_COLORS[index] }}
                        >
                          {player.display_name || player.username}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allLevels.map(level => {
                      const times = selectedPlayers.map(player => {
                        const completion = player.completions.find(c => c.level_id === level.id);
                        return completion?.completion_time;
                      });
                      const bestTime = Math.min(...times.filter((t): t is number => t !== undefined));

                      return (
                        <tr key={level.id} className="border-b border-border hover:bg-secondary/20">
                          <td className="p-4">
                            <Link to={`/level/${level.stringId}`} className="hover:text-primary transition-colors">
                              <div className="font-medium">#{level.rank} {level.name}</div>
                            </Link>
                          </td>
                          {selectedPlayers.map((player, index) => {
                            const completion = player.completions.find(c => c.level_id === level.id);
                            const isBest = completion?.completion_time === bestTime;
                            return (
                              <td key={player.id} className="text-center p-4">
                                {completion ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className={`font-mono ${isBest ? "font-bold" : "text-foreground"}`} style={isBest ? { color: PLAYER_COLORS[index] } : {}}>
                                      {formatTime(completion.completion_time)}
                                    </span>
                                    {isBest && <Trophy className="w-3 h-3 text-primary" />}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedPlayers.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <GitCompare className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">Select Players to Compare</h3>
              <p className="text-muted-foreground">
                Use the search above to add players and compare their level completions.
              </p>
            </div>
          )}

          {selectedPlayers.length === 1 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold">Add Another Player</h3>
              <p className="text-muted-foreground">
                Add at least one more player to start comparing.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
