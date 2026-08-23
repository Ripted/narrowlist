import { ITEMS_PER_PAGE } from "./utils";
import { Check, Clipboard, List, Search, Send, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { extractLevelId } from "@/lib/extractLevelId";
import type { AdminLevelApiResponse, AdminListRpcArgs, AdminListRpcName, AdminListRpcResult, ApprovedPlayer, BannedUser, ChangelogEntry, ClaimRequest, DeletedLevel, DeletedProfileArchive, ExtendedLevel, FutureLevel, Level, LevelRater, LevelSubmission, ManualRun, Profile, RaterAccess, RunSubmission } from "./types";

export function useAdminState() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [raterAccess, setRaterAccess] = useState<RaterAccess | null>(null);
  const [raterLoaded, setRaterLoaded] = useState(false);
  const [levelRaters, setLevelRaters] = useState<LevelRater[]>([]);
  const [newRaterName, setNewRaterName] = useState("");
  const [addingRater, setAddingRater] = useState(false);
  const [deleteConfirmRater, setDeleteConfirmRater] = useState<LevelRater | null>(null);

  const [levels, setLevels] = useState<Level[]>([]);
  const [futureLevels, setFutureLevels] = useState<FutureLevel[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<ApprovedPlayer[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [manualRuns, setManualRuns] = useState<ManualRun[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [levelSubmissions, setLevelSubmissions] = useState<LevelSubmission[]>([]);
  const [runSubmissions, setRunSubmissions] = useState<RunSubmission[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [deletedLevels, setDeletedLevels] = useState<DeletedLevel[]>([]);
  const [extendedLevels, setExtendedLevels] = useState<ExtendedLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoringLevel, setRestoringLevel] = useState<string | null>(null);
  
  // Extended list form
  const [newExtendedLevelId, setNewExtendedLevelId] = useState("");
  const [newExtendedLevelRank, setNewExtendedLevelRank] = useState("");
  const [addingExtendedLevel, setAddingExtendedLevel] = useState(false);
  const [extendedSearchQuery, setExtendedSearchQuery] = useState("");
  const [fetchingExtendedLevelInfo, setFetchingExtendedLevelInfo] = useState(false);
  const [extendedLevelPreview, setExtendedLevelPreview] = useState<{ name: string; author: string } | null>(null);
  const [extendedRankInputId, setExtendedRankInputId] = useState<string | null>(null);
  const [extendedRankInputValue, setExtendedRankInputValue] = useState("");
  const [extendedRankConfirmLevel, setExtendedRankConfirmLevel] = useState<ExtendedLevel | null>(null);
  const [pendingExtendedRank, setPendingExtendedRank] = useState<number | null>(null);
  const [uploadingExtendedRowThumb, setUploadingExtendedRowThumb] = useState<string | null>(null);
  // Removed: hardfixing state (hardfix button removed)
  
  // Submission review
  const [reviewingSubmission, setReviewingSubmission] = useState<LevelSubmission | null>(null);
  const [submissionRank, setSubmissionRank] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionTargetList, setSubmissionTargetList] = useState<"main" | "extra" | "future">("main");
  const [processingSubmission, setProcessingSubmission] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  
  // Move confirmation dialogs
  const [moveToMainConfirm, setMoveToMainConfirm] = useState<ExtendedLevel | null>(null);
  const [moveToExtraConfirm, setMoveToExtraConfirm] = useState<Level | null>(null);
  
  // Run submission review
  const [reviewingRunSubmission, setReviewingRunSubmission] = useState<RunSubmission | null>(null);
  const [runSubmissionNote, setRunSubmissionNote] = useState("");
  const [runSubmissionTime, setRunSubmissionTime] = useState("");
  const [runSubmissionArrow, setRunSubmissionArrow] = useState("Energy Arrow");
  const [runSubmissionDate, setRunSubmissionDate] = useState("");
  const [processingRunSubmission, setProcessingRunSubmission] = useState<string | null>(null);
  const [editingRunNoteId, setEditingRunNoteId] = useState<string | null>(null);
  const [editRunNoteValue, setEditRunNoteValue] = useState("");
  // Ban form
  const [banEmail, setBanEmail] = useState("");
  const [banReason, setBanReason] = useState("");
  const [addingBan, setAddingBan] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  
  // Search filters
  const [levelSearchQuery, setLevelSearchQuery] = useState("");
  const [submissionSearchQuery, setSubmissionSearchQuery] = useState("");
  const [runSubmissionSearchQuery, setRunSubmissionSearchQuery] = useState("");
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [futureSearchQuery, setFutureSearchQuery] = useState("");
  
  // New level form with rank
  const [newLevelId, setNewLevelId] = useState("");
  const [newLevelRank, setNewLevelRank] = useState("");
  const [addingLevel, setAddingLevel] = useState(false);
  
  // Future level form
  const [newFutureLevelId, setNewFutureLevelId] = useState("");
  const [newFutureLevelRank, setNewFutureLevelRank] = useState("");
  const [addingFutureLevel, setAddingFutureLevel] = useState(false);
  
  
  // Edit modal
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [editName, setEditName] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCreators, setEditCreators] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editVerifier, setEditVerifier] = useState<string>("");
  const [editAlternativeIds, setEditAlternativeIds] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // Delete confirmation
  const [deleteConfirmLevel, setDeleteConfirmLevel] = useState<Level | null>(null);
  const [deleteConfirmFutureLevel, setDeleteConfirmFutureLevel] = useState<FutureLevel | null>(null);
  const [deleteConfirmManualRun, setDeleteConfirmManualRun] = useState<ManualRun | null>(null);
  
  // Edit future level
  const [editingFutureLevel, setEditingFutureLevel] = useState<FutureLevel | null>(null);
  const [editFutureName, setEditFutureName] = useState("");
  const [editFutureAuthor, setEditFutureAuthor] = useState("");
  const [editFutureRank, setEditFutureRank] = useState("");
  const [editFuturePoints, setEditFuturePoints] = useState("");
  const [editFutureThumbnail, setEditFutureThumbnail] = useState("");
  const [editFutureDescription, setEditFutureDescription] = useState("");
  const [savingFutureLevel, setSavingFutureLevel] = useState(false);
  const [uploadingFutureThumbnail, setUploadingFutureThumbnail] = useState(false);
  const editFutureThumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Edit extended level
  const [editingExtendedLevel, setEditingExtendedLevel] = useState<ExtendedLevel | null>(null);
  const [editExtendedName, setEditExtendedName] = useState("");
  const [editExtendedAuthor, setEditExtendedAuthor] = useState("");
  const [editExtendedCreators, setEditExtendedCreators] = useState("");
  const [editExtendedRank, setEditExtendedRank] = useState("");
  const [editExtendedThumbnail, setEditExtendedThumbnail] = useState("");
  const [editExtendedVerifier, setEditExtendedVerifier] = useState("none");
  const [editExtendedAlternativeIds, setEditExtendedAlternativeIds] = useState("");
  const [editExtendedDescription, setEditExtendedDescription] = useState("");
  const [savingExtendedLevel, setSavingExtendedLevel] = useState(false);
  const [uploadingExtendedThumbnail, setUploadingExtendedThumbnail] = useState(false);
  const editExtendedThumbnailInputRef = useRef<HTMLInputElement>(null);
  const [syncingExtraCompletions, setSyncingExtraCompletions] = useState(false);
  
  // Manual run list type
  const [manualRunListType, setManualRunListType] = useState<"main" | "extra">("main");
  
  // Quick rank change
  const [rankInputId, setRankInputId] = useState<string | null>(null);
  const [rankInputValue, setRankInputValue] = useState("");
  
  // Quick thumbnail edit
  const [thumbnailEditId, setThumbnailEditId] = useState<string | null>(null);
  const [thumbnailInputValue, setThumbnailInputValue] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState<string | null>(null);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);
  
  // Drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Future list inline editing & drag state
  const [futureRankInputId, setFutureRankInputId] = useState<string | null>(null);
  const [futureRankInputValue, setFutureRankInputValue] = useState("");
  const [futureThumbnailEditId, setFutureThumbnailEditId] = useState<string | null>(null);
  const [futureThumbnailInputValue, setFutureThumbnailInputValue] = useState("");
  const [uploadingFutureRowThumbnail, setUploadingFutureRowThumbnail] = useState<string | null>(null);
  const [futureDraggedIndex, setFutureDraggedIndex] = useState<number | null>(null);
  const [futureDragOverIndex, setFutureDragOverIndex] = useState<number | null>(null);
  const [savingFuture, setSavingFuture] = useState(false);
  
  // Claim requests
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [processingClaim, setProcessingClaim] = useState<string | null>(null);
  
  // Manual run form
  const [addManualRunOpen, setAddManualRunOpen] = useState(false);
  const [editingManualRun, setEditingManualRun] = useState<ManualRun | null>(null);
  const [manualRunLevel, setManualRunLevel] = useState("");
  const [manualRunProfile, setManualRunProfile] = useState("");
  const [manualRunTime, setManualRunTime] = useState("");
  const [manualRunArrow, setManualRunArrow] = useState("Energy Arrow");
  const [manualRunVerifier, setManualRunVerifier] = useState(false);
  const [manualRunDate, setManualRunDate] = useState("");
  const [manualRunNote, setManualRunNote] = useState("");
  const [manualRunProofUrl, setManualRunProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [addingManualRun, setAddingManualRun] = useState(false);
  const manualRunProofInputRef = useRef<HTMLInputElement>(null);
  
  
  // Rank confirmation dialog
  const [rankConfirmLevel, setRankConfirmLevel] = useState<Level | null>(null);
  const [pendingNewRank, setPendingNewRank] = useState<number | null>(null);
  
  // Bulk tag manager
  const [bulkTagManagerOpen, setBulkTagManagerOpen] = useState(false);
  
  // Profile merge state
  const [mergeSourceProfile, setMergeSourceProfile] = useState("");
  const [mergeTargetProfile, setMergeTargetProfile] = useState("");
  const [mergeDisplayName, setMergeDisplayName] = useState("");
  const [mergingProfiles, setMergingProfiles] = useState(false);
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);

  // Hard delete profile (moderation)
  const [hardDeleteSearch, setHardDeleteSearch] = useState("");
  const [hardDeleteSelectedId, setHardDeleteSelectedId] = useState<string | null>(null);
  const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);
  const [hardDeleting, setHardDeleting] = useState(false);
  const [deletedProfileArchive, setDeletedProfileArchive] = useState<DeletedProfileArchive[]>([]);
  const [restoringArchiveId, setRestoringArchiveId] = useState<string | null>(null);

  // Load the current user's level-rater access (non-admin staff role)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRaterAccess(null);
      setRaterLoaded(true);
      return;
    }
    supabase
      .from("level_raters")
      .select("can_main, can_future, can_extra")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRaterAccess(data ?? null);
        setRaterLoaded(true);
      });
  }, [user, authLoading]);

  const canMain = isAdmin || !!raterAccess?.can_main;
  const canFuture = isAdmin || !!raterAccess?.can_future;
  const canExtra = isAdmin || !!raterAccess?.can_extra;
  const isRater = !isAdmin && !!(raterAccess && (raterAccess.can_main || raterAccess.can_future || raterAccess.can_extra));
  const hasAccess = isAdmin || isRater;

  useEffect(() => {
    if (!authLoading && raterLoaded && !hasAccess) {
      toast({ title: "Access Denied", description: "Admin privileges required", variant: "destructive" });
      navigate("/");
    }
  }, [hasAccess, authLoading, raterLoaded, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchLevels();
      fetchFutureLevels();
      fetchExtendedLevels();
      fetchClaimRequests();
      fetchApprovedPlayers();
      fetchChangelog();
      fetchManualRuns();
      fetchAllProfiles();
      fetchLevelSubmissions();
      fetchRunSubmissions();
      fetchBannedUsers();
      fetchDeletedLevels();
      fetchDeletedProfileArchive();
      fetchLevelRaters();
    } else if (raterAccess) {
      // Level raters only load the lists they manage
      if (raterAccess.can_main) fetchLevels();
      if (raterAccess.can_future) fetchFutureLevels();
      if (raterAccess.can_extra) fetchExtendedLevels();
      fetchChangelog();
    }
  }, [isAdmin, raterAccess]);

  const fetchLevelRaters = async () => {
    const { data } = await supabase
      .from("level_raters")
      .select("*")
      .order("username", { ascending: true });
    if (data) setLevelRaters(data as LevelRater[]);
  };

  const addLevelRater = async () => {
    const username = newRaterName.trim();
    if (!username) return;
    setAddingRater(true);
    try {
      // Raters must correspond to a real narrowlist profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("username", username)
        .maybeSingle();

      if (!profile) {
        toast({
          title: "Unknown player",
          description: `No narrowlist profile named "${username}" exists. Raters must be real players on the list.`,
          variant: "destructive",
        });
        return;
      }

      if (!profile.user_id) {
        toast({
          title: "Profile not claimed",
          description: `"${username}" hasn't claimed their account yet — rater added but unlinked.`,
        });
      }

      const { error } = await supabase.from("level_raters").insert({
        username,
        user_id: profile?.user_id ?? null,
      });
      if (error) throw error;
      if (!profile.user_id) {
        toast({
          title: "Rater added (unlinked)",
          description: `"${username}" hasn't claimed their account — access activates once they do.`,
        });
      } else {
        toast({ title: "Rater added", description: `${username} can now be granted list access.` });
      }
      await logAction("Added level rater", username);
      setNewRaterName("");
      fetchLevelRaters();
      fetchChangelog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add rater";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setAddingRater(false);
    }
  };

  const toggleRaterList = async (rater: LevelRater, field: "can_main" | "can_future" | "can_extra") => {
    const next = { ...rater, [field]: !rater[field] };
    setLevelRaters((prev) => prev.map((r) => (r.id === rater.id ? next : r)));
    const { error } = await supabase
      .from("level_raters")
      .update({ [field]: !rater[field] })
      .eq("id", rater.id);
    if (error) {
      setLevelRaters((prev) => prev.map((r) => (r.id === rater.id ? rater : r)));
      toast({ title: "Error", description: "Failed to update rater access", variant: "destructive" });
      return;
    }
    await logAction(
      "Updated level rater",
      `${rater.username}: ${field.replace("can_", "")} ${!rater[field] ? "granted" : "revoked"}`,
    );
    fetchChangelog();
  };

  const removeLevelRater = async () => {
    if (!deleteConfirmRater) return;
    const { error } = await supabase.from("level_raters").delete().eq("id", deleteConfirmRater.id);
    if (error) {
      toast({ title: "Error", description: "Failed to remove rater", variant: "destructive" });
    } else {
      await logAction("Removed level rater", deleteConfirmRater.username);
      toast({ title: "Removed", description: `${deleteConfirmRater.username} is no longer a level rater` });
      fetchLevelRaters();
      fetchChangelog();
    }
    setDeleteConfirmRater(null);
  };


  const sendAdminNotification = async (
    eventType: string,
    levelName: string,
    oldRank?: number,
    newRank?: number,
    listType?: string,
    action?: string,
    levelDetails?: { level_id?: string; thumbnail_url?: string | null; author?: string | null; rank_position?: number; points?: number }
  ) => {
    try {
      await supabase.functions.invoke("admin-notify", {
        body: {
          event_type: eventType,
          admin_email: user?.email || "unknown",
          level_name: levelName,
          old_rank: oldRank,
          new_rank: newRank,
          list_type: listType || "Main",
          action: action || eventType,
          ...levelDetails,
        },
      });
    } catch (error) {
      console.error("Admin notification failed:", error);
    }
  };

  const fetchExtendedLevels = async () => {
    const { data } = await supabase
      .from("extended_levels")
      .select("*")
      .order("rank_position");
    
    if (data) setExtendedLevels(data as ExtendedLevel[]);
  };

  const fetchDeletedLevels = async () => {
    const { data } = await supabase
      .from("deleted_levels")
      .select("*")
      .order("deleted_at", { ascending: false });
    
    if (data) setDeletedLevels(data as DeletedLevel[]);
  };

  const restoreDeletedLevel = async (deletedLevel: DeletedLevel) => {
    setRestoringLevel(deletedLevel.id);
    try {
      // Insert back into levels table
      const { error: insertError } = await supabase
        .from("levels")
        .insert({
          level_id: deletedLevel.level_id,
          name: deletedLevel.name,
          author: deletedLevel.author,
          rank_position: deletedLevel.rank_position,
          points: deletedLevel.points,
          thumbnail_url: deletedLevel.thumbnail_url,
          alternative_ids: deletedLevel.alternative_ids,
          verifier_profile_id: deletedLevel.verifier_profile_id,
        });
      
      if (insertError) throw insertError;
      
      // Remove from deleted_levels
      const { error: deleteError } = await supabase
        .from("deleted_levels")
        .delete()
        .eq("id", deletedLevel.id);
      
      if (deleteError) throw deleteError;
      
      await logAction("Restored deleted level", `${deletedLevel.name || deletedLevel.level_id} at rank #${deletedLevel.rank_position}`);
      toast({ title: "Level Restored", description: `${deletedLevel.name || deletedLevel.level_id} has been restored` });
      
      fetchLevels();
      fetchDeletedLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Restore Failed", description: error.message, variant: "destructive" });
    } finally {
      setRestoringLevel(null);
    }
  };

  // Extended List functions
  const fetchExtendedLevelPreview = async (levelId: string) => {
    const cleanLevelId = extractLevelId(levelId);
    if (!cleanLevelId.trim()) {
      setExtendedLevelPreview(null);
      return;
    }
    setFetchingExtendedLevelInfo(true);
    try {
      const response = await fetch(`https://api.narrowarrow.xyz/level-details/${encodeURIComponent(cleanLevelId)}?isCustomLevel=true`);
      if (response.ok) {
        const data = await response.json();
        setExtendedLevelPreview({
          name: data.levelInfo?.name || "Unknown",
          author: data.levelInfo?.author || "Unknown",
        });
      } else {
        setExtendedLevelPreview(null);
      }
    } catch {
      setExtendedLevelPreview(null);
    } finally {
      setFetchingExtendedLevelInfo(false);
    }
  };

  const cleanLevelIdText = (value: string) => extractLevelId(value).trim();

  const handleLevelIdPaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    setter: (value: string) => void,
    afterClean?: (value: string) => void,
  ) => {
    const pasted = event.clipboardData.getData("text");
    const cleaned = cleanLevelIdText(pasted);
    if (!cleaned || cleaned === pasted.trim()) return;
    event.preventDefault();
    setter(cleaned);
    afterClean?.(cleaned);
  };

  const fetchLevelDetailsForAdmin = async (levelId: string) => {
    const response = await fetch(`https://api.narrowarrow.xyz/level-details/${encodeURIComponent(levelId)}?isCustomLevel=true`);
    if (!response.ok) throw new Error("Level not found");
    return response.json() as Promise<AdminLevelApiResponse>;
  };

  const callAdminListRpc = (name: AdminListRpcName, args: AdminListRpcArgs): AdminListRpcResult => {
    // Call via supabase.rpc to preserve `this` binding (avoids "reading 'rest'" error)
    return (supabase.rpc as unknown as (name: AdminListRpcName, args: AdminListRpcArgs) => AdminListRpcResult).call(supabase, name, args);
  };

;

;

;

  // Hardfix function removed - functionality covered by Sync Completions button

  const addExtendedLevel = async () => {
    const levelId = cleanLevelIdText(newExtendedLevelId);
    if (!levelId) return;
    setAddingExtendedLevel(true);

    try {
      setNewExtendedLevelId(levelId);
      const targetRank = parseInt(newExtendedLevelRank) || extendedLevels.length + 1;

      // Validate target rank
      if (targetRank < 1 || targetRank > extendedLevels.length + 1) {
        throw new Error(`Rank must be between 1 and ${extendedLevels.length + 1}`);
      }

      // Use preview data if available, otherwise fetch fresh
      let levelData: AdminLevelApiResponse | null = null;
      if (extendedLevelPreview) {
        levelData = { levelInfo: extendedLevelPreview };
      } else {
        levelData = await fetchLevelDetailsForAdmin(levelId);
      }

      const { error } = await callAdminListRpc("admin_add_extra_level", {
        _level_id: levelId,
        _name: levelData?.levelInfo?.name || null,
        _author: levelData?.levelInfo?.author || null,
        _rank_position: targetRank,
        _thumbnail_url: levelData?.levelInfo?.thumbnail_url || `https://api.narrowarrow.xyz/level-image/${levelId}.png`,
      });

      if (error) throw error;

      const levelName = levelData?.levelInfo?.name || levelId;
      await logAction("Added extra level", `${levelName} at rank #${targetRank}`);
      
      // Send webhook notification
      await sendAdminNotification("extra_level_added", levelName, undefined, targetRank, "Extra", "added", {
        level_id: levelId,
        thumbnail_url: levelData?.levelInfo?.thumbnail_url || `https://api.narrowarrow.xyz/level-image/${levelId}.png`,
        author: levelData?.levelInfo?.author || null,
        rank_position: targetRank,
      });
      
      toast({ title: "Success", description: `Extra level added at rank #${targetRank}` });
      setNewExtendedLevelId("");
      setNewExtendedLevelRank("");
      setExtendedLevelPreview(null);
      fetchExtendedLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAddingExtendedLevel(false);
    }
  };

  const moveExtendedLevel = async (index: number, direction: "up" | "down") => {
    const newLevels = [...extendedLevels];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newLevels.length) return;
    
    // Swap positions
    const currentLevel = newLevels[index];
    const swapLevel = newLevels[targetIndex];
    
    try {
      const oldRank = currentLevel.rank_position;
      const newRank = swapLevel.rank_position;
      // Park current at a temporary value to avoid UNIQUE(rank_position) collision
      const tempRank = -Math.abs(oldRank) - 1000000;
      await supabase.from("extended_levels").update({ rank_position: tempRank }).eq("id", currentLevel.id);
      await supabase.from("extended_levels").update({ rank_position: oldRank }).eq("id", swapLevel.id);
      await supabase.from("extended_levels").update({ rank_position: newRank }).eq("id", currentLevel.id);

      await logAction("Moved extra level", `${currentLevel.name || currentLevel.level_id} ${direction}`);
      await sendAdminNotification("rank_change", currentLevel.name || currentLevel.level_id, oldRank, newRank, "Extra", "moved", currentLevel);
      fetchExtendedLevels();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const syncExtraCompletions = async () => {
    setSyncingExtraCompletions(true);
    try {
      const response = await supabase.functions.invoke("sync-extra-completions");
      if (response.error) throw response.error;
      
      await logAction("Synced extra completions", "Manual sync triggered");
      toast({ 
        title: "Sync Complete", 
        description: `Extra completions synced. ${response.data?.newCompletions || 0} new completions added.` 
      });
      fetchChangelog();
    } catch (error) {
      toast({ title: "Sync Failed", description: error.message || "Failed to sync extra completions", variant: "destructive" });
    } finally {
      setSyncingExtraCompletions(false);
    }
  };

  const deleteExtendedLevel = async (level: ExtendedLevel) => {
    try {
      const { error } = await supabase
        .from("extended_levels")
        .delete()
        .eq("id", level.id);

      if (error) throw error;

      // Re-rank remaining extended levels sequentially
      const remaining = extendedLevels
        .filter(l => l.id !== level.id)
        .sort((a, b) => a.rank_position - b.rank_position);
      
      for (let i = 0; i < remaining.length; i++) {
        const newRank = i + 1;
        if (remaining[i].rank_position !== newRank) {
          await supabase
            .from("extended_levels")
            .update({ rank_position: newRank })
            .eq("id", remaining[i].id);
        }
      }

      await logAction("Deleted extra level", level.name || level.level_id);
      await sendAdminNotification("extra_level_deleted", level.name || level.level_id, level.rank_position, undefined, "Extra", "deleted", level);
      toast({ title: "Deleted", description: "Extra level removed and ranks updated" });
      fetchExtendedLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateExtendedRanksSafely = async (updated: ExtendedLevel[]) => {
    for (let i = 0; i < updated.length; i++) {
      await supabase
        .from("extended_levels")
        .update({ rank_position: -(i + 1) - 100000 })
        .eq("id", updated[i].id);
    }

    for (let i = 0; i < updated.length; i++) {
      const newRank = i + 1;
      await supabase
        .from("extended_levels")
        .update({ rank_position: newRank, points: calculateExtraPoints(newRank) })
        .eq("id", updated[i].id);
    }
  };

  const startExtendedRankEdit = (level: ExtendedLevel) => {
    setExtendedRankInputId(level.id);
    setExtendedRankInputValue(String(level.rank_position));
  };

  const confirmExtendedRankChange = () => {
    if (!extendedRankInputId) return;
    const newRank = parseInt(extendedRankInputValue);
    if (isNaN(newRank) || newRank < 1 || newRank > extendedLevels.length) {
      toast({ title: "Invalid rank", description: `Enter a number between 1 and ${extendedLevels.length}`, variant: "destructive" });
      return;
    }
    const level = extendedLevels.find((l) => l.id === extendedRankInputId);
    if (!level) return;
    if (level.rank_position === newRank) {
      setExtendedRankInputId(null);
      return;
    }
    setExtendedRankConfirmLevel(level);
    setPendingExtendedRank(newRank);
  };

  const executeExtendedRankChange = async () => {
    if (!extendedRankConfirmLevel || pendingExtendedRank === null) return;
    const sorted = [...extendedLevels].sort((a, b) => a.rank_position - b.rank_position);
    const currentIndex = sorted.findIndex((l) => l.id === extendedRankConfirmLevel.id);
    if (currentIndex === -1) return;
    const oldRank = extendedRankConfirmLevel.rank_position;
    const [moved] = sorted.splice(currentIndex, 1);
    sorted.splice(pendingExtendedRank - 1, 0, moved);

    try {
      await updateExtendedRanksSafely(sorted);
      await logAction("Changed extra level rank", `${extendedRankConfirmLevel.name || extendedRankConfirmLevel.level_id} from #${oldRank} to #${pendingExtendedRank}`);
      await sendAdminNotification("rank_change", extendedRankConfirmLevel.name || extendedRankConfirmLevel.level_id, oldRank, pendingExtendedRank, "Extra", "moved", extendedRankConfirmLevel);
      toast({ title: "Saved", description: "Extra list rankings updated" });
      fetchExtendedLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setExtendedRankInputId(null);
      setExtendedRankConfirmLevel(null);
      setPendingExtendedRank(null);
    }
  };

  const saveExtendedRowThumbnail = async (levelId: string, file: File) => {
    setUploadingExtendedRowThumb(levelId);
    try {
      const fileName = `extended-${levelId}-${Date.now()}.${file.name.split(".").pop()}`;
      const { data, error } = await supabase.storage.from("level-thumbnails").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("level-thumbnails").getPublicUrl(data.path);
      const { error: updErr } = await supabase.from("extended_levels").update({ thumbnail_url: publicUrl }).eq("id", levelId);
      if (updErr) throw updErr;
      setExtendedLevels((prev) => prev.map((l) => (l.id === levelId ? { ...l, thumbnail_url: publicUrl } : l)));
      toast({ title: "Success", description: "Thumbnail updated" });
    } catch (err) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingExtendedRowThumb(null);
    }
  };

  const handleQuickExtendedThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, levelId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await saveExtendedRowThumbnail(levelId, file);
    e.target.value = "";
  };

  const handleQuickPasteExtendedThumbnail = async (levelId: string) => {
    const file = await readImageFromClipboard();
    if (!file) return;
    await saveExtendedRowThumbnail(levelId, file);
  };


  const transferExtendedToMain = async (level: ExtendedLevel) => {
    try {
      // Get the next rank in main list
      const targetRank = levels.length + 1;

      // Insert into main levels
      const { error: insertError } = await supabase.from("levels").insert({
        level_id: level.level_id,
        name: level.name,
        author: level.author,
        creators: level.creators,
        rank_position: targetRank,
        points: 1, // Will be auto-calculated by trigger
        thumbnail_url: level.thumbnail_url,
      });

      if (insertError) throw insertError;

      // Delete from extended
      const { error: deleteError } = await supabase
        .from("extended_levels")
        .delete()
        .eq("id", level.id);

      if (deleteError) throw deleteError;

      const levelName = level.name || level.level_id;
      await logAction("Transferred to main list", `${levelName} moved to main list at rank #${targetRank}`);
      
      // Send webhook notification
      await sendAdminNotification("extra_to_main", levelName, level.rank_position, targetRank, "Extra", "transferred to Main", level);
      
      toast({ title: "Success", description: `${levelName} moved to main list` });
      fetchLevels();
      fetchExtendedLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const transferMainToExtended = async (level: Level) => {
    try {
      const targetRank = extendedLevels.length + 1;

      const { error: insertError } = await callAdminListRpc("admin_add_extra_level", {
        _level_id: level.level_id,
        _name: level.name,
        _author: level.author,
        _rank_position: targetRank,
        _thumbnail_url: level.thumbnail_url,
      });

      if (insertError) throw insertError;

      // Store the level's original_id to clean up deleted_levels after
      const originalLevelId = level.id;

      // Delete from main list (this will trigger archiving to deleted_levels)
      const { error: deleteError } = await supabase
        .from("levels")
        .delete()
        .eq("id", level.id);

      if (deleteError) throw deleteError;

      // Remove from deleted_levels since this is a transfer, not a deletion
      await supabase
        .from("deleted_levels")
        .delete()
        .eq("original_id", originalLevelId);

      // Re-rank remaining main list levels
      const remainingLevels = levels.filter(l => l.id !== level.id).sort((a, b) => a.rank_position - b.rank_position);
      for (let i = 0; i < remainingLevels.length; i++) {
        const newRank = i + 1;
        if (remainingLevels[i].rank_position !== newRank) {
          await supabase
            .from("levels")
            .update({ rank_position: newRank, points: calculatePoints(newRank) })
            .eq("id", remainingLevels[i].id);
        }
      }

      await logAction("Transferred to extra list", `${level.name || level.level_id} moved to extra list at rank #${targetRank}`);
      await sendAdminNotification("level_to_extended", level.name || level.level_id, level.rank_position, targetRank, "Main", "transferred to Extra", level);
      toast({ title: "Success", description: `${level.name || level.level_id} moved to extra list` });
      fetchLevels();
      fetchExtendedLevels();
      fetchDeletedLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const logAction = async (action: string, details?: string) => {
    if (!user) return;
    await supabase.from("admin_changelog").insert({
      admin_user_id: user.id,
      admin_email: user.email || "unknown",
      action,
      details,
    });
  };

  const fetchChangelog = async () => {
    const { data } = await supabase
      .from("admin_changelog")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (data) setChangelog(data);
  };

  const fetchManualRuns = async () => {
    const { data } = await supabase
      .from("manual_runs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Resolve level names from BOTH main and extra tables based on list_type
      const mainIds = Array.from(new Set(data.filter(r => r.list_type !== "extra").map(r => r.level_id)));
      const extraIds = Array.from(new Set(data.filter(r => r.list_type === "extra").map(r => r.level_id)));
      const profileIds = Array.from(new Set(data.map(r => r.profile_id)));

      const [mainLevels, extraLevels, profilesRes] = await Promise.all([
        mainIds.length ? supabase.from("levels").select("id, name, level_id").in("id", mainIds) : Promise.resolve({ data: [] as never[] }),
        extraIds.length ? supabase.from("extended_levels").select("id, name, level_id").in("id", extraIds) : Promise.resolve({ data: [] as never[] }),
        profileIds.length ? supabase.from("profiles").select("id, username").in("id", profileIds) : Promise.resolve({ data: [] as never[] }),
      ]);

      const mainMap = new Map((mainLevels.data || []).map((l) => [l.id, l]));
      const extraMap = new Map((extraLevels.data || []).map((l) => [l.id, l]));
      const profMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));

      const enrichedRuns = data.map((run) => {
        const lvl = run.list_type === "extra" ? extraMap.get(run.level_id) : mainMap.get(run.level_id);
        return {
          ...run,
          level_name: lvl?.name || lvl?.level_id || "Unknown Level",
          profile_username: profMap.get(run.profile_id)?.username || "Unknown Player",
        };
      });

      setManualRuns(enrichedRuns);
    }
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, total_points, extra_points, user_id")
      .order("username");
    
    if (data) setAllProfiles(data);
  };

  const fetchDeletedProfileArchive = async () => {
    const { data, error } = await supabase
      .from("deleted_profiles_archive")
      .select("id, original_profile_id, username, deleted_by_email, deleted_at, restored_at")
      .is("restored_at", null)
      .order("deleted_at", { ascending: false });
    if (!error && data) setDeletedProfileArchive(data as DeletedProfileArchive[]);
  };

  const hardDeleteProfile = async () => {
    if (!hardDeleteSelectedId) return;
    setHardDeleting(true);
    try {
      const target = allProfiles.find(p => p.id === hardDeleteSelectedId);
      const { error } = await supabase.rpc("admin_hard_delete_profile", { _profile_id: hardDeleteSelectedId });
      if (error) throw error;
      await logAction("Hard-deleted profile", `${target?.username || hardDeleteSelectedId}`);
      toast({ title: "Profile deleted", description: `${target?.username || hardDeleteSelectedId} and all their runs were removed. Restorable from the archive.` });
      setHardDeleteSelectedId(null);
      setHardDeleteSearch("");
      setHardDeleteConfirmOpen(false);
      fetchAllProfiles();
      fetchApprovedPlayers();
      fetchManualRuns();
      fetchDeletedProfileArchive();
    } catch (err) {
      toast({ title: "Delete failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setHardDeleting(false);
    }
  };

  const restoreDeletedProfile = async (archiveId: string, username: string) => {
    setRestoringArchiveId(archiveId);
    try {
      const { error } = await supabase.rpc("admin_restore_profile", { _archive_id: archiveId });
      if (error) throw error;
      await logAction("Restored profile", username);
      toast({ title: "Profile restored", description: `${username} was restored with all their runs.` });
      fetchAllProfiles();
      fetchApprovedPlayers();
      fetchManualRuns();
      fetchDeletedProfileArchive();
    } catch (err) {
      toast({ title: "Restore failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setRestoringArchiveId(null);
    }
  };

  const fetchLevelSubmissions = async () => {
    const { data } = await supabase
      .from("level_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setLevelSubmissions(data);
  };

  const fetchBannedUsers = async () => {
    const { data } = await supabase
      .from("submission_banned_users")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setBannedUsers(data);
  };

  const fetchRunSubmissions = async () => {
    const { data } = await supabase
      .from("run_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setRunSubmissions(data);
  };

  const updateRunSubmissionNote = async (submissionId: string, note: string) => {
    try {
      const { error } = await supabase
        .from("run_submissions")
        .update({ admin_note: note || null })
        .eq("id", submissionId);
      
      if (error) throw error;
      
      toast({ title: "Note Updated" });
      setEditingRunNoteId(null);
      setEditRunNoteValue("");
      fetchRunSubmissions();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRunSubmissionReview = async (submissionId: string, action: "approved" | "rejected") => {
    const submission = runSubmissions.find(s => s.id === submissionId);
    if (!submission || !user) return;

    setProcessingRunSubmission(submissionId);

    try {
      if (action === "approved") {
        // Find profile by username
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", submission.username.trim())
          .maybeSingle();
        
        if (!profile) {
          throw new Error(`Player "${submission.username}" not found. Please create the profile first.`);
        }
        
        // Find level by level_id
        const { data: level } = await supabase
          .from("levels")
          .select("id, name, rank_position")
          .eq("level_id", submission.level_id)
          .maybeSingle();
        
        if (!level) {
          throw new Error(`Level "${submission.level_id}" not found in the main list.`);
        }

        // Create manual run
        const completionTime = parseFloat(runSubmissionTime) || 0;
        const completedDate = runSubmissionDate || new Date().toISOString().split('T')[0];

        const { data: insertedRun, error: insertError } = await supabase.from("manual_runs").insert({
          level_id: level.id,
          profile_id: profile.id,
          completion_time: completionTime,
          arrow_name: runSubmissionArrow,
          is_verifier: submission.is_verifier,
          completed_at: new Date(completedDate).toISOString(),
          note: runSubmissionNote || `Submitted via run submission`,
          proof_url: submission.proof_url,
          added_by_admin_id: user.id,
          added_by_admin_email: user.email || "unknown",
        }).select("id").single();

        if (insertError) throw insertError;

        // Send Discord notification
        try {
          await supabase.functions.invoke("discord-notify", {
            body: {
              webhook_type: level.rank_position <= 100 ? "main_completions" : "extended_completions",
              completion_type: "manual_run",
              completion_id: insertedRun?.id || `run-${Date.now()}`,
              profile_id: profile.id,
              level_id: level.id,
              player_name: submission.username,
              level_name: level.name || submission.level_name || "Unknown Level",
              level_rank: level.rank_position,
              completion_time: completionTime,
              arrow_name: runSubmissionArrow,
              is_verifier: submission.is_verifier,
            },
          });
        } catch (discordError) {
          console.error("Discord notification failed:", discordError);
          // Don't throw - the run was approved, just notification failed
        }

        await logAction("Approved run submission", `${submission.username} on ${level.name || submission.level_id} (submitted by ${displaySubmitter(submission.submitted_by, submission.submitted_by_email)})`);
        toast({ title: "Run Approved", description: `Added as manual run for ${submission.username}` });
        fetchManualRuns();
      } else {
        await logAction("Rejected run submission", `${submission.username} on ${submission.level_name || submission.level_id} (submitted by ${displaySubmitter(submission.submitted_by, submission.submitted_by_email)})`);
        toast({ title: "Run Rejected" });
      }

      // Update submission status
      await supabase
        .from("run_submissions")
        .update({ 
          status: action,
          admin_note: runSubmissionNote || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", submissionId);

      setReviewingRunSubmission(null);
      setRunSubmissionNote("");
      setRunSubmissionTime("");
      setRunSubmissionArrow("Energy Arrow");
      setRunSubmissionDate("");
      fetchRunSubmissions();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingRunSubmission(null);
    }
  };

  const updateRunSubmission = async (submissionId: string, updates: Partial<RunSubmission>) => {
    try {
      const { error } = await supabase
        .from("run_submissions")
        .update(updates)
        .eq("id", submissionId);
      
      if (error) throw error;
      
      toast({ title: "Submission Updated" });
      fetchRunSubmissions();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const banUserFromSubmissions = async () => {
    if (!banEmail.trim() || !user) return;
    setAddingBan(true);
    
    try {
      // Find user by email in level_submissions
      const { data: submissions } = await supabase
        .from("level_submissions")
        .select("submitted_by")
        .eq("submitted_by_email", banEmail.trim())
        .limit(1);
      
      if (!submissions || submissions.length === 0 || !submissions[0].submitted_by) {
        throw new Error("No user found with this email in submissions");
      }
      
      const { error } = await supabase.from("submission_banned_users").insert({
        user_id: submissions[0].submitted_by,
        email: banEmail.trim(),
        reason: banReason || null,
        banned_by: user.id,
        banned_by_email: user.email || "unknown",
      });
      
      if (error) {
        if (error.code === '23505') throw new Error("User is already banned");
        throw error;
      }
      
      await logAction("Banned user from submissions", `${banEmail.trim()}${banReason ? ` - ${banReason}` : ""}`);
      toast({ title: "User Banned", description: "User can no longer submit levels" });
      setBanEmail("");
      setBanReason("");
      fetchBannedUsers();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAddingBan(false);
    }
  };

  const unbanUser = async (banned: BannedUser) => {
    try {
      const { error } = await supabase
        .from("submission_banned_users")
        .delete()
        .eq("id", banned.id);
      
      if (error) throw error;
      
      await logAction("Unbanned user from submissions", banned.email);
      toast({ title: "User Unbanned", description: "User can now submit levels again" });
      fetchBannedUsers();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateSubmissionNote = async (submissionId: string, note: string) => {
    try {
      const { error } = await supabase
        .from("level_submissions")
        .update({ admin_note: note || null })
        .eq("id", submissionId);
      
      if (error) throw error;
      
      toast({ title: "Note Updated" });
      setEditingNoteId(null);
      setEditNoteValue("");
      fetchLevelSubmissions();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmissionReview = async (submissionId: string, action: "approved" | "rejected") => {
    const submission = levelSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    setProcessingSubmission(submissionId);

    try {
      if (action === "approved") {
        const rank = parseInt(submissionRank) || submission.suggested_rank;
        const targetList = submissionTargetList;
        
        if (targetList === "main") {
          const { error: insertError } = await callAdminListRpc("admin_add_main_level", {
            _level_id: cleanLevelIdText(submission.level_id),
            _name: submission.level_name,
            _author: submission.author,
            _rank_position: rank,
            _thumbnail_url: submission.thumbnail_url || `https://api.narrowarrow.xyz/level-image/${cleanLevelIdText(submission.level_id)}.png`,
          });

          if (insertError) throw insertError;
          
          await logAction("Approved level submission to Main List", `${submission.level_name || submission.level_id} at rank #${rank}`);
          toast({ title: "Level Approved", description: `Added to Main List at rank #${rank}` });
          fetchLevels();
        } else if (targetList === "extra") {
          const { error: insertError } = await callAdminListRpc("admin_add_extra_level", {
            _level_id: cleanLevelIdText(submission.level_id),
            _name: submission.level_name,
            _author: submission.author,
            _rank_position: rank,
            _thumbnail_url: submission.thumbnail_url || `https://api.narrowarrow.xyz/level-image/${cleanLevelIdText(submission.level_id)}.png`,
          });

          if (insertError) throw insertError;
          
          await logAction("Approved level submission to Extra List", `${submission.level_name || submission.level_id} at rank #${rank}`);
          toast({ title: "Level Approved", description: `Added to Extra List at rank #${rank}` });
          fetchExtendedLevels();
        } else if (targetList === "future") {
          const { error: insertError } = await callAdminListRpc("admin_add_future_level", {
            _level_id: cleanLevelIdText(submission.level_id),
            _name: submission.level_name,
            _author: submission.author,
            _rank_position: rank,
            _thumbnail_url: submission.thumbnail_url || `https://api.narrowarrow.xyz/level-image/${cleanLevelIdText(submission.level_id)}.png`,
          });

          if (insertError) throw insertError;
          
          await logAction("Approved level submission to Future List", `${submission.level_name || submission.level_id} at rank #${rank}`);
          toast({ title: "Level Approved", description: `Added to Future List at rank #${rank}` });
          fetchFutureLevels();
        }
      } else {
        await logAction("Rejected level submission", `${submission.level_name || submission.level_id} (submitted by ${displaySubmitter(submission.submitted_by, submission.submitted_by_email)})`);
        toast({ title: "Submission Rejected" });
      }

      // Update submission status
      await supabase
        .from("level_submissions")
        .update({ 
          status: action,
          approved_list: action === "approved" ? submissionTargetList : null,
          final_rank: action === "approved" ? (parseInt(submissionRank) || submission.suggested_rank) : null,
          admin_note: submissionNote || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      setReviewingSubmission(null);
      setSubmissionRank("");
      setSubmissionNote("");
      setSubmissionTargetList("main");
      fetchLevelSubmissions();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingSubmission(null);
    }
  };

  const fetchLevels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("levels")
      .select("*")
      .order("rank_position", { ascending: true });
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch levels", variant: "destructive" });
    } else {
      setLevels(data || []);
    }
    setLoading(false);
  };

  const fetchFutureLevels = async () => {
    const { data, error } = await supabase
      .from("future_levels")
      .select("*")
      .order("rank_position", { ascending: true })
      .order("sub_rank", { ascending: true });

    if (!error) {
      setFutureLevels(data || []);
    }
  };

  // Auto-move levels with 0 completions to future list
  // IMPORTANT: Also checks manual_runs table to avoid moving levels that have not-on-API runs
  const checkAndMoveEmptyLevels = async (currentLevels: Level[]) => {
    const { fetchLeaderboard } = await import("@/lib/api");
    const emptyLevels: Level[] = [];
    
    for (const level of currentLevels) {
      // Check API leaderboard
      const leaderboard = await fetchLeaderboard(level.level_id);
      
      // Also check for manual runs in the database
      const { data: manualRunsForLevel } = await supabase
        .from("manual_runs")
        .select("id")
        .eq("level_id", level.id)
        .limit(1);
      
      // Also check for DB completions
      const { data: completionsForLevel } = await supabase
        .from("completions")
        .select("id")
        .eq("level_id", level.id)
        .limit(1);
      
      // Only mark as empty if no API completions AND no manual runs AND no DB completions
      const hasManualRuns = manualRunsForLevel && manualRunsForLevel.length > 0;
      const hasDbCompletions = completionsForLevel && completionsForLevel.length > 0;
      
      if (leaderboard.length === 0 && !hasManualRuns && !hasDbCompletions) {
        emptyLevels.push(level);
      }
    }
    
    if (emptyLevels.length === 0) return;
    
    for (const level of emptyLevels) {
      // Move to future list
      const { error: insertError } = await supabase.from("future_levels").insert({
        level_id: level.level_id,
        name: level.name,
        author: level.author,
        rank_position: level.rank_position,
        points: level.points,
        thumbnail_url: level.thumbnail_url,
      });
      
      if (insertError) continue;
      
      // Remove from main list
      await supabase.from("levels").delete().eq("id", level.id);
      
      await logAction("Auto-moved level to future list", `${level.name || level.level_id} (0 completions)`);
    }
    
    // Re-rank remaining levels
    const remaining = currentLevels.filter(l => !emptyLevels.find(e => e.id === l.id));
    for (let i = 0; i < remaining.length; i++) {
      await supabase
        .from("levels")
        .update({ rank_position: i + 1, points: calculatePoints(i + 1) })
        .eq("id", remaining[i].id);
    }
    
    if (emptyLevels.length > 0) {
      toast({ 
        title: "Levels Moved", 
        description: `${emptyLevels.length} level(s) with no completions moved to future list` 
      });
      fetchLevels();
      fetchFutureLevels();
      fetchChangelog();
    }
  };

  const fetchApprovedPlayers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, user_id")
      .not("user_id", "is", null);
    
    if (!error && data) {
      // Get emails for each user
      const playersWithEmails: ApprovedPlayer[] = [];
      for (const profile of data) {
        // Get email from claim requests (most recent approved)
        const { data: claimData } = await supabase
          .from("profile_claim_requests")
          .select("email")
          .eq("profile_id", profile.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        playersWithEmails.push({
          ...profile,
          user_id: profile.user_id!,
          email: claimData?.email,
        });
      }
      setApprovedPlayers(playersWithEmails);
    }
  };

  const fetchClaimRequests = async () => {
    const { data, error } = await supabase
      .from("profile_claim_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    
    if (!error && data) {
      const requestsWithProfiles = await Promise.all(
        data.map(async (req) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", req.profile_id)
            .single();
          
          return {
            ...req,
            profile_username: profile?.username,
            profile_display_name: profile?.display_name,
          };
        })
      );
      setClaimRequests(requestsWithProfiles);
    }
  };

  const calculatePoints = (rank: number): number => {
    if (rank === 1) return 28;
    if (rank === 2) return 24;
    if (rank === 3) return 21;
    if (rank === 4) return 18;
    if (rank === 5) return 16;
    if (rank >= 6 && rank <= 10) return 13;
    if (rank >= 11 && rank <= 20) return 10;
    if (rank >= 21 && rank <= 30) return 7;
    if (rank >= 31 && rank <= 50) return 4;
    if (rank >= 51 && rank <= 70) return 2;
    if (rank >= 71 && rank <= 100) return 1;
    return 0; // 101+ (Extended List)
  };

  const calculateExtraPoints = (rank: number): number => {
    if (rank === 1) return 10;
    if (rank === 2) return 8;
    if (rank === 3) return 7;
    if (rank === 4) return 6;
    if (rank === 5) return 5;
    if (rank <= 10) return 3;
    if (rank <= 25) return 2;
    return 1;
  };

  /** Privacy helpers: prefer usernames, never show a full email address in the UI. */
  const maskEmail = (email?: string | null) => {
    if (!email) return "unknown";
    const [local] = email.split("@");
    return local || "unknown";
  };

  const usernameByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of allProfiles) {
      if (p.user_id) map[p.user_id] = p.username;
    }
    return map;
  }, [allProfiles]);

  const displaySubmitter = (userId?: string | null, email?: string | null) =>
    (userId && usernameByUserId[userId]) || maskEmail(email);


  // Filtered and paginated data
  const filteredLevels = useMemo(() => {
    if (!levelSearchQuery.trim()) return levels;
    const query = levelSearchQuery.toLowerCase();
    return levels.filter(l => 
      l.name?.toLowerCase().includes(query) ||
      l.author?.toLowerCase().includes(query) ||
      l.level_id.toLowerCase().includes(query) ||
      l.rank_position.toString().includes(query)
    );
  }, [levels, levelSearchQuery]);

  const filteredExtendedLevels = useMemo(() => {
    const sorted = [...extendedLevels].sort((a, b) => a.rank_position - b.rank_position);
    if (!extendedSearchQuery.trim()) return sorted;
    const query = extendedSearchQuery.toLowerCase();
    return sorted.filter(l =>
      l.name?.toLowerCase().includes(query) ||
      l.author?.toLowerCase().includes(query) ||
      l.level_id.toLowerCase().includes(query) ||
      l.rank_position.toString().includes(query)
    );
  }, [extendedLevels, extendedSearchQuery]);



  const filteredFutureLevels = useMemo(() => {
    if (!futureSearchQuery.trim()) return futureLevels;
    const query = futureSearchQuery.toLowerCase();
    return futureLevels.filter(l =>
      l.name?.toLowerCase().includes(query) ||
      l.author?.toLowerCase().includes(query) ||
      l.level_id.toLowerCase().includes(query)
    );
  }, [futureLevels, futureSearchQuery]);

  const futureRankGroupSizes = useMemo(() => {
    const sizes = new Map<number, number>();
    for (const l of futureLevels) {
      sizes.set(l.rank_position, (sizes.get(l.rank_position) ?? 0) + 1);
    }
    return sizes;
  }, [futureLevels]);

  const filteredLevelSubmissions = useMemo(() => {
    if (!submissionSearchQuery.trim()) return levelSubmissions;
    const query = submissionSearchQuery.toLowerCase();
    return levelSubmissions.filter(s => 
      s.level_name?.toLowerCase().includes(query) ||
      s.author?.toLowerCase().includes(query) ||
      s.level_id.toLowerCase().includes(query) ||
      s.submitted_by_email.toLowerCase().includes(query)
    );
  }, [levelSubmissions, submissionSearchQuery]);

  const filteredRunSubmissions = useMemo(() => {
    if (!runSubmissionSearchQuery.trim()) return runSubmissions;
    const query = runSubmissionSearchQuery.toLowerCase();
    return runSubmissions.filter(s => 
      s.level_name?.toLowerCase().includes(query) ||
      s.username.toLowerCase().includes(query) ||
      s.level_id.toLowerCase().includes(query) ||
      s.submitted_by_email.toLowerCase().includes(query)
    );
  }, [runSubmissions, runSubmissionSearchQuery]);

  const filteredPlayers = useMemo(() => {
    if (!playerSearchQuery.trim()) return approvedPlayers;
    const query = playerSearchQuery.toLowerCase();
    return approvedPlayers.filter(p => 
      p.username.toLowerCase().includes(query) ||
      p.display_name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query)
    );
  }, [approvedPlayers, playerSearchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredLevels.length / ITEMS_PER_PAGE);
  const paginatedLevels = showAll 
    ? filteredLevels 
    : filteredLevels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const addLevel = async () => {
    const levelId = cleanLevelIdText(newLevelId);
    if (!levelId) return;
    
    setAddingLevel(true);
    
    try {
      setNewLevelId(levelId);
      const data = await fetchLevelDetailsForAdmin(levelId);
      const targetRank = newLevelRank ? parseInt(newLevelRank) : levels.length + 1;
      
      if (targetRank < 1 || targetRank > levels.length + 1) {
        throw new Error(`Rank must be between 1 and ${levels.length + 1}`);
      }
      
      const { error } = await callAdminListRpc("admin_add_main_level", {
        _level_id: levelId,
        _name: data.levelInfo?.name || "Unknown Level",
        _author: data.levelInfo?.author || "Unknown",
        _rank_position: targetRank,
        _thumbnail_url: `https://api.narrowarrow.xyz/level-image/${levelId}.png`,
      });
      
      if (error) throw error;
      
      await logAction("Added level", `${data.levelInfo?.name || levelId} at rank #${targetRank}`);
      toast({ title: "Success", description: `Level added at rank #${targetRank}` });
      
      // Send admin notification
      await sendAdminNotification("level_addition", data.levelInfo?.name || levelId, undefined, targetRank, "Main", "added", {
        level_id: levelId,
        thumbnail_url: `https://api.narrowarrow.xyz/level-image/${levelId}.png`,
        author: data.levelInfo?.author || null,
        rank_position: targetRank,
      });
      
      setNewLevelId("");
      setNewLevelRank("");
      fetchLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to add level", variant: "destructive" });
    } finally {
      setAddingLevel(false);
    }
  };

  const addFutureLevel = async () => {
    const levelId = cleanLevelIdText(newFutureLevelId);
    if (!levelId) return;
    
    setAddingFutureLevel(true);
    
    try {
      setNewFutureLevelId(levelId);
      const data = await fetchLevelDetailsForAdmin(levelId);
      const targetRank = newFutureLevelRank ? parseInt(newFutureLevelRank) : futureLevels.length + 1;
      
      const { error } = await callAdminListRpc("admin_add_future_level", {
        _level_id: levelId,
        _name: data.levelInfo?.name || "Unknown Level",
        _author: data.levelInfo?.author || "Unknown",
        _rank_position: targetRank,
        _thumbnail_url: `https://api.narrowarrow.xyz/level-image/${levelId}.png`,
      });
      
      if (error) throw error;
      
      await logAction("Added future level", `${data.levelInfo?.name || levelId} at estimated rank #${targetRank}`);
      toast({ title: "Success", description: `Future level added with estimated rank #${targetRank}` });
      
      // Send admin notification
      await sendAdminNotification("future_level", data.levelInfo?.name || levelId, undefined, targetRank, "Future", "added", {
        level_id: levelId,
        thumbnail_url: `https://api.narrowarrow.xyz/level-image/${levelId}.png`,
        author: data.levelInfo?.author || null,
        rank_position: targetRank,
      });
      
      setNewFutureLevelId("");
      setNewFutureLevelRank("");
      fetchFutureLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to add future level", variant: "destructive" });
    } finally {
      setAddingFutureLevel(false);
    }
  };

  const deleteFutureLevel = async () => {
    if (!deleteConfirmFutureLevel) return;
    
    const { error } = await supabase.from("future_levels").delete().eq("id", deleteConfirmFutureLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to remove future level", variant: "destructive" });
    } else {
      // Future ranks are estimates — do NOT resequence remaining levels on delete.

      await logAction("Removed future level", deleteConfirmFutureLevel.name || deleteConfirmFutureLevel.level_id);
      toast({ title: "Success", description: "Future level removed" });
      await sendAdminNotification(
        "future_level_deleted",
        deleteConfirmFutureLevel.name || deleteConfirmFutureLevel.level_id,
        deleteConfirmFutureLevel.rank_position,
        undefined,
        "Future",
        "deleted",
        deleteConfirmFutureLevel,
      );
      fetchFutureLevels();
      fetchChangelog();
    }
    
    setDeleteConfirmFutureLevel(null);
  };

  const openEditFutureLevel = (level: FutureLevel) => {
    setEditingFutureLevel(level);
    setEditFutureName(level.name || "");
    setEditFutureAuthor(level.author || "");
    const groupSize = futureLevels.filter(f => f.rank_position === level.rank_position).length;
    setEditFutureRank(groupSize > 1 ? `${level.rank_position}.${level.sub_rank ?? 1}` : String(level.rank_position));
    setEditFuturePoints(String(level.points));
    setEditFutureThumbnail(level.thumbnail_url || "");
    setEditFutureDescription(level.description || "");
  };

  const saveEditedFutureLevel = async () => {
    if (!editingFutureLevel) return;
    
    setSavingFutureLevel(true);
    const parsedRank = parseFutureRankInput(editFutureRank);
    if (!parsedRank) {
      toast({ title: "Invalid rank", description: "Enter a rank like 5, or rank.sub like 5.2", variant: "destructive" });
      setSavingFutureLevel(false);
      return;
    }
    const { rank: newRank, sub } = parsedRank;
    const oldRank = editingFutureLevel.rank_position;
    // On a rank change the level joins the end of its new rank group, or the requested
    // sub-position when given as rank.sub (the rest of the group shifts down).
    const newSubRank =
      newRank !== oldRank || sub !== null
        ? (sub ?? Math.max(0, ...futureLevels.filter((f) => f.rank_position === newRank).map((f) => f.sub_rank ?? 1)) + 1)
        : (editingFutureLevel.sub_rank ?? 1);
    const { error } = await supabase
      .from("future_levels")
      .update({
        name: editFutureName || null,
        author: editFutureAuthor || null,
        rank_position: newRank,
        sub_rank: newSubRank,
        points: parseInt(editFuturePoints) || calculatePoints(newRank),
        thumbnail_url: editFutureThumbnail || null,
        description: editFutureDescription.trim() || null,
      })
      .eq("id", editingFutureLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update future level", variant: "destructive" });
    } else {
      await logAction("Edited future level", `${editFutureName || editingFutureLevel.level_id}`);
      toast({ title: "Success", description: "Future level updated" });
      if (newRank !== oldRank) {
        await sendAdminNotification(
          "future_level_rank_change",
          editFutureName || editingFutureLevel.name || editingFutureLevel.level_id,
          oldRank,
          newRank,
          "Future",
          "moved",
          {
            level_id: editingFutureLevel.level_id,
            author: editFutureAuthor || editingFutureLevel.author,
            thumbnail_url: editFutureThumbnail || editingFutureLevel.thumbnail_url,
            rank_position: newRank,
            points: parseInt(editFuturePoints) || editingFutureLevel.points,
          },
        );
      }
      if (newRank !== oldRank || sub !== null) {
        // Keep sub_ranks contiguous group-wide: shift members below the insertion point,
        // then resequence every group. The edited level itself was persisted above.
        const before = new Map(futureLevels.map((f) => [f.id, f]));
        const shifted = futureLevels.map((f) =>
          f.id !== editingFutureLevel.id && f.rank_position === newRank && (f.sub_rank ?? 1) >= newSubRank
            ? { ...f, sub_rank: (f.sub_rank ?? 1) + 1 }
            : f
        );
        const moved = sortFutureLevels(
          shifted.map((f) =>
            f.id === editingFutureLevel.id ? { ...f, rank_position: newRank, sub_rank: newSubRank } : f
          )
        );
        const normalized = normalizeFutureGroups(moved);
        const changed = normalized.filter((f) => {
          const old = before.get(f.id)!;
          return f.id !== editingFutureLevel.id &&
            (old.rank_position !== f.rank_position || (old.sub_rank ?? 1) !== f.sub_rank);
        });
        setFutureLevels(normalized);
        await updateFutureRanks(changed);
      }
      setEditingFutureLevel(null);
      fetchFutureLevels();
      fetchChangelog();
    }
    setSavingFutureLevel(false);
  };

  const handleFutureThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingFutureLevel) return;
    
    setUploadingFutureThumbnail(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `future-${editingFutureLevel.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('level-thumbnails')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('level-thumbnails')
        .getPublicUrl(data.path);
      
      setEditFutureThumbnail(publicUrl);
      toast({ title: "Success", description: "Thumbnail uploaded" });
    } catch (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingFutureThumbnail(false);
      e.target.value = '';
    }
  };

  // Extended level editing functions
  const openEditExtendedLevel = (level: ExtendedLevel) => {
    setEditingExtendedLevel(level);
    setEditExtendedName(level.name || "");
    setEditExtendedAuthor(level.author || "");
    setEditExtendedCreators(level.creators?.join(", ") || "");
    setEditExtendedRank(String(level.rank_position));
    setEditExtendedThumbnail(level.thumbnail_url || "");
    setEditExtendedVerifier(level.verifier_profile_id || "none");
    setEditExtendedAlternativeIds(level.alternative_ids?.join(", ") || "");
    setEditExtendedDescription(level.description || "");
  };

  const saveEditedExtendedLevel = async () => {
    if (!editingExtendedLevel) return;
    
    setSavingExtendedLevel(true);
    const requestedRank = Math.min(
      Math.max(parseInt(editExtendedRank) || editingExtendedLevel.rank_position, 1),
      extendedLevels.length,
    );
    
    const creatorsArray = editExtendedCreators
      .split(/[,\n]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const alternativeIdsArray = editExtendedAlternativeIds
      .split(/[,\n]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    const { error } = await supabase
      .from("extended_levels")
      .update({
        name: editExtendedName || null,
        author: editExtendedAuthor || null,
        creators: creatorsArray.length > 0 ? creatorsArray : null,
        thumbnail_url: editExtendedThumbnail || null,
        verifier_profile_id: editExtendedVerifier === "none" ? null : editExtendedVerifier || null,
        alternative_ids: alternativeIdsArray.length > 0 ? alternativeIdsArray : null,
        description: editExtendedDescription.trim() || null,
      })
      .eq("id", editingExtendedLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update extra level", variant: "destructive" });
    } else {
      if (requestedRank !== editingExtendedLevel.rank_position) {
        const reordered = [...extendedLevels].sort((a, b) => a.rank_position - b.rank_position);
        const currentIndex = reordered.findIndex((level) => level.id === editingExtendedLevel.id);
        if (currentIndex >= 0) {
          const [item] = reordered.splice(currentIndex, 1);
          reordered.splice(requestedRank - 1, 0, item);
          await updateExtendedRanksSafely(reordered);
        }
      }
      await logAction("Edited extra level", `${editExtendedName || editingExtendedLevel.level_id}${alternativeIdsArray.length > 0 ? ` (alt IDs: ${alternativeIdsArray.join(", ")})` : ""}`);
      toast({ title: "Success", description: "Extra level updated" });
      setEditingExtendedLevel(null);
      fetchExtendedLevels();
      fetchChangelog();
    }
    setSavingExtendedLevel(false);
  };

  const handleExtendedThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingExtendedLevel) return;
    
    setUploadingExtendedThumbnail(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `extended-${editingExtendedLevel.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('level-thumbnails')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('level-thumbnails')
        .getPublicUrl(data.path);
      
      setEditExtendedThumbnail(publicUrl);
      toast({ title: "Success", description: "Thumbnail uploaded" });
    } catch (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingExtendedThumbnail(false);
      e.target.value = '';
    }
  };

  const moveFutureLevelToMain = async (futureLevel: FutureLevel) => {
    try {
      // Add to main list
      const targetRank = futureLevel.rank_position;
      
      // Shift existing levels
      const levelsToUpdate = levels.filter(l => l.rank_position >= targetRank);
      for (const level of levelsToUpdate) {
        await supabase
          .from("levels")
          .update({ 
            rank_position: level.rank_position + 1,
            points: calculatePoints(level.rank_position + 1)
          })
          .eq("id", level.id);
      }
      
      // Insert into main list
      const { error: insertError } = await supabase.from("levels").insert({
        level_id: futureLevel.level_id,
        name: futureLevel.name,
        author: futureLevel.author,
        rank_position: targetRank,
        points: calculatePoints(targetRank),
        thumbnail_url: futureLevel.thumbnail_url,
      });
      
      if (insertError) throw insertError;
      
      // Remove from future list
      const { error: deleteError } = await supabase.from("future_levels").delete().eq("id", futureLevel.id);
      
      if (deleteError) throw deleteError;
      
      await logAction("Moved future level to main", `${futureLevel.name || futureLevel.level_id} at rank #${targetRank}`);
      await sendAdminNotification("future_to_main", futureLevel.name || futureLevel.level_id, futureLevel.rank_position, targetRank, "Future", "moved to Main", futureLevel);
      toast({ title: "Success", description: `Level moved to main list at rank #${targetRank}` });
      fetchLevels();
      fetchFutureLevels();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

;

  const confirmDeleteLevel = async () => {
    if (!deleteConfirmLevel) return;
    
    const deletedName = deleteConfirmLevel.name || deleteConfirmLevel.level_id;
    const deletedRank = deleteConfirmLevel.rank_position;
    const { error } = await supabase.from("levels").delete().eq("id", deleteConfirmLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to remove level", variant: "destructive" });
    } else {
      await logAction("Removed level", deletedName);
      toast({ title: "Success", description: "Level removed" });
      const remaining = levels.filter(l => l.id !== deleteConfirmLevel.id);
      await updateRanks(remaining.map((l, i) => ({ ...l, rank_position: i + 1 })));
      await sendAdminNotification("level_deletion", deletedName, deletedRank, undefined, "Main", "deleted", deleteConfirmLevel);
      fetchLevels();
      fetchChangelog();
    }
    
    setDeleteConfirmLevel(null);
  };

  const moveLevel = async (index: number, direction: "up" | "down") => {
    const newLevels = [...levels];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newLevels.length) return;
    
    const movingLevel = newLevels[index];
    const oldRank = index + 1;
    const newRank = targetIndex + 1;
    
    [newLevels[index], newLevels[targetIndex]] = [newLevels[targetIndex], newLevels[index]];
    
    const updatedLevels = newLevels.map((l, i) => ({
      ...l,
      rank_position: i + 1,
      points: calculatePoints(i + 1),
    }));
    
    setLevels(updatedLevels);
    await updateRanks(updatedLevels);
    await sendAdminNotification("rank_change", movingLevel.name || movingLevel.level_id, oldRank, newRank, "Main", "moved", movingLevel);
    fetchChangelog();
  };

  const updateRanks = async (updatedLevels: Level[]) => {
    setSaving(true);
    
    for (const level of updatedLevels) {
      await supabase
        .from("levels")
        .update({ 
          rank_position: level.rank_position, 
          points: calculatePoints(level.rank_position) 
        })
        .eq("id", level.id);
    }
    
    setSaving(false);
    toast({ title: "Saved", description: "Rankings updated" });
  };

  const startRankEdit = (level: Level) => {
    setRankInputId(level.id);
    setRankInputValue(String(level.rank_position));
  };

  const confirmRankChange = async () => {
    if (!rankInputId) return;
    
    const newRank = parseInt(rankInputValue);
    if (isNaN(newRank) || newRank < 1 || newRank > levels.length) {
      toast({ title: "Invalid rank", description: `Enter a number between 1 and ${levels.length}`, variant: "destructive" });
      return;
    }

    const levelToMove = levels.find(l => l.id === rankInputId);
    if (!levelToMove) return;

    const currentIndex = levels.findIndex(l => l.id === rankInputId);
    const targetIndex = newRank - 1;

    if (currentIndex === targetIndex) {
      setRankInputId(null);
      return;
    }

    // Show confirmation dialog
    setRankConfirmLevel(levelToMove);
    setPendingNewRank(newRank);
  };

  const executeRankChange = async () => {
    if (!rankConfirmLevel || pendingNewRank === null) return;
    
    const currentIndex = levels.findIndex(l => l.id === rankConfirmLevel.id);
    const targetIndex = pendingNewRank - 1;
    const oldRank = currentIndex + 1;

    const newLevels = [...levels];
    newLevels.splice(currentIndex, 1);
    newLevels.splice(targetIndex, 0, rankConfirmLevel);

    const updatedLevels = newLevels.map((l, i) => ({
      ...l,
      rank_position: i + 1,
      points: calculatePoints(i + 1),
    }));

    await logAction("Changed level rank", `${rankConfirmLevel.name} from #${oldRank} to #${pendingNewRank}`);
    setLevels(updatedLevels);
    setRankInputId(null);
    setRankConfirmLevel(null);
    setPendingNewRank(null);
    await updateRanks(updatedLevels);
    
    // Send admin notification
    await sendAdminNotification("rank_change", rankConfirmLevel.name || rankConfirmLevel.level_id, oldRank, pendingNewRank, "Main", "moved", rankConfirmLevel);
    
    fetchChangelog();
  };

  // Merge two profiles - transfer all data from source to target
  const mergeProfiles = async () => {
    if (!mergeSourceProfile || !mergeTargetProfile) return;
    
    setMergingProfiles(true);
    try {
      // Find source and target profiles
      const { data: sourceProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", mergeSourceProfile)
        .maybeSingle();
      
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", mergeTargetProfile)
        .maybeSingle();
      
      if (!sourceProfile || !targetProfile) {
        toast({ title: "Error", description: "One or both profiles not found", variant: "destructive" });
        setMergingProfiles(false);
        return;
      }
      
      if (sourceProfile.id === targetProfile.id) {
        toast({ title: "Error", description: "Cannot merge a profile with itself", variant: "destructive" });
        setMergingProfiles(false);
        return;
      }
      
      // Transfer completions from source to target
      await supabase
        .from("completions")
        .update({ profile_id: targetProfile.id })
        .eq("profile_id", sourceProfile.id);
      
      // Transfer extra completions from source to target
      await supabase
        .from("extra_completions")
        .update({ profile_id: targetProfile.id })
        .eq("profile_id", sourceProfile.id);
      
      // Transfer manual runs from source to target
      await supabase
        .from("manual_runs")
        .update({ profile_id: targetProfile.id })
        .eq("profile_id", sourceProfile.id);
      
      // Update verifier references - levels table
      await supabase
        .from("levels")
        .update({ verifier_profile_id: targetProfile.id })
        .eq("verifier_profile_id", sourceProfile.id);
      
      // Update verifier references - extended_levels table
      await supabase
        .from("extended_levels")
        .update({ verifier_profile_id: targetProfile.id })
        .eq("verifier_profile_id", sourceProfile.id);
      
      // Update target profile display name if specified
      const updateData: { display_name?: string; user_id?: string | null; avatar_url?: string | null; banner_url?: string | null; bio?: string | null; country_code?: string | null } = {};
      if (mergeDisplayName) {
        updateData.display_name = mergeDisplayName;
      }
      // Merge user_id if source had one but target doesn't
      if (sourceProfile.user_id && !targetProfile.user_id) {
        updateData.user_id = sourceProfile.user_id;
      }
      // Merge avatar/banner if target doesn't have one
      if (sourceProfile.avatar_url && !targetProfile.avatar_url) {
        updateData.avatar_url = sourceProfile.avatar_url;
      }
      if (sourceProfile.banner_url && !targetProfile.banner_url) {
        updateData.banner_url = sourceProfile.banner_url;
      }
      if (sourceProfile.bio && !targetProfile.bio) {
        updateData.bio = sourceProfile.bio;
      }
      if (sourceProfile.country_code && !targetProfile.country_code) {
        updateData.country_code = sourceProfile.country_code;
      }
      
      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", targetProfile.id);
      }
      
      // Delete the source profile
      await supabase
        .from("profiles")
        .delete()
        .eq("id", sourceProfile.id);
      
      // Recalculate points for target profile
      await supabase.rpc("recalculate_player_points", { player_profile_id: targetProfile.id });
      await supabase.rpc("recalculate_player_extra_points", { player_profile_id: targetProfile.id });
      
      await logAction("Merged profiles", `${mergeSourceProfile} → ${mergeTargetProfile}${mergeDisplayName ? ` (display: ${mergeDisplayName})` : ""}`);
      toast({ title: "Success", description: `Merged ${mergeSourceProfile} into ${mergeTargetProfile}` });
      
      // Reset form
      setMergeSourceProfile("");
      setMergeTargetProfile("");
      setMergeDisplayName("");
      setMergeConfirmOpen(false);
      
      // Refresh data
      fetchAllProfiles();
      fetchApprovedPlayers();
      fetchChangelog();
    } catch (error) {
      console.error("Merge error:", error);
      toast({ title: "Error", description: error.message || "Failed to merge profiles", variant: "destructive" });
    } finally {
      setMergingProfiles(false);
    }
  };

  const startThumbnailEdit = (level: Level) => {
    setThumbnailEditId(level.id);
    setThumbnailInputValue(level.thumbnail_url || "");
  };

  const confirmThumbnailChange = async () => {
    if (!thumbnailEditId) return;

    setSaving(true);
    const { error } = await supabase
      .from("levels")
      .update({ thumbnail_url: thumbnailInputValue || null })
      .eq("id", thumbnailEditId);

    if (error) {
      toast({ title: "Error", description: "Failed to update thumbnail", variant: "destructive" });
    } else {
      const level = levels.find(l => l.id === thumbnailEditId);
      await logAction("Updated thumbnail URL", level?.name || thumbnailEditId);
      toast({ title: "Success", description: "Thumbnail updated" });
      setLevels(prev => prev.map(l => 
        l.id === thumbnailEditId ? { ...l, thumbnail_url: thumbnailInputValue || null } : l
      ));
      fetchChangelog();
    }
    
    setThumbnailEditId(null);
    setSaving(false);
  };

  const uploadThumbnail = async (file: File, levelId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${levelId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('level-thumbnails')
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('level-thumbnails')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleQuickThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, levelId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingThumbnail(levelId);
    const url = await uploadThumbnail(file, levelId);
    
    if (url) {
      const { error } = await supabase
        .from("levels")
        .update({ thumbnail_url: url })
        .eq("id", levelId);
      
      if (!error) {
        const level = levels.find(l => l.id === levelId);
        await logAction("Uploaded thumbnail", level?.name || levelId);
        setLevels(prev => prev.map(l => l.id === levelId ? { ...l, thumbnail_url: url } : l));
        toast({ title: "Success", description: "Thumbnail uploaded" });
        fetchChangelog();
      }
    }
    
    setUploadingThumbnail(null);
    e.target.value = '';
  };

  const handleEditThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLevel) return;
    
    setSaving(true);
    const url = await uploadThumbnail(file, editingLevel.id);
    
    if (url) {
      setEditThumbnail(url);
    }
    
    setSaving(false);
    e.target.value = '';
  };

  /**
   * Reads an image from the user's clipboard and returns it as a File.
   * Returns null and toasts if no image is found or clipboard is unavailable.
   */
  const readImageFromClipboard = async (): Promise<File | null> => {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      toast({
        title: "Clipboard not supported",
        description: "Your browser doesn't support reading images from the clipboard.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split("/")[1] || "png";
          return new File([blob], `clipboard-${Date.now()}.${ext}`, { type: imageType });
        }
      }
      toast({
        title: "No image in clipboard",
        description: "Copy an image first (e.g., screenshot), then click Paste.",
        variant: "destructive",
      });
      return null;
    } catch (err) {
      toast({
        title: "Clipboard access denied",
        description: err?.message || "Allow clipboard permission and try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Quick paste from clipboard for hover overlay on Main list
  const handleQuickPasteMainThumbnail = async (levelId: string) => {
    const file = await readImageFromClipboard();
    if (!file) return;
    setUploadingThumbnail(levelId);
    const url = await uploadThumbnail(file, levelId);
    if (url) {
      const { error } = await supabase.from("levels").update({ thumbnail_url: url }).eq("id", levelId);
      if (!error) {
        const level = levels.find(l => l.id === levelId);
        await logAction("Pasted thumbnail", level?.name || levelId);
        setLevels(prev => prev.map(l => l.id === levelId ? { ...l, thumbnail_url: url } : l));
        toast({ title: "Pasted", description: "Thumbnail uploaded from clipboard" });
        fetchChangelog();
      }
    }
    setUploadingThumbnail(null);
  };

  // Quick paste from clipboard for hover overlay on Future list
  const handleQuickPasteFutureThumbnail = async (levelId: string) => {
    const file = await readImageFromClipboard();
    if (!file) return;
    try {
      const fileName = `future-${levelId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage.from('level-thumbnails').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('level-thumbnails').getPublicUrl(data.path);
      const { error: updErr } = await supabase.from("future_levels").update({ thumbnail_url: publicUrl }).eq("id", levelId);
      if (updErr) throw updErr;
      setFutureLevels(prev => prev.map(l => l.id === levelId ? { ...l, thumbnail_url: publicUrl } : l));
      toast({ title: "Pasted", description: "Thumbnail uploaded from clipboard" });
    } catch (err) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  };

  const handlePasteMainThumbnail = async () => {
    if (!editingLevel) return;
    const file = await readImageFromClipboard();
    if (!file) return;
    setSaving(true);
    const url = await uploadThumbnail(file, editingLevel.id);
    if (url) {
      setEditThumbnail(url);
      toast({ title: "Pasted", description: "Thumbnail uploaded from clipboard" });
    }
    setSaving(false);
  };

  const handlePasteFutureThumbnail = async () => {
    if (!editingFutureLevel) return;
    const file = await readImageFromClipboard();
    if (!file) return;
    setUploadingFutureThumbnail(true);
    try {
      const fileName = `future-${editingFutureLevel.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('level-thumbnails')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('level-thumbnails')
        .getPublicUrl(data.path);
      setEditFutureThumbnail(publicUrl);
      toast({ title: "Pasted", description: "Thumbnail uploaded from clipboard" });
    } catch (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingFutureThumbnail(false);
    }
  };

  const handlePasteExtendedThumbnail = async () => {
    if (!editingExtendedLevel) return;
    const file = await readImageFromClipboard();
    if (!file) return;
    setUploadingExtendedThumbnail(true);
    try {
      const fileName = `extended-${editingExtendedLevel.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('level-thumbnails')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('level-thumbnails')
        .getPublicUrl(data.path);
      setEditExtendedThumbnail(publicUrl);
      toast({ title: "Pasted", description: "Thumbnail uploaded from clipboard" });
    } catch (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingExtendedThumbnail(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newLevels = [...levels];
    const [draggedItem] = newLevels.splice(draggedIndex, 1);
    newLevels.splice(targetIndex, 0, draggedItem);

    const updatedLevels = newLevels.map((l, i) => ({
      ...l,
      rank_position: i + 1,
      points: calculatePoints(i + 1),
    }));

    setLevels(updatedLevels);
    setDraggedIndex(null);
    setDragOverIndex(null);
    await updateRanks(updatedLevels);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ===== Future-list inline rank/thumbnail/drag handlers =====
  const sortFutureLevels = (arr: FutureLevel[]) =>
    [...arr].sort((a, b) => a.rank_position - b.rank_position || (a.sub_rank ?? 1) - (b.sub_rank ?? 1));

  // Accepts "5" (join end of rank group 5) or "5.2" (insert at sub-position 2, shifting the group).
  const parseFutureRankInput = (value: string): { rank: number; sub: number | null } | null => {
    const m = value.trim().match(/^(\d+)(?:\.(\d+))?$/);
    if (!m) return null;
    const rank = parseInt(m[1]);
    const sub = m[2] ? parseInt(m[2]) : null;
    if (rank < 1 || (sub !== null && sub < 1)) return null;
    return { rank, sub };
  };

  // Resequence sub_rank to 1..n within each estimated-rank group, preserving order.
  const normalizeFutureGroups = (arr: FutureLevel[]) => {
    const counters = new Map<number, number>();
    return arr.map((f) => {
      const next = (counters.get(f.rank_position) ?? 0) + 1;
      counters.set(f.rank_position, next);
      return { ...f, sub_rank: next };
    });
  };

  const updateFutureRanks = async (updated: FutureLevel[]) => {
    if (updated.length === 0) return;
    setSavingFuture(true);
    for (const f of updated) {
      await supabase
        .from("future_levels")
        .update({ rank_position: f.rank_position, sub_rank: f.sub_rank, points: calculatePoints(f.rank_position) })
        .eq("id", f.id);
    }
    setSavingFuture(false);
    toast({ title: "Saved", description: "Future rankings updated" });
  };

  const moveFutureLevel = async (index: number, direction: "up" | "down") => {
    const arr = sortFutureLevels(futureLevels);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    // Swap only the sort keys so freeform estimated ranks (e.g. 1, 1, 10) are preserved.
    const a = arr[index];
    const b = arr[target];
    arr[index] = { ...a, rank_position: b.rank_position, sub_rank: b.sub_rank ?? 1 };
    arr[target] = { ...b, rank_position: a.rank_position, sub_rank: a.sub_rank ?? 1 };
    const normalized = normalizeFutureGroups(sortFutureLevels(arr));
    const before = new Map(futureLevels.map((f) => [f.id, f]));
    const changed = normalized.filter((f) => {
      const old = before.get(f.id)!;
      return old.rank_position !== f.rank_position || (old.sub_rank ?? 1) !== f.sub_rank;
    });
    setFutureLevels(normalized);
    await updateFutureRanks(changed);
  };

  const startFutureRankEdit = (level: FutureLevel) => {
    setFutureRankInputId(level.id);
    const groupSize = futureLevels.filter(f => f.rank_position === level.rank_position).length;
    setFutureRankInputValue(
      groupSize > 1 ? `${level.rank_position}.${level.sub_rank ?? 1}` : String(level.rank_position)
    );
  };

  const confirmFutureRankChange = async () => {
    if (!futureRankInputId) return;
    const parsed = parseFutureRankInput(futureRankInputValue);
    if (!parsed) {
      toast({ title: "Invalid rank", description: "Enter a rank like 5, or rank.sub like 5.2", variant: "destructive" });
      return;
    }
    const { rank: newRank, sub } = parsed;
    const target = futureLevels.find(f => f.id === futureRankInputId);
    if (!target) {
      setFutureRankInputId(null);
      return;
    }
    if (target.rank_position === newRank && (sub === null || (target.sub_rank ?? 1) === sub)) {
      setFutureRankInputId(null);
      return;
    }
    // Estimated ranks are freeform — without a sub-position the level joins the end of its new
    // rank group; with one, the rest of the group shifts down to make room.
    const before = new Map(futureLevels.map((f) => [f.id, f]));
    const shifted = futureLevels.map((f) =>
      sub !== null && f.id !== futureRankInputId && f.rank_position === newRank && (f.sub_rank ?? 1) >= sub
        ? { ...f, sub_rank: (f.sub_rank ?? 1) + 1 }
        : f
    );
    const moved = sortFutureLevels(
      shifted.map((f) =>
        f.id === futureRankInputId
          ? { ...f, rank_position: newRank, sub_rank: sub ?? Number.MAX_SAFE_INTEGER, points: calculatePoints(newRank) }
          : f
      )
    );
    const normalized = normalizeFutureGroups(moved);
    const changed = normalized.filter((f) => {
      const old = before.get(f.id)!;
      return old.rank_position !== f.rank_position || (old.sub_rank ?? 1) !== f.sub_rank;
    });
    setFutureLevels(normalized);
    setFutureRankInputId(null);
    await updateFutureRanks(changed);
  };

  const startFutureThumbnailEdit = (level: FutureLevel) => {
    setFutureThumbnailEditId(level.id);
    setFutureThumbnailInputValue(level.thumbnail_url || "");
  };

  const confirmFutureThumbnailChange = async () => {
    if (!futureThumbnailEditId) return;
    setSavingFuture(true);
    const { error } = await supabase
      .from("future_levels")
      .update({ thumbnail_url: futureThumbnailInputValue || null })
      .eq("id", futureThumbnailEditId);
    if (error) {
      toast({ title: "Error", description: "Failed to update thumbnail", variant: "destructive" });
    } else {
      setFutureLevels(prev =>
        prev.map(f =>
          f.id === futureThumbnailEditId ? { ...f, thumbnail_url: futureThumbnailInputValue || null } : f
        )
      );
      toast({ title: "Success", description: "Thumbnail updated" });
    }
    setFutureThumbnailEditId(null);
    setSavingFuture(false);
  };

  const handleQuickFutureThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    levelId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFutureRowThumbnail(levelId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `future-${levelId}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("level-thumbnails")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from("level-thumbnails")
        .getPublicUrl(data.path);
      const { error: updateError } = await supabase
        .from("future_levels")
        .update({ thumbnail_url: publicUrl })
        .eq("id", levelId);
      if (updateError) throw updateError;
      setFutureLevels(prev =>
        prev.map(f => (f.id === levelId ? { ...f, thumbnail_url: publicUrl } : f))
      );
      toast({ title: "Success", description: "Thumbnail uploaded" });
    } catch (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingFutureRowThumbnail(null);
      e.target.value = "";
    }
  };

  const handleFutureDragStart = (index: number) => setFutureDraggedIndex(index);
  const handleFutureDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setFutureDragOverIndex(index);
  };
  const handleFutureDrop = async (_targetIndex: number) => {
    // Future list ranks are freeform (e.g. 1, 1, 1, 10, 30) — drag-reorder is disabled.
    // Use the rank input on each row to change a specific level's estimated rank.
    setFutureDraggedIndex(null);
    setFutureDragOverIndex(null);
    toast({
      title: "Drag disabled on Future List",
      description: "Edit a level's estimated rank using its rank input instead.",
    });
  };
  const handleFutureDragEnd = () => {
    setFutureDraggedIndex(null);
    setFutureDragOverIndex(null);
  };

  const openEditModal = (level: Level) => {
    setEditingLevel(level);
    setEditName(level.name || "");
    setEditAuthor(level.author || "");
    setEditCreators((level.creators || []).join(", "));
    setEditThumbnail(level.thumbnail_url || "");
    setEditVerifier(level.verifier_profile_id || "none");
    setEditAlternativeIds((level.alternative_ids || []).join(", "));
    setEditDescription(level.description || "");
  };
  const saveEditedLevel = async () => {
    if (!editingLevel) return;
    
    setSaving(true);
    
    // Parse alternative IDs
    const alternativeIds = editAlternativeIds
      .split(/[,\n]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    // Parse creators
    const creators = editCreators
      .split(/[,\n]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    const { error } = await supabase
      .from("levels")
      .update({
        name: editName || null,
        author: editAuthor || null,
        creators: creators,
        thumbnail_url: editThumbnail || null,
        alternative_ids: alternativeIds.length > 0 ? alternativeIds : [],
        verifier_profile_id: editVerifier === "none" ? null : editVerifier || null,
        description: editDescription.trim() || null,
      } as unknown as TablesUpdate<"levels">)
      .eq("id", editingLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update level", variant: "destructive" });
    } else {
      await logAction("Edited level", `${editName || editingLevel.level_id}${creators.length > 0 ? ` (creators: ${creators.join(", ")})` : ""}${alternativeIds.length > 0 ? ` (alt IDs: ${alternativeIds.join(", ")})` : ""}`);
      toast({ title: "Success", description: "Level updated" });
      setEditingLevel(null);
      fetchLevels();
      fetchChangelog();
    }
    setSaving(false);
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const response = await supabase.functions.invoke("sync-completions");
      if (response.error) throw response.error;
      await logAction("Synced completions", "Manual sync triggered");
      toast({ title: "Sync Complete", description: "Completions have been updated" });
      fetchChangelog();
      // Check for empty levels after sync
      const { data: currentLevels } = await supabase.from("levels").select("*").order("rank_position");
      if (currentLevels) {
        await checkAndMoveEmptyLevels(currentLevels);
      }
    } catch (error) {
      toast({ title: "Sync Failed", description: error.message || "Failed to sync", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };


  // Manual check for empty levels without syncing
  const manualCheckEmptyLevels = async () => {
    setSyncing(true);
    try {
      const { data: currentLevels } = await supabase.from("levels").select("*").order("rank_position");
      if (currentLevels) {
        await checkAndMoveEmptyLevels(currentLevels);
      }
      toast({ title: "Check Complete", description: "Empty levels check finished" });
    } catch (error) {
      toast({ title: "Check Failed", description: error.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  // Check if future levels have been verified and move them to main list
  const checkVerifiedFutureLevels = async () => {
    setSyncing(true);
    try {
      const { fetchLeaderboard, fetchRunDetails } = await import("@/lib/api");
      let movedCount = 0;
      
      for (const futureLevel of futureLevels) {
        const leaderboard = await fetchLeaderboard(futureLevel.level_id);
        if (leaderboard.length === 0) continue;
        
        // Check if any run has verified=true (the person who verified the level)
        for (const entry of leaderboard) {
          const runDetails = await fetchRunDetails(entry.run_id);
          if (runDetails?.verified === true) {
            // Level has been verified, move to main list
            await moveFutureLevelToMain(futureLevel);
            movedCount++;
            break;
          }
        }
      }
      
      if (movedCount > 0) {
        toast({ title: "Levels Moved", description: `${movedCount} verified level(s) moved to main list` });
      } else {
        toast({ title: "No Verified Levels", description: "No future levels have been verified yet" });
      }
    } catch (error) {
      toast({ title: "Check Failed", description: error.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleClaimRequest = async (requestId: string, action: "approved" | "rejected") => {
    setProcessingClaim(requestId);
    
    const request = claimRequests.find(r => r.id === requestId);
    if (!request) return;
    
    try {
      if (action === "approved") {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ user_id: request.user_id })
          .eq("id", request.profile_id);
        
        if (profileError) throw profileError;
      }
      
      const { error } = await supabase
        .from("profile_claim_requests")
        .update({ 
          status: action,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      
      if (error) throw error;
      
      await logAction(`${action === "approved" ? "Approved" : "Rejected"} claim request`, `Profile: ${request.profile_username}`);
      
      toast({ 
        title: action === "approved" ? "Claim Approved" : "Claim Rejected",
        description: action === "approved" 
          ? `Profile linked to user successfully` 
          : `Claim request has been rejected`
      });
      
      fetchClaimRequests();
      fetchApprovedPlayers();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingClaim(null);
    }
  };

  const unlinkPlayer = async (player: ApprovedPlayer) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ user_id: null })
        .eq("id", player.id);
      
      if (error) throw error;
      
      await logAction("Unlinked player", `${player.display_name || player.username}`);
      toast({ title: "Success", description: "Player unlinked" });
      fetchApprovedPlayers();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Manual Runs
  const openAddManualRun = () => {
    setEditingManualRun(null);
    setManualRunLevel("");
    setManualRunProfile("");
    setManualRunTime("");
    setManualRunArrow("Energy Arrow");
    setManualRunVerifier(false);
    setManualRunDate(new Date().toISOString().split("T")[0]);
    setManualRunNote("");
    setManualRunProofUrl("");
    setManualRunListType("main");
    setAddManualRunOpen(true);
  };

  const openEditManualRun = (run: ManualRun) => {
    setEditingManualRun(run);
    setManualRunLevel(run.level_id);
    setManualRunProfile(run.profile_id);
    setManualRunTime(String(run.completion_time));
    setManualRunArrow(run.arrow_name);
    setManualRunVerifier(run.is_verifier);
    setManualRunDate(run.completed_at.split("T")[0]);
    setManualRunNote(run.note || "");
    setManualRunProofUrl(run.proof_url || "");
    setManualRunListType((run.list_type as "main" | "extra") || "main");
    setAddManualRunOpen(true);
  };

  const uploadProofScreenshot = async (file: File) => {
    setUploadingProof(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `proof-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('level-thumbnails')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('level-thumbnails')
        .getPublicUrl(data.path);
      
      setManualRunProofUrl(publicUrl);
      toast({ title: "Success", description: "Proof screenshot uploaded" });
    } catch (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingProof(false);
    }
  };

  const saveManualRun = async () => {
    if (!manualRunLevel || !manualRunProfile || !manualRunTime || !manualRunDate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setAddingManualRun(true);

    try {
      const completionTime = parseFloat(manualRunTime);
      if (isNaN(completionTime) || completionTime <= 0) {
        throw new Error("Invalid completion time");
      }

      // If marking as verifier, update the level's verifier_profile_id and clear old verifier
      if (manualRunVerifier) {
        // Update the level to set this profile as verifier based on list type
        const tableName = manualRunListType === "extra" ? "extended_levels" : "levels";
        const { error: verifierError } = await supabase
          .from(tableName)
          .update({ verifier_profile_id: manualRunProfile })
          .eq("id", manualRunLevel);
        
        if (verifierError) throw verifierError;
        
        // Also remove is_verifier flag from other manual runs for this level
        await supabase
          .from("manual_runs")
          .update({ is_verifier: false })
          .eq("level_id", manualRunLevel)
          .neq("id", editingManualRun?.id || "");
      }

      if (editingManualRun) {
        // Update existing
        const { error } = await supabase
          .from("manual_runs")
          .update({
            level_id: manualRunLevel,
            profile_id: manualRunProfile,
            completion_time: completionTime,
            arrow_name: manualRunArrow,
            is_verifier: manualRunVerifier,
            completed_at: new Date(manualRunDate).toISOString(),
            note: manualRunNote || null,
            proof_url: manualRunProofUrl || null,
            list_type: manualRunListType,
          })
          .eq("id", editingManualRun.id);

        if (error) throw error;
        await logAction("Updated manual run", `${manualRunTime}s for profile ${manualRunProfile} (${manualRunListType})`);
        toast({ title: "Success", description: "Manual run updated" });
      } else {
        // Create new
        const { data: insertedRun, error } = await supabase.from("manual_runs").insert({
          level_id: manualRunLevel,
          profile_id: manualRunProfile,
          completion_time: completionTime,
          arrow_name: manualRunArrow,
          is_verifier: manualRunVerifier,
          completed_at: new Date(manualRunDate).toISOString(),
          note: manualRunNote || null,
          proof_url: manualRunProofUrl || null,
          added_by_admin_id: user!.id,
          added_by_admin_email: user!.email || "unknown",
          list_type: manualRunListType,
        }).select("id").single();

        if (error) throw error;
        
        // Get level and profile info for Discord notification
        const levelInfo = manualRunListType === "extra" 
          ? extendedLevels.find(l => l.id === manualRunLevel)
          : levels.find(l => l.id === manualRunLevel);
        const profileInfo = allProfiles.find(p => p.id === manualRunProfile);
        
        if (levelInfo && profileInfo) {
          try {
            await supabase.functions.invoke("discord-notify", {
              body: {
                webhook_type: manualRunListType === "extra"
                  ? "extra_completions"
                  : levelInfo.rank_position <= 100
                    ? "main_completions"
                    : "extended_completions",
                completion_type: manualRunListType === "extra" ? "extra_manual_run" : "manual_run",
                completion_id: insertedRun?.id || `manual-${Date.now()}`,
                profile_id: manualRunProfile,
                level_id: manualRunLevel,
                player_name: profileInfo.display_name || profileInfo.username,
                level_name: levelInfo.name || "Unknown Level",
                level_rank: levelInfo.rank_position,
                completion_time: completionTime,
                arrow_name: manualRunArrow,
                is_verifier: manualRunVerifier,
                list_type: manualRunListType,
              },
            });
          } catch (discordError) {
            console.error("Discord notification failed:", discordError);
          }
        }
        
        await logAction("Added manual run", `${manualRunTime}s for profile ${manualRunProfile} (${manualRunListType})`);
        toast({ title: "Success", description: "Manual run added" });
      }

      // Refresh levels to get updated verifier
      fetchLevels();
      if (manualRunListType === "extra") fetchExtendedLevels();

      setAddManualRunOpen(false);
      fetchManualRuns();
      fetchChangelog();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAddingManualRun(false);
    }
  };

  const deleteManualRun = async () => {
    if (!deleteConfirmManualRun) return;

    const { error } = await supabase.from("manual_runs").delete().eq("id", deleteConfirmManualRun.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete manual run", variant: "destructive" });
    } else {
      await logAction("Deleted manual run", `${deleteConfirmManualRun.completion_time}s for ${deleteConfirmManualRun.profile_username}`);
      toast({ title: "Success", description: "Manual run deleted" });
      fetchManualRuns();
      fetchChangelog();
    }

    setDeleteConfirmManualRun(null);
  };

  return {
    addExtendedLevel,
    addFutureLevel,
    addLevel,
    addLevelRater,
    addManualRunOpen,
    addingBan,
    addingExtendedLevel,
    addingFutureLevel,
    addingLevel,
    addingManualRun,
    addingRater,
    allProfiles,
    approvedPlayers,
    authLoading,
    banEmail,
    banReason,
    banUserFromSubmissions,
    bannedUsers,
    canExtra,
    canFuture,
    canMain,
    changelog,
    checkVerifiedFutureLevels,
    claimRequests,
    confirmDeleteLevel,
    confirmExtendedRankChange,
    confirmFutureRankChange,
    confirmFutureThumbnailChange,
    confirmRankChange,
    confirmThumbnailChange,
    currentPage,
    deleteConfirmFutureLevel,
    deleteConfirmLevel,
    deleteConfirmManualRun,
    deleteConfirmRater,
    deleteExtendedLevel,
    deleteFutureLevel,
    deleteManualRun,
    deletedLevels,
    deletedProfileArchive,
    displaySubmitter,
    dragOverIndex,
    draggedIndex,
    editAlternativeIds,
    editAuthor,
    editCreators,
    editDescription,
    editExtendedAlternativeIds,
    editExtendedAuthor,
    editExtendedCreators,
    editExtendedDescription,
    editExtendedName,
    editExtendedRank,
    editExtendedThumbnail,
    editExtendedThumbnailInputRef,
    editExtendedVerifier,
    editFutureAuthor,
    editFutureDescription,
    editFutureName,
    editFuturePoints,
    editFutureRank,
    editFutureThumbnail,
    editFutureThumbnailInputRef,
    editName,
    editNoteValue,
    editRunNoteValue,
    editThumbnail,
    editThumbnailInputRef,
    editVerifier,
    editingExtendedLevel,
    editingFutureLevel,
    editingLevel,
    editingManualRun,
    editingNoteId,
    editingRunNoteId,
    executeExtendedRankChange,
    executeRankChange,
    extendedLevelPreview,
    extendedLevels,
    extendedRankConfirmLevel,
    extendedRankInputId,
    extendedRankInputValue,
    extendedSearchQuery,
    fetchChangelog,
    fetchExtendedLevelPreview,
    fetchLevelSubmissions,
    fetchRunSubmissions,
    fetchingExtendedLevelInfo,
    filteredExtendedLevels,
    filteredFutureLevels,
    filteredLevelSubmissions,
    filteredLevels,
    filteredPlayers,
    filteredRunSubmissions,
    futureLevels,
    futureRankGroupSizes,
    futureRankInputId,
    futureRankInputValue,
    futureSearchQuery,
    futureThumbnailEditId,
    futureThumbnailInputValue,
    handleClaimRequest,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleDrop,
    handleEditThumbnailUpload,
    handleExtendedThumbnailUpload,
    handleFutureThumbnailUpload,
    handleLevelIdPaste,
    handlePasteExtendedThumbnail,
    handlePasteFutureThumbnail,
    handlePasteMainThumbnail,
    handleQuickExtendedThumbnailUpload,
    handleQuickFutureThumbnailUpload,
    handleQuickPasteExtendedThumbnail,
    handleQuickPasteFutureThumbnail,
    handleQuickPasteMainThumbnail,
    handleQuickThumbnailUpload,
    handleRunSubmissionReview,
    handleSubmissionReview,
    hardDeleteConfirmOpen,
    hardDeleteProfile,
    hardDeleteSearch,
    hardDeleteSelectedId,
    hardDeleting,
    hasAccess,
    isAdmin,
    levelRaters,
    levelSearchQuery,
    levelSubmissions,
    levels,
    loading,
    logAction,
    manualCheckEmptyLevels,
    manualRunArrow,
    manualRunDate,
    manualRunLevel,
    manualRunListType,
    manualRunNote,
    manualRunProfile,
    manualRunProofInputRef,
    manualRunProofUrl,
    manualRunTime,
    manualRunVerifier,
    manualRuns,
    maskEmail,
    mergeConfirmOpen,
    mergeDisplayName,
    mergeProfiles,
    mergeSourceProfile,
    mergeTargetProfile,
    mergingProfiles,
    moveExtendedLevel,
    moveFutureLevel,
    moveLevel,
    moveToExtraConfirm,
    moveToMainConfirm,
    newExtendedLevelId,
    newExtendedLevelRank,
    newFutureLevelId,
    newFutureLevelRank,
    newLevelId,
    newLevelRank,
    newRaterName,
    openAddManualRun,
    openEditExtendedLevel,
    openEditFutureLevel,
    openEditManualRun,
    openEditModal,
    paginatedLevels,
    pendingExtendedRank,
    pendingNewRank,
    playerSearchQuery,
    processingClaim,
    processingRunSubmission,
    processingSubmission,
    rankConfirmLevel,
    rankInputId,
    rankInputValue,
    raterAccess,
    raterLoaded,
    removeLevelRater,
    restoreDeletedLevel,
    restoreDeletedProfile,
    restoringArchiveId,
    restoringLevel,
    reviewingRunSubmission,
    reviewingSubmission,
    runSubmissionArrow,
    runSubmissionDate,
    runSubmissionNote,
    runSubmissionSearchQuery,
    runSubmissionTime,
    runSubmissions,
    saveEditedExtendedLevel,
    saveEditedFutureLevel,
    saveEditedLevel,
    saveManualRun,
    saving,
    savingExtendedLevel,
    savingFuture,
    savingFutureLevel,
    setAddManualRunOpen,
    setBanEmail,
    setBanReason,
    setCurrentPage,
    setDeleteConfirmFutureLevel,
    setDeleteConfirmLevel,
    setDeleteConfirmManualRun,
    setDeleteConfirmRater,
    setEditAlternativeIds,
    setEditAuthor,
    setEditCreators,
    setEditDescription,
    setEditExtendedAlternativeIds,
    setEditExtendedAuthor,
    setEditExtendedCreators,
    setEditExtendedDescription,
    setEditExtendedName,
    setEditExtendedRank,
    setEditExtendedThumbnail,
    setEditExtendedVerifier,
    setEditFutureAuthor,
    setEditFutureDescription,
    setEditFutureName,
    setEditFuturePoints,
    setEditFutureRank,
    setEditFutureThumbnail,
    setEditName,
    setEditNoteValue,
    setEditRunNoteValue,
    setEditThumbnail,
    setEditVerifier,
    setEditingExtendedLevel,
    setEditingFutureLevel,
    setEditingLevel,
    setEditingNoteId,
    setEditingRunNoteId,
    setExtendedRankConfirmLevel,
    setExtendedRankInputId,
    setExtendedRankInputValue,
    setExtendedSearchQuery,
    setFutureRankInputId,
    setFutureRankInputValue,
    setFutureSearchQuery,
    setFutureThumbnailEditId,
    setFutureThumbnailInputValue,
    setHardDeleteConfirmOpen,
    setHardDeleteSearch,
    setHardDeleteSelectedId,
    setLevelSearchQuery,
    setManualRunArrow,
    setManualRunDate,
    setManualRunLevel,
    setManualRunListType,
    setManualRunNote,
    setManualRunProfile,
    setManualRunProofUrl,
    setManualRunTime,
    setManualRunVerifier,
    setMergeConfirmOpen,
    setMergeDisplayName,
    setMergeSourceProfile,
    setMergeTargetProfile,
    setMoveToExtraConfirm,
    setMoveToMainConfirm,
    setNewExtendedLevelId,
    setNewExtendedLevelRank,
    setNewFutureLevelId,
    setNewFutureLevelRank,
    setNewLevelId,
    setNewLevelRank,
    setNewRaterName,
    setPendingExtendedRank,
    setPendingNewRank,
    setPlayerSearchQuery,
    setRankConfirmLevel,
    setRankInputId,
    setRankInputValue,
    setReviewingRunSubmission,
    setReviewingSubmission,
    setRunSubmissionArrow,
    setRunSubmissionDate,
    setRunSubmissionNote,
    setRunSubmissionSearchQuery,
    setRunSubmissionTime,
    setShowAll,
    setSubmissionNote,
    setSubmissionRank,
    setSubmissionSearchQuery,
    setSubmissionTargetList,
    setThumbnailEditId,
    setThumbnailInputValue,
    showAll,
    startExtendedRankEdit,
    startFutureRankEdit,
    startRankEdit,
    submissionNote,
    submissionRank,
    submissionSearchQuery,
    submissionTargetList,
    syncing,
    thumbnailEditId,
    thumbnailInputValue,
    toast,
    toggleRaterList,
    totalPages,
    transferExtendedToMain,
    transferMainToExtended,
    triggerSync,
    unbanUser,
    unlinkPlayer,
    updateRunSubmission,
    updateRunSubmissionNote,
    updateSubmissionNote,
    uploadProofScreenshot,
    uploadingExtendedRowThumb,
    uploadingExtendedThumbnail,
    uploadingFutureRowThumbnail,
    uploadingFutureThumbnail,
    uploadingProof,
    uploadingThumbnail,
  };
}

export type AdminState = ReturnType<typeof useAdminState>;
