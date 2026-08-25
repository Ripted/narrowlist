import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  Flag,
  ListChecks,
  LogIn,
  PartyPopper,
  ScrollText,
  Send,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findJamBySlug, getJamPhase, getRevealedTheme, JamEventConfig, JamPhase } from "@/config/events";
import { JamCountdown } from "@/components/jam/JamCountdown";
import { useNow } from "@/hooks/useNow";
import { JamSubmissionForm } from "@/components/jam/JamSubmissionForm";
import { JamVotingSection } from "@/components/jam/JamVotingSection";
import { JamResults } from "@/components/jam/JamResults";
import { JamSubmissionCard } from "@/components/jam/JamSubmissionCard";
import {
  computeJamScores,
  JAM_MAX_ENTRIES_PER_USER,
  useJamCollaborators,
  useJamRatings,
  useJamSubmissions,
} from "@/hooks/useJam";
import { useAuth } from "@/hooks/useAuth";

const formatJamDate = (ts: number) => format(new Date(ts), "EEEE, MMM d yyyy 'at' HH:mm");

function phaseLabel(phase: JamPhase): string {
  switch (phase) {
    case "upcoming":
      return "Upcoming";
    case "active":
      return "Live now";
    case "voting":
      return "Voting";
    case "ended":
      return "Jam is over";
  }
}

function JamHero({ jam }: { jam: JamEventConfig }) {
  // Ticks at 1s so the phase flips the moment the jam starts/ends.
  const now = useNow();
  const phase = getJamPhase(jam, now);
  const theme = getRevealedTheme(jam, now);

  return (
    <Card className="relative overflow-hidden p-6 md:p-8 bg-card/40 border-border/60">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.05] pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text">{jam.name}</h1>
            <Badge
              variant={phase === "active" ? "default" : "secondary"}
              className={phase === "active" ? "glow-primary" : ""}
            >
              {phaseLabel(phase)}
            </Badge>
          </div>
          <p className="text-muted-foreground">Hosted by {jam.host}</p>

          {phase === "upcoming" && (
            <p className="text-sm text-muted-foreground">The theme will be revealed when the jam starts.</p>
          )}
          {theme && (
            <p className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>
                Theme: <span className="font-display font-bold gradient-text">{theme}</span>
              </span>
            </p>
          )}
        </div>

        <div className="shrink-0">
          {phase === "upcoming" && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Jam starts in</p>
              <JamCountdown target={jam.startsAt} />
            </div>
          )}
          {phase === "active" && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-primary">Jam ends in</p>
              <JamCountdown target={jam.endsAt} />
            </div>
          )}
          {phase === "voting" && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Voting ends in</p>
              <JamCountdown target={jam.votingEndsAt} />
            </div>
          )}
          {phase === "ended" && (
            <div className="flex items-center gap-2 border border-border/60 rounded-lg px-5 py-4 text-muted-foreground">
              <Flag className="w-5 h-5" />
              <span className="font-medium">Jam is over</span>
            </div>
          )}
        </div>
      </div>

      {phase === "voting" && (
        <p className="relative mt-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
          The jam is over — now rate the entries! Voting closes {formatJamDate(jam.votingEndsAt)}.
        </p>
      )}
    </Card>
  );
}

function JamSchedule({ jam }: { jam: JamEventConfig }) {
  return (
    <Card className="p-6 bg-card/40 border-border/60">
      <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        Schedule
      </h2>
      <dl className="space-y-3 text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <dt className="text-muted-foreground sm:w-40 shrink-0">Submissions open</dt>
          <dd className="font-medium">{formatJamDate(jam.startsAt)}</dd>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <dt className="text-muted-foreground sm:w-40 shrink-0">Submissions close</dt>
          <dd className="font-medium">{formatJamDate(jam.endsAt)} (96 hours)</dd>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <dt className="text-muted-foreground sm:w-40 shrink-0">Voting closes</dt>
          <dd className="font-medium">{formatJamDate(jam.votingEndsAt)} (7 days)</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        Times are shown in your local timezone. The jam runs 21:00 to 21:00 UTC+2.
      </p>
    </Card>
  );
}

function JamRules({ jam }: { jam: JamEventConfig }) {
  return (
    <Card className="p-6 bg-card/40 border-border/60 h-full">
      <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4 flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-primary" />
        How it works
      </h2>
      <p className="text-sm text-muted-foreground mb-4">{jam.description}</p>
      <ul className="space-y-2 text-sm">
        {jam.rules.map((rule, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

type JamTab = "submissions" | "vote" | "results";

function defaultTabFor(phase: JamPhase): JamTab {
  if (phase === "voting") return "vote";
  if (phase === "ended") return "results";
  return "submissions";
}

export default function JamEventPage() {
  const { jamSlug } = useParams<{ jamSlug: string }>();
  const jam = findJamBySlug(jamSlug);
  const now = useNow(15_000);
  const { user } = useAuth();
  const [tab, setTab] = useState<JamTab | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const submissions = useJamSubmissions(jam?.id ?? "");
  const collaborators = useJamCollaborators(jam?.id ?? "");
  const ratings = useJamRatings(jam?.id ?? "");

  if (!jam) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Event not found</h1>
          <p className="text-muted-foreground mb-6">This event doesn't exist — check the events page.</p>
          <Link to="/events">
            <Button>Back to events</Button>
          </Link>
        </main>
      </div>
    );
  }

  const phase = getJamPhase(jam, now);
  const entries = submissions.data ?? [];
  const allCollaborators = collaborators.data ?? [];
  const allRatings = ratings.data ?? [];
  const myEntries = entries.filter((s) => s.user_id === user?.id);
  const collabCountBySubmission = new Map<string, number>();
  for (const c of allCollaborators) {
    collabCountBySubmission.set(c.submission_id, (collabCountBySubmission.get(c.submission_id) ?? 0) + 1);
  }
  const scores = computeJamScores(allRatings);
  const activeTab = tab ?? defaultTabFor(phase);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title={jam.name} description={jam.tagline} />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 space-y-8">
        <JamHero jam={jam} />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground px-1">
          <span className="inline-flex items-center gap-1.5">
            <PartyPopper className="w-4 h-4 text-primary" />
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-primary" />
            {allRatings.length} rating{allRatings.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <JamSchedule jam={jam} />
          <JamRules jam={jam} />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setTab(v as JamTab)}>
          <TabsList>
            <TabsTrigger value="submissions" className="gap-1.5">
              <Send className="w-4 h-4" />
              Submissions ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="vote" className="gap-1.5">
              <ListChecks className="w-4 h-4" />
              Vote
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1.5">
              <Trophy className="w-4 h-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6 space-y-6">
            {phase === "active" &&
              (user ? (
                <Card className="p-6 bg-card/40 border-primary/30">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Your entries ({myEntries.length} / {JAM_MAX_ENTRIES_PER_USER})
                    </h2>
                    {myEntries.length < JAM_MAX_ENTRIES_PER_USER && !formOpen && (
                      <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
                        <Send className="w-4 h-4 mr-1.5" />
                        Submit a level
                      </Button>
                    )}
                  </div>

                  {myEntries.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {myEntries.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-4 py-2.5"
                        >
                          <Link
                            to={`/events/${jam.slug}/level/${entry.slug}`}
                            className="text-sm font-medium hover:text-primary transition-colors truncate"
                          >
                            {entry.level_name}
                          </Link>
                          <span className="text-xs text-muted-foreground shrink-0">Manage on its page →</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {formOpen && myEntries.length < JAM_MAX_ENTRIES_PER_USER && (
                    <div className="pt-4 border-t border-border/50">
                      <JamSubmissionForm jam={jam} onDone={() => setFormOpen(false)} />
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-6 bg-card/40 border-primary/30 text-center">
                  <LogIn className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">Sign in to submit a level to the jam.</p>
                  <Link to="/auth">
                    <Button size="sm" className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign in
                    </Button>
                  </Link>
                </Card>
              ))}
            {phase === "upcoming" && (
              <p className="text-center text-muted-foreground">
                Submissions open when the jam starts — that's when the theme is revealed.
              </p>
            )}

            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {entries.map((submission) => (
                  <JamSubmissionCard
                    key={submission.id}
                    submission={submission}
                    jamSlug={jam.slug}
                    collaboratorCount={collabCountBySubmission.get(submission.id) ?? 0}
                    score={scores.get(submission.id) ?? null}
                    showScore={phase === "ended"}
                    footer={
                      submission.user_id === user?.id ? (
                        <Badge variant="secondary" className="self-start">Your entry</Badge>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vote" className="mt-6">
            {phase === "upcoming" || phase === "active" ? (
              <Card className="p-8 text-center bg-card/40 border-border/60">
                <p className="text-muted-foreground">
                  Voting opens when the jam ends ({formatJamDate(jam.endsAt)}) and runs for 7 days.
                </p>
              </Card>
            ) : phase === "voting" ? (
              <JamVotingSection jam={jam} submissions={entries} ratings={allRatings} collaborators={allCollaborators} />
            ) : (
              <Card className="p-8 text-center bg-card/40 border-border/60">
                <p className="text-muted-foreground">Voting has closed — see the final results.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {phase === "ended" ? (
              <JamResults submissions={entries} ratings={allRatings} collaborators={allCollaborators} jamSlug={jam.slug} />
            ) : (
              <Card className="p-8 text-center bg-card/40 border-border/60">
                <p className="text-muted-foreground">
                  Results will be available once voting closes ({formatJamDate(jam.votingEndsAt)}).
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
