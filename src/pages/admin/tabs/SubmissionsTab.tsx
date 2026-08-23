import { Check, Edit2, ExternalLink, FileVideo, MessageSquare, Play, Search, Send, Trash2, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Level } from "../types";
import type { AdminState } from "../useAdminState";

export function SubmissionsTab({ a }: { a: AdminState }) {
  const {
    displaySubmitter,
    editNoteValue,
    editRunNoteValue,
    editingNoteId,
    editingRunNoteId,
    fetchChangelog,
    fetchLevelSubmissions,
    fetchRunSubmissions,
    filteredLevelSubmissions,
    filteredRunSubmissions,
    handleRunSubmissionReview,
    handleSubmissionReview,
    levelSubmissions,
    logAction,
    processingRunSubmission,
    processingSubmission,
    runSubmissionSearchQuery,
    runSubmissions,
    setBanEmail,
    setBanReason,
    setEditNoteValue,
    setEditRunNoteValue,
    setEditingNoteId,
    setEditingRunNoteId,
    setReviewingRunSubmission,
    setReviewingSubmission,
    setRunSubmissionArrow,
    setRunSubmissionDate,
    setRunSubmissionNote,
    setRunSubmissionSearchQuery,
    setRunSubmissionTime,
    setSubmissionNote,
    setSubmissionRank,
    setSubmissionSearchQuery,
    submissionSearchQuery,
    toast,
    updateRunSubmissionNote,
    updateSubmissionNote,
  } = a;
  return (
            <TabsContent value="submissions" className="space-y-6">
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Level Submissions
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                      {levelSubmissions.filter(s => s.status === 'pending').length} pending
                    </span>
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search submissions..."
                      value={submissionSearchQuery}
                      onChange={(e) => setSubmissionSearchQuery(e.target.value)}
                      className="pl-9 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>

                {filteredLevelSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {submissionSearchQuery ? "No matching submissions found." : "No level submissions yet."}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredLevelSubmissions.map(submission => (
                      <div key={submission.id} className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {submission.thumbnail_url && (
                              <div className="w-20 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 hidden sm:block">
                                <img src={submission.thumbnail_url} alt={submission.level_name || ""} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {submission.level_name || submission.level_id}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                by {submission.author || "Unknown"} • Suggested: #{submission.suggested_rank}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Submitted by {displaySubmitter(submission.submitted_by, submission.submitted_by_email)} • {new Date(submission.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {submission.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => {
                                    setReviewingSubmission(submission);
                                    setSubmissionRank(submission.suggested_rank.toString());
                                    setSubmissionNote("");
                                  }}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Review
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-green-500 border-green-500/50 hover:bg-green-500/10"
                                  onClick={() => {
                                    setSubmissionRank(submission.suggested_rank.toString());
                                    handleSubmissionReview(submission.id, "approved");
                                  }}
                                  disabled={processingSubmission === submission.id}
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="hidden sm:inline">Quick Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                                  onClick={() => handleSubmissionReview(submission.id, "rejected")}
                                  disabled={processingSubmission === submission.id}
                                >
                                  <X className="w-4 h-4" />
                                  <span className="hidden sm:inline">Reject</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-muted-foreground"
                                  onClick={async () => {
                                    try {
                                      await supabase
                                        .from("level_submissions")
                                        .update({ status: "read" })
                                        .eq("id", submission.id);
                                      await logAction("Marked level submission as read", `${submission.level_name || submission.level_id} (${displaySubmitter(submission.submitted_by, submission.submitted_by_email)})`);
                                      toast({ title: "Marked as Read" });
                                      fetchLevelSubmissions();
                                      fetchChangelog();
                                    } catch (error) {
                                      toast({ title: "Error", description: error.message, variant: "destructive" });
                                    }
                                  }}
                                  disabled={processingSubmission === submission.id}
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="hidden sm:inline">Read</span>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Select
                                  value={submission.status}
                                  onValueChange={async (newStatus) => {
                                    try {
                                      await supabase
                                        .from("level_submissions")
                                        .update({ status: newStatus })
                                        .eq("id", submission.id);
                                      await logAction("Changed submission status", `${submission.level_name || submission.level_id}: ${submission.status} → ${newStatus}`);
                                      toast({ title: "Status Updated", description: `Changed to ${newStatus}` });
                                      fetchLevelSubmissions();
                                      fetchChangelog();
                                    } catch (error) {
                                      toast({ title: "Error", description: error.message, variant: "destructive" });
                                    }
                                  }}
                                >
                                  <SelectTrigger className={`w-32 h-8 text-sm ${
                                    submission.status === 'approved' 
                                      ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                      : submission.status === 'rejected'
                                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                                        : submission.status === 'read'
                                          ? 'bg-muted/50 text-muted-foreground border-muted'
                                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                  }`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                                {submission.final_rank && (
                                  <span className="text-sm text-muted-foreground">at #{submission.final_rank}</span>
                                )}
                                {submission.submitted_by && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                                    onClick={async () => {
                                      setBanEmail(submission.submitted_by_email);
                                      setBanReason("");
                                    }}
                                  >
                                    <UserX className="w-4 h-4" />
                                    <span className="hidden sm:inline">Ban</span>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={async () => {
                                    if (confirm(`Delete submission for "${submission.level_name || submission.level_id}"?`)) {
                                      try {
                                        await supabase
                                          .from("level_submissions")
                                          .delete()
                                          .eq("id", submission.id);
                                        await logAction("Deleted submission", `${submission.level_name || submission.level_id} (${displaySubmitter(submission.submitted_by, submission.submitted_by_email)})`);
                                        toast({ title: "Submission Deleted" });
                                        fetchLevelSubmissions();
                                        fetchChangelog();
                                      } catch (error) {
                                        toast({ title: "Error", description: error.message, variant: "destructive" });
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Note section with edit capability */}
                        <div className="mt-2">
                          {editingNoteId === submission.id ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                value={editNoteValue}
                                onChange={(e) => setEditNoteValue(e.target.value)}
                                placeholder="Admin note..."
                                className="flex-1 h-8 text-sm bg-secondary border-border"
                              />
                              <Button size="sm" variant="ghost" onClick={() => updateSubmissionNote(submission.id, editNoteValue)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingNoteId(null); setEditNoteValue(""); }}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                              onClick={() => {
                                setEditingNoteId(submission.id);
                                setEditNoteValue(submission.admin_note || "");
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                              {submission.admin_note ? (
                                <span className="text-accent">Note: {submission.admin_note}</span>
                              ) : (
                                <span className="italic">Add note...</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Run Submissions Section */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    Run Submissions
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                      {runSubmissions.filter(s => s.status === 'pending').length} pending
                    </span>
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search run submissions..."
                      value={runSubmissionSearchQuery}
                      onChange={(e) => setRunSubmissionSearchQuery(e.target.value)}
                      className="pl-9 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>

                {filteredRunSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {runSubmissionSearchQuery ? "No matching run submissions found." : "No run submissions yet."}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredRunSubmissions.map(submission => (
                      <div key={submission.id} className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {submission.proof_url && (
                              <a 
                                href={submission.proof_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-20 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 hidden sm:flex items-center justify-center hover:opacity-80 transition-opacity"
                              >
                                <FileVideo className="w-6 h-6 text-muted-foreground" />
                              </a>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                                <span className="truncate">{submission.username}</span>
                                {submission.is_verifier && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Verifier</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Level: {submission.level_name || submission.level_id}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                <span>Submitted by {displaySubmitter(submission.submitted_by, submission.submitted_by_email)}</span>
                                <span>•</span>
                                <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                                <a 
                                  href={submission.proof_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Proof
                                </a>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {submission.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => {
                                    setReviewingRunSubmission(submission);
                                    setRunSubmissionNote("");
                                    setRunSubmissionTime("");
                                    setRunSubmissionArrow("Energy Arrow");
                                    setRunSubmissionDate(new Date().toISOString().split('T')[0]);
                                  }}
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Review
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                                  onClick={() => handleRunSubmissionReview(submission.id, "rejected")}
                                  disabled={processingRunSubmission === submission.id}
                                >
                                  <X className="w-4 h-4" />
                                  <span className="hidden sm:inline">Reject</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-muted-foreground"
                                  onClick={async () => {
                                    try {
                                      await supabase
                                        .from("run_submissions")
                                        .update({ status: "read" })
                                        .eq("id", submission.id);
                                      await logAction("Marked run submission as read", `${submission.username} on ${submission.level_name || submission.level_id}`);
                                      toast({ title: "Marked as Read" });
                                      fetchRunSubmissions();
                                      fetchChangelog();
                                    } catch (error) {
                                      toast({ title: "Error", description: error.message, variant: "destructive" });
                                    }
                                  }}
                                  disabled={processingRunSubmission === submission.id}
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="hidden sm:inline">Read</span>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Select
                                  value={submission.status}
                                  onValueChange={async (newStatus) => {
                                    try {
                                      await supabase
                                        .from("run_submissions")
                                        .update({ status: newStatus })
                                        .eq("id", submission.id);
                                      await logAction("Changed run submission status", `${submission.username} on ${submission.level_name || submission.level_id}: ${submission.status} → ${newStatus}`);
                                      toast({ title: "Status Updated", description: `Changed to ${newStatus}` });
                                      fetchRunSubmissions();
                                      fetchChangelog();
                                    } catch (error) {
                                      toast({ title: "Error", description: error.message, variant: "destructive" });
                                    }
                                  }}
                                >
                                  <SelectTrigger className={`w-32 h-8 text-sm ${
                                    submission.status === 'approved' 
                                      ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                      : submission.status === 'rejected'
                                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                                        : submission.status === 'read'
                                          ? 'bg-muted/50 text-muted-foreground border-muted'
                                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                  }`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={async () => {
                                    if (confirm(`Delete run submission for "${submission.username}"?`)) {
                                      try {
                                        await supabase
                                          .from("run_submissions")
                                          .delete()
                                          .eq("id", submission.id);
                                        await logAction("Deleted run submission", `${submission.username} on ${submission.level_name || submission.level_id}`);
                                        toast({ title: "Run Submission Deleted" });
                                        fetchRunSubmissions();
                                        fetchChangelog();
                                      } catch (error) {
                                        toast({ title: "Error", description: error.message, variant: "destructive" });
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Note section with edit capability */}
                        <div className="mt-2">
                          {editingRunNoteId === submission.id ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                value={editRunNoteValue}
                                onChange={(e) => setEditRunNoteValue(e.target.value)}
                                placeholder="Admin note..."
                                className="flex-1 h-8 text-sm bg-secondary border-border"
                              />
                              <Button size="sm" variant="ghost" onClick={() => updateRunSubmissionNote(submission.id, editRunNoteValue)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingRunNoteId(null); setEditRunNoteValue(""); }}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                              onClick={() => {
                                setEditingRunNoteId(submission.id);
                                setEditRunNoteValue(submission.admin_note || "");
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                              {submission.admin_note ? (
                                <span className="text-accent">Note: {submission.admin_note}</span>
                              ) : (
                                <span className="italic">Add note...</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
  );
}
