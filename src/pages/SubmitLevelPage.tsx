import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Search, Loader2, CheckCircle, Clock, XCircle, AlertCircle, Ban, Play, Image, Upload } from "lucide-react";

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

interface RunSubmission {
  id: string;
  level_id: string;
  level_name: string | null;
  username: string;
  is_verifier: boolean;
  proof_url: string;
  status: string;
  created_at: string;
  admin_note: string | null;
}

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_HOURS = 24;

export default function SubmitLevelPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Level submission state
  const [levelId, setLevelId] = useState("");
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [suggestedRank, setSuggestedRank] = useState("");
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [recentSubmissionCount, setRecentSubmissionCount] = useState(0);

  // Run submission state
  const [runLevelId, setRunLevelId] = useState("");
  const [runLevelData, setRunLevelData] = useState<LevelData | null>(null);
  const [runUsername, setRunUsername] = useState("");
  const [isVerifier, setIsVerifier] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [fetchingRun, setFetchingRun] = useState(false);
  const [submittingRun, setSubmittingRun] = useState(false);
  const [runFetchError, setRunFetchError] = useState<string | null>(null);
  const [myRunSubmissions, setMyRunSubmissions] = useState<RunSubmission[]>([]);
  const [recentRunSubmissionCount, setRecentRunSubmissionCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({ title: "Sign In Required", description: "Please sign in to submit", variant: "destructive" });
      navigate("/auth");
    }
  }, [user, authLoading, navigate, toast]);

  useEffect(() => {
    if (user) {
      fetchMySubmissions();
      fetchMyRunSubmissions();
      checkBanStatus();
      checkRateLimit();
      checkRunRateLimit();
    }
  }, [user]);

  const checkBanStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("submission_banned_users")
      .select("reason")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setIsBanned(true);
      setBanReason(data.reason);
    }
  };

  const checkRateLimit = async () => {
    if (!user) return;
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - RATE_LIMIT_HOURS);
    
    const { count } = await supabase
      .from("level_submissions")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by", user.id)
      .gte("created_at", cutoffTime.toISOString());
    
    setRecentSubmissionCount(count || 0);
  };

  const checkRunRateLimit = async () => {
    if (!user) return;
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - RATE_LIMIT_HOURS);
    
    const { count } = await supabase
      .from("run_submissions")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by", user.id)
      .gte("created_at", cutoffTime.toISOString());
    
    setRecentRunSubmissionCount(count || 0);
  };

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

  const fetchMyRunSubmissions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("run_submissions")
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setMyRunSubmissions(data as RunSubmission[]);
    }
  };

  const fetchLevelData = async () => {
    if (!levelId.trim()) return;
    
    setFetching(true);
    setFetchError(null);
    setLevelData(null);

    try {
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

  const fetchRunLevelData = async () => {
    if (!runLevelId.trim()) return;
    
    setFetchingRun(true);
    setRunFetchError(null);
    setRunLevelData(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(
        `https://api.narrowarrow.xyz/level-details/${runLevelId.trim()}?isCustomLevel=true`
      );

      if (!response.ok) {
        throw new Error("Level not found. Please check the ID and try again.");
      }

      const data = await response.json();
      
      if (!data.levelInfo) {
        throw new Error("Invalid level data received.");
      }

      setRunLevelData({
        name: data.levelInfo.name || "Unknown Level",
        author: data.levelInfo.author || "Unknown",
        thumbnail_url: data.levelInfo.thumbnail || null,
      });
    } catch (error: any) {
      setRunFetchError(error.message || "Failed to fetch level data");
    } finally {
      setFetchingRun(false);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid File", description: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File Too Large", description: "Max file size is 5MB", variant: "destructive" });
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !levelData || !suggestedRank) return;

    if (isBanned) {
      toast({ title: "Banned", description: "You are banned from submitting", variant: "destructive" });
      return;
    }

    if (recentSubmissionCount >= RATE_LIMIT_COUNT) {
      toast({ 
        title: "Rate Limited", 
        description: `You can only submit ${RATE_LIMIT_COUNT} levels per ${RATE_LIMIT_HOURS} hours`, 
        variant: "destructive" 
      });
      return;
    }

    const rank = parseInt(suggestedRank);
    if (isNaN(rank) || rank < 1) {
      toast({ title: "Invalid Rank", description: "Please enter a valid rank number", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
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

      setLevelId("");
      setLevelData(null);
      setSuggestedRank("");
      fetchMySubmissions();
      checkRateLimit();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunSubmit = async () => {
    if (!user || !runLevelData || !runUsername.trim() || !proofFile) return;

    if (isBanned) {
      toast({ title: "Banned", description: "You are banned from submitting", variant: "destructive" });
      return;
    }

    if (recentRunSubmissionCount >= RATE_LIMIT_COUNT) {
      toast({ 
        title: "Rate Limited", 
        description: `You can only submit ${RATE_LIMIT_COUNT} runs per ${RATE_LIMIT_HOURS} hours`, 
        variant: "destructive" 
      });
      return;
    }

    setSubmittingRun(true);

    try {
      // Check for existing pending submission
      const { data: existingSubmission } = await supabase
        .from("run_submissions")
        .select("id")
        .eq("level_id", runLevelId.trim())
        .eq("username", runUsername.trim())
        .eq("status", "pending")
        .maybeSingle();

      if (existingSubmission) {
        throw new Error("This run already has a pending submission!");
      }

      // Upload proof image
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `run-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, proofFile);

      if (uploadError) throw new Error("Failed to upload proof image");

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      const { error } = await supabase.from("run_submissions").insert({
        level_id: runLevelId.trim(),
        level_name: runLevelData.name,
        username: runUsername.trim(),
        is_verifier: isVerifier,
        proof_url: urlData.publicUrl,
        submitted_by: user.id,
        submitted_by_email: user.email || "unknown",
      });

      if (error) throw error;

      toast({ 
        title: "Run Submitted!", 
        description: "Your run submission is now pending admin review." 
      });

      // Reset form
      setRunLevelId("");
      setRunLevelData(null);
      setRunUsername("");
      setIsVerifier(false);
      setProofFile(null);
      setProofPreview(null);
      fetchMyRunSubmissions();
      checkRunRateLimit();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingRun(false);
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
            <h1 className="font-display text-2xl md:text-3xl font-bold">Submit</h1>
          </div>

          {/* Ban Notice */}
          {isBanned && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-6">
              <Ban className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-destructive">You are banned from submitting</div>
                {banReason && (
                  <div className="text-sm text-destructive/80 mt-1">Reason: {banReason}</div>
                )}
              </div>
            </div>
          )}

          <Tabs defaultValue="levels" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="levels">Submit Level</TabsTrigger>
              <TabsTrigger value="runs">Submit Run</TabsTrigger>
            </TabsList>

            {/* Level Submissions Tab */}
            <TabsContent value="levels" className="space-y-6">
              {/* Rate Limit Notice */}
              {!isBanned && recentSubmissionCount >= RATE_LIMIT_COUNT && (
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-500">Rate limit reached</div>
                    <div className="text-sm text-yellow-500/80 mt-1">
                      You can only submit {RATE_LIMIT_COUNT} levels per {RATE_LIMIT_HOURS} hours.
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Form */}
              <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
                {!isBanned && recentSubmissionCount < RATE_LIMIT_COUNT && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Submissions: {recentSubmissionCount}/{RATE_LIMIT_COUNT} used (resets in {RATE_LIMIT_HOURS}h)
                  </div>
                )}
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
                      disabled={isBanned || recentSubmissionCount >= RATE_LIMIT_COUNT}
                    />
                    <Button 
                      onClick={fetchLevelData} 
                      disabled={!levelId.trim() || fetching || isBanned || recentSubmissionCount >= RATE_LIMIT_COUNT}
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

                {fetching && (
                  <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Fetching level data...</span>
                  </div>
                )}

                {fetchError && (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <span className="text-destructive">{fetchError}</span>
                  </div>
                )}

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

              {/* My Level Submissions */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold">My Level Submissions</h2>
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
            </TabsContent>

            {/* Run Submissions Tab */}
            <TabsContent value="runs" className="space-y-6">
              {/* Rate Limit Notice */}
              {!isBanned && recentRunSubmissionCount >= RATE_LIMIT_COUNT && (
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-500">Rate limit reached</div>
                    <div className="text-sm text-yellow-500/80 mt-1">
                      You can only submit {RATE_LIMIT_COUNT} runs per {RATE_LIMIT_HOURS} hours.
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Run Form */}
              <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
                {!isBanned && recentRunSubmissionCount < RATE_LIMIT_COUNT && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Submissions: {recentRunSubmissionCount}/{RATE_LIMIT_COUNT} used (resets in {RATE_LIMIT_HOURS}h)
                  </div>
                )}

                <div>
                  <Label htmlFor="runLevelId">Level ID</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="runLevelId"
                      placeholder="Enter level ID"
                      value={runLevelId}
                      onChange={(e) => {
                        setRunLevelId(e.target.value);
                        setRunLevelData(null);
                        setRunFetchError(null);
                      }}
                      className="flex-1 bg-secondary border-border"
                      disabled={isBanned || recentRunSubmissionCount >= RATE_LIMIT_COUNT}
                    />
                    <Button 
                      onClick={fetchRunLevelData} 
                      disabled={!runLevelId.trim() || fetchingRun || isBanned || recentRunSubmissionCount >= RATE_LIMIT_COUNT}
                      variant="outline"
                    >
                      {fetchingRun ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {fetchingRun && (
                  <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">Fetching level data...</span>
                  </div>
                )}

                {runFetchError && (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <span className="text-destructive">{runFetchError}</span>
                  </div>
                )}

                {runLevelData && (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
                      {runLevelData.thumbnail_url && (
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={runLevelData.thumbnail_url} 
                            alt={runLevelData.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-display text-lg font-bold text-foreground">{runLevelData.name}</div>
                        <div className="text-sm text-muted-foreground">by {runLevelData.author}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        Level found!
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="runUsername">Your Narrow Arrow Username</Label>
                      <Input
                        id="runUsername"
                        placeholder="Enter your in-game username"
                        value={runUsername}
                        onChange={(e) => setRunUsername(e.target.value)}
                        className="mt-1 bg-secondary border-border"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isVerifier"
                        checked={isVerifier}
                        onCheckedChange={(checked) => setIsVerifier(checked === true)}
                      />
                      <Label htmlFor="isVerifier" className="text-sm cursor-pointer">
                        This is a verifier run (first completion)
                      </Label>
                    </div>

                    <div>
                      <Label>Proof Screenshot</Label>
                      <div className="mt-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleProofFileChange}
                          className="hidden"
                        />
                        {proofPreview ? (
                          <div className="space-y-2">
                            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                              <img 
                                src={proofPreview} 
                                alt="Proof preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full gap-2"
                            >
                              <Image className="w-4 h-4" />
                              Change Image
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-32 border-dashed gap-2"
                          >
                            <Upload className="w-5 h-5" />
                            Upload Proof Screenshot
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Screenshot showing completion. Max 5MB.
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleRunSubmit} 
                      disabled={!runUsername.trim() || !proofFile || submittingRun}
                      className="w-full gap-2"
                    >
                      {submittingRun ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Submit Run
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* My Run Submissions */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold">My Run Submissions</h2>
                </div>

                {myRunSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    You haven't submitted any runs yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {myRunSubmissions.map(submission => (
                      <div key={submission.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">
                            {submission.level_name || submission.level_id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Player: {submission.username} {submission.is_verifier && "(Verifier)"} • {new Date(submission.created_at).toLocaleDateString()}
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}