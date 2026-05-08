import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Plus, Trash2, Send, Eye, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { extractLevelId } from "@/lib/extractLevelId";

interface HtsRound {
  id: string;
  round_name: string;
  level_ids: string[];
  player_usernames: string[];
  qualify_limit: number;
  webhook_url: string;
  enabled: boolean;
  last_posted_at: string | null;
  last_payload: any;
}

interface Edits {
  round_name?: string;
  level_ids_text?: string;
  player_usernames_text?: string;
  qualify_limit?: number;
  webhook_url?: string;
}

export const HtsCupManager = () => {
  const [rounds, setRounds] = useState<HtsRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, Edits>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [newName, setNewName] = useState("");

  const fetchRounds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hts_cup_rounds")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRounds((data || []) as HtsRound[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRounds(); }, []);

  const createRound = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("hts_cup_rounds").insert({
      round_name: newName.trim(),
      level_ids: [],
      player_usernames: [],
      qualify_limit: 3,
      webhook_url: "",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewName("");
    fetchRounds();
  };

  const deleteRound = async (id: string) => {
    if (!confirm("Delete this round?")) return;
    const { error } = await supabase.from("hts_cup_rounds").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchRounds();
  };

  const toggleEnabled = async (round: HtsRound) => {
    const { error } = await supabase
      .from("hts_cup_rounds")
      .update({ enabled: !round.enabled })
      .eq("id", round.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchRounds();
  };

  const saveEdits = async (round: HtsRound) => {
    const e = edits[round.id];
    if (!e) return;
    const update: any = {};
    if (e.round_name !== undefined) update.round_name = e.round_name.trim();
    if (e.webhook_url !== undefined) update.webhook_url = e.webhook_url.trim();
    if (e.qualify_limit !== undefined) update.qualify_limit = Math.max(1, Number(e.qualify_limit) || 1);
    if (e.level_ids_text !== undefined) {
      update.level_ids = e.level_ids_text
        .split(/[\n,]/)
        .map((s) => extractLevelId(s))
        .filter(Boolean);
    }
    if (e.player_usernames_text !== undefined) {
      update.player_usernames = e.player_usernames_text
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    setBusyId(round.id);
    const { error } = await supabase.from("hts_cup_rounds").update(update).eq("id", round.id);
    setBusyId(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Round updated" });
      setEdits((prev) => { const n = { ...prev }; delete n[round.id]; return n; });
      fetchRounds();
    }
  };

  const runCheck = async (round: HtsRound, dryRun: boolean) => {
    setBusyId(round.id);
    setPreviewData(null);
    try {
      const { data, error } = await supabase.functions.invoke("hts-cup-check", {
        body: { round_id: round.id, dry_run: dryRun },
      });
      if (error) throw error;
      if ((data as any).error) throw new Error((data as any).error);
      if (dryRun) {
        setPreviewId(round.id);
        setPreviewData(data);
      } else {
        toast({ title: "Posted!", description: "Sent to Discord" });
        fetchRounds();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || String(e), variant: "destructive" });
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-display font-bold">HTS Cup Tracker</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Track specific players' completions on specific levels. Top N by best time qualify; the rest are eliminated.
          Hit "Post to Discord" to publish current standings.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="New round name (e.g., Round 3 - Emerald Rally)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={createRound} disabled={!newName.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Create
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading…</div>
      ) : rounds.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No rounds yet</div>
      ) : (
        rounds.map((round) => {
          const e = edits[round.id] || {};
          const levelText = e.level_ids_text ?? round.level_ids.join("\n");
          const playerText = e.player_usernames_text ?? round.player_usernames.join("\n");
          const qLimit = e.qualify_limit ?? round.qualify_limit;
          const url = e.webhook_url ?? round.webhook_url;
          const name = e.round_name ?? round.round_name;
          const dirty = !!edits[round.id];
          return (
            <div key={round.id} className="rounded-lg bg-card border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    value={name}
                    onChange={(ev) => setEdits((p) => ({ ...p, [round.id]: { ...p[round.id], round_name: ev.target.value } }))}
                    className="font-display text-base font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${round.enabled ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}>
                    {round.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => toggleEnabled(round)}>
                    {round.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteRound(round.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Level IDs (one per line — links work too)</Label>
                  <Textarea
                    value={levelText}
                    onChange={(ev) => setEdits((p) => ({ ...p, [round.id]: { ...p[round.id], level_ids_text: ev.target.value } }))}
                    placeholder="1778255582064&#10;https://narrowarrow.xyz/levelid=1234567890"
                    className="min-h-[120px] font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Player usernames (one per line)</Label>
                  <Textarea
                    value={playerText}
                    onChange={(ev) => setEdits((p) => ({ ...p, [round.id]: { ...p[round.id], player_usernames_text: ev.target.value } }))}
                    placeholder="Aqprox&#10;Penguin&#10;Ripted"
                    className="min-h-[120px] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Qualify limit</Label>
                  <Input
                    type="number"
                    min={1}
                    value={qLimit}
                    onChange={(ev) => setEdits((p) => ({ ...p, [round.id]: { ...p[round.id], qualify_limit: Number(ev.target.value) } }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Discord Webhook URL</Label>
                  <Input
                    value={url}
                    onChange={(ev) => setEdits((p) => ({ ...p, [round.id]: { ...p[round.id], webhook_url: ev.target.value } }))}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {round.last_posted_at ? `Last posted ${new Date(round.last_posted_at).toLocaleString()}` : "Never posted"}
                </div>
                <div className="flex gap-2">
                  {dirty && (
                    <Button size="sm" onClick={() => saveEdits(round)} disabled={busyId === round.id}>
                      Save Changes
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => runCheck(round, true)} disabled={busyId === round.id}>
                    {busyId === round.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />} Preview
                  </Button>
                  <Button size="sm" onClick={() => runCheck(round, false)} disabled={busyId === round.id || !round.webhook_url || dirty}>
                    <Send className="w-4 h-4 mr-1" /> Post to Discord
                  </Button>
                </div>
              </div>

              {previewId === round.id && previewData && (
                <div className="mt-3 p-3 bg-secondary/40 rounded border border-border">
                  <div className="text-xs font-semibold mb-2">Preview</div>
                  <div className="space-y-1 text-sm">
                    <div className="font-bold">✅ Qualified ({(previewData.qualifiers || []).length})</div>
                    {(previewData.qualifiers || []).map((q: any, i: number) => (
                      <div key={q.username} className="font-mono text-xs">
                        {["🥇","🥈","🥉"][i] || `#${i+1}`} {q.username} — {Number(q.time).toFixed(3)}s
                      </div>
                    ))}
                    <div className="font-bold mt-2">❌ Eliminated</div>
                    <div className="text-xs text-muted-foreground">
                      {(previewData.eliminated || []).join(", ") || "None"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
