import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Tag, Loader2, Search, X, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Level {
  id: string;
  name: string | null;
  level_id: string;
  rank_position: number;
}

interface BulkTagManagerProps {
  onClose: () => void;
}

export function BulkTagManager({ onClose }: BulkTagManagerProps) {
  const { toast } = useToast();
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelIds, setSelectedLevelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelType, setLevelType] = useState<"main" | "future" | "extra">("main");
  
  // Tag form
  const [emoji, setEmoji] = useState("🏷️");
  const [text, setText] = useState("");
  const [showOnCard, setShowOnCard] = useState(true);
  const [showOnPage, setShowOnPage] = useState(true);

  useEffect(() => {
    fetchLevels();
  }, [levelType]);

  const fetchLevels = async () => {
    setLoading(true);
    setSelectedLevelIds(new Set());
    
    const table = levelType === "main" ? "levels" : levelType === "future" ? "future_levels" : "extended_levels";
    
    const { data, error } = await supabase
      .from(table)
      .select("id, name, level_id, rank_position")
      .order("rank_position");
    
    if (error) {
      toast({ title: "Error", description: "Failed to load levels", variant: "destructive" });
    } else {
      setLevels((data as Level[]) || []);
    }
    setLoading(false);
  };

  const toggleLevel = (levelId: string) => {
    setSelectedLevelIds(prev => {
      const next = new Set(prev);
      if (next.has(levelId)) {
        next.delete(levelId);
      } else {
        next.add(levelId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const filtered = filteredLevels;
    if (selectedLevelIds.size === filtered.length) {
      setSelectedLevelIds(new Set());
    } else {
      setSelectedLevelIds(new Set(filtered.map(l => l.id)));
    }
  };

  const applyTags = async () => {
    if (!text.trim()) {
      toast({ title: "Error", description: "Tag text is required", variant: "destructive" });
      return;
    }
    
    if (selectedLevelIds.size === 0) {
      toast({ title: "Error", description: "Select at least one level", variant: "destructive" });
      return;
    }

    setApplying(true);
    let successCount = 0;
    let errorCount = 0;

    for (const levelId of selectedLevelIds) {
      const { error } = await supabase.from("level_tags").insert({
        level_id: levelId,
        level_type: levelType,
        emoji: emoji || "🏷️",
        text: text.trim(),
        show_on_card: showOnCard,
        show_on_page: showOnPage,
        display_order: 0,
      });

      if (error) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    if (errorCount > 0) {
      toast({ 
        title: "Partial Success", 
        description: `Applied to ${successCount} levels, ${errorCount} failed`,
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Success", 
        description: `Tag applied to ${successCount} levels` 
      });
      setText("");
      setSelectedLevelIds(new Set());
    }
    
    setApplying(false);
  };

  const filteredLevels = levels.filter(l => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.level_id.toLowerCase().includes(q) ||
      l.rank_position.toString().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Bulk Tag Manager
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
          {/* List Type Selection */}
          <div className="flex items-center gap-4">
            <Label>List Type:</Label>
            <Select value={levelType} onValueChange={(v) => setLevelType(v as typeof levelType)}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main List</SelectItem>
                <SelectItem value="future">Future List</SelectItem>
                <SelectItem value="extra">Extra List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Configuration */}
          <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
            <Label className="text-sm font-medium">Tag to Apply:</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="🏷️"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-14 h-9 text-center bg-secondary border-border"
                maxLength={4}
              />
              <Input
                placeholder="Tag text..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 h-9 bg-secondary border-border"
              />
            </div>
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={showOnCard} onCheckedChange={setShowOnCard} className="scale-90" />
                <span>Show on card</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={showOnPage} onCheckedChange={setShowOnPage} className="scale-90" />
                <span>Show on page</span>
              </label>
            </div>
          </div>

          {/* Search & Select All */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search levels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="gap-1"
            >
              {selectedLevelIds.size === filteredLevels.length && filteredLevels.length > 0 ? (
                <>
                  <X className="w-3 h-3" />
                  Deselect All
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  Select All
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {selectedLevelIds.size} selected
            </span>
          </div>

          {/* Level List */}
          <ScrollArea className="flex-1 rounded-lg border border-border">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLevels.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No matching levels found." : "No levels in this list."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLevels.map((level) => (
                  <label
                    key={level.id}
                    className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedLevelIds.has(level.id)}
                      onCheckedChange={() => toggleLevel(level.id)}
                    />
                    <span className="w-10 font-mono text-sm text-muted-foreground">
                      #{level.rank_position}
                    </span>
                    <span className="flex-1 truncate font-medium">
                      {level.name || level.level_id}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={applyTags}
            disabled={applying || selectedLevelIds.size === 0 || !text.trim()}
            className="gap-2"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Apply Tag to {selectedLevelIds.size} Levels
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
