import { List, Loader2, Mail, RotateCcw, Search, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import type { Profile } from "../types";
import type { AdminState } from "../useAdminState";

export function PlayersTab({ a }: { a: AdminState }) {
  const {
    allProfiles,
    approvedPlayers,
    deletedProfileArchive,
    filteredPlayers,
    hardDeleteSearch,
    hardDeleteSelectedId,
    hardDeleting,
    maskEmail,
    mergeDisplayName,
    mergeSourceProfile,
    mergeTargetProfile,
    mergingProfiles,
    playerSearchQuery,
    restoreDeletedProfile,
    restoringArchiveId,
    setHardDeleteConfirmOpen,
    setHardDeleteSearch,
    setHardDeleteSelectedId,
    setMergeConfirmOpen,
    setMergeDisplayName,
    setMergeSourceProfile,
    setMergeTargetProfile,
    setPlayerSearchQuery,
    unlinkPlayer,
  } = a;
  return (
            <TabsContent value="players" className="space-y-6">
              {/* Profile Merge Tool */}
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Merge Duplicate Profiles
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Transfer all completions, runs, and data from one profile to another. The source profile will be deleted.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Source (will be deleted)</Label>
                    <Input
                      placeholder="Source username"
                      value={mergeSourceProfile}
                      onChange={(e) => setMergeSourceProfile(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Target (will keep)</Label>
                    <Input
                      placeholder="Target username"
                      value={mergeTargetProfile}
                      onChange={(e) => setMergeTargetProfile(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">New Display Name (optional)</Label>
                    <Input
                      placeholder="Display name"
                      value={mergeDisplayName}
                      onChange={(e) => setMergeDisplayName(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={() => setMergeConfirmOpen(true)} 
                      disabled={!mergeSourceProfile.trim() || !mergeTargetProfile.trim() || mergingProfiles}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Users className="w-4 h-4" />
                      {mergingProfiles ? "Merging..." : "Merge Profiles"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hard Delete Profile (Moderation) */}
              <div className="rounded-lg bg-card border-2 border-destructive/40 p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-2 flex items-center gap-2 text-destructive">
                  <UserX className="w-5 h-5" />
                  Hard Delete Profile (Moderation)
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Removes the profile and ALL their completions, manual runs, extra completions, claim requests, and watchlist entries.
                  A full snapshot is archived so you can restore later.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Search player (username / display name). List is ranked by total points.
                    </Label>
                    <Input
                      placeholder="Type a username..."
                      value={hardDeleteSearch}
                      onChange={(e) => { setHardDeleteSearch(e.target.value); setHardDeleteSelectedId(null); }}
                      className="bg-secondary border-border"
                    />
                    {(() => {
                      const ranked = [...allProfiles]
                        .sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0))
                        .map((p, i) => ({ ...p, rank: i + 1 }));
                      const q = hardDeleteSearch.trim().toLowerCase();
                      const matches = q
                        ? ranked.filter(p =>
                            p.username.toLowerCase().includes(q) ||
                            (p.display_name || "").toLowerCase().includes(q)
                          ).slice(0, 20)
                        : [];
                      const selected = ranked.find(p => p.id === hardDeleteSelectedId);
                      if (selected) {
                        return (
                          <div className="mt-2 flex items-center justify-between rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm">
                            <span>
                              <span className="font-mono text-primary">#{selected.rank}</span>{" "}
                              <span className="font-medium">@{selected.username}</span>
                              {selected.display_name && selected.display_name !== selected.username && (
                                <span className="text-muted-foreground"> ({selected.display_name})</span>
                              )}
                              <span className="text-muted-foreground"> • {selected.total_points ?? 0} pts</span>
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => { setHardDeleteSelectedId(null); setHardDeleteSearch(""); }}>
                              Change
                            </Button>
                          </div>
                        );
                      }
                      if (!q) return null;
                      if (matches.length === 0) {
                        return <div className="mt-2 text-sm text-muted-foreground">No matches.</div>;
                      }
                      return (
                        <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-border divide-y divide-border">
                          {matches.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { setHardDeleteSelectedId(p.id); setHardDeleteSearch(p.username); }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary/50"
                            >
                              <span className="font-mono text-primary w-12 flex-shrink-0">#{p.rank}</span>
                              <span className="flex-1 truncate">
                                <span className="font-medium">@{p.username}</span>
                                {p.display_name && p.display_name !== p.username && (
                                  <span className="text-muted-foreground"> ({p.display_name})</span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">{p.total_points ?? 0} pts</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      disabled={!hardDeleteSelectedId || hardDeleting}
                      onClick={() => setHardDeleteConfirmOpen(true)}
                    >
                      <UserX className="w-4 h-4" />
                      {hardDeleting ? "Deleting..." : "Delete Profile + All Runs"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Deleted Profiles Archive (Restore) */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-destructive/10 flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2 text-destructive">
                    <RotateCcw className="w-5 h-5" />
                    Deleted Profiles Archive
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                      {deletedProfileArchive.length} archived
                    </span>
                  </h2>
                </div>
                {deletedProfileArchive.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No archived profile deletions.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {deletedProfileArchive.map((a) => (
                      <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">@{a.username}</div>
                          <div className="text-xs text-muted-foreground">
                            Deleted by {a.deleted_by_email || "unknown"} on {new Date(a.deleted_at).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="gap-2 flex-shrink-0"
                          disabled={restoringArchiveId === a.id}
                          onClick={() => restoreDeletedProfile(a.id, a.username)}
                        >
                          {restoringArchiveId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved Players List */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Approved Players
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                      {filteredPlayers.length}{playerSearchQuery ? ` of ${approvedPlayers.length}` : ""} players
                    </span>
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={playerSearchQuery}
                      onChange={(e) => setPlayerSearchQuery(e.target.value)}
                      className="pl-9 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>

                {filteredPlayers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {playerSearchQuery ? "No matching players found." : "No approved players yet."}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredPlayers.map((player) => (
                      <div key={player.id} className="flex items-center gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">
                            {player.display_name || player.username}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>@{player.username}</span>
                            {player.email && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {maskEmail(player.email)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlinkPlayer(player)}
                          className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                        >
                          <UserX className="w-4 h-4" />
                          Unlink
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
  );
}
