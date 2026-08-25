import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMyProfile, useSubmitJamEntry } from "@/hooks/useJam";
import { fetchLevelDetails } from "@/lib/api";
import { BadgeCheck, Loader2, Search } from "lucide-react";
import type { JamEventConfig } from "@/config/events";

interface JamSubmissionFormProps {
  jam: JamEventConfig;
  onDone?: () => void;
}

interface VerifiedLevel {
  level_id: string;
  name: string;
  author: string;
}

/**
 * New-entry form. The level must be uploaded on the Narrow Arrow account the
 * user's Narrowlist profile is linked to — verified against the public API.
 */
export function JamSubmissionForm({ jam, onDone }: JamSubmissionFormProps) {
  const { toast } = useToast();
  const submitEntry = useSubmitJamEntry(jam);
  const profile = useMyProfile();

  const [levelId, setLevelId] = useState("");
  const [description, setDescription] = useState("");
  const [verified, setVerified] = useState<VerifiedLevel | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    const id = levelId.trim();
    if (!id) return;
    setVerifying(true);
    setVerified(null);
    try {
      const details = await fetchLevelDetails(id);
      if (!details?.levelInfo) {
        toast({ title: "Level not found", description: "Check the level ID.", variant: "destructive" });
        return;
      }
      const author = details.levelInfo.author;
      const linkedName = profile.data?.username;
      if (!linkedName) {
        toast({
          title: "No linked player profile",
          description: "Your Narrowlist account must be linked to a player profile first.",
          variant: "destructive",
        });
        return;
      }
      if (author.toLowerCase() !== linkedName.toLowerCase()) {
        toast({
          title: "This level is not yours",
          description: `"${details.levelInfo.name}" was uploaded by ${author}, but your account is linked to ${linkedName}.`,
          variant: "destructive",
        });
        return;
      }
      setVerified({ level_id: id, name: details.levelInfo.name, author });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) return;
    try {
      await submitEntry.mutateAsync({
        level_id: verified.level_id,
        level_name: verified.name,
        creator: verified.author,
        description,
      });
      toast({ title: "Level submitted to the jam" });
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
      <div className="space-y-2">
        <Label htmlFor="jam-level-id">Level ID *</Label>
        <div className="flex gap-2">
          <Input
            id="jam-level-id"
            value={levelId}
            onChange={(e) => {
              setLevelId(e.target.value);
              setVerified(null);
            }}
            placeholder="e.g. 1743661104278"
            required
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleVerify}
            disabled={!levelId.trim() || verifying || profile.isLoading}
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-1.5">Verify</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The level must be uploaded on the account your Narrowlist profile is linked to
          {profile.data?.username ? ` (${profile.data.username})` : ""}.
        </p>
      </div>

      {verified && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-2.5">
          <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm">
            <span className="font-semibold text-foreground">{verified.name}</span>
            <span className="text-muted-foreground"> by {verified.author} — verified as yours.</span>
          </p>
        </div>
      )}

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

      <Button type="submit" disabled={!verified || submitEntry.isPending} className="glow-primary">
        {submitEntry.isPending ? "Saving..." : "Submit level"}
      </Button>
    </form>
  );
}
