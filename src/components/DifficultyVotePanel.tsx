import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { BarChart2, Lock, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useDifficultyVotes,
  useSubmitDifficulty,
  useDeleteDifficultyVote,
  formatDifficulty,
  averageDifficulty,
} from "@/hooks/useDifficultyVotes";
import { useUserCanRateLevel } from "@/hooks/useLevelRatings";

interface Props {
  levelDbId: string;
  levelType: "main" | "extra";
}

const TIER_INFO = [
  { d: 8, label: "D8 — Robot/macro only (e.g. Lifeless)" },
  { d: 7, label: "D7 — Forever human skill cap" },
  { d: 6, label: "D6 — Above current skill cap" },
  { d: 5, label: "D5 — Current skill cap (e.g. TapTapDash)" },
  { d: 4, label: "D4 — Tops take a long time" },
  { d: 3, label: "D3 — Tops beat semi-fast (e.g. Detour)" },
  { d: 2, label: "D2 — Semi-new players need to learn" },
  { d: 1, label: "D1 — Beginner hard map (e.g. RitF)" },
  { d: 0, label: "D0 — Possible to die, low room for error" },
];

export function DifficultyVotePanel({ levelDbId, levelType }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: votes = [], isLoading } = useDifficultyVotes(levelDbId);
  const { data: canRate = false } = useUserCanRateLevel(levelDbId, levelType);
  const [isAdmin, setIsAdmin] = useState(false);
  const submit = useSubmitDifficulty(levelDbId, levelType);
  const del = useDeleteDifficultyVote(levelDbId);

  const myVote = useMemo(() => (user ? votes.find((v) => v.user_id === user.id) : undefined), [votes, user]);
  const [val, setVal] = useState<number>(3);
  const [usernames, setUsernames] = useState<Map<string, string>>(new Map());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (myVote) setVal(Number(myVote.difficulty));
  }, [myVote]);

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    if (!showAll || votes.length === 0) return;
    const ids = Array.from(new Set(votes.map((v) => v.user_id)));
    supabase
      .from("profiles")
      .select("user_id, username, display_name")
      .in("user_id", ids)
      .then(({ data }) => {
        if (!data) return;
        const m = new Map<string, string>();
        for (const p of data) {
          if (p.user_id) m.set(p.user_id, p.display_name || p.username);
        }
        setUsernames(m);
      });
  }, [showAll, votes]);

  // Build histogram bins per integer tier (0..8) — votes in [d, d+1) go in bin d, except 8 which is [8,8]
  const histogram = useMemo(() => {
    const bins = Array(9).fill(0);
    for (const v of votes) {
      const d = Number(v.difficulty);
      const bin = d >= 8 ? 8 : Math.floor(d);
      if (bin >= 0 && bin <= 8) bins[bin] += 1;
    }
    return bins;
  }, [votes]);

  const max = Math.max(1, ...histogram);
  const avg = averageDifficulty(votes);
  const eligible = canRate || isAdmin;

  const handleSubmit = async () => {
    try {
      // round to 0.1
      const rounded = Math.round(val * 10) / 10;
      await submit.mutateAsync({ id: myVote?.id, difficulty: rounded });
      toast({ title: myVote ? "Difficulty updated" : "Difficulty submitted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast({ title: "Vote removed" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-lg bg-card border border-border p-4 sm:p-6 space-y-5">
      <div>
        <h3 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Community Difficulty Tier
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {votes.length > 0
            ? `${votes.length} ${votes.length === 1 ? "vote" : "votes"} · Avg ${avg !== null ? formatDifficulty(avg) : "—"}`
            : "No difficulty votes yet."}{" "}
          Voting does not affect the official rank.
        </p>
      </div>

      {/* Histogram D0..D8 */}
      <div className="space-y-1.5">
        {[8, 7, 6, 5, 4, 3, 2, 1, 0].map((d) => (
          <div key={d} className="flex items-center gap-2 text-xs">
            <span className="w-8 font-mono font-bold text-foreground">D{d}</span>
            <div className="flex-1 h-4 rounded bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/60 to-primary"
                style={{ width: `${(histogram[d] / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-muted-foreground">{histogram[d]}</span>
          </div>
        ))}
      </div>

      {/* Voting */}
      <div className="border-t border-border pt-4">
        {!user ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Sign in to vote on difficulty.
          </div>
        ) : !eligible ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Beat this level to vote on difficulty.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{myVote ? "Update your tier vote" : "Your tier vote"}</Label>
              <span className="font-mono font-bold text-primary">{formatDifficulty(val)}</span>
            </div>
            <Slider
              min={0}
              max={8}
              step={0.1}
              value={[val]}
              onValueChange={(v) => setVal(v[0])}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submit.isPending} className="flex-1">
                {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : myVote ? "Update Vote" : "Submit Vote"}
              </Button>
              {myVote && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(myVote.id)}
                  className="text-destructive hover:text-destructive"
                  disabled={del.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tier reference */}
      <details className="border-t border-border pt-3">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          What do D0–D8 mean?
        </summary>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {TIER_INFO.map((t) => (
            <li key={t.d}>
              <span className="font-mono font-bold text-foreground">D{t.d}</span> — {t.label.split("— ")[1]}
            </li>
          ))}
          <li className="italic mt-2">Decimals like D6.5 fall between two tiers.</li>
        </ul>
      </details>

      {/* All votes */}
      {votes.length > 0 && (
        <div className="border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((s) => !s)}
            className="w-full justify-between"
          >
            <span>All votes ({votes.length})</span>
            <span>{showAll ? "▲" : "▼"}</span>
          </Button>
          {showAll && (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                votes
                  .slice()
                  .sort((a, b) => Number(b.difficulty) - Number(a.difficulty))
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-secondary/40 text-xs"
                    >
                      <span className="truncate">
                        {usernames.get(v.user_id) || "Unknown"}
                        {user && v.user_id === user.id && (
                          <span className="text-muted-foreground"> (you)</span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {formatDifficulty(Number(v.difficulty))}
                      </span>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => handleDelete(v.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
