import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tags, Lock, Loader2, Plus, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTagPresets } from "@/hooks/useTagPresets";
import {
  useLevelTagVotes,
  useToggleTagVote,
  useAdminDeleteTagVote,
} from "@/hooks/useLevelTagVotes";
import { useUserCanRateLevel } from "@/hooks/useLevelRatings";

interface Props {
  levelDbId: string;
  levelType: "main" | "extra";
}

export function CommunityTagsPanel({ levelDbId, levelType }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { presets, isLoading: presetsLoading } = useTagPresets();
  const { data: votes = [], isLoading: votesLoading } = useLevelTagVotes(levelDbId);
  const { data: canRate = false } = useUserCanRateLevel(levelDbId, levelType);
  const [isAdmin, setIsAdmin] = useState(false);
  const toggle = useToggleTagVote(levelDbId, levelType);
  const adminDelete = useAdminDeleteTagVote(levelDbId);

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  // Aggregate votes per preset
  const counts = useMemo(() => {
    const map = new Map<string, { count: number; myVoteId?: string }>();
    for (const v of votes) {
      const cur = map.get(v.preset_id) || { count: 0 };
      cur.count += 1;
      if (user && v.user_id === user.id) cur.myVoteId = v.id;
      map.set(v.preset_id, cur);
    }
    return map;
  }, [votes, user]);

  // Sort presets: voted first, then by count desc, then alpha
  const sortedPresets = useMemo(() => {
    return [...presets].sort((a, b) => {
      const ca = counts.get(a.id)?.count || 0;
      const cb = counts.get(b.id)?.count || 0;
      if (cb !== ca) return cb - ca;
      return a.text.localeCompare(b.text);
    });
  }, [presets, counts]);

  const eligible = canRate || isAdmin;

  const handleToggle = async (presetId: string, existingVoteId?: string) => {
    try {
      await toggle.mutateAsync({ presetId, existingVoteId });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (presetsLoading || votesLoading) {
    return (
      <div className="rounded-lg bg-card border border-border p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card border border-border p-4 sm:p-6 space-y-4">
      <div>
        <h3 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2">
          <Tags className="w-5 h-5 text-primary" />
          Community Tags
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Players who beat this level can vote on which tags fit. Separate from admin-set tags.
        </p>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tag presets available yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedPresets.map((p) => {
            const info = counts.get(p.id);
            const count = info?.count || 0;
            const mine = !!info?.myVoteId;
            return (
              <button
                key={p.id}
                disabled={!eligible || toggle.isPending}
                onClick={() => handleToggle(p.id, info?.myVoteId)}
                title={
                  eligible
                    ? mine
                      ? "Remove your vote"
                      : "Vote for this tag"
                    : "Beat this level to vote"
                }
                className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  mine
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-secondary/50 border-border text-foreground hover:border-primary/50"
                } ${!eligible ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span className="text-base leading-none">{p.emoji}</span>
                <span>{p.text}</span>
                <span className="ml-1 font-mono bg-background/60 px-1.5 py-0.5 rounded text-[10px]">
                  {count}
                </span>
                {mine && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      )}

      {!user ? (
        <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t border-border">
          <Lock className="w-3 h-3" />
          Sign in and beat this level to vote on tags.
        </div>
      ) : !eligible ? (
        <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2 border-t border-border">
          <Lock className="w-3 h-3" />
          Beat this level to vote on tags.
        </div>
      ) : (
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          Click a tag to vote. Click again to remove your vote.
        </div>
      )}

      {isAdmin && votes.length > 0 && (
        <details className="pt-2 border-t border-border">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Admin: manage individual votes ({votes.length})
          </summary>
          <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
            {votes.map((v) => {
              const preset = presets.find((p) => p.id === v.preset_id);
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-2 text-xs p-1.5 rounded bg-secondary/40"
                >
                  <span className="truncate">
                    {preset?.emoji} {preset?.text || "(removed)"} —{" "}
                    <span className="font-mono text-muted-foreground">
                      {v.user_id.slice(0, 8)}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => adminDelete.mutate(v.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
