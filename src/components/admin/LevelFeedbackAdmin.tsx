import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, X, Trash2, CheckCircle, XCircle, Filter } from "lucide-react";
import { Link } from "react-router-dom";

interface LevelFeedback {
  id: string;
  level_id: string;
  user_id: string;
  rating: string;
  feedback_text: string | null;
  created_at: string;
  level_rank_at_feedback: number | null;
  level_name?: string;
  level_rank?: number;
  user_email?: string;
  user_completed?: boolean;
}

interface LevelSummary {
  level_id: string;
  level_name: string;
  level_rank: number;
  overrated: number;
  fair: number;
  underrated: number;
  not_worthy: number;
  total: number;
}

export function LevelFeedbackAdmin() {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<LevelFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSummary, setShowSummary] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    
    // Fetch all feedback
    const { data: feedbackData, error } = await supabase
      .from("level_feedback")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "Failed to load feedback", variant: "destructive" });
      setLoading(false);
      return;
    }
    
    // Fetch levels to get names and current ranks
    const { data: levels } = await supabase
      .from("levels")
      .select("id, name, rank_position");
    
    const levelMap = new Map(levels?.map(l => [l.id, { name: l.name, rank: l.rank_position }]) || []);
    
    // Get user profiles to check completions
    const userIds = [...new Set(feedbackData?.map(f => f.user_id) || [])];
    
    // Get completions for these users
    const { data: completions } = await supabase
      .from("completions")
      .select("profile_id, level_id")
      .in("profile_id", userIds);
    
    const { data: manualRuns } = await supabase
      .from("manual_runs")
      .select("profile_id, level_id")
      .in("profile_id", userIds);
    
    // Get profiles to map user_id to profile_id
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id")
      .in("user_id", userIds);
    
    const userToProfile = new Map(profiles?.map(p => [p.user_id, p.id]) || []);
    
    // Create a set of "userId-levelId" for completed levels
    const completedSet = new Set<string>();
    completions?.forEach(c => {
      // Find user_id from profile_id
      for (const [userId, profileId] of userToProfile) {
        if (profileId === c.profile_id) {
          completedSet.add(`${userId}-${c.level_id}`);
        }
      }
    });
    manualRuns?.forEach(r => {
      for (const [userId, profileId] of userToProfile) {
        if (profileId === r.profile_id) {
          completedSet.add(`${userId}-${r.level_id}`);
        }
      }
    });
    
    // Enrich feedback data
    const enrichedFeedback = feedbackData?.map(f => {
      const levelInfo = levelMap.get(f.level_id);
      return {
        ...f,
        level_name: levelInfo?.name || "Unknown Level",
        level_rank: levelInfo?.rank,
        user_completed: completedSet.has(`${f.user_id}-${f.level_id}`),
      };
    }) || [];
    
    setFeedback(enrichedFeedback);
    setLoading(false);
  };

  const deleteFeedback = async (id: string) => {
    const { error } = await supabase
      .from("level_feedback")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete feedback", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Feedback removed" });
      setFeedback(prev => prev.filter(f => f.id !== id));
    }
  };

  // Calculate summary data
  const summaryData = useMemo(() => {
    const levelStats = new Map<string, LevelSummary>();
    
    feedback.forEach(f => {
      if (!levelStats.has(f.level_id)) {
        levelStats.set(f.level_id, {
          level_id: f.level_id,
          level_name: f.level_name || "Unknown",
          level_rank: f.level_rank || 0,
          overrated: 0,
          fair: 0,
          underrated: 0,
          not_worthy: 0,
          total: 0,
        });
      }
      
      const stats = levelStats.get(f.level_id)!;
      stats.total++;
      if (f.rating === "overrated") stats.overrated++;
      if (f.rating === "fair") stats.fair++;
      if (f.rating === "underrated") stats.underrated++;
      if (f.rating === "not_worthy") stats.not_worthy++;
    });
    
    return Array.from(levelStats.values()).sort((a, b) => a.level_rank - b.level_rank);
  }, [feedback]);

  // Filter feedback
  const filteredFeedback = useMemo(() => {
    return feedback.filter(f => {
      if (ratingFilter !== "all" && f.rating !== ratingFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!f.level_name?.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [feedback, ratingFilter, searchQuery]);

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case "overrated": return <ThumbsDown className="w-4 h-4 text-destructive" />;
      case "fair": return <Minus className="w-4 h-4 text-muted-foreground" />;
      case "underrated": return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case "not_worthy": return <X className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case "overrated": return "Overrated";
      case "fair": return "Fair";
      case "underrated": return "Underrated";
      case "not_worthy": return "Not Worthy";
      default: return rating;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "overrated": return "text-destructive bg-destructive/10";
      case "fair": return "text-muted-foreground bg-muted";
      case "underrated": return "text-green-500 bg-green-500/10";
      case "not_worthy": return "text-destructive bg-destructive/10";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading feedback...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div 
          className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between cursor-pointer"
          onClick={() => setShowSummary(!showSummary)}
        >
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Feedback Summary
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
              {feedback.length} total
            </span>
          </h2>
          <Button variant="ghost" size="sm">
            {showSummary ? "Hide" : "Show"}
          </Button>
        </div>
        
        {showSummary && (
          <div className="p-4 overflow-x-auto">
            {summaryData.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">No feedback data yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Rank</th>
                    <th className="text-left py-2 px-2">Level</th>
                    <th className="text-center py-2 px-2">
                      <ThumbsDown className="w-4 h-4 text-destructive mx-auto" />
                    </th>
                    <th className="text-center py-2 px-2">
                      <Minus className="w-4 h-4 text-muted-foreground mx-auto" />
                    </th>
                    <th className="text-center py-2 px-2">
                      <ThumbsUp className="w-4 h-4 text-green-500 mx-auto" />
                    </th>
                    <th className="text-center py-2 px-2">
                      <X className="w-4 h-4 text-destructive mx-auto" />
                    </th>
                    <th className="text-center py-2 px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map(level => (
                    <tr key={level.level_id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="py-2 px-2 font-mono">#{level.level_rank}</td>
                      <td className="py-2 px-2">
                        <Link 
                          to={`/level/${level.level_id}`}
                          className="text-primary hover:underline"
                        >
                          {level.level_name}
                        </Link>
                      </td>
                      <td className="text-center py-2 px-2">
                        {level.overrated > 0 && (
                          <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                            {level.overrated}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2">
                        {level.fair > 0 && (
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {level.fair}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2">
                        {level.underrated > 0 && (
                          <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500">
                            {level.underrated}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2">
                        {level.not_worthy > 0 && (
                          <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                            {level.not_worthy}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2 font-medium">{level.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Individual Feedback */}
      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-primary" />
            All Feedback
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by level name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="overrated">Overrated</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="underrated">Underrated</SelectItem>
                <SelectItem value="not_worthy">Not Worthy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredFeedback.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No feedback found.
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {filteredFeedback.map(f => (
              <div key={f.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{f.level_rank}
                      </span>
                      <Link 
                        to={`/level/${f.level_id}`}
                        className="font-medium text-primary hover:underline truncate"
                      >
                        {f.level_name}
                      </Link>
                      <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getRatingColor(f.rating)}`}>
                        {getRatingIcon(f.rating)}
                        {getRatingLabel(f.rating)}
                      </span>
                      {f.user_completed ? (
                        <span className="px-2 py-0.5 rounded text-xs flex items-center gap-1 bg-green-500/10 text-green-500">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs flex items-center gap-1 bg-yellow-500/10 text-yellow-500">
                          <XCircle className="w-3 h-3" />
                          Not Completed
                        </span>
                      )}
                    </div>
                    {f.feedback_text && (
                      <p className="text-sm text-muted-foreground mt-2 bg-secondary/30 p-2 rounded">
                        {f.feedback_text}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(f.created_at).toLocaleDateString()}
                      {f.level_rank_at_feedback && f.level_rank && f.level_rank_at_feedback !== f.level_rank && (
                        <span className="ml-2 text-yellow-500">
                          (was #{f.level_rank_at_feedback} when submitted)
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFeedback(f.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
