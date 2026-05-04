import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useLevels } from "@/hooks/useLevels";
import { useAllRatingsAggregate, useAllDifficultyAggregate } from "@/hooks/useLevelAggregates";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Star, Gauge, ArrowRight, Lock } from "lucide-react";

export default function HelpImprovePage() {
  const { user } = useAuth();
  const { levels, loading } = useLevels();
  const { data: ratingsAgg } = useAllRatingsAggregate();
  const { data: difficultyAgg } = useAllDifficultyAggregate();

  const needsRatings = useMemo(() => {
    return [...levels]
      .map(l => ({ level: l, count: ratingsAgg?.get(l.dbId || "")?.count || 0 }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 30);
  }, [levels, ratingsAgg]);

  const needsDifficulty = useMemo(() => {
    return [...levels]
      .map(l => ({ level: l, count: difficultyAgg?.get(l.dbId || "")?.count || 0 }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 30);
  }, [levels, difficultyAgg]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Community
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text mb-2">
            Help us improve Narrowlist
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            These levels need your input. If you've beaten them, drop a rating or a difficulty vote — it
            keeps the list fair for everyone.
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
          <div className="grid lg:grid-cols-2 gap-6">
            <Section
              title="Levels needing ratings"
              icon={<Star className="w-5 h-5 text-accent" />}
              items={needsRatings}
              metricLabel="ratings"
            />
            <Section
              title="Levels needing difficulty votes"
              icon={<Gauge className="w-5 h-5 text-primary" />}
              items={needsDifficulty}
              metricLabel="votes"
            />
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
}

function Section({ title, icon, items, metricLabel }: SectionProps) {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-2">
        {icon}
        <h2 className="font-display font-bold">{title}</h2>
      </div>
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {items.map(({ level, count }) => (
          <Link
            key={level.dbId || level.level_id}
            to={`/level/${level.level_id}`}
            className="flex items-center gap-3 p-3 hover:bg-secondary/40 transition group"
          >
            <span className="font-display font-bold text-muted-foreground w-10 text-center">
              #{level.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{level.name}</div>
              <div className="text-xs text-muted-foreground truncate">{level.author}</div>
            </div>
            <div className="text-right">
              <div className={`font-mono font-bold text-sm ${count === 0 ? "text-destructive" : "text-foreground"}`}>
                {count}
              </div>
              <div className="text-[10px] text-muted-foreground">{metricLabel}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}
