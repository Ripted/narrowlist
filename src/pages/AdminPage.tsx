import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, Trash2, Plus, RefreshCw, GripVertical, Image, Edit2, 
  ChevronUp, ChevronDown, ArrowUpDown, Check, X, Users, Upload, AlertTriangle 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Level {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
}

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  email?: string;
}

export default function AdminPage() {
  const { isAdmin, isHeadAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // New level form
  const [newLevelId, setNewLevelId] = useState("");
  const [addingLevel, setAddingLevel] = useState(false);
  
  // Bulk import
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkLevelIds, setBulkLevelIds] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  
  // Edit modal
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [editName, setEditName] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  
  // Delete confirmation
  const [deleteConfirmLevel, setDeleteConfirmLevel] = useState<Level | null>(null);
  
  // Quick rank change
  const [rankInputId, setRankInputId] = useState<string | null>(null);
  const [rankInputValue, setRankInputValue] = useState("");
  
  // Quick thumbnail edit
  const [thumbnailEditId, setThumbnailEditId] = useState<string | null>(null);
  const [thumbnailInputValue, setThumbnailInputValue] = useState("");
  
  // Drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Admin management (head admin only)
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({ title: "Access Denied", description: "Admin privileges required", variant: "destructive" });
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchLevels();
      if (isHeadAdmin) {
        fetchAdmins();
      }
    }
  }, [isAdmin, isHeadAdmin]);

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

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .eq("role", "admin");
    
    if (!error && data) {
      setAdmins(data);
    }
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

  const bulkImportLevels = async () => {
    const ids = bulkLevelIds
      .split(/[\n,]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    if (ids.length === 0) {
      toast({ title: "Error", description: "No valid level IDs found", variant: "destructive" });
      return;
    }
    
    setBulkImporting(true);
    let successCount = 0;
    let errorCount = 0;
    let currentRank = levels.length;
    
    for (const levelId of ids) {
      try {
        // Check if already exists
        const existingLevel = levels.find(l => l.level_id === levelId);
        if (existingLevel) {
          errorCount++;
          continue;
        }
        
        const response = await fetch(
          `https://api.narrowarrow.xyz/level-details/${levelId}?isCustomLevel=true`
        );
        
        if (!response.ok) {
          errorCount++;
          continue;
        }
        
        const data = await response.json();
        currentRank++;
        
        const { error } = await supabase.from("levels").insert({
          level_id: levelId,
          name: data.levelInfo?.name || "Unknown Level",
          author: data.levelInfo?.author || "Unknown",
          rank_position: currentRank,
          points: calculatePoints(currentRank),
          thumbnail_url: null,
        });
        
        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch {
        errorCount++;
      }
    }
    
    setBulkImporting(false);
    setBulkImportOpen(false);
    setBulkLevelIds("");
    
    toast({ 
      title: "Bulk Import Complete", 
      description: `Added ${successCount} levels. ${errorCount > 0 ? `${errorCount} failed/skipped.` : ""}` 
    });
    
    fetchLevels();
  };

  const confirmDeleteLevel = async () => {
    if (!deleteConfirmLevel) return;
    
    const { error } = await supabase.from("levels").delete().eq("id", deleteConfirmLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to remove level", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Level removed" });
      const remaining = levels.filter(l => l.id !== deleteConfirmLevel.id);
      await updateRanks(remaining.map((l, i) => ({ ...l, rank_position: i + 1 })));
      fetchLevels();
    }
    
    setDeleteConfirmLevel(null);
  };

  const moveLevel = async (index: number, direction: "up" | "down") => {
    const newLevels = [...levels];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newLevels.length) return;
    
    [newLevels[index], newLevels[targetIndex]] = [newLevels[targetIndex], newLevels[index]];
    
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

  const startRankEdit = (level: Level) => {
    setRankInputId(level.id);
    setRankInputValue(String(level.rank_position));
  };

  const confirmRankChange = async () => {
    if (!rankInputId) return;
    
    const newRank = parseInt(rankInputValue);
    if (isNaN(newRank) || newRank < 1 || newRank > levels.length) {
      toast({ title: "Invalid rank", description: `Enter a number between 1 and ${levels.length}`, variant: "destructive" });
      return;
    }

    const levelToMove = levels.find(l => l.id === rankInputId);
    if (!levelToMove) return;

    const currentIndex = levels.findIndex(l => l.id === rankInputId);
    const targetIndex = newRank - 1;

    if (currentIndex === targetIndex) {
      setRankInputId(null);
      return;
    }

    const newLevels = [...levels];
    newLevels.splice(currentIndex, 1);
    newLevels.splice(targetIndex, 0, levelToMove);

    const updatedLevels = newLevels.map((l, i) => ({
      ...l,
      rank_position: i + 1,
      points: calculatePoints(i + 1),
    }));

    setLevels(updatedLevels);
    setRankInputId(null);
    await updateRanks(updatedLevels);
  };

  const startThumbnailEdit = (level: Level) => {
    setThumbnailEditId(level.id);
    setThumbnailInputValue(level.thumbnail_url || "");
  };

  const confirmThumbnailChange = async () => {
    if (!thumbnailEditId) return;

    setSaving(true);
    const { error } = await supabase
      .from("levels")
      .update({ thumbnail_url: thumbnailInputValue || null })
      .eq("id", thumbnailEditId);

    if (error) {
      toast({ title: "Error", description: "Failed to update thumbnail", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Thumbnail updated" });
      setLevels(prev => prev.map(l => 
        l.id === thumbnailEditId ? { ...l, thumbnail_url: thumbnailInputValue || null } : l
      ));
    }
    
    setThumbnailEditId(null);
    setSaving(false);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newLevels = [...levels];
    const [draggedItem] = newLevels.splice(draggedIndex, 1);
    newLevels.splice(targetIndex, 0, draggedItem);

    const updatedLevels = newLevels.map((l, i) => ({
      ...l,
      rank_position: i + 1,
      points: calculatePoints(i + 1),
    }));

    setLevels(updatedLevels);
    setDraggedIndex(null);
    setDragOverIndex(null);
    await updateRanks(updatedLevels);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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

  // Admin management functions
  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    
    setAddingAdmin(true);
    
    try {
      // First, we need to find the user by email - we'll use a workaround
      // since we can't directly query auth.users
      // The user needs to exist and be signed up
      toast({ 
        title: "Note", 
        description: "The user must have already signed up. Enter their user ID instead of email for now.",
      });
      
      // For now, treat input as user_id
      const userId = newAdminEmail.trim();
      
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Admin added" });
      setNewAdminEmail("");
      fetchAdmins();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add admin", variant: "destructive" });
    } finally {
      setAddingAdmin(false);
    }
  };

  const removeAdmin = async (roleId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", roleId);
    
    if (error) {
      toast({ title: "Error", description: "Failed to remove admin", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Admin removed" });
      fetchAdmins();
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
                <h1 className="font-display text-3xl font-bold text-foreground">
                  Admin Panel {isHeadAdmin && <span className="text-accent text-lg">(Head Admin)</span>}
                </h1>
                <p className="text-muted-foreground">Drag to reorder • Click rank to jump • Click thumbnail to edit</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setBulkImportOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Bulk Import
              </Button>
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
          </div>

          {/* Head Admin: Manage Admins */}
          {isHeadAdmin && (
            <div className="rounded-lg bg-card border border-accent/30 p-6 mb-8">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Manage Admins
              </h2>
              
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Enter user ID to grant admin"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 bg-secondary border-border"
                />
                <Button onClick={addAdmin} disabled={addingAdmin || !newAdminEmail.trim()}>
                  {addingAdmin ? "Adding..." : "Add Admin"}
                </Button>
              </div>
              
              {admins.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">Current Admins:</p>
                  {admins.map(admin => (
                    <div key={admin.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <span className="font-mono text-sm text-foreground">{admin.user_id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAdmin(admin.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
          </div>

          {/* Level List */}
          <div className="rounded-lg bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-primary" />
                Level Rankings
              </h2>
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
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-4 transition-all cursor-grab active:cursor-grabbing
                      ${draggedIndex === index ? "opacity-50 bg-primary/10" : "hover:bg-secondary/20"}
                      ${dragOverIndex === index && draggedIndex !== index ? "border-t-2 border-primary" : ""}
                    `}
                  >
                    <div className="flex-shrink-0 text-muted-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <div className="w-16 flex-shrink-0">
                      {rankInputId === level.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            max={levels.length}
                            value={rankInputValue}
                            onChange={(e) => setRankInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && confirmRankChange()}
                            className="w-12 h-8 text-center p-1 bg-secondary"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmRankChange}>
                            <Check className="w-3 h-3 text-green-500" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRankInputId(null)}>
                            <X className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startRankEdit(level)}
                          className={`font-display font-bold text-xl hover:underline cursor-pointer ${
                            index === 0 ? "rank-gold" :
                            index === 1 ? "rank-silver" :
                            index === 2 ? "rank-bronze" :
                            "text-muted-foreground"
                          }`}
                          title="Click to change rank"
                        >
                          #{index + 1}
                        </button>
                      )}
                    </div>

                    <div className="w-20 h-12 rounded bg-secondary overflow-hidden flex-shrink-0 relative group">
                      {thumbnailEditId === level.id ? (
                        <div className="absolute inset-0 bg-card p-1 flex items-center gap-1 z-10">
                          <Input
                            type="text"
                            placeholder="URL..."
                            value={thumbnailInputValue}
                            onChange={(e) => setThumbnailInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && confirmThumbnailChange()}
                            className="h-full text-xs p-1 bg-secondary flex-1"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmThumbnailChange}>
                            <Check className="w-3 h-3 text-green-500" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setThumbnailEditId(null)}>
                            <X className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startThumbnailEdit(level)}
                          className="w-full h-full relative"
                          title="Click to edit thumbnail"
                        >
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
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Edit2 className="w-4 h-4 text-foreground" />
                          </div>
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {level.name || "Unnamed Level"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {level.level_id} • By: {level.author || "Unknown"} • {level.points} pts
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveLevel(index, "up")}
                        disabled={index === 0 || saving}
                        className="h-8 w-8"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveLevel(index, "down")}
                        disabled={index === levels.length - 1 || saving}
                        className="h-8 w-8"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(level)}
                        className="h-8 w-8"
                        title="Edit details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmLevel(level)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Remove level"
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

      {/* Bulk Import Modal */}
      {bulkImportOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Bulk Import Levels
            </h2>
            
            <div>
              <Label htmlFor="bulkIds">Level IDs (one per line or comma-separated)</Label>
              <Textarea
                id="bulkIds"
                value={bulkLevelIds}
                onChange={(e) => setBulkLevelIds(e.target.value)}
                placeholder="1743661104278
1234567890123
9876543210987"
                className="mt-1 bg-secondary border-border min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Levels will be added in the order listed, starting after current last position.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setBulkImportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={bulkImportLevels} disabled={bulkImporting || !bulkLevelIds.trim()}>
                {bulkImporting ? "Importing..." : "Import Levels"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="font-display text-xl font-bold">Edit Level</h2>
            
            <div className="aspect-video rounded-lg bg-secondary overflow-hidden">
              {editThumbnail ? (
                <img src={editThumbnail} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Image className="w-8 h-8" />
                </div>
              )}
            </div>
            
            <div className="space-y-4">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmLevel} onOpenChange={() => setDeleteConfirmLevel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Level?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmLevel?.name || "this level"}</strong>? 
              This will remove it from the rankings and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLevel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
