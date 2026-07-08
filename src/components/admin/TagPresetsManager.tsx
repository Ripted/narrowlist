import { useState } from "react";
import { useTagPresets, TagPreset } from "@/hooks/useTagPresets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Plus, Trash2, Save } from "lucide-react";

export function TagPresetsManager() {
  const { presets, isLoading, addPreset, updatePreset, deletePreset } = useTagPresets();
  const [newEmoji, setNewEmoji] = useState("🏷️");
  const [newText, setNewText] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editing, setEditing] = useState<Record<string, { emoji: string; text: string; description: string | null }>>({});

  const startEdit = (p: TagPreset) => {
    setEditing((s) => ({ ...s, [p.id]: { emoji: p.emoji, text: p.text, description: p.description } }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card border border-border p-4 md:p-6">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Add Tag Preset
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_2fr_auto] gap-3 items-end">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Emoji</Label>
            <Input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="bg-secondary border-border text-center" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>
            <Input placeholder="FAST-PACED" value={newText} onChange={(e) => setNewText(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Description (optional)</Label>
            <Input placeholder="What the tag means" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="bg-secondary border-border" />
          </div>
          <Button
            onClick={() => {
              if (!newText.trim()) return;
              addPreset.mutate(
                { emoji: newEmoji || "🏷️", text: newText.trim(), description: newDesc.trim() || undefined },
                { onSuccess: () => { setNewEmoji("🏷️"); setNewText(""); setNewDesc(""); } }
              );
            }}
            disabled={!newText.trim() || addPreset.isPending}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Tag Presets
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">{presets.length}</span>
          </h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : presets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No tag presets yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {presets.map((p) => {
              const draft = editing[p.id];
              return (
                <div key={p.id} className="p-4 grid grid-cols-1 md:grid-cols-[80px_1fr_2fr_auto] gap-3 items-center">
                  {draft ? (
                    <>
                      <Input value={draft.emoji} onChange={(e) => setEditing((s) => ({ ...s, [p.id]: { ...draft, emoji: e.target.value } }))} className="bg-secondary border-border text-center" />
                      <Input value={draft.text} onChange={(e) => setEditing((s) => ({ ...s, [p.id]: { ...draft, text: e.target.value } }))} className="bg-secondary border-border" />
                      <Input value={draft.description || ""} onChange={(e) => setEditing((s) => ({ ...s, [p.id]: { ...draft, description: e.target.value } }))} className="bg-secondary border-border" />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            updatePreset.mutate(
                              { id: p.id, emoji: draft.emoji, text: draft.text, description: draft.description },
                              { onSuccess: () => setEditing((s) => { const { [p.id]: _, ...rest } = s; return rest; }) }
                            );
                          }}
                          className="gap-1"
                        >
                          <Save className="w-4 h-4" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing((s) => { const { [p.id]: _, ...rest } = s; return rest; })}>Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl text-center">{p.emoji}</div>
                      <div className="font-medium text-foreground truncate">{p.text}</div>
                      <div className="text-sm text-muted-foreground truncate">{p.description || "—"}</div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/50 hover:bg-destructive/10 gap-1"
                          onClick={() => {
                            if (confirm(`Delete tag preset "${p.text}"?`)) deletePreset.mutate(p.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
