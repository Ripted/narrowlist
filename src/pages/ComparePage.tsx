import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitCompare, Search, X, Plus, Trophy, Target, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number | null;
}

interface CompletionData {
  level_id: string;
  level_name: string | null;
  level_rank: number;
  completion_time: number;
  completed_at: string;
}

interface PlayerData extends Profile {
  completions: CompletionData[];
}

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

    // Fetch completions for this player
    const { data: completions } = await supabase
      .from("completions")
      .select("level_id, completion_time, completed_at")
      .eq("profile_id", profile.id);

    // Fetch level info
    const levelIds = [...new Set(completions?.map(c => c.level_id) || [])];
    const { data: levels } = await supabase
      .from("levels")
      .select("id, name, rank_position")
      .in("id", levelIds);

    const levelMap = new Map(levels?.map(l => [l.id, l]) || []);

    const playerData: PlayerData = {
      ...profile,
      completions: (completions || []).map(c => ({
        level_id: c.level_id,
        level_name: levelMap.get(c.level_id)?.name || "Unknown",
        level_rank: levelMap.get(c.level_id)?.rank_position || 0,
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

  // Get all unique levels from selected players
  const allLevels = useMemo(() => {
    const levelSet = new Map<string, { id: string; name: string; rank: number }>();
    selectedPlayers.forEach(player => {
      player.completions.forEach(c => {
        if (!levelSet.has(c.level_id)) {
          levelSet.set(c.level_id, { id: c.level_id, name: c.level_name || "", rank: c.level_rank });
        }
      });
    });
    return Array.from(levelSet.values()).sort((a, b) => a.rank - b.rank);
  }, [selectedPlayers]);

  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : `${seconds}s`;
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
              {selectedPlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5"
                >
                  <div className="w-6 h-6 rounded-full bg-muted overflow-hidden">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold">
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
              {selectedPlayers.map(player => (
                <div key={player.id} className="bg-card border border-border rounded-lg p-4 text-center">
                  <Link to={`/player/${player.username}`}>
                    <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-3 overflow-hidden border-2 border-primary/50 hover:border-primary transition-colors">
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
                  <div className="flex items-center justify-center gap-1 text-primary mt-1">
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

          {/* Comparison Table */}
          {selectedPlayers.length >= 2 && allLevels.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">Level</th>
                      {selectedPlayers.map(player => (
                        <th key={player.id} className="text-center p-4 font-medium text-foreground min-w-[120px]">
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
                            <Link to={`/level/${level.id}`} className="hover:text-primary transition-colors">
                              <div className="font-medium">#{level.rank} {level.name}</div>
                            </Link>
                          </td>
                          {selectedPlayers.map(player => {
                            const completion = player.completions.find(c => c.level_id === level.id);
                            const isBest = completion?.completion_time === bestTime;
                            return (
                              <td key={player.id} className="text-center p-4">
                                {completion ? (
                                  <span className={`font-mono ${isBest ? "text-primary font-bold" : "text-foreground"}`}>
                                    {formatTime(completion.completion_time)}
                                    {isBest && <span className="text-xs ml-1">👑</span>}
                                  </span>
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
