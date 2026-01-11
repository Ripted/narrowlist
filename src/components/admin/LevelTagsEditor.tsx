import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface LevelTag {
  id: string;
  level_id: string;
  level_type: string;
  emoji: string;
  text: string;
  show_on_card: boolean;
  show_on_page: boolean;
  display_order: number;
}

interface LevelTagsEditorProps {
  levelId: string;
  levelType: "main" | "future" | "extra";
  onClose?: () => void;
}

export function LevelTagsEditor({ levelId, levelType, onClose }: LevelTagsEditorProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState<LevelTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New tag form
  const [newEmoji, setNewEmoji] = useState("🏷️");
  const [newText, setNewText] = useState("");
  const [newShowOnCard, setNewShowOnCard] = useState(true);
  const [newShowOnPage, setNewShowOnPage] = useState(true);

  useEffect(() => {
    fetchTags();
  }, [levelId]);

  const fetchTags = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("level_tags")
      .select("*")
      .eq("level_id", levelId)
      .order("display_order");
    
    if (error) {
      toast({ title: "Error", description: "Failed to load tags", variant: "destructive" });
    } else {
      setTags((data as LevelTag[]) || []);
    }
    setLoading(false);
  };

  const addTag = async () => {
    if (!newText.trim()) {
      toast({ title: "Error", description: "Tag text is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("level_tags").insert({
      level_id: levelId,
      level_type: levelType,
      emoji: newEmoji || "🏷️",
      text: newText.trim(),
      show_on_card: newShowOnCard,
      show_on_page: newShowOnPage,
      display_order: tags.length,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add tag", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Tag added" });
      setNewEmoji("🏷️");
      setNewText("");
      setNewShowOnCard(true);
      setNewShowOnPage(true);
      fetchTags();
    }
    setSaving(false);
  };

  const updateTag = async (tag: LevelTag, updates: Partial<LevelTag>) => {
    const { error } = await supabase
      .from("level_tags")
      .update(updates)
      .eq("id", tag.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update tag", variant: "destructive" });
    } else {
      fetchTags();
    }
  };

  const deleteTag = async (tagId: string) => {
    const { error } = await supabase
      .from("level_tags")
      .delete()
      .eq("id", tagId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete tag", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Tag removed" });
      fetchTags();
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold">Level Tags</h3>
      </div>

      {/* Existing Tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
              <Input
                value={tag.emoji}
                onChange={(e) => updateTag(tag, { emoji: e.target.value })}
                className="w-14 h-8 text-center bg-card border-border"
                maxLength={4}
              />
              <Input
                value={tag.text}
                onChange={(e) => updateTag(tag, { text: e.target.value })}
                className="flex-1 h-8 bg-card border-border"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-1 cursor-pointer">
                  <Switch
                    checked={tag.show_on_card}
                    onCheckedChange={(checked) => updateTag(tag, { show_on_card: checked })}
                    className="scale-75"
                  />
                  <span>Card</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <Switch
                    checked={tag.show_on_page}
                    onCheckedChange={(checked) => updateTag(tag, { show_on_page: checked })}
                    className="scale-75"
                  />
                  <span>Page</span>
                </label>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => deleteTag(tag.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Tag */}
      <div className="border border-dashed border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="🏷️"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            className="w-14 h-8 text-center bg-card border-border"
            maxLength={4}
          />
          <Input
            placeholder="Tag text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 h-8 bg-card border-border"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <label className="flex items-center gap-1 cursor-pointer">
              <Switch
                checked={newShowOnCard}
                onCheckedChange={setNewShowOnCard}
                className="scale-75"
              />
              <span>Show on card</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <Switch
                checked={newShowOnPage}
                onCheckedChange={setNewShowOnPage}
                className="scale-75"
              />
              <span>Show on page</span>
            </label>
          </div>
          <Button
            size="sm"
            onClick={addTag}
            disabled={saving || !newText.trim()}
            className="gap-1"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Tag
          </Button>
        </div>
      </div>

      {tags.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No tags yet. Add tags to highlight special attributes of this level.
        </p>
      )}
    </div>
  );
}
