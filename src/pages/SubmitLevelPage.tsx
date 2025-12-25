import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Search, Loader2, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface LevelData {
  name: string;
  author: string;
  thumbnail_url: string | null;
}

interface Submission {
  id: string;
  level_id: string;
  level_name: string | null;
  suggested_rank: number;
  status: string;
  created_at: string;
  admin_note: string | null;
}

export default function SubmitLevelPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [levelId, setLevelId] = useState("");
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [suggestedRank, setSuggestedRank] = useState("");
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({ title: "Sign In Required", description: "Please sign in to submit levels", variant: "destructive" });
      navigate("/auth");
    }
  }, [user, authLoading, navigate, toast]);

  useEffect(() => {
    if (user) {
      fetchMySubmissions();
    }
  }, [user]);

  const fetchMySubmissions = async () => {
    if (!user) return;
    setLoadingSubmissions(true);
    
    const { data, error } = await supabase
      .from("level_submissions")
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setMySubmissions(data);
    }
    setLoadingSubmissions(false);
  };

  const fetchLevelData = async () => {
    if (!levelId.trim()) return;
    
    setFetching(true);
    setFetchError(null);
    setLevelData(null);

    try {
      // Wait 1 second for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(
        `https://api.narrowarrow.xyz/level-details/${levelId.trim()}?isCustomLevel=true`
      );

      if (!response.ok) {
        throw new Error("Level not found. Please check the ID and try again.");
      }

      const data = await response.json();
      
      if (!data.levelInfo) {
        throw new Error("Invalid level data received.");
      }

      setLevelData({
        name: data.levelInfo.name || "Unknown Level",
        author: data.levelInfo.author || "Unknown",
        thumbnail_url: data.levelInfo.thumbnail || null,
      });
    } catch (error: any) {
      setFetchError(error.message || "Failed to fetch level data");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !levelData || !suggestedRank) return;

    const rank = parseInt(suggestedRank);
    if (isNaN(rank) || rank < 1) {
      toast({ title: "Invalid Rank", description: "Please enter a valid rank number", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // Check if level already exists in main list or submissions
      const { data: existingLevel } = await supabase
        .from("levels")
        .select("id")
        .eq("level_id", levelId.trim())
        .maybeSingle();

      if (existingLevel) {
        throw new Error("This level is already in the main list!");
      }

      const { data: existingSubmission } = await supabase
        .from("level_submissions")
        .select("id, status")
        .eq("level_id", levelId.trim())
        .eq("status", "pending")
        .maybeSingle();

      if (existingSubmission) {
        throw new Error("This level already has a pending submission!");
      }

      const { error } = await supabase.from("level_submissions").insert({
        level_id: levelId.trim(),
        level_name: levelData.name,
        author: levelData.author,
        thumbnail_url: levelData.thumbnail_url,
        suggested_rank: rank,
        submitted_by: user.id,
        submitted_by_email: user.email || "unknown",
      });

      if (error) throw error;

      toast({ 
        title: "Submission Sent!", 
        description: "Your level submission is now pending admin review." 
      });

      // Reset form
      setLevelId("");
      setLevelData(null);
      setSuggestedRank("");
      fetchMySubmissions();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "approved":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <main className="relative pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Send className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold">Submit a Level</h1>
          </div>

          <div className="space-y-6">
            {/* Submit Form */}
            <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
              <div>
                <Label htmlFor="levelId">Level ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="levelId"
                    placeholder="Enter level ID (e.g., 1234567890123)"
                    value={levelId}
                    onChange={(e) => {
                      setLevelId(e.target.value);
                      setLevelData(null);
                      setFetchError(null);
                    }}
                    className="flex-1 bg-secondary border-border"
                  />
                  <Button 
                    onClick={fetchLevelData} 
                    disabled={!levelId.trim() || fetching}
                    variant="outline"
                  >
                    {fetching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Fetching State */}
              {fetching && (
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Fetching level data...</span>
                </div>
              )}

              {/* Error State */}
              {fetchError && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-destructive">{fetchError}</span>
                </div>
              )}

              {/* Level Preview */}
              {levelData && (
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
                    {levelData.thumbnail_url && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={levelData.thumbnail_url} 
                          alt={levelData.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-display text-lg font-bold text-foreground">{levelData.name}</div>
                      <div className="text-sm text-muted-foreground">by {levelData.author}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <CheckCircle className="w-4 h-4" />
                      Level found and verified!
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="suggestedRank">Suggested Rank</Label>
                    <Input
                      id="suggestedRank"
                      type="number"
                      min={1}
                      placeholder="Where do you think this level should rank?"
                      value={suggestedRank}
                      onChange={(e) => setSuggestedRank(e.target.value)}
                      className="mt-1 bg-secondary border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Admins may adjust this rank before approval
                    </p>
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    disabled={!suggestedRank || submitting}
                    className="w-full gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Level
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* My Submissions */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/30">
                <h2 className="font-display text-lg font-bold">My Submissions</h2>
              </div>

              {loadingSubmissions ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : mySubmissions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  You haven't submitted any levels yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {mySubmissions.map(submission => (
                    <div key={submission.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">
                          {submission.level_name || submission.level_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Suggested rank: #{submission.suggested_rank} • {new Date(submission.created_at).toLocaleDateString()}
                        </div>
                        {submission.admin_note && (
                          <div className="text-sm text-accent mt-1">
                            Admin note: {submission.admin_note}
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        <span className="capitalize">{submission.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}