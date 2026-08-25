import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dices, ListChecks, LogIn, PartyPopper, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  JAM_UNLOCK_RATING_COUNT,
  JamCollaborator,
  JamRating,
  JamSubmission,
  useMyJamAssignments,
  useMyProfile,
  useRequestJamAssignment,
  useSkipJamAssignment,
  useSubmitJamRating,
} from "@/hooks/useJam";
import { useAuth } from "@/hooks/useAuth";
import { JamRatingForm, JamSubmissionCard } from "./JamSubmissionCard";
import type { JamEventConfig } from "@/config/events";

const MAX_OUTSTANDING_ASSIGNMENTS = 5;

interface JamVotingSectionProps {
  jam: JamEventConfig;
  submissions: JamSubmission[];
  ratings: JamRating[];
  collaborators: JamCollaborator[];
}

/**
 * Voting during the 7-day window after the jam. Participants (creators and
 * collaborators) rate any level freely; everyone else rates levels assigned
 * through the queue until 5 ratings unlock free voting.
 */
export function JamVotingSection({ jam, submissions, ratings, collaborators }: JamVotingSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const assignments = useMyJamAssignments(jam.id);
  const profile = useMyProfile();
  const requestAssignment = useRequestJamAssignment(jam);
  const skipAssignment = useSkipJamAssignment(jam);
  const submitRating = useSubmitJamRating(jam);
  // Skipped levels stay excluded for this session — the server has no memory of skips.
  const [skippedIds, setSkippedIds] = useState<string[]>([]);

  const myRatings = useMemo(() => {
    const map = new Map<string, JamRating>();
    for (const r of ratings) {
      if (r.user_id === user?.id) map.set(r.submission_id, r);
    }
    return map;
  }, [ratings, user?.id]);

  // Submissions the user is involved in (creator or collaborator) are off-limits.
  const myCollabSubIds = useMemo(() => {
    const set = new Set<string>();
    if (profile.data) {
      for (const c of collaborators) {
        if (c.profile_id === profile.data.id) set.add(c.submission_id);
      }
    }
    return set;
  }, [collaborators, profile.data]);

  if (!user) {
    return (
      <Card className="p-8 text-center bg-card/60 border-border/60">
        <LogIn className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Sign in to vote</h3>
        <p className="text-muted-foreground text-sm mt-1 mb-4">
          You need an account to rate jam levels.
        </p>
        <Link to="/auth">
          <Button className="gap-2">
            <LogIn className="w-4 h-4" />
            Sign in
          </Button>
        </Link>
      </Card>
    );
  }

  const isEntryMember = (s: JamSubmission) => s.user_id === user.id || myCollabSubIds.has(s.id);
  const isParticipant =
    submissions.some((s) => s.user_id === user.id) || myCollabSubIds.size > 0;
  const freeVotingUnlocked = myRatings.size >= JAM_UNLOCK_RATING_COUNT;
  const canRateFreely = isParticipant || freeVotingUnlocked;
  const rateable = submissions.filter((s) => !isEntryMember(s));

  const handleRate = async (submissionId: string, values: { enjoyment: number; creativity: number; design: number }) => {
    try {
      await submitRating.mutateAsync({ submission_id: submissionId, ...values });
      toast({ title: "Rating saved" });
    } catch (err) {
      toast({
        title: "Could not save rating",
        description: err instanceof Error ? err.message : "Voting may be closed.",
        variant: "destructive",
      });
    }
  };

  if (canRateFreely) {
    return (
      <div className="space-y-4">
        <Card className="p-4 bg-primary/5 border-primary/20 flex items-center gap-3">
          {isParticipant ? (
            <PartyPopper className="w-5 h-5 text-primary shrink-0" />
          ) : (
            <Unlock className="w-5 h-5 text-primary shrink-0" />
          )}
          <p className="text-sm">
            {isParticipant
              ? "You entered the jam — you can rate every level except ones you worked on. "
              : `You rated ${JAM_UNLOCK_RATING_COUNT} levels — free voting unlocked! `}
            <span className="text-muted-foreground">
              {myRatings.size} / {rateable.length} rated
            </span>
          </p>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rateable.map((submission) => (
            <JamSubmissionCard
              key={submission.id}
              submission={submission}
              jamSlug={jam.slug}
              footer={
                <JamRatingForm
                  key={myRatings.get(submission.id)?.id ?? `new-${submission.id}`}
                  existing={myRatings.get(submission.id) ?? null}
                  submitting={submitRating.isPending}
                  onSubmit={(values) => handleRate(submission.id, values)}
                />
              }
            />
          ))}
        </div>
        {rateable.length === 0 && (
          <p className="text-center text-muted-foreground py-8">There are no other levels to rate yet.</p>
        )}
      </div>
    );
  }

  // Non-participant: rating queue
  const assigned = (assignments.data ?? [])
    .map((a) => submissions.find((s) => s.id === a.submission_id))
    .filter((s): s is JamSubmission => !!s);
  const outstanding = assignments.data?.length ?? 0;

  const handleGetNext = async () => {
    try {
      const picked = await requestAssignment.mutateAsync({ excludeIds: skippedIds });
      if (!picked) {
        toast({ title: "Nothing left in the queue", description: "You've rated every available level." });
      }
    } catch (err) {
      toast({
        title: "Could not get a level",
        description: err instanceof Error ? err.message : "Voting may be closed.",
        variant: "destructive",
      });
    }
  };

  const handleSkip = async (submissionId: string) => {
    try {
      await skipAssignment.mutateAsync(submissionId);
      setSkippedIds((prev) => [...prev, submissionId]);
    } catch {
      toast({ title: "Could not skip this level", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/5 border-primary/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ListChecks className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm">
            Since you didn't enter the jam, levels are assigned to you from the queue.{" "}
            <span className="text-muted-foreground">
              {myRatings.size} rated — rate {JAM_UNLOCK_RATING_COUNT} to unlock free voting
            </span>
          </p>
        </div>
        <Button
          onClick={handleGetNext}
          disabled={requestAssignment.isPending || outstanding >= MAX_OUTSTANDING_ASSIGNMENTS}
          className="gap-2"
        >
          <Dices className="w-4 h-4" />
          {requestAssignment.isPending ? "Picking..." : "Get a level to rate"}
        </Button>
      </Card>

      {assigned.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Your queue is empty — grab a level above and start rating.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assigned.map((submission) => (
            <JamSubmissionCard
              key={submission.id}
              submission={submission}
              jamSlug={jam.slug}
              footer={
                <JamRatingForm
                  key={myRatings.get(submission.id)?.id ?? `new-${submission.id}`}
                  existing={myRatings.get(submission.id) ?? null}
                  submitting={submitRating.isPending}
                  skipping={skipAssignment.isPending}
                  onSubmit={(values) => handleRate(submission.id, values)}
                  onSkip={() => handleSkip(submission.id)}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
