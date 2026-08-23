import { Trash2, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import type { AdminState } from "../useAdminState";

export function RatersTab({ a }: { a: AdminState }) {
  const {
    addLevelRater,
    addingRater,
    levelRaters,
    newRaterName,
    setDeleteConfirmRater,
    setNewRaterName,
    toggleRaterList,
  } = a;
  return (
            <TabsContent value="raters" className="space-y-6">
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Add Level Rater
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Level raters can manage only the lists you grant them — nothing else in this panel.
                  The username must match an existing narrowlist player profile; if the account is
                  claimed, access activates immediately.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Enter username"
                    value={newRaterName}
                    onChange={(e) => setNewRaterName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLevelRater()}
                    className="flex-1 bg-secondary border-border"
                  />
                  <Button onClick={addLevelRater} disabled={addingRater || !newRaterName.trim()}>
                    {addingRater ? "Adding..." : "Add Rater"}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Level Raters
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                      {levelRaters.length} {levelRaters.length === 1 ? "rater" : "raters"}
                    </span>
                  </h2>
                </div>

                {levelRaters.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No level raters yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      <span>Rater</span>
                      <span className="w-16 text-center">Main</span>
                      <span className="w-16 text-center">Future</span>
                      <span className="w-16 text-center">Extra</span>
                      <span className="w-10" />
                    </div>
                    {levelRaters.map((rater) => (
                      <div
                        key={rater.id}
                        className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{rater.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {rater.user_id ? "Account linked" : "Not linked to an account"}
                          </div>
                        </div>
                        {(["can_main", "can_future", "can_extra"] as const).map((field) => (
                          <div key={field} className="w-16 flex flex-col items-center gap-1">
                            <input
                              type="checkbox"
                              checked={rater[field]}
                              onChange={() => toggleRaterList(rater, field)}
                              className="h-4 w-4 accent-primary cursor-pointer"
                              title={`${field.replace("can_", "")} list access`}
                            />
                            <span className="text-[10px] uppercase text-muted-foreground sm:hidden">
                              {field.replace("can_", "")}
                            </span>
                          </div>
                        ))}
                        <div className="w-10 flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmRater(rater)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Remove rater"
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
