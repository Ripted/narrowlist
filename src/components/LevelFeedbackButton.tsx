import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, X, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface LevelFeedbackButtonProps {
  levelDbId: string;
  levelRank: number;
}

type FeedbackRating = "overrated" | "fair" | "underrated" | "not_worthy";

export function LevelFeedbackButton({ levelDbId, levelRank }: LevelFeedbackButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<FeedbackRating | "">("");
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<{ id: string; rating: FeedbackRating; feedback_text: string | null } | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadExistingFeedback();
    }
  }, [user, open, levelDbId]);

  const loadExistingFeedback = async () => {
    if (!user) return;
    setLoadingExisting(true);
    
    const { data } = await supabase
      .from("level_feedback")
      .select("id, rating, feedback_text")
      .eq("level_id", levelDbId)
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setExistingFeedback(data as { id: string; rating: FeedbackRating; feedback_text: string | null });
      setRating(data.rating as FeedbackRating);
      setFeedbackText(data.feedback_text || "");
    } else {
      setExistingFeedback(null);
      setRating("");
      setFeedbackText("");
    }
    setLoadingExisting(false);
  };

  const handleSubmit = async () => {
    if (!user || !rating) return;
    setLoading(true);

    try {
      if (existingFeedback) {
        const { error } = await supabase
          .from("level_feedback")
          .update({
            rating,
            feedback_text: feedbackText || null,
            level_rank_at_feedback: levelRank,
          })
          .eq("id", existingFeedback.id);
        
        if (error) throw error;
        toast({ title: "Feedback Updated", description: "Your feedback has been updated" });
      } else {
        const { error } = await supabase.from("level_feedback").insert({
          level_id: levelDbId,
          user_id: user.id,
          rating,
          feedback_text: feedbackText || null,
          level_rank_at_feedback: levelRank,
        });
        
        if (error) throw error;
        toast({ title: "Feedback Submitted", description: "Thank you for your feedback!" });
      }
      
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingFeedback) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("level_feedback")
        .delete()
        .eq("id", existingFeedback.id);
      
      if (error) throw error;
      
      toast({ title: "Feedback Removed" });
      setExistingFeedback(null);
      setRating("");
      setFeedbackText("");
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getRatingLabel = (r: FeedbackRating) => {
    switch (r) {
      case "overrated": return "Overrated";
      case "fair": return "Fairly Rated";
      case "underrated": return "Underrated";
      case "not_worthy": return "Not Worth Being on List";
    }
  };

  const getRatingIcon = (r: FeedbackRating) => {
    switch (r) {
      case "overrated": return <ThumbsDown className="w-4 h-4" />;
      case "fair": return <Minus className="w-4 h-4" />;
      case "underrated": return <ThumbsUp className="w-4 h-4" />;
      case "not_worthy": return <X className="w-4 h-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Feedback</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Rate This Level</h4>
            {existingFeedback && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="text-destructive hover:text-destructive h-auto p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {loadingExisting ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <RadioGroup value={rating} onValueChange={(v) => setRating(v as FeedbackRating)}>
                {(["overrated", "fair", "underrated", "not_worthy"] as FeedbackRating[]).map((r) => (
                  <div key={r} className="flex items-center space-x-2">
                    <RadioGroupItem value={r} id={r} />
                    <Label htmlFor={r} className="flex items-center gap-2 cursor-pointer text-sm">
                      {getRatingIcon(r)}
                      {getRatingLabel(r)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="space-y-2">
                <Label htmlFor="feedback-text" className="text-sm">Additional Feedback (optional)</Label>
                <Textarea
                  id="feedback-text"
                  placeholder="Share your thoughts about this level's placement..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="min-h-[80px] text-sm"
                  maxLength={500}
                />
              </div>
              
              <Button 
                onClick={handleSubmit} 
                disabled={!rating || loading}
                className="w-full"
                size="sm"
              >
                {loading ? "Saving..." : existingFeedback ? "Update Feedback" : "Submit Feedback"}
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
