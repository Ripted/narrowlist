import { Edit2, History, List, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import type { AdminState } from "../useAdminState";

export function ManualRunsTab({ a }: { a: AdminState }) {
  const {
    manualRuns,
    maskEmail,
    openAddManualRun,
    openEditManualRun,
    setDeleteConfirmManualRun,
  } = a;
  return (
            <TabsContent value="manual-runs" className="space-y-6">
              {/* Add Manual Run */}
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    Manual Runs
                  </h2>
                  <Button onClick={openAddManualRun} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Run
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add runs that are not tracked in the API (e.g., old records, removed runs). These will show in leaderboards with a special note.
                </p>
              </div>

              {/* Manual Runs List */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Added Runs ({manualRuns.length})
                  </h2>
                </div>

                {manualRuns.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No manual runs added yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {manualRuns.map((run) => (
                      <div key={run.id} className="flex items-center gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {run.profile_username}
                            {run.is_verifier && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Verifier</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {run.level_name} • {run.completion_time}s • {run.arrow_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Completed: {new Date(run.completed_at).toLocaleDateString()} • Added by: {maskEmail(run.added_by_admin_email)}
                            {run.note && <span className="ml-2 italic">• {run.note}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditManualRun(run)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmManualRun(run)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
  );
}
