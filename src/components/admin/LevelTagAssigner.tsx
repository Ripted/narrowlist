import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTagPresets, TagPreset } from "@/hooks/useTagPresets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface LevelTagAssignerProps {
  levelId: string;
  levelType: "main" | "future" | "extra";
  onClose?: () => void;
}

export function LevelTagAssigner({ levelId, levelType, onClose }: LevelTagAssignerProps) {
  const { toast } = useToast();
  const { presets, isLoading: presetsLoading } = useTagPresets();
  const [tags, setTags] = useState<LevelTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New tag form
  const [selectedPreset, setSelectedPreset] = useState<string>("");
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

  const assignTag = async () => {
    const preset = presets.find(p => p.id === selectedPreset);
    if (!preset) {
      toast({ title: "Error", description: "Please select a tag preset", variant: "destructive" });
      return;
    }

    // Check if tag already exists on this level
    const existingTag = tags.find(t => t.emoji === preset.emoji && t.text === preset.text);
    if (existingTag) {
      toast({ title: "Already Added", description: "This tag is already on this level", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("level_tags").insert({
      level_id: levelId,
      level_type: levelType,
      emoji: preset.emoji,
      text: preset.text,
      show_on_card: newShowOnCard,
      show_on_page: newShowOnPage,
      display_order: tags.length,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to assign tag", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Tag assigned" });
      setSelectedPreset("");
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

  const removeTag = async (tagId: string) => {
    const { error } = await supabase
      .from("level_tags")
      .delete()
      .eq("id", tagId);

    if (error) {
      toast({ title: "Error", description: "Failed to remove tag", variant: "destructive" });
    } else {
      toast({ title: "Removed", description: "Tag removed from level" });
      fetchTags();
    }
  };

  // Get available presets (not already assigned)
  const availablePresets = presets.filter(preset => 
    !tags.some(tag => tag.emoji === preset.emoji && tag.text === preset.text)
  );

  if (loading || presetsLoading) {
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

      {/* Assigned Tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Assigned Tags</p>
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
              <span className="text-lg w-8 text-center">{tag.emoji}</span>
              <span className="flex-1 font-medium text-sm">{tag.text}</span>
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
                onClick={() => removeTag(tag.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Assign New Tag from Preset */}
      {presets.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No tag presets available.
          </p>
          <p className="text-xs text-muted-foreground">
            Create presets in the Tag Presets Manager first.
          </p>
        </div>
      ) : availablePresets.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            All available tag presets have been assigned to this level.
          </p>
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-lg p-3 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Assign a tag preset</label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger className="h-9 bg-card border-border">
                <SelectValue placeholder="Select a preset..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availablePresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <span className="flex items-center gap-2">
                      <span>{preset.emoji}</span>
                      <span>{preset.text}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              onClick={assignTag}
              disabled={saving || !selectedPreset}
              className="gap-1"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Assign
            </Button>
          </div>
        </div>
      )}

      {tags.length === 0 && presets.length > 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No tags assigned yet. Select from presets above to highlight special attributes.
        </p>
      )}
    </div>
  );
}