import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Hammer, Loader2, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function CreatorPointsConfigPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mainMult, setMainMult] = useState("1");
  const [extraFlat, setExtraFlat] = useState("1");
  const [unrated, setUnrated] = useState("5");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("creator_points_config" as any)
        .select("main_rating_multiplier, extra_flat_points, default_unrated_rating")
        .maybeSingle();
      if (data) {
        setMainMult(String((data as any).main_rating_multiplier ?? 1));
        setExtraFlat(String((data as any).extra_flat_points ?? 1));
        setUnrated(String((data as any).default_unrated_rating ?? 5));
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = {
      id: true,
      main_rating_multiplier: Number(mainMult) || 0,
      extra_flat_points: Number(extraFlat) || 0,
      default_unrated_rating: Number(unrated) || 0,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("creator_points_config" as any).upsert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: "Creator point formula updated." });
    qc.invalidateQueries({ queryKey: ["creator-points-config"] });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-secondary/30">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Hammer className="w-5 h-5 text-primary" />
          Creator Points Formula
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Per main-list level: <span className="text-foreground">avg community rating × multiplier</span> (unrated levels treated as the default rating).
          Per extra-list level: flat points.
        </p>
      </div>
      <div className="p-4 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Main list rating multiplier</Label>
          <Input type="number" step="0.1" value={mainMult} onChange={(e) => setMainMult(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">Default 1 → 1 point per rating star.</p>
        </div>
        <div className="space-y-2">
          <Label>Extra list flat points</Label>
          <Input type="number" step="0.1" value={extraFlat} onChange={(e) => setExtraFlat(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">Each extra-list level grants this much.</p>
        </div>
        <div className="space-y-2">
          <Label>Default rating for unrated levels</Label>
          <Input type="number" step="0.1" min="0" max="10" value={unrated} onChange={(e) => setUnrated(e.target.value)} />
          <p className="text-[11px] text-muted-foreground">Used when a level has 0 ratings. Keep at 5 for neutral.</p>
        </div>
      </div>
      <div className="p-4 border-t border-border flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </div>
    </div>
  );
}
