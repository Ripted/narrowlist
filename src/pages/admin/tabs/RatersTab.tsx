import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2, UserCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import type { AdminState } from "../useAdminState";

export function RatersTab({ a }: { a: AdminState }) {
  const {
    addLevelRater,
    addingRater,
    allProfiles,
    levelRaters,
    newRaterName,
    setDeleteConfirmRater,
    setNewRaterName,
    toggleRaterList,
  } = a;
  const [pickerQuery, setPickerQuery] = useState("");

  const raterUsernames = useMemo(
    () => new Set(levelRaters.map((r) => r.username.toLowerCase())),
    [levelRaters]
  );

  const pickerResults = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    if (!query) return [];
    return allProfiles
      .filter((p) => !raterUsernames.has(p.username.toLowerCase()))
      .filter(
        (p) =>
          p.username.toLowerCase().includes(query) ||
          p.display_name?.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [allProfiles, pickerQuery, raterUsernames]);

  const addFromPicker = (username: string) => {
    setNewRaterName(username);
    setPickerQuery("");
    addLevelRater(username);
  };

  return (
            <TabsContent value="raters" className="space-y-6">
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Add Level Rater
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Level raters can manage only the lists you grant them — nothing else in this panel.
                  Pick a player from their narrowlist profile; if their account is claimed, access
                  activates immediately.
                </p>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players by username or display name..."
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
                {pickerQuery.trim() && (
                  <div className="mt-2 max-w-md rounded-lg border border-border bg-secondary/40 divide-y divide-border overflow-hidden">
                    {pickerResults.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No matching players found.
                      </div>
                    ) : (
                      pickerResults.map((p) => (
                        <div
                          key={p.username}
                          className="flex items-center gap-3 p-2.5 hover:bg-secondary/60 transition-colors"
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={p.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {p.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-foreground truncate">
                              {p.display_name || p.username}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              @{p.username}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addFromPicker(p.username)}
                            disabled={addingRater}
                            className="gap-1 text-xs flex-shrink-0"
                          >
                            <Plus className="w-3 h-3" />
                            {addingRater && newRaterName.toLowerCase() === p.username.toLowerCase()
                              ? "Adding..."
                              : "Add"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
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
                    {levelRaters.map((rater) => {
                      const profile = allProfiles.find(
                        (p) => p.username.toLowerCase() === rater.username.toLowerCase()
                      );
                      return (
                        <div
                          key={rater.id}
                          className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={profile?.avatar_url ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {rater.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <Link
                                to={`/player/${encodeURIComponent(rater.username)}`}
                                className="font-medium text-foreground truncate hover:text-primary transition-colors block"
                              >
                                {profile?.display_name || rater.username}
                              </Link>
                              <div className="text-xs text-muted-foreground truncate">
                                @{rater.username} · {rater.user_id ? "Account linked" : "Not linked to an account"}
                              </div>
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
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
  );
}
