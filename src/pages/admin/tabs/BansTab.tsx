import { List, UserCheck, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import type { AdminState } from "../useAdminState";

export function BansTab({ a }: { a: AdminState }) {
  const {
    addingBan,
    banEmail,
    banReason,
    banUserFromSubmissions,
    bannedUsers,
    displaySubmitter,
    levels,
    maskEmail,
    setBanEmail,
    setBanReason,
    unbanUser,
  } = a;
  return (
            <TabsContent value="bans" className="space-y-6">
              {/* Add Ban Form */}
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <UserX className="w-5 h-5 text-destructive" />
                  Ban User from Submissions
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="User email"
                    value={banEmail}
                    onChange={(e) => setBanEmail(e.target.value)}
                    className="flex-1 bg-secondary border-border"
                  />
                  <Input
                    placeholder="Reason (optional)"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="flex-1 bg-secondary border-border"
                  />
                  <Button 
                    onClick={banUserFromSubmissions} 
                    disabled={!banEmail.trim() || addingBan}
                    variant="destructive"
                  >
                    {addingBan ? "Banning..." : "Ban User"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Rate limit: Users can only submit 3 levels per 24 hours.
                </p>
              </div>

              {/* Banned Users List */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <UserX className="w-5 h-5 text-destructive" />
                    Banned Users
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                      {bannedUsers.length} banned
                    </span>
                  </h2>
                </div>

                {bannedUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No banned users.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {bannedUsers.map((banned) => (
                      <div key={banned.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">{displaySubmitter(banned.user_id, banned.email)}</div>
                          {banned.reason && (
                            <div className="text-sm text-muted-foreground">Reason: {banned.reason}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Banned by {maskEmail(banned.banned_by_email)} • {new Date(banned.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-500 border-green-500/50 hover:bg-green-500/10"
                          onClick={() => unbanUser(banned)}
                        >
                          <UserCheck className="w-4 h-4" />
                          Unban
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
  );
}
