import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Edit2, Search, X, Loader2, Package, GripVertical } from "lucide-react";

interface LevelPack {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  item_count?: number;
}

interface LevelOption {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  thumbnail_url: string | null;
  level_type: "main" | "extended";
}

interface PackItem {
  id?: string;
  level_id: string;
  level_type: "main" | "extended";
  display_order: number;
  level?: LevelOption;
}

export function LevelPacksManager() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [packs, setPacks] = useState<LevelPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPack, setEditingPack] = useState<LevelPack | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [items, setItems] = useState<PackItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Level picker
  const [allLevels, setAllLevels] = useState<LevelOption[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");

  const loadPacks = async () => {
    setLoading(true);
    const { data: packsData } = await supabase
      .from("level_packs")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: itemsData } = await supabase
      .from("level_pack_items")
      .select("pack_id");

    const counts = new Map<string, number>();
    (itemsData || []).forEach((i: any) => {
      counts.set(i.pack_id, (counts.get(i.pack_id) || 0) + 1);
    });

    setPacks(
      (packsData || []).map((p: any) => ({ ...p, item_count: counts.get(p.id) || 0 }))
    );
    setLoading(false);
  };

  const loadLevels = async () => {
    const [{ data: mainData }, { data: extData }] = await Promise.all([
      supabase.from("levels").select("id, level_id, name, author, rank_position, thumbnail_url").order("rank_position"),
      supabase.from("extended_levels").select("id, level_id, name, author, rank_position, thumbnail_url").order("rank_position"),
    ]);
    const merged: LevelOption[] = [
      ...(mainData || []).map((l: any) => ({ ...l, level_type: "main" as const })),
      ...(extData || []).map((l: any) => ({ ...l, level_type: "extended" as const })),
    ];
    setAllLevels(merged);
  };

  useEffect(() => {
    loadPacks();
    loadLevels();
  }, []);

  const uploadCoverFile = async (file: File) => {
    setUploadingCover(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `pack-cover-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("level-thumbnails")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("level-thumbnails").getPublicUrl(data.path);
      setCoverUrl(publicUrl);
      toast({ title: "Uploaded", description: "Cover image set" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingCover(false);
    }
  };

  const openNew = () => {
    setEditingPack(null);
    setName("");
    setDescription("");
    setCoverUrl("");
    setItems([]);
    setEditorOpen(true);
  };

  const openEdit = async (pack: LevelPack) => {
    setEditingPack(pack);
    setName(pack.name);
    setDescription(pack.description || "");
    setCoverUrl(pack.cover_url || "");

    const { data: itemRows } = await supabase
      .from("level_pack_items")
      .select("*")
      .eq("pack_id", pack.id)
      .order("display_order");

    const levelMap = new Map(allLevels.map((l) => [`${l.level_type}:${l.id}`, l]));
    setItems(
      (itemRows || []).map((r: any) => ({
        id: r.id,
        level_id: r.level_id,
        level_type: r.level_type,
        display_order: r.display_order,
        level: levelMap.get(`${r.level_type}:${r.level_id}`),
      }))
    );
    setEditorOpen(true);
  };

  const addLevel = (lvl: LevelOption) => {
    if (items.some((i) => i.level_id === lvl.id && i.level_type === lvl.level_type)) {
      toast({ title: "Already added", variant: "destructive" });
      return;
    }
    setItems([...items, { level_id: lvl.id, level_type: lvl.level_type, display_order: items.length, level: lvl }]);
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, display_order: i }));
    setItems(next);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next.map((it, i) => ({ ...it, display_order: i })));
  };

  const savePack = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let packId = editingPack?.id;
      if (!packId) {
        const { data, error } = await supabase
          .from("level_packs")
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            cover_url: coverUrl.trim() || null,
            created_by: user?.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        packId = data.id;
      } else {
        const { error } = await supabase
          .from("level_packs")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            cover_url: coverUrl.trim() || null,
          })
          .eq("id", packId);
        if (error) throw error;
        // Wipe existing items so we can re-insert with new order
        await supabase.from("level_pack_items").delete().eq("pack_id", packId);
      }

      if (items.length > 0 && packId) {
        const rows = items.map((it, i) => ({
          pack_id: packId,
          level_id: it.level_id,
          level_type: it.level_type,
          display_order: i,
        }));
        const { error: itemsError } = await supabase.from("level_pack_items").insert(rows);
        if (itemsError) throw itemsError;
      }

      toast({ title: "Saved", description: `Pack "${name}" saved` });
      setEditorOpen(false);
      loadPacks();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("level_packs").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      loadPacks();
    }
    setDeleteId(null);
  };

  const filteredPickerLevels = useMemo(() => {
    if (!pickerSearch.trim()) return allLevels.slice(0, 50);
    const q = pickerSearch.toLowerCase();
    return allLevels
      .filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.author?.toLowerCase().includes(q) ||
          l.level_id.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [allLevels, pickerSearch]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Level Packs
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
              {packs.length}
            </span>
          </h2>
          <Button size="sm" onClick={openNew} className="gap-1">
            <Plus className="w-4 h-4" /> New Pack
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin inline" />
          </div>
        ) : packs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No packs yet. Create one to group levels together.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {packs.map((pack) => (
              <div key={pack.id} className="p-4 flex items-center gap-4">
                {pack.cover_url ? (
                  <img src={pack.cover_url} alt={pack.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{pack.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {pack.description || "No description"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {pack.item_count} level{pack.item_count === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(pack)} className="gap-1">
                    <Edit2 className="w-3 h-3" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteId(pack.id)} className="gap-1">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPack ? "Edit Pack" : "New Level Pack"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pack name" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this pack about?" rows={3} />
            </div>
            <div>
              <Label>Cover image</Label>
              <div className="flex items-center gap-3 mt-1">
                {coverUrl ? (
                  <img src={coverUrl} alt="cover" className="w-16 h-16 rounded object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded bg-muted flex items-center justify-center border border-border">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="Paste image URL or upload below"
                    onPaste={async (e) => {
                      const file = Array.from(e.clipboardData.files).find(f => f.type.startsWith("image/"));
                      if (!file) return;
                      e.preventDefault();
                      await uploadCoverFile(file);
                    }}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploadingCover}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await uploadCoverFile(file);
                        e.target.value = "";
                      }}
                      className="text-xs"
                    />
                    {coverUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCoverUrl("")} className="gap-1">
                        <X className="w-3 h-3" /> Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Tip: paste an image directly into the URL box.</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Levels in pack ({items.length})</Label>
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded">
                  No levels added yet. Add some below.
                </div>
              ) : (
                <div className="space-y-1 mt-2 max-h-60 overflow-y-auto">
                  {items.map((it, idx) => (
                    <div key={`${it.level_type}:${it.level_id}`} className="flex items-center gap-2 p-2 rounded bg-secondary/40 border border-border">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {it.level?.name || it.level_id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {it.level_type === "main" ? "Main" : "Extra"} #{it.level?.rank_position} • {it.level?.author || "Unknown"}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveItem(idx, -1)}>↑</Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveItem(idx, 1)}>↓</Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeItem(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Add levels</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} placeholder="Search levels..." className="pl-9" />
              </div>
              <div className="space-y-1 mt-2 max-h-60 overflow-y-auto border border-border rounded p-1">
                {filteredPickerLevels.map((lvl) => {
                  const added = items.some((i) => i.level_id === lvl.id && i.level_type === lvl.level_type);
                  return (
                    <button
                      key={`${lvl.level_type}:${lvl.id}`}
                      type="button"
                      disabled={added}
                      onClick={() => addLevel(lvl)}
                      className="w-full flex items-center gap-2 p-2 rounded hover:bg-secondary/50 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                    >
                      <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{lvl.name || lvl.level_id}</div>
                        <div className="text-xs text-muted-foreground">
                          {lvl.level_type === "main" ? "Main" : "Extra"} #{lvl.rank_position} • {lvl.author || "Unknown"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={savePack} disabled={saving} className="gap-1">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Pack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this pack?</AlertDialogTitle>
            <AlertDialogDescription>
              The pack and all its level entries will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
