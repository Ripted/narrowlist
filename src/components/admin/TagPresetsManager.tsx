import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTagPresets, TagPreset } from "@/hooks/useTagPresets";
import { Plus, Trash2, Tag, Loader2, Edit2, Check, X } from "lucide-react";

export function TagPresetsManager() {
  const { presets, isLoading, addPreset, updatePreset, deletePreset } = useTagPresets();
  const [newEmoji, setNewEmoji] = useState("🏷️");
  const [newText, setNewText] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmoji, setEditEmoji] = useState("");
  const [editText, setEditText] = useState("");

  const handleAdd = () => {
    if (!newText.trim()) return;
    addPreset.mutate(
      { emoji: newEmoji || "🏷️", text: newText.trim(), description: newDescription.trim() || undefined },
      {
        onSuccess: () => {
          setNewEmoji("🏷️");
          setNewText("");
          setNewDescription("");
        },
      }
    );
  };

  const startEditing = (preset: TagPreset) => {
    setEditingId(preset.id);
    setEditEmoji(preset.emoji);
    setEditText(preset.text);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return;
    updatePreset.mutate(
      { id: editingId, emoji: editEmoji || "🏷️", text: editText.trim() },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEmoji("");
    setEditText("");
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Tag Presets</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Create reusable tag presets that can be quickly assigned to levels. These presets will appear when editing any level's tags.
      </p>

      {/* Existing Presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg border border-border"
            >
              {editingId === preset.id ? (
                <>
                  <Input
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    className="w-14 h-8 text-center bg-card border-border"
                    maxLength={4}
                  />
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 h-8 bg-card border-border"
                  />
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={saveEdit}>
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xl w-8 text-center">{preset.emoji}</span>
                  <span className="flex-1 font-medium">{preset.text}</span>
                  {preset.description && (
                    <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {preset.description}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => startEditing(preset)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deletePreset.mutate(preset.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Preset */}
      <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
        <Label className="text-sm font-medium">Add New Preset</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="🏷️"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            className="w-14 h-9 text-center bg-card border-border"
            maxLength={4}
          />
          <Input
            placeholder="Tag name..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 h-9 bg-card border-border"
          />
        </div>
        <Input
          placeholder="Description (optional)..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="h-9 bg-card border-border"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={addPreset.isPending || !newText.trim()}
          className="gap-1"
        >
          {addPreset.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add Preset
        </Button>
      </div>

      {presets.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No tag presets yet. Create presets to quickly apply common tags to levels.
        </p>
      )}
    </div>
  );
}
