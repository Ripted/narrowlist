import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import type { AdminState } from "../useAdminState";

export function DeletedTab({ a }: { a: AdminState }) {
  const {
    deletedLevels,
    levels,
    maskEmail,
    restoreDeletedLevel,
    restoringLevel,
  } = a;
  return (
            <TabsContent value="deleted" className="space-y-6">
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-destructive/10">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2 text-destructive">
                    <RotateCcw className="w-5 h-5" />
                    Deleted Levels (Restorable for 30 days)
                  </h2>
                </div>

                {deletedLevels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No deleted levels to restore.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {deletedLevels.map((level) => (
                      <div key={level.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {level.thumbnail_url && (
                            <img src={level.thumbnail_url} alt="" className="w-12 h-8 rounded object-cover" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">
                              #{level.rank_position} - {level.name || level.level_id}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Deleted by {maskEmail(level.deleted_by_email)} on {new Date(level.deleted_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => restoreDeletedLevel(level)}
                          disabled={restoringLevel === level.id}
                          className="gap-2 flex-shrink-0"
                        >
                          {restoringLevel === level.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
  );
}
