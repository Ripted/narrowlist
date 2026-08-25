import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSubmitJamEntry, JamSubmission } from "@/hooks/useJam";
import type { JamEventConfig } from "@/config/events";

interface JamSubmissionFormProps {
  jam: JamEventConfig;
  existing?: JamSubmission | null;
  onDone?: () => void;
}

export function JamSubmissionForm({ jam, existing, onDone }: JamSubmissionFormProps) {
  const { toast } = useToast();
  const submitEntry = useSubmitJamEntry(jam);
  const [levelId, setLevelId] = useState(existing?.level_id ?? "");
  const [levelName, setLevelName] = useState(existing?.level_name ?? "");
  const [creator, setCreator] = useState(existing?.creator ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.video_url ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelId.trim() || !levelName.trim()) {
      toast({ title: "Level ID and level name are required", variant: "destructive" });
      return;
    }
    try {
      await submitEntry.mutateAsync({
        level_id: levelId,
        level_name: levelName,
        creator,
        description,
        video_url: videoUrl,
      });
      toast({ title: existing ? "Submission updated" : "Level submitted to the jam" });
      onDone?.();
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "The submission window may be closed.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jam-level-id">Level ID *</Label>
          <Input
            id="jam-level-id"
            value={levelId}
            onChange={(e) => setLevelId(e.target.value)}
            placeholder="e.g. 1743661104278"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jam-level-name">Level name *</Label>
          <Input
            id="jam-level-name"
            value={levelName}
            onChange={(e) => setLevelName(e.target.value)}
            placeholder="Name of your level"
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jam-creator">Creator</Label>
          <Input
            id="jam-creator"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="In-game creator name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jam-video">Video URL</Label>
          <Input
            id="jam-video"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jam-description">Description</Label>
        <Textarea
          id="jam-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="How does your level fit the theme?"
          rows={3}
        />
      </div>
      <Button type="submit" disabled={submitEntry.isPending} className="glow-primary">
        {submitEntry.isPending ? "Saving..." : existing ? "Update submission" : "Submit level"}
      </Button>
    </form>
  );
}
