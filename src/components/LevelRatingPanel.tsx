import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Star, Trash2, ChevronDown, ChevronUp, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useLevelRatings,
  useUserCanRateLevel,
  useSubmitRating,
  useDeleteRating,
  computeAverages,
  LevelRating,
  RatingCategory,
} from "@/hooks/useLevelRatings";

interface LevelRatingPanelProps {
  levelDbId: string;
  levelType: "main" | "extra";
}

const CATEGORIES: { key: RatingCategory; label: string }[] = [
  { key: "enjoyment", label: "Enjoyment" },
  { key: "design", label: "Design" },
  { key: "decoration", label: "Decoration" },
  { key: "gameplay", label: "Gameplay" },
];

export function LevelRatingPanel({ levelDbId, levelType }: LevelRatingPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: ratings = [], isLoading } = useLevelRatings(levelDbId);
  const { data: canRate = false } = useUserCanRateLevel(levelDbId, levelType);
  const [isAdmin, setIsAdmin] = useState(false);
  const submit = useSubmitRating(levelDbId, levelType);
  const del = useDeleteRating(levelDbId);

  const myRating = useMemo<LevelRating | undefined>(
    () => (user ? ratings.find((r) => r.user_id === user.id) : undefined),
    [ratings, user]
  );

  const [enjoyment, setEnjoyment] = useState(7);
  const [design, setDesign] = useState(7);
  const [decoration, setDecoration] = useState(7);
  const [gameplay, setGameplay] = useState(7);
  const [showAll, setShowAll] = useState(false);
  const [usernames, setUsernames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (myRating) {
      setEnjoyment(myRating.enjoyment);
      setDesign(myRating.design);
      setDecoration(myRating.decoration);
      setGameplay(myRating.gameplay);
    }
  }, [myRating]);

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  // Fetch usernames for all raters when showing the list
  useEffect(() => {
    if (!showAll || ratings.length === 0) return;
    const userIds = Array.from(new Set(ratings.map((r) => r.user_id)));
    supabase
      .from("profiles")
      .select("user_id, username, display_name")
      .in("user_id", userIds)
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<string, string>();
        for (const p of data) {
          if (p.user_id) map.set(p.user_id, p.display_name || p.username);
        }
        setUsernames(map);
      });
  }, [showAll, ratings]);

  const averages = useMemo(() => computeAverages(ratings), [ratings]);
  const eligibleToVote = canRate || isAdmin;

  const handleSubmit = async () => {
    try {
      await submit.mutateAsync({
        id: myRating?.id,
        enjoyment,
        design,
        decoration,
        gameplay,
      });
      toast({
        title: myRating ? "Rating updated" : "Rating submitted",
        description: "Thanks for rating this level!",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast({ title: "Rating removed" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-lg bg-card border border-border p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Community Ratings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {averages.count > 0
              ? `${averages.count} ${averages.count === 1 ? "vote" : "votes"} · Overall ${averages.overall.toFixed(1)}/10`
              : "No ratings yet — be the first."}
          </p>
        </div>
      </div>

      {/* Averages bars */}
      {averages.count > 0 && (
        <div className="space-y-3">
          {CATEGORIES.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-mono font-medium text-foreground">
                  {averages[c.key].toFixed(1)} / 10
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all"
                  style={{ width: `${(averages[c.key] / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Voting form */}
      <div className="border-t border-border pt-4">
        {!user ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Sign in to rate this level.
          </div>
        ) : !eligibleToVote ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Beat this level to leave a rating.
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">{myRating ? "Update your rating" : "Your rating"}</h4>
            {CATEGORIES.map((c) => {
              const value =
                c.key === "enjoyment"
                  ? enjoyment
                  : c.key === "design"
                  ? design
                  : c.key === "decoration"
                  ? decoration
                  : gameplay;
              const setter =
                c.key === "enjoyment"
                  ? setEnjoyment
                  : c.key === "design"
                  ? setDesign
                  : c.key === "decoration"
                  ? setDecoration
                  : setGameplay;
              return (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm">{c.label}</Label>
                    <span className="font-mono font-medium text-sm text-primary">{value}/10</span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[value]}
                    onValueChange={(v) => setter(v[0])}
                  />
                </div>
              );
            })}
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submit.isPending} className="flex-1">
                {submit.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : myRating ? (
                  "Update Rating"
                ) : (
                  "Submit Rating"
                )}
              </Button>
              {myRating && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(myRating.id)}
                  disabled={del.isPending}
                  className="text-destructive hover:text-destructive"
                  title="Remove your rating"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* All votes list */}
      {ratings.length > 0 && (
        <div className="border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((s) => !s)}
            className="w-full justify-between"
          >
            <span>All ratings ({ratings.length})</span>
            {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          {showAll && (
            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                ratings.map((r) => {
                  const overall = (r.enjoyment + r.design + r.decoration + r.gameplay) / 4;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/40 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">
                          {usernames.get(r.user_id) || "Unknown"}
                          {user && r.user_id === user.id && (
                            <span className="text-muted-foreground"> (you)</span>
                          )}
                        </div>
                        <div className="text-muted-foreground font-mono">
                          E {r.enjoyment} · D {r.design} · Dc {r.decoration} · G {r.gameplay}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-primary">
                        {overall.toFixed(1)}
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(r.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="Admin: remove this rating"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
