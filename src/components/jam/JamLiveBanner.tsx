import { Link } from "react-router-dom";
import { ArrowRight, Hourglass, Vote } from "lucide-react";
import { JAM_EVENTS, getJamPhase, getRevealedTheme } from "@/config/events";
import { useNow } from "@/hooks/useNow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatRemaining(target: number, now: number): string {
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Shown on the hub while a jam is running or its voting window is open. */
export function JamLiveBanner() {
  const now = useNow(30_000);
  const liveJam = JAM_EVENTS.find((j) => {
    const phase = getJamPhase(j, now);
    return phase === "active" || phase === "voting";
  });

  if (!liveJam) return null;

  const phase = getJamPhase(liveJam, now);
  const isActive = phase === "active";
  const theme = getRevealedTheme(liveJam, now);
  const remaining = formatRemaining(isActive ? liveJam.endsAt : liveJam.votingEndsAt, now);

  return (
    <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-r from-primary/15 via-card/60 to-accent/15 mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-accent/[0.06] pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary shrink-0">
            {isActive ? <Hourglass className="w-5 h-5" /> : <Vote className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            {isActive ? (
              <>
                <p className="font-display font-bold text-foreground leading-tight">
                  The {liveJam.name} is live!
                  {theme && (
                    <span className="text-muted-foreground font-normal">
                      {" "}— theme: <span className="gradient-text font-bold">{theme}</span>
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  Submissions close in {remaining} — check it out and join the jam.
                </p>
              </>
            ) : (
              <>
                <p className="font-display font-bold text-foreground leading-tight">
                  The {liveJam.name} is over — voting is open!
                </p>
                <p className="text-sm text-muted-foreground">
                  Rate the entries in Enjoyment, Creativity and Design — {remaining} left.
                </p>
              </>
            )}
          </div>
        </div>
        <Link to={`/events/${liveJam.slug}`} className="sm:ml-auto shrink-0">
          <Button className="gap-2 glow-primary w-full sm:w-auto">
            {isActive ? "Go to the jam" : "Vote now"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
