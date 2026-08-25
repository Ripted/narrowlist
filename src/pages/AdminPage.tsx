import { Clock, HeartPulse, List, Package, RefreshCw, RotateCcw, Send, Shield, Tag, UserCheck, UserX, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LevelPacksManager } from "@/components/admin/LevelPacksManager";
import { TagPresetsManager } from "@/components/admin/TagPresetsManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Level, Profile } from "./admin/types";
import { useAdminState } from "./admin/useAdminState";
import { SubmissionsTab } from "./admin/tabs/SubmissionsTab";
import { LevelsTab } from "./admin/tabs/LevelsTab";
import { FutureTab } from "./admin/tabs/FutureTab";
import { ExtendedTab } from "./admin/tabs/ExtendedTab";
import { ManualRunsTab } from "./admin/tabs/ManualRunsTab";
import { PlayersTab } from "./admin/tabs/PlayersTab";
import { BansTab } from "./admin/tabs/BansTab";
import { RatersTab } from "./admin/tabs/RatersTab";
import { DeletedTab } from "./admin/tabs/DeletedTab";
import { ChangelogTab } from "./admin/tabs/ChangelogTab";
import { HealthTab } from "./admin/tabs/HealthTab";
import { AdminDialogs } from "./admin/AdminDialogs";

export default function AdminPage() {
  const a = useAdminState();
  const {
    approvedPlayers,
    authLoading,
    bannedUsers,
    canExtra,
    canFuture,
    canMain,
    changelog,
    claimRequests,
    deletedLevels,
    extendedLevels,
    futureLevels,
    handleClaimRequest,
    hasAccess,
    isAdmin,
    levelRaters,
    levelSubmissions,
    levels,
    loading,
    manualRuns,
    processingClaim,
    raterAccess,
    raterLoaded,
    syncing,
    triggerSync,
  } = a;

  if (authLoading || !raterLoaded || (isAdmin && loading)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground hidden md:block">
                  {isAdmin
                    ? "Manage levels, players, and settings"
                    : `Level Rater — ${[
                        raterAccess?.can_main && "Main",
                        raterAccess?.can_future && "Future",
                        raterAccess?.can_extra && "Extra",
                      ].filter(Boolean).join(", ")} list access`}
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={triggerSync}
                  disabled={syncing}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync Now"}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Claim Requests */}
          {isAdmin && claimRequests.length > 0 && (
            <div className="rounded-lg bg-card border border-yellow-500/30 p-4 md:p-6 mb-8">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Profile Claim Requests ({claimRequests.length})
              </h2>
              
              <div className="space-y-3">
                {claimRequests.map(request => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <div className="font-medium text-foreground">
                        {request.profile_display_name || request.profile_username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-green-500 border-green-500/50 hover:bg-green-500/10"
                        onClick={() => handleClaimRequest(request.id, "approved")}
                        disabled={processingClaim === request.id}
                      >
                        <UserCheck className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                        onClick={() => handleClaimRequest(request.id, "rejected")}
                        disabled={processingClaim === request.id}
                      >
                        <UserX className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue={canMain ? "levels" : canFuture ? "future" : "extended"} className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <TabsList className="justify-start overflow-x-auto flex-nowrap gap-1 h-auto p-1.5 bg-card/50 border border-border/60 rounded-xl">
                {isAdmin && (
                  <>
                    <span className="hidden lg:inline px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 self-center">Review</span>
                    <TabsTrigger value="submissions" className="text-xs sm:text-sm gap-1 flex-shrink-0">
                      <Send className="w-3 h-3 hidden sm:inline" />
                      Submissions
                      {levelSubmissions.filter(s => s.status === 'pending').length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-yellow-950 rounded-full">
                          {levelSubmissions.filter(s => s.status === 'pending').length}
                        </span>
                      )}
                    </TabsTrigger>
                    <span className="mx-1 h-6 w-px bg-border self-center flex-shrink-0" />
                  </>
                )}
                <span className="hidden lg:inline px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 self-center">Lists</span>
                {canMain && (
                  <TabsTrigger value="levels" className="text-xs sm:text-sm flex-shrink-0">Main ({levels.length})</TabsTrigger>
                )}
                {canFuture && (
                  <TabsTrigger value="future" className="text-xs sm:text-sm flex-shrink-0">Future ({futureLevels.length})</TabsTrigger>
                )}
                {canExtra && (
                  <TabsTrigger value="extended" className="text-xs sm:text-sm flex-shrink-0">Extra ({extendedLevels.length})</TabsTrigger>
                )}
                {isAdmin && (
                  <>
                    <TabsTrigger value="manual-runs" className="text-xs sm:text-sm flex-shrink-0">Runs ({manualRuns.length})</TabsTrigger>
                    <TabsTrigger value="deleted" className="text-xs sm:text-sm flex-shrink-0 text-muted-foreground data-[state=active]:text-foreground">
                      <RotateCcw className="w-3 h-3 hidden sm:inline" />
                      Deleted ({deletedLevels.length})
                    </TabsTrigger>
                    <span className="mx-1 h-6 w-px bg-border self-center flex-shrink-0" />
                    <span className="hidden lg:inline px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 self-center">Users</span>
                    <TabsTrigger value="players" className="text-xs sm:text-sm flex-shrink-0">Players ({approvedPlayers.length})</TabsTrigger>
                    <TabsTrigger value="bans" className="text-xs sm:text-sm flex-shrink-0">Bans ({bannedUsers.length})</TabsTrigger>
                    <TabsTrigger value="raters" className="text-xs sm:text-sm flex-shrink-0">
                      <UserCheck className="w-3 h-3 hidden sm:inline" />
                      Raters ({levelRaters.length})
                    </TabsTrigger>
                    <span className="mx-1 h-6 w-px bg-border self-center flex-shrink-0" />
                    <span className="hidden lg:inline px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 self-center">System</span>
                    <TabsTrigger value="packs" className="text-xs sm:text-sm flex-shrink-0">
                      <Package className="w-3 h-3 hidden sm:inline" />
                      Packs
                    </TabsTrigger>
                    <TabsTrigger value="tag-presets" className="text-xs sm:text-sm flex-shrink-0">
                      <Tag className="w-3 h-3 hidden sm:inline" />
                      Tag Presets
                    </TabsTrigger>
                    <TabsTrigger value="health" className="text-xs sm:text-sm flex-shrink-0">
                      <HeartPulse className="w-3 h-3 hidden sm:inline" />
                      Health
                    </TabsTrigger>
                    <TabsTrigger value="changelog" className="text-xs sm:text-sm flex-shrink-0">Log</TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            {/* Level Submissions Tab */}
            <SubmissionsTab a={a} />

            <LevelsTab a={a} />

            <FutureTab a={a} />

            {/* Extended List Tab */}
            <ExtendedTab a={a} />


            <ManualRunsTab a={a} />


            <PlayersTab a={a} />

            {/* Bans Tab */}
            <BansTab a={a} />

            {/* Level Raters Tab */}
            <RatersTab a={a} />


            {/* Deleted Levels Tab */}
            <DeletedTab a={a} />

            <TabsContent value="packs" className="space-y-6">
              <LevelPacksManager />
            </TabsContent>

            <TabsContent value="tag-presets" className="space-y-6">
              <TagPresetsManager />
            </TabsContent>



            <HealthTab />

            <ChangelogTab a={a} />
          </Tabs>
        </div>
      </main>
      <AdminDialogs a={a} />
    </div>
  );
}
