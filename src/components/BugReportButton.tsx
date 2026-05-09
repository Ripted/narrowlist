import { useState } from "react";
import { Bug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(10, "Please describe the bug (10+ chars)").max(2000),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

export function BugReportButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [email, setEmail] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setEmail("");
  };

  const handleSubmit = async () => {
    const parsed = schema.safeParse({ title, description, email });
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.errors[0]?.message ?? "Please check your input",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("bug_reports").insert({
        title: parsed.data.title,
        description: parsed.data.description,
        severity,
        page_url: window.location.href,
        user_id: user?.id ?? null,
        reporter_email: parsed.data.email || user?.email || null,
      });
      if (error) throw error;
      toast({ title: "Bug report submitted", description: "Thanks for helping improve the site!" });
      reset();
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="default"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform"
          aria-label="Report a bug"
          title="Report a bug"
        >
          <Bug className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Found something broken? Let us know so we can fix it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="bug-title">Title</Label>
            <Input
              id="bug-title"
              placeholder="Short summary of the bug"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-desc">Description</Label>
            <Textarea
              id="bug-desc"
              placeholder="What happened? What did you expect? Steps to reproduce..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — minor issue</SelectItem>
                <SelectItem value="medium">Medium — annoying</SelectItem>
                <SelectItem value="high">High — broken feature</SelectItem>
                <SelectItem value="critical">Critical — site unusable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!user && (
            <div className="space-y-1.5">
              <Label htmlFor="bug-email">Email (optional)</Label>
              <Input
                id="bug-email"
                type="email"
                placeholder="So we can follow up"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
