import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Save, Trash2, Plus, RefreshCw, GripVertical, Image, Edit2 } from "lucide-react";

interface Level {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
}

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // New level form
  const [newLevelId, setNewLevelId] = useState("");
  const [addingLevel, setAddingLevel] = useState(false);
  
  // Edit modal
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [editName, setEditName] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({ title: "Access Denied", description: "Admin privileges required", variant: "destructive" });
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchLevels();
    }
  }, [isAdmin]);

  const fetchLevels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("levels")
      .select("*")
      .order("rank_position", { ascending: true });
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch levels", variant: "destructive" });
    } else {
      setLevels(data || []);
    }
    setLoading(false);
  };

  const calculatePoints = (rank: number): number => {
    if (rank === 1) return 10;
    if (rank === 2) return 8;
    if (rank === 3) return 7;
    if (rank === 4) return 6;
    if (rank === 5) return 5;
    if (rank >= 6 && rank <= 10) return 4;
    if (rank >= 11 && rank <= 25) return 3;
    if (rank >= 26 && rank <= 50) return 2;
    return 1;
  };

  const addLevel = async () => {
    if (!newLevelId.trim()) return;
    
    setAddingLevel(true);
    
    try {
      // Fetch level details from API
      const response = await fetch(
        `https://api.narrowarrow.xyz/level-details/${newLevelId.trim()}?isCustomLevel=true`
      );
      
      if (!response.ok) {
        throw new Error("Level not found");
      }
      
      const data = await response.json();
      const newRank = levels.length + 1;
      
      const { error } = await supabase.from("levels").insert({
        level_id: newLevelId.trim(),
        name: data.levelInfo?.name || "Unknown Level",
        author: data.levelInfo?.author || "Unknown",
        rank_position: newRank,
        points: calculatePoints(newRank),
        thumbnail_url: null,
      });
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Level added successfully" });
      setNewLevelId("");
      fetchLevels();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add level", variant: "destructive" });
    } finally {
      setAddingLevel(false);
    }
  };

  const removeLevel = async (id: string) => {
    const { error } = await supabase.from("levels").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to remove level", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Level removed" });
      // Recalculate ranks
      const remaining = levels.filter(l => l.id !== id);
      await updateRanks(remaining.map((l, i) => ({ ...l, rank_position: i + 1 })));
      fetchLevels();
    }
  };

  const moveLevel = async (index: number, direction: "up" | "down") => {
    const newLevels = [...levels];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newLevels.length) return;
    
    [newLevels[index], newLevels[targetIndex]] = [newLevels[targetIndex], newLevels[index]];
    
    // Update ranks
    const updatedLevels = newLevels.map((l, i) => ({
      ...l,
      rank_position: i + 1,
      points: calculatePoints(i + 1),
    }));
    
    setLevels(updatedLevels);
    await updateRanks(updatedLevels);
  };

  const updateRanks = async (updatedLevels: Level[]) => {
    setSaving(true);
    
    for (const level of updatedLevels) {
      await supabase
        .from("levels")
        .update({ 
          rank_position: level.rank_position, 
          points: calculatePoints(level.rank_position) 
        })
        .eq("id", level.id);
    }
    
    setSaving(false);
    toast({ title: "Saved", description: "Rankings updated" });
  };

  const openEditModal = (level: Level) => {
    setEditingLevel(level);
    setEditName(level.name || "");
    setEditAuthor(level.author || "");
    setEditThumbnail(level.thumbnail_url || "");
  };

  const saveEditedLevel = async () => {
    if (!editingLevel) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("levels")
      .update({
        name: editName || null,
        author: editAuthor || null,
        thumbnail_url: editThumbnail || null,
      })
      .eq("id", editingLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update level", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Level updated" });
      setEditingLevel(null);
      fetchLevels();
    }
    setSaving(false);
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const response = await supabase.functions.invoke("sync-completions");
      if (response.error) throw response.error;
      toast({ title: "Sync Complete", description: "Completions have been updated" });
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message || "Failed to sync", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Admin Panel</h1>
                <p className="text-muted-foreground">Manage levels and trigger sync</p>
              </div>
            </div>
            
            <Button 
              onClick={triggerSync} 
              disabled={syncing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>

          {/* Add New Level */}
          <div className="rounded-lg bg-card border border-border p-6 mb-8">
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Level
            </h2>
            <div className="flex gap-4">
              <Input
                placeholder="Enter level ID (e.g., 1743661104278)"
                value={newLevelId}
                onChange={(e) => setNewLevelId(e.target.value)}
                className="flex-1 bg-secondary border-border"
              />
              <Button onClick={addLevel} disabled={addingLevel || !newLevelId.trim()}>
                {addingLevel ? "Adding..." : "Add Level"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              The level will be added at the bottom of the list. You can then reorder it.
            </p>
          </div>

          {/* Level List */}
          <div className="rounded-lg bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Level Rankings</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {levels.length} levels
              </span>
            </div>

            {levels.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No levels added yet. Add a level above to get started.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {levels.map((level, index) => (
                  <div
                    key={level.id}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-12 text-center">
                      <span className={`font-display font-bold text-xl ${
                        index === 0 ? "rank-gold" :
                        index === 1 ? "rank-silver" :
                        index === 2 ? "rank-bronze" :
                        "text-muted-foreground"
                      }`}>
                        #{index + 1}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                      {level.thumbnail_url ? (
                        <img
                          src={level.thumbnail_url}
                          alt={level.name || "Level"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {level.name || "Unnamed Level"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {level.level_id} • By: {level.author || "Unknown"} • {level.points} pts
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveLevel(index, "up")}
                        disabled={index === 0 || saving}
                        className="h-8 w-8"
                      >
                        <GripVertical className="w-4 h-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveLevel(index, "down")}
                        disabled={index === levels.length - 1 || saving}
                        className="h-8 w-8"
                      >
                        <GripVertical className="w-4 h-4 -rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(level)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLevel(level.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="font-display text-xl font-bold">Edit Level</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Level Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editAuthor">Author</Label>
                <Input
                  id="editAuthor"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editThumbnail">Thumbnail URL</Label>
                <Input
                  id="editThumbnail"
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingLevel(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedLevel} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
