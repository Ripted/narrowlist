import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { computeJamScores, JamCollaborator, JamRating, JamSubmission } from "@/hooks/useJam";
import { JAM_RATING_CATEGORIES, JamRatingCategory } from "@/config/events";
import { cn } from "@/lib/utils";

interface JamResultsProps {
  submissions: JamSubmission[];
  ratings: JamRating[];
  collaborators: JamCollaborator[];
  jamSlug: string;
}

interface RankedEntry {
  submission: JamSubmission;
  collaborators: JamCollaborator[];
  enjoyment: number;
  creativity: number;
  design: number;
  overall: number;
  count: number;
}

export function JamResults({ submissions, ratings, collaborators, jamSlug }: JamResultsProps) {
  const [category, setCategory] = useState<"overall" | JamRatingCategory>("overall");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ranked = useMemo<RankedEntry[]>(() => {
    const scores = computeJamScores(ratings);
    return submissions
      .map((submission) => {
        const s = scores.get(submission.id);
        return {
          submission,
          collaborators: collaborators.filter((c) => c.submission_id === submission.id),
          enjoyment: s?.enjoyment ?? 0,
          creativity: s?.creativity ?? 0,
          design: s?.design ?? 0,
          overall: s?.overall ?? 0,
          count: s?.count ?? 0,
        };
      })
      .sort((a, b) => b[category] - a[category] || b.count - a.count);
  }, [submissions, ratings, collaborators, category]);

  if (ratings.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/60 border-border/60">
        <Trophy className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">No ratings were given, so there are no results to show.</p>
      </Card>
    );
  }

  return (
    <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
      <TabsList>
        <TabsTrigger value="overall">Overall</TabsTrigger>
        {JAM_RATING_CATEGORIES.map((c) => (
          <TabsTrigger key={c.key} value={c.key}>
            {c.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={category} className="mt-4">
        <Card className="overflow-hidden bg-card/60 border-border/60">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium w-14">Rank</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium text-right">Enjoyment</th>
                <th className="px-4 py-3 font-medium text-right">Creativity</th>
                <th className="px-4 py-3 font-medium text-right">Design</th>
                <th className="px-4 py-3 font-medium text-right">Overall</th>
                <th className="px-4 py-3 font-medium text-right">Ratings</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((entry, index) => {
                const isExpanded = expanded.has(entry.submission.id);
                return (
                  <tr
                    key={entry.submission.id}
                    className={cn(
                      "border-b border-border/40 last:border-0 align-top",
                      index < 3 && category === "overall" && "bg-primary/[0.04]"
                    )}
                  >
                    <td className="px-4 py-3 font-display font-bold tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        {index === 0 && category === "overall" && <Trophy className="w-4 h-4 text-amber-400" />}
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                      <Link
                        to={`/events/${jamSlug}/level/${entry.submission.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        {entry.submission.level_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px]">
                      <div className="truncate">
                        {entry.submission.username ? (
                          <Link to={`/player/${entry.submission.username}`} className="hover:underline text-primary">
                            {entry.submission.username}
                          </Link>
                        ) : (
                          entry.submission.creator ?? "Unknown"
                        )}
                      </div>
                      {entry.collaborators.length > 0 && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(entry.submission.id)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {entry.collaborators.length} collaborator{entry.collaborators.length === 1 ? "" : "s"}
                          </button>
                          {isExpanded && (
                            <ul className="mt-1 space-y-0.5 text-xs">
                              {entry.collaborators.map((c) => (
                                <li key={c.id}>
                                  {c.username ? (
                                    <Link to={`/player/${c.username}`} className="hover:underline text-primary">
                                      {c.username}
                                    </Link>
                                  ) : (
                                    "Unknown"
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{entry.enjoyment.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{entry.creativity.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{entry.design.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{entry.overall.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{entry.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
