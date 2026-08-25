import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarDays, Flag, Hourglass, Vote } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EventFilter,
  JamEventConfig,
  JAM_EVENTS,
  getJamPhase,
  jamMatchesFilter,
} from "@/config/events";
import { JamCountdown } from "@/components/jam/JamCountdown";
import { useNow } from "@/hooks/useNow";
import { useJamSubmissionCount } from "@/hooks/useJam";

const formatEventDate = (ts: number) => format(new Date(ts), "EEE, MMM d yyyy, HH:mm");

function PhaseBadge({ jam, now }: { jam: JamEventConfig; now: number }) {
  const phase = getJamPhase(jam, now);
  if (phase === "active") {
    return <Badge className="gap-1.5 glow-primary"><Hourglass className="w-3 h-3" />Live now</Badge>;
  }
  if (phase === "voting") {
    return <Badge variant="secondary" className="gap-1.5"><Vote className="w-3 h-3" />Voting</Badge>;
  }
  if (phase === "ended") {
    return <Badge variant="outline" className="gap-1.5 text-muted-foreground"><Flag className="w-3 h-3" />Jam is over</Badge>;
  }
  return <Badge variant="secondary" className="gap-1.5"><CalendarDays className="w-3 h-3" />Upcoming</Badge>;
}

function EventCard({ jam }: { jam: JamEventConfig }) {
  const now = useNow();
  const phase = getJamPhase(jam, now);
  const count = useJamSubmissionCount(jam.id);

  return (
    <Link to={`/events/${jam.slug}`} className="group block">
      <Card className="relative overflow-hidden p-6 h-full bg-card/40 border-border/60 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="font-display text-2xl font-bold gradient-text">{jam.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{jam.tagline}</p>
          </div>
          <PhaseBadge jam={jam} now={now} />
        </div>

        <p className="text-sm text-muted-foreground">
          {formatEventDate(jam.startsAt)} — {formatEventDate(jam.endsAt)}
          {typeof count.data === "number" && phase !== "upcoming" && (
            <span className="ml-2 text-foreground/80 font-medium">
              · {count.data} {count.data === 1 ? "entry" : "entries"}
            </span>
          )}
        </p>

        <div className="mt-4">
          {phase === "upcoming" && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Starts in</p>
              <JamCountdown target={jam.startsAt} />
            </div>
          )}
          {phase === "active" && (
            <div>
              <p className="text-xs uppercase tracking-widest text-primary mb-2">Jam ends in</p>
              <JamCountdown target={jam.endsAt} />
            </div>
          )}
          {phase === "voting" && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Jam is over — voting ends in
              </p>
              <JamCountdown target={jam.votingEndsAt} />
            </div>
          )}
          {phase === "ended" && (
            <p className="text-sm font-medium text-muted-foreground border border-border/60 rounded-lg px-4 py-3 inline-block">
              Jam is over — check out the results
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default function EventsPage() {
  const now = useNow(30_000);

  const counts = useMemo(() => {
    const result: Record<EventFilter, number> = { active: 0, future: 0, past: 0 };
    for (const jam of JAM_EVENTS) {
      const phase = getJamPhase(jam, now);
      if (jamMatchesFilter(phase, "active")) result.active++;
      else if (jamMatchesFilter(phase, "future")) result.future++;
      else result.past++;
    }
    return result;
  }, [now]);

  const defaultFilter: EventFilter =
    counts.active > 0 ? "active" : counts.future > 0 ? "future" : "past";
  const [filter, setFilter] = useState<EventFilter | null>(null);
  const activeFilter = filter ?? defaultFilter;

  const visible = JAM_EVENTS.filter((jam) => jamMatchesFilter(getJamPhase(jam, now), activeFilter));

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Events" description="Narrowlist events — level jams and community competitions." />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-3">Events</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Level jams and community competitions.
          </p>
        </div>

        <Tabs value={activeFilter} onValueChange={(v) => setFilter(v as EventFilter)} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
              <TabsTrigger value="future">Future ({counts.future})</TabsTrigger>
              <TabsTrigger value="past">Past ({counts.past})</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {activeFilter === "active" && "No events running right now."}
            {activeFilter === "future" && "No upcoming events announced yet."}
            {activeFilter === "past" && "No past events yet."}
          </p>
        ) : (
          <div className="grid gap-5 max-w-3xl mx-auto">
            {visible.map((jam) => (
              <EventCard key={jam.id} jam={jam} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
