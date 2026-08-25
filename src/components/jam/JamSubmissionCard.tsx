import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, User as UserIcon, Users } from "lucide-react";
import { JamRating, JamScore, JamSubmission } from "@/hooks/useJam";
import { JamStarRating } from "./JamStarRating";
import { JAM_RATING_CATEGORIES } from "@/config/events";

interface JamSubmissionCardProps {
  submission: JamSubmission;
  jamSlug: string;
  collaboratorCount?: number;
  score?: JamScore | null;
  showScore?: boolean;
  footer?: React.ReactNode;
}

export function JamSubmissionCard({ submission, jamSlug, collaboratorCount, score, showScore, footer }: JamSubmissionCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-5 bg-card/60 border-border/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/events/${jamSlug}/level/${submission.slug}`}
            className="font-semibold text-lg leading-tight truncate block hover:text-primary transition-colors"
          >
            {submission.level_name}
          </Link>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <UserIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{submission.username ?? submission.creator ?? "Unknown"}</span>
          </p>
        </div>
        {showScore && score && (
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {score.count} rating{score.count === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      {submission.description && (
        <p className="text-sm text-muted-foreground line-clamp-3">{submission.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Hash className="w-3 h-3" />
          ID {submission.level_id}
        </span>
        {!!collaboratorCount && (
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" />
            {collaboratorCount} collaborator{collaboratorCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {showScore && score && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/50 pt-3 text-sm">
          {JAM_RATING_CATEGORIES.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{c.label}</span>
              <span className="tabular-nums font-medium">{score[c.key].toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {footer}
    </Card>
  );
}

interface JamRatingFormProps {
  existing?: JamRating | null;
  submitting: boolean;
  onSubmit: (values: { enjoyment: number; creativity: number; design: number }) => void;
  onSkip?: () => void;
  skipping?: boolean;
}

/** Three-category star rating form for a single submission. */
export function JamRatingForm({ existing, submitting, onSubmit, onSkip, skipping }: JamRatingFormProps) {
  const [enjoyment, setEnjoyment] = useState(existing?.enjoyment ?? 0);
  const [creativity, setCreativity] = useState(existing?.creativity ?? 0);
  const [design, setDesign] = useState(existing?.design ?? 0);

  const complete = enjoyment > 0 && creativity > 0 && design > 0;
  const dirty =
    !existing ||
    existing.enjoyment !== enjoyment ||
    existing.creativity !== creativity ||
    existing.design !== design;

  return (
    <div className="mt-auto space-y-2 border-t border-border/50 pt-3">
      {JAM_RATING_CATEGORIES.map((c) => (
        <div key={c.key} className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{c.label}</span>
          <JamStarRating
            value={c.key === "enjoyment" ? enjoyment : c.key === "creativity" ? creativity : design}
            onChange={(v) =>
              c.key === "enjoyment" ? setEnjoyment(v) : c.key === "creativity" ? setCreativity(v) : setDesign(v)
            }
            disabled={submitting}
            size={18}
          />
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          className="flex-1"
          disabled={!complete || !dirty || submitting}
          onClick={() => onSubmit({ enjoyment, creativity, design })}
        >
          {submitting ? "Saving..." : existing ? "Update rating" : "Save rating"}
        </Button>
        {onSkip && (
          <Button size="sm" variant="ghost" onClick={onSkip} disabled={skipping || submitting}>
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}
