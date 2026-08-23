import { History } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import type { AdminState } from "../useAdminState";

export function ChangelogTab({ a }: { a: AdminState }) {
  const {
    changelog,
    maskEmail,
  } = a;
  return (
            <TabsContent value="changelog" className="space-y-6">
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Admin Changelog
                  </h2>
                </div>

                {changelog.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No actions logged yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                    {changelog.map((entry) => (
                      <div key={entry.id} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground">
                              {entry.action}
                            </div>
                            {entry.details && (
                              <div className="text-sm text-muted-foreground truncate">
                                {entry.details}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm text-foreground">{maskEmail(entry.admin_email)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
  );
}
