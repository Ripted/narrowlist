import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useLevels } from "@/hooks/useLevels";
import {
  useAllRatingsAggregate,
  useAllDifficultyAggregate,
} from "@/hooks/useLevelAggregates";
import { useAllLevelTagVotes } from "@/hooks/useLevelTagVotes";
import { useUserCompletions } from "@/hooks/useUserCompletions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Star,
  Gauge,
  Tags,
  ArrowRight,
  Lock,
  CheckCircle2,
} from "lucide-react";

function useMyVotedLevels() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-voted-levels", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const result = {
        ratings: new Set<string>(),
        difficulty: new Set<string>(),
        tags: new Set<string>(),
      };
      if (!user) return result;
      const [r, d, t] = await Promise.all([
        supabase.from("level_ratings").select("level_id").eq("user_id", user.id),
        supabase
          .from("level_difficulty_votes")
          .select("level_id")
          .eq("user_id", user.id),
        supabase.from("level_tag_votes").select("level_id").eq("user_id", user.id),
      ]);
      r.data?.forEach((x: any) => result.ratings.add(x.level_id));
      d.data?.forEach((x: any) => result.difficulty.add(x.level_id));
      t.data?.forEach((x: any) => result.tags.add(x.level_id));
      return result;
    },
  });
}

export default function HelpImprovePage() {
  const { user } = useAuth();
  const { levels, loading } = useLevels();
  const { data: ratingsAgg } = useAllRatingsAggregate();
  const { data: difficultyAgg } = useAllDifficultyAggregate();
  const { data: tagVotes } = useAllLevelTagVotes();
  const { completedLevelIds } = useUserCompletions();
  const { data: myVotes } = useMyVotedLevels();

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of tagVotes || []) m.set(v.level_id, (m.get(v.level_id) || 0) + 1);
    return m;
  }, [tagVotes]);

  const sortByCount = (getCount: (dbId: string) => number) =>
    [...levels]
      .map((l) => ({ level: l, count: getCount(l.dbId || "") }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 30);

  const needsRatings = useMemo(
    () => sortByCount((id) => (ratingsAgg as any)?.get(id)?.count || 0),
    [levels, ratingsAgg]
  );
  const needsDifficulty = useMemo(
    () => sortByCount((id) => (difficultyAgg as any)?.get(id)?.count || 0),
    [levels, difficultyAgg]
  );
  const needsTags = useMemo(
    () => sortByCount((id) => tagCounts.get(id) || 0),
    [levels, tagCounts]
  );

  // Levels you've beaten but haven't voted on
  const beatenButNotVoted = useMemo(() => {
    if (!user) return [];
    const items: { level: any; missing: string[] }[] = [];
    for (const l of levels) {
      if (!completedLevelIds.has(l.levelInfo.level_id)) continue;
      const dbId = l.dbId || "";
      const missing: string[] = [];
      if (!myVotes?.ratings.has(dbId)) missing.push("rating");
      if (!myVotes?.difficulty.has(dbId)) missing.push("difficulty");
      if (!myVotes?.tags.has(dbId)) missing.push("tags");
      if (missing.length > 0) items.push({ level: l, missing });
    }
    return items.sort((a, b) => b.missing.length - a.missing.length).slice(0, 50);
  }, [levels, completedLevelIds, myVotes, user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> Community
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold gradient-text mb-2">
            Help us improve Narrowlist
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            These levels need your input. Drop a rating, difficulty vote, or tag —
            it keeps the list fair for everyone.
          </p>
          {!user && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" /> Sign in and link your profile to vote.
            </div>
          )}
        </div>

        {loading ? (
          <div className="h-40 rounded-xl bg-card border border-border animate-pulse" />
        ) : (
          <div className="space-y-6">
            {user && (
              <Section
                title="Levels you've beaten but haven't voted on"
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                items={beatenButNotVoted.map((b) => ({
                  level: b.level,
                  count: b.missing.length,
                }))}
                metricLabel="missing"
                emptyText="You've voted on every level you've beaten. Nice work!"
                highlightHigh
              />
            )}
            <div className="grid lg:grid-cols-3 gap-6">
              <Section
                title="Need ratings"
                icon={<Star className="w-5 h-5 text-accent" />}
                items={needsRatings}
                metricLabel="ratings"
              />
              <Section
                title="Need difficulty votes"
                icon={<Gauge className="w-5 h-5 text-primary" />}
                items={needsDifficulty}
                metricLabel="votes"
              />
              <Section
                title="Need tag votes"
                icon={<Tags className="w-5 h-5 text-theme-tertiary" />}
                items={needsTags}
                metricLabel="tags"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  items: { level: any; count: number }[];
  metricLabel: string;
  emptyText?: string;
  highlightHigh?: boolean;
}

function Section({
  title,
  icon,
  items,
  metricLabel,
  emptyText,
  highlightHigh,
}: SectionProps) {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden shadow-card animate-fade-in">
      <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-2">
        {icon}
        <h2 className="font-display font-bold">{title}</h2>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          {emptyText || "Nothing here right now."}
        </div>
      ) : (
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto scrollbar-thin">
          {items.map(({ level, count }) => {
            const linkId =
              level.levelInfo?.level_id || level.level_id || level.dbId;
            return (
              <Link
                key={level.dbId || linkId}
                to={`/level/${linkId}`}
                className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-all duration-200 group hover-scale"
              >
                <span className="font-display font-bold text-muted-foreground w-10 text-center text-sm">
                  #{level.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate group-hover:text-primary transition-colors">
                    {level.levelInfo?.name || level.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {level.levelInfo?.author || level.author}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-mono font-bold text-sm ${
                      highlightHigh
                        ? count > 0
                          ? "text-amber-400"
                          : "text-muted-foreground"
                        : count === 0
                          ? "text-destructive"
                          : "text-foreground"
                    }`}
                  >
                    {count}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {metricLabel}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
