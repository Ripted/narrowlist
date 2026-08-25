import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Hash,
  Pencil,
  Trash2,
  User as UserIcon,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { findJamBySlug, getJamPhase, getRevealedTheme } from "@/config/events";
import { useNow } from "@/hooks/useNow";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  computeJamScores,
  JAM_MAX_COLLABORATORS,
  useAddJamCollaborator,
  useDeleteJamEntry,
  useJamCollaborators,
  useJamRatings,
  useJamSubmissions,
  useRemoveJamCollaborator,
  useUpdateJamEntry,
} from "@/hooks/useJam";
import { JamStarRating } from "@/components/jam/JamStarRating";
import { JAM_RATING_CATEGORIES } from "@/config/events";

export default function JamEntryPage() {
  const { jamSlug } = useParams<{ jamSlug: string; entrySlug: string }>();
  const jam = findJamBySlug(jamSlug);

  if (!jam) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Event not found</h1>
          <Link to="/events">
            <Button>Back to events</Button>
          </Link>
        </main>
      </div>
    );
  }

  return <JamEntryContent jam={jam} />;
}

function JamEntryContent({ jam }: { jam: NonNullable<ReturnType<typeof findJamBySlug>> }) {
  const { entrySlug } = useParams<{ entrySlug: string }>();
  const now = useNow(30_000);
  const { user } = useAuth();
  const { toast } = useToast();

  const submissions = useJamSubmissions(jam.id);
  const collaborators = useJamCollaborators(jam.id);
  const ratings = useJamRatings(jam.id);
  const updateEntry = useUpdateJamEntry(jam);
  const deleteEntry = useDeleteJamEntry(jam);
  const addCollaborator = useAddJamCollaborator(jam);
  const removeCollaborator = useRemoveJamCollaborator(jam);

  const [editing, setEditing] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const [collabInput, setCollabInput] = useState("");

  const phase = getJamPhase(jam, now);
  const submission = (submissions.data ?? []).find((s) => s.slug === entrySlug) ?? null;

  if (submissions.data && !submission) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold mb-3">Entry not found</h1>
          <p className="text-muted-foreground mb-6">This jam entry doesn't exist.</p>
          <Link to={`/events/${jam.slug}`}>
            <Button>Back to {jam.name}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const isOwner = !!submission && submission.user_id === user?.id;
  const submissionCollaborators = (collaborators.data ?? []).filter(
    (c) => c.submission_id === submission?.id
  );
  const scores = computeJamScores(ratings.data ?? []);
  const score = submission ? scores.get(submission.id) ?? null : null;
  const theme = getRevealedTheme(jam, now);
  const canEditIdentity = phase === "active"; // level id/name/collaborators locked after jam end

  const handleSaveDescription = async () => {
    if (!submission || descriptionDraft === null) return;
    try {
      await updateEntry.mutateAsync({ id: submission.id, description: descriptionDraft });
      toast({ title: "Description updated" });
      setEditing(false);
      setDescriptionDraft(null);
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleAddCollaborator = async () => {
    if (!submission || !collabInput.trim()) return;
    try {
      await addCollaborator.mutateAsync({ submissionId: submission.id, username: collabInput });
      toast({ title: "Collaborator added" });
      setCollabInput("");
    } catch (err) {
      toast({
        title: "Could not add collaborator",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    try {
      await removeCollaborator.mutateAsync(id);
      toast({ title: "Collaborator removed" });
    } catch (err) {
      toast({
        title: "Could not remove collaborator",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!submission) return;
    try {
      await deleteEntry.mutateAsync(submission.id);
      toast({ title: "Entry removed" });
    } catch (err) {
      toast({
        title: "Could not remove entry",
        description: err instanceof Error ? err.message : "Entries can only be removed while the jam is running.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={submission ? `${submission.level_name} — ${jam.name}` : jam.name}
        description={submission?.description ?? jam.tagline}
      />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 space-y-8 max-w-3xl">
        <Link
          to={`/events/${jam.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {jam.name}
        </Link>

        {!submission ? (
          <p className="text-muted-foreground">Loading entry…</p>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text">
                  {submission.level_name}
                </h1>
                <Badge variant="secondary">{jam.name}</Badge>
                {theme && <Badge variant="outline">Theme: {theme}</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-primary" />
                  {submission.username ? (
                    <Link to={`/player/${submission.username}`} className="hover:text-foreground transition-colors">
                      {submission.username}
                    </Link>
                  ) : (
                    (submission.creator ?? "Unknown")
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-primary" />
                  ID {submission.level_id}
                </span>
              </div>
            </div>

            <Card className="p-6 bg-card/40 border-border/60">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  About this level
                </h2>
                {isOwner && !editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDescriptionDraft(submission.description ?? "");
                      setEditing(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <Textarea
                    value={descriptionDraft ?? ""}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    rows={5}
                    placeholder="Describe your level — how does it fit the theme?"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription} disabled={updateEntry.isPending}>
                      {updateEntry.isPending ? "Saving..." : "Save description"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(false);
                        setDescriptionDraft(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : submission.description ? (
                <p className="text-sm whitespace-pre-wrap">{submission.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description yet.</p>
              )}
            </Card>

            <Card className="p-6 bg-card/40 border-border/60">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Collaborators ({submissionCollaborators.length})
              </h2>

              {submissionCollaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No collaborators.</p>
              ) : (
                <ul className="space-y-2">
                  {submissionCollaborators.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                      {c.username ? (
                        <Link to={`/player/${c.username}`} className="hover:text-primary transition-colors">
                          {c.username}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown account</span>
                      )}
                      {isOwner && canEditIdentity && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveCollaborator(c.id)}
                          disabled={removeCollaborator.isPending}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isOwner && canEditIdentity && submissionCollaborators.length < JAM_MAX_COLLABORATORS && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                  <Input
                    value={collabInput}
                    onChange={(e) => setCollabInput(e.target.value)}
                    placeholder="Narrowlist username"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCollaborator())}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddCollaborator}
                    disabled={!collabInput.trim() || addCollaborator.isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Add
                  </Button>
                </div>
              )}
              {isOwner && !canEditIdentity && (
                <p className="text-xs text-muted-foreground mt-3">Collaborators are locked now that the jam has ended.</p>
              )}
            </Card>

            {phase === "ended" && score && (
              <Card className="p-6 bg-card/40 border-border/60">
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
                  Ratings ({score.count})
                </h2>
                <div className="space-y-3">
                  {JAM_RATING_CATEGORIES.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">{c.label}</span>
                      <div className="flex items-center gap-2">
                        <JamStarRating value={Math.round(score[c.key])} size={14} disabled onChange={() => {}} />
                        <span className="text-sm font-medium tabular-nums w-10 text-right">
                          {score[c.key].toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/50">
                    <span className="text-sm font-semibold">Overall</span>
                    <span className="font-display font-bold gradient-text tabular-nums">
                      {score.overall.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            )}
            {phase !== "ended" && (
              <p className="text-sm text-muted-foreground">
                Ratings for this entry will be shown here once voting closes.
              </p>
            )}

            {isOwner && canEditIdentity && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleteEntry.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  {deleteEntry.isPending ? "Removing..." : "Remove this entry"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
