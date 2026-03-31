import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, Trash2, Plus, RefreshCw, GripVertical, Image, Edit2, 
  ChevronUp, ChevronDown, ArrowUpDown, Check, X, Upload, AlertTriangle,
  ImagePlus, Loader2, UserCheck, UserX, Clock, Users, Mail, Hourglass, History,
  ListCollapse, List, Play, Send, MessageSquare, ExternalLink, FileVideo, Search, RotateCcw, Bell, Settings, Tag
} from "lucide-react";
import { LevelFeedbackAdmin } from "@/components/admin/LevelFeedbackAdmin";
import { LevelTagAssigner } from "@/components/admin/LevelTagAssigner";
import { BulkTagAssigner } from "@/components/admin/BulkTagAssigner";
import { TagPresetsManager } from "@/components/admin/TagPresetsManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Level {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  verifier_profile_id: string | null;
  alternative_ids: string[] | null;
}

interface FutureLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
}

interface ExtendedLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  creators: string[] | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  verifier_profile_id: string | null;
  alternative_ids: string[] | null;
}

// State for editing future level
interface FutureLevelEdit {
  id: string;
  name: string;
  author: string;
  rank_position: number;
  points: number;
  thumbnail_url: string;
}

interface ClaimRequest {
  id: string;
  profile_id: string;
  user_id: string;
  email: string;
  status: string;
  created_at: string;
  profile_username?: string;
  profile_display_name?: string;
}

interface ApprovedPlayer {
  id: string;
  username: string;
  display_name: string | null;
  user_id: string;
  email?: string;
}

interface ChangelogEntry {
  id: string;
  admin_email: string;
  action: string;
  details: string | null;
  created_at: string;
}

interface ManualRun {
  id: string;
  level_id: string;
  profile_id: string;
  completion_time: number;
  arrow_name: string;
  is_verifier: boolean;
  completed_at: string;
  note: string | null;
  proof_url: string | null;
  added_by_admin_email: string;
  created_at: string;
  level_name?: string;
  profile_username?: string;
  list_type?: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
}

interface LevelSubmission {
  id: string;
  level_id: string;
  level_name: string | null;
  author: string | null;
  thumbnail_url: string | null;
  suggested_rank: number;
  target_list: string;
  approved_list: string | null;
  final_rank: number | null;
  submitted_by: string | null;
  submitted_by_email: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

interface BannedUser {
  id: string;
  user_id: string;
  email: string;
  reason: string | null;
  banned_by_email: string;
  created_at: string;
}

interface RunSubmission {
  id: string;
  level_id: string;
  level_name: string | null;
  username: string;
  is_verifier: boolean;
  proof_url: string;
  status: string;
  admin_note: string | null;
  submitted_by_email: string;
  submitted_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface DeletedLevel {
  id: string;
  original_id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
  alternative_ids: string[] | null;
  verifier_profile_id: string | null;
  deleted_at: string;
  deleted_by: string;
  deleted_by_email: string;
}

interface WebhookSettings {
  id: string;
  webhook_type: string;
  webhook_url: string;
  enabled: boolean;
  custom_message_template: string | null;
}

const ITEMS_PER_PAGE = 20;

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
  const [resyncingExtraLevels, setResyncingExtraLevels] = useState(false);
  const [resyncingMainLevels, setResyncingMainLevels] = useState(false);
  const [resyncingFutureLevels, setResyncingFutureLevels] = useState(false);
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
  
  // Bulk import
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkLevelIds, setBulkLevelIds] = useState("");
  const [bulkStartRank, setBulkStartRank] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  
  // Edit modal
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [editName, setEditName] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCreators, setEditCreators] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editVerifier, setEditVerifier] = useState<string>("");
  const [editAlternativeIds, setEditAlternativeIds] = useState("");
  
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
  
  // Webhook settings
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings[]>([]);
  const [savingWebhook, setSavingWebhook] = useState<string | null>(null);
  const [webhookLocalEdits, setWebhookLocalEdits] = useState<Record<string, { webhook_url?: string; custom_message_template?: string | null }>>({});
  
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

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({ title: "Access Denied", description: "Admin privileges required", variant: "destructive" });
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate, toast]);

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
      fetchWebhookSettings();
    }
  }, [isAdmin]);

  const fetchWebhookSettings = async () => {
    const { data } = await supabase
      .from("webhook_settings")
      .select("*")
      .order("webhook_type");
    
    if (data) setWebhookSettings(data as WebhookSettings[]);
  };

  const updateWebhookSetting = async (id: string, updates: Partial<WebhookSettings>) => {
    setSavingWebhook(id);
    const { error } = await supabase
      .from("webhook_settings")
      .update(updates)
      .eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update webhook settings", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Webhook settings updated" });
      fetchWebhookSettings();
    }
    setSavingWebhook(null);
  };

  const sendAdminNotification = async (eventType: string, levelName: string, oldRank?: number, newRank?: number, listType?: string, action?: string) => {
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
    } catch (error: any) {
      toast({ title: "Restore Failed", description: error.message, variant: "destructive" });
    } finally {
      setRestoringLevel(null);
    }
  };

  // Extended List functions
  const fetchExtendedLevelPreview = async (levelId: string) => {
    if (!levelId.trim()) {
      setExtendedLevelPreview(null);
      return;
    }
    setFetchingExtendedLevelInfo(true);
    try {
      const response = await fetch(`https://api.narrowarrow.xyz/level-details/${levelId.trim()}?isCustomLevel=true`);
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

  const resyncExtraLevels = async () => {
    setResyncingExtraLevels(true);
    try {
      const { data, error } = await supabase.functions.invoke("resync-extra-levels");
      if (error) throw error;
      toast({ 
        title: "Resync Complete", 
        description: `Updated ${data?.updated || 0} extra levels with fresh data` 
      });
      fetchExtendedLevels();
    } catch (error: any) {
      toast({ title: "Resync Failed", description: error.message, variant: "destructive" });
    } finally {
      setResyncingExtraLevels(false);
    }
  };

  const resyncMainLevels = async () => {
    setResyncingMainLevels(true);
    try {
      const { data, error } = await supabase.functions.invoke("resync-main-levels");
      if (error) throw error;
      toast({ 
        title: "Resync Complete", 
        description: `Updated ${data?.updated || 0} main levels with fresh data` 
      });
      fetchLevels();
    } catch (error: any) {
      toast({ title: "Resync Failed", description: error.message, variant: "destructive" });
    } finally {
      setResyncingMainLevels(false);
    }
  };

  const resyncFutureLevels = async () => {
    setResyncingFutureLevels(true);
    try {
      const { data, error } = await supabase.functions.invoke("resync-future-levels");
      if (error) throw error;
      toast({ 
        title: "Resync Complete", 
        description: `Updated ${data?.updated || 0} future levels with fresh data` 
      });
      fetchFutureLevels();
    } catch (error: any) {
      toast({ title: "Resync Failed", description: error.message, variant: "destructive" });
    } finally {
      setResyncingFutureLevels(false);
    }
  };

  // Hardfix function removed - functionality covered by Sync Completions button

  const addExtendedLevel = async () => {
    if (!newExtendedLevelId.trim()) return;
    setAddingExtendedLevel(true);

    try {
      const targetRank = parseInt(newExtendedLevelRank) || extendedLevels.length + 1;

      // Validate target rank
      if (targetRank < 1 || targetRank > extendedLevels.length + 1) {
        throw new Error(`Rank must be between 1 and ${extendedLevels.length + 1}`);
      }

      // Shift existing levels down if inserting at a specific rank
      if (targetRank <= extendedLevels.length) {
        const levelsToShift = extendedLevels.filter(l => l.rank_position >= targetRank);
        for (const level of levelsToShift) {
          await supabase
            .from("extended_levels")
            .update({ rank_position: level.rank_position + 1 })
            .eq("id", level.id);
        }
      }

      // Use preview data if available, otherwise fetch fresh
      let levelData: any = null;
      if (extendedLevelPreview) {
        levelData = { levelInfo: extendedLevelPreview };
      } else {
        const response = await fetch(`https://api.narrowarrow.xyz/level-details/${newExtendedLevelId.trim()}?isCustomLevel=true`);
        if (response.ok) {
          levelData = await response.json();
        }
      }

      const { error } = await supabase.from("extended_levels").insert({
        level_id: newExtendedLevelId.trim(),
        name: levelData?.levelInfo?.name || null,
        author: levelData?.levelInfo?.author || null,
        rank_position: targetRank,
        thumbnail_url: levelData?.levelInfo?.thumbnail_url || null,
      });

      if (error) throw error;

      const levelName = levelData?.levelInfo?.name || newExtendedLevelId.trim();
      await logAction("Added extra level", `${levelName} at rank #${targetRank}`);
      
      // Send webhook notification
      await sendAdminNotification("extra_level_added", levelName, undefined, targetRank, "Extra", "added");
      
      toast({ title: "Success", description: `Extra level added at rank #${targetRank}` });
      setNewExtendedLevelId("");
      setNewExtendedLevelRank("");
      setExtendedLevelPreview(null);
      fetchExtendedLevels();
      fetchChangelog();
    } catch (error: any) {
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
      // Update both levels' rank positions
      await supabase
        .from("extended_levels")
        .update({ rank_position: swapLevel.rank_position })
        .eq("id", currentLevel.id);
      
      await supabase
        .from("extended_levels")
        .update({ rank_position: currentLevel.rank_position })
        .eq("id", swapLevel.id);
      
      await logAction("Moved extra level", `${currentLevel.name || currentLevel.level_id} ${direction}`);
      fetchExtendedLevels();
    } catch (error: any) {
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
    } catch (error: any) {
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
      toast({ title: "Deleted", description: "Extra level removed and ranks updated" });
      fetchExtendedLevels();
      fetchChangelog();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
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
      await sendAdminNotification("extra_to_main", levelName, level.rank_position, targetRank, "Extra", "transferred to Main");
      
      toast({ title: "Success", description: `${levelName} moved to main list` });
      fetchLevels();
      fetchExtendedLevels();
      fetchChangelog();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const transferMainToExtended = async (level: Level) => {
    try {
      // Get the next rank in extended list
      const targetRank = extendedLevels.length + 1;

      // Insert into extended levels with all relevant data
      const { error: insertError } = await supabase.from("extended_levels").insert({
        level_id: level.level_id,
        name: level.name,
        author: level.author,
        creators: [],
        rank_position: targetRank,
        points: 0,
        thumbnail_url: level.thumbnail_url,
        verifier_profile_id: level.verifier_profile_id,
        alternative_ids: level.alternative_ids,
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
      await sendAdminNotification("level_to_extended", level.name || level.level_id, level.rank_position, targetRank, "Main", "transferred to Extra");
      toast({ title: "Success", description: `${level.name || level.level_id} moved to extra list` });
      fetchLevels();
      fetchExtendedLevels();
      fetchDeletedLevels();
      fetchChangelog();
    } catch (error: any) {
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
      // Get level names and profile usernames
      const enrichedRuns = await Promise.all(data.map(async (run) => {
        const { data: level } = await supabase
          .from("levels")
          .select("name")
          .eq("id", run.level_id)
          .maybeSingle();
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", run.profile_id)
          .maybeSingle();
        
        return {
          ...run,
          level_name: level?.name || "Unknown Level",
          profile_username: profile?.username || "Unknown Player",
        };
      }));
      
      setManualRuns(enrichedRuns);
    }
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .order("username");
    
    if (data) setAllProfiles(data);
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
    } catch (error: any) {
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

        await logAction("Approved run submission", `${submission.username} on ${level.name || submission.level_id} (submitted by ${submission.submitted_by_email})`);
        toast({ title: "Run Approved", description: `Added as manual run for ${submission.username}` });
        fetchManualRuns();
      } else {
        await logAction("Rejected run submission", `${submission.username} on ${submission.level_name || submission.level_id} (submitted by ${submission.submitted_by_email})`);
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
          // Shift existing main levels
          const levelsToUpdate = levels.filter(l => l.rank_position >= rank);
          for (const level of levelsToUpdate) {
            await supabase
              .from("levels")
              .update({ 
                rank_position: level.rank_position + 1,
                points: calculatePoints(level.rank_position + 1)
              })
              .eq("id", level.id);
          }

          // Add to main list
          const { error: insertError } = await supabase.from("levels").insert({
            level_id: submission.level_id,
            name: submission.level_name,
            author: submission.author,
            rank_position: rank,
            points: calculatePoints(rank),
            thumbnail_url: submission.thumbnail_url,
          });

          if (insertError) throw insertError;
          
          await logAction("Approved level submission to Main List", `${submission.level_name || submission.level_id} at rank #${rank}`);
          toast({ title: "Level Approved", description: `Added to Main List at rank #${rank}` });
          fetchLevels();
        } else if (targetList === "extra") {
          // Add to extra list
          const { error: insertError } = await supabase.from("extended_levels").insert({
            level_id: submission.level_id,
            name: submission.level_name,
            author: submission.author,
            rank_position: rank,
            points: 0, // Will be auto-calculated by trigger
            thumbnail_url: submission.thumbnail_url,
          });

          if (insertError) throw insertError;
          
          await logAction("Approved level submission to Extra List", `${submission.level_name || submission.level_id} at rank #${rank}`);
          toast({ title: "Level Approved", description: `Added to Extra List at rank #${rank}` });
          fetchExtendedLevels();
        } else if (targetList === "future") {
          // Add to future list
          const { error: insertError } = await supabase.from("future_levels").insert({
            level_id: submission.level_id,
            name: submission.level_name,
            author: submission.author,
            rank_position: rank,
            points: calculatePoints(rank),
            thumbnail_url: submission.thumbnail_url,
          });

          if (insertError) throw insertError;
          
          await logAction("Approved level submission to Future List", `${submission.level_name || submission.level_id} at rank #${rank}`);
          toast({ title: "Level Approved", description: `Added to Future List at rank #${rank}` });
          fetchFutureLevels();
        }
      } else {
        await logAction("Rejected level submission", `${submission.level_name || submission.level_id} (submitted by ${submission.submitted_by_email})`);
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
    } catch (error: any) {
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
      .order("rank_position", { ascending: true });
    
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

  const filteredFutureLevels = useMemo(() => {
    if (!futureSearchQuery.trim()) return futureLevels;
    const query = futureSearchQuery.toLowerCase();
    return futureLevels.filter(l => 
      l.name?.toLowerCase().includes(query) ||
      l.author?.toLowerCase().includes(query) ||
      l.level_id.toLowerCase().includes(query)
    );
  }, [futureLevels, futureSearchQuery]);

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
    if (!newLevelId.trim()) return;
    
    setAddingLevel(true);
    
    try {
      const response = await fetch(
        `https://api.narrowarrow.xyz/level-details/${newLevelId.trim()}?isCustomLevel=true`
      );
      
      if (!response.ok) {
        throw new Error("Level not found");
      }
      
      const data = await response.json();
      const targetRank = newLevelRank ? parseInt(newLevelRank) : levels.length + 1;
      
      if (targetRank < 1 || targetRank > levels.length + 1) {
        throw new Error(`Rank must be between 1 and ${levels.length + 1}`);
      }
      
      if (targetRank <= levels.length) {
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
      }
      
      const { error } = await supabase.from("levels").insert({
        level_id: newLevelId.trim(),
        name: data.levelInfo?.name || "Unknown Level",
        author: data.levelInfo?.author || "Unknown",
        rank_position: targetRank,
        points: calculatePoints(targetRank),
        thumbnail_url: null,
      });
      
      if (error) throw error;
      
      await logAction("Added level", `${data.levelInfo?.name || newLevelId} at rank #${targetRank}`);
      toast({ title: "Success", description: `Level added at rank #${targetRank}` });
      
      // Send admin notification
      await sendAdminNotification("level_addition", data.levelInfo?.name || newLevelId, undefined, targetRank, "Main", "added");
      
      setNewLevelId("");
      setNewLevelRank("");
      fetchLevels();
      fetchChangelog();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add level", variant: "destructive" });
    } finally {
      setAddingLevel(false);
    }
  };

  const addFutureLevel = async () => {
    if (!newFutureLevelId.trim()) return;
    
    setAddingFutureLevel(true);
    
    try {
      const response = await fetch(
        `https://api.narrowarrow.xyz/level-details/${newFutureLevelId.trim()}?isCustomLevel=true`
      );
      
      if (!response.ok) {
        throw new Error("Level not found");
      }
      
      const data = await response.json();
      const targetRank = newFutureLevelRank ? parseInt(newFutureLevelRank) : 1;
      
      const { error } = await supabase.from("future_levels").insert({
        level_id: newFutureLevelId.trim(),
        name: data.levelInfo?.name || "Unknown Level",
        author: data.levelInfo?.author || "Unknown",
        rank_position: targetRank,
        points: calculatePoints(targetRank),
        thumbnail_url: null,
      });
      
      if (error) throw error;
      
      await logAction("Added future level", `${data.levelInfo?.name || newFutureLevelId} at estimated rank #${targetRank}`);
      toast({ title: "Success", description: `Future level added with estimated rank #${targetRank}` });
      
      // Send admin notification
      await sendAdminNotification("future_level", data.levelInfo?.name || newFutureLevelId, undefined, targetRank, "Future", "added");
      
      setNewFutureLevelId("");
      setNewFutureLevelRank("");
      fetchFutureLevels();
      fetchChangelog();
    } catch (error: any) {
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
      await logAction("Removed future level", deleteConfirmFutureLevel.name || deleteConfirmFutureLevel.level_id);
      toast({ title: "Success", description: "Future level removed" });
      fetchFutureLevels();
      fetchChangelog();
    }
    
    setDeleteConfirmFutureLevel(null);
  };

  const openEditFutureLevel = (level: FutureLevel) => {
    setEditingFutureLevel(level);
    setEditFutureName(level.name || "");
    setEditFutureAuthor(level.author || "");
    setEditFutureRank(String(level.rank_position));
    setEditFuturePoints(String(level.points));
    setEditFutureThumbnail(level.thumbnail_url || "");
  };

  const saveEditedFutureLevel = async () => {
    if (!editingFutureLevel) return;
    
    setSavingFutureLevel(true);
    const { error } = await supabase
      .from("future_levels")
      .update({
        name: editFutureName || null,
        author: editFutureAuthor || null,
        rank_position: parseInt(editFutureRank) || 1,
        points: parseInt(editFuturePoints) || calculatePoints(parseInt(editFutureRank) || 1),
        thumbnail_url: editFutureThumbnail || null,
      })
      .eq("id", editingFutureLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update future level", variant: "destructive" });
    } else {
      await logAction("Edited future level", `${editFutureName || editingFutureLevel.level_id}`);
      toast({ title: "Success", description: "Future level updated" });
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
    } catch (error: any) {
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
  };

  const saveEditedExtendedLevel = async () => {
    if (!editingExtendedLevel) return;
    
    setSavingExtendedLevel(true);
    
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
        rank_position: parseInt(editExtendedRank) || 1,
        thumbnail_url: editExtendedThumbnail || null,
        verifier_profile_id: editExtendedVerifier === "none" ? null : editExtendedVerifier || null,
        alternative_ids: alternativeIdsArray.length > 0 ? alternativeIdsArray : null,
      })
      .eq("id", editingExtendedLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update extra level", variant: "destructive" });
    } else {
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
    } catch (error: any) {
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
      toast({ title: "Success", description: `Level moved to main list at rank #${targetRank}` });
      fetchLevels();
      fetchFutureLevels();
      fetchChangelog();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const bulkImportLevels = async () => {
    const ids = bulkLevelIds
      .split(/[\n,]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    if (ids.length === 0) {
      toast({ title: "Error", description: "No valid level IDs found", variant: "destructive" });
      return;
    }
    
    setBulkImporting(true);
    let successCount = 0;
    let errorCount = 0;
    
    const startRank = bulkStartRank ? parseInt(bulkStartRank) : levels.length + 1;
    
    if (startRank <= levels.length) {
      const levelsToUpdate = levels.filter(l => l.rank_position >= startRank);
      for (const level of levelsToUpdate) {
        await supabase
          .from("levels")
          .update({ 
            rank_position: level.rank_position + ids.length,
            points: calculatePoints(level.rank_position + ids.length)
          })
          .eq("id", level.id);
      }
    }
    
    let currentRank = startRank;
    
    for (const levelId of ids) {
      try {
        const existingLevel = levels.find(l => l.level_id === levelId);
        if (existingLevel) {
          errorCount++;
          continue;
        }
        
        const response = await fetch(
          `https://api.narrowarrow.xyz/level-details/${levelId}?isCustomLevel=true`
        );
        
        if (!response.ok) {
          errorCount++;
          continue;
        }
        
        const data = await response.json();
        
        const { error } = await supabase.from("levels").insert({
          level_id: levelId,
          name: data.levelInfo?.name || "Unknown Level",
          author: data.levelInfo?.author || "Unknown",
          rank_position: currentRank,
          points: calculatePoints(currentRank),
          thumbnail_url: null,
        });
        
        if (error) {
          errorCount++;
        } else {
          successCount++;
          currentRank++;
        }
      } catch {
        errorCount++;
      }
    }
    
    await logAction("Bulk imported levels", `${successCount} levels starting at rank #${startRank}`);
    
    setBulkImporting(false);
    setBulkImportOpen(false);
    setBulkLevelIds("");
    setBulkStartRank("");
    
    toast({ 
      title: "Bulk Import Complete", 
      description: `Added ${successCount} levels starting at rank #${startRank}. ${errorCount > 0 ? `${errorCount} failed/skipped.` : ""}` 
    });
    
    fetchLevels();
    fetchChangelog();
  };

  const confirmDeleteLevel = async () => {
    if (!deleteConfirmLevel) return;
    
    const { error } = await supabase.from("levels").delete().eq("id", deleteConfirmLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to remove level", variant: "destructive" });
    } else {
      await logAction("Removed level", deleteConfirmLevel.name || deleteConfirmLevel.level_id);
      toast({ title: "Success", description: "Level removed" });
      const remaining = levels.filter(l => l.id !== deleteConfirmLevel.id);
      await updateRanks(remaining.map((l, i) => ({ ...l, rank_position: i + 1 })));
      fetchLevels();
      fetchChangelog();
    }
    
    setDeleteConfirmLevel(null);
  };

  const moveLevel = async (index: number, direction: "up" | "down") => {
    const newLevels = [...levels];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newLevels.length) return;
    
    [newLevels[index], newLevels[targetIndex]] = [newLevels[targetIndex], newLevels[index]];
    
    const updatedLevels = newLevels.map((l, i) => ({
      ...l,
      rank_position: i + 1,
      points: calculatePoints(i + 1),
    }));
    
    setLevels(updatedLevels);
    await updateRanks(updatedLevels);
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
    await sendAdminNotification("rank_change", rankConfirmLevel.name || rankConfirmLevel.level_id, oldRank, pendingNewRank, "Main", "moved");
    
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
      const updateData: any = {};
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
    } catch (error: any) {
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

  const openEditModal = (level: Level) => {
    setEditingLevel(level);
    setEditName(level.name || "");
    setEditAuthor(level.author || "");
    setEditCreators(((level as any).creators || []).join(", "));
    setEditThumbnail(level.thumbnail_url || "");
    setEditVerifier(level.verifier_profile_id || "");
    setEditAlternativeIds((level.alternative_ids || []).join(", "));
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
      })
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
      
      await logAction(`${action === "approved" ? "Approved" : "Rejected"} claim request`, `Profile: ${request.profile_username}, Email: ${request.email}`);
      
      toast({ 
        title: action === "approved" ? "Claim Approved" : "Claim Rejected",
        description: action === "approved" 
          ? `Profile linked to user successfully` 
          : `Claim request has been rejected`
      });
      
      fetchClaimRequests();
      fetchApprovedPlayers();
      fetchChangelog();
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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

  if (authLoading || loading) {
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

  if (!isAdmin) return null;

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
                <p className="text-sm text-muted-foreground hidden md:block">Manage levels, players, and settings</p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => setBulkImportOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk Import</span>
              </Button>
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
          </div>

          {/* Claim Requests */}
          {claimRequests.length > 0 && (
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
                        Email: {request.email} • Requested: {new Date(request.created_at).toLocaleDateString()}
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

          <Tabs defaultValue="levels" className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <TabsList className="justify-start overflow-x-auto flex-nowrap gap-1 h-auto p-1">
                <TabsTrigger value="submissions" className="text-xs sm:text-sm gap-1 flex-shrink-0">
                  <Send className="w-3 h-3 hidden sm:inline" />
                  Submissions
                  {levelSubmissions.filter(s => s.status === 'pending').length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-yellow-950 rounded-full">
                      {levelSubmissions.filter(s => s.status === 'pending').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="levels" className="text-xs sm:text-sm flex-shrink-0">Main ({levels.length})</TabsTrigger>
                <TabsTrigger value="future" className="text-xs sm:text-sm flex-shrink-0">Future ({futureLevels.length})</TabsTrigger>
                <TabsTrigger value="extended" className="text-xs sm:text-sm flex-shrink-0">Extra ({extendedLevels.length})</TabsTrigger>
                <TabsTrigger value="manual-runs" className="text-xs sm:text-sm flex-shrink-0">Runs ({manualRuns.length})</TabsTrigger>
                <TabsTrigger value="feedback" className="text-xs sm:text-sm flex-shrink-0">Feedback</TabsTrigger>
                <TabsTrigger value="players" className="text-xs sm:text-sm flex-shrink-0">Players ({approvedPlayers.length})</TabsTrigger>
                <TabsTrigger value="bans" className="text-xs sm:text-sm flex-shrink-0">Bans ({bannedUsers.length})</TabsTrigger>
                <TabsTrigger value="deleted" className="text-xs sm:text-sm flex-shrink-0 text-destructive">
                  <RotateCcw className="w-3 h-3 hidden sm:inline" />
                  Deleted ({deletedLevels.length})
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="text-xs sm:text-sm flex-shrink-0">
                  <Bell className="w-3 h-3 hidden sm:inline" />
                  Webhooks
                </TabsTrigger>
                <TabsTrigger value="tags" className="text-xs sm:text-sm flex-shrink-0">
                  <Tag className="w-3 h-3 hidden sm:inline" />
                  Tag Presets
                </TabsTrigger>
                <TabsTrigger value="changelog" className="text-xs sm:text-sm flex-shrink-0">Log</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkTagManagerOpen(true)}
                className="gap-1 flex-shrink-0"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk Tags</span>
              </Button>
            </div>

            {/* Level Submissions Tab */}
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
                                Submitted by {submission.submitted_by_email} • {new Date(submission.created_at).toLocaleDateString()}
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
                                      await logAction("Marked level submission as read", `${submission.level_name || submission.level_id} (${submission.submitted_by_email})`);
                                      toast({ title: "Marked as Read" });
                                      fetchLevelSubmissions();
                                      fetchChangelog();
                                    } catch (error: any) {
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
                                    } catch (error: any) {
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
                                        await logAction("Deleted submission", `${submission.level_name || submission.level_id} (${submission.submitted_by_email})`);
                                        toast({ title: "Submission Deleted" });
                                        fetchLevelSubmissions();
                                        fetchChangelog();
                                      } catch (error: any) {
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
                                <span>Submitted by {submission.submitted_by_email}</span>
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
                                    } catch (error: any) {
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
                                    } catch (error: any) {
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
                                      } catch (error: any) {
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

            <TabsContent value="levels" className="space-y-6">
              {/* Add New Level */}
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Add New Level
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Enter level ID"
                    value={newLevelId}
                    onChange={(e) => setNewLevelId(e.target.value)}
                    className="flex-1 bg-secondary border-border"
                  />
                  <Input
                    placeholder={`Rank (1-${levels.length + 1})`}
                    value={newLevelRank}
                    onChange={(e) => setNewLevelRank(e.target.value)}
                    className="w-full sm:w-32 bg-secondary border-border"
                    type="number"
                    min={1}
                    max={levels.length + 1}
                  />
                  <Button onClick={addLevel} disabled={addingLevel || !newLevelId.trim()}>
                    {addingLevel ? "Adding..." : "Add Level"}
                  </Button>
                </div>
              </div>

              {/* Level List */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                      <ArrowUpDown className="w-5 h-5 text-primary" />
                      Level Rankings
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                        {filteredLevels.length}{levelSearchQuery ? ` of ${levels.length}` : ""} levels
                      </span>
                    </h2>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resyncMainLevels}
                        disabled={resyncingMainLevels}
                        className="gap-1 text-xs"
                      >
                        {resyncingMainLevels ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Resync All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="gap-1 text-xs"
                      >
                        {showAll ? <ListCollapse className="w-3 h-3" /> : <List className="w-3 h-3" />}
                        {showAll ? "Paginate" : "Show All"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={manualCheckEmptyLevels}
                        disabled={syncing}
                        className="gap-1 text-xs"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Check Empty
                      </Button>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search levels by name, author, or ID..."
                      value={levelSearchQuery}
                      onChange={(e) => { setLevelSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="pl-9 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>

                {filteredLevels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {levelSearchQuery ? "No matching levels found." : "No levels added yet."}
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border">
                      {paginatedLevels.map((level, index) => {
                        const realIndex = showAll ? index : (currentPage - 1) * ITEMS_PER_PAGE + index;
                        return (
                          <div
                            key={level.id}
                            draggable
                            onDragStart={() => handleDragStart(realIndex)}
                            onDragOver={(e) => handleDragOver(e, realIndex)}
                            onDrop={() => handleDrop(realIndex)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 transition-all cursor-grab active:cursor-grabbing
                              ${draggedIndex === realIndex ? "opacity-50 bg-primary/10" : "hover:bg-secondary/20"}
                              ${dragOverIndex === realIndex && draggedIndex !== realIndex ? "border-t-2 border-primary" : ""}
                            `}
                          >
                            <div className="flex-shrink-0 text-muted-foreground hidden sm:block">
                              <GripVertical className="w-5 h-5" />
                            </div>

                            <div className="w-12 md:w-16 flex-shrink-0">
                              {rankInputId === level.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={levels.length}
                                    value={rankInputValue}
                                    onChange={(e) => setRankInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && confirmRankChange()}
                                    className="w-12 h-8 text-center p-1 bg-secondary"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmRankChange}>
                                    <Check className="w-3 h-3 text-green-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRankInputId(null)}>
                                    <X className="w-3 h-3 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startRankEdit(level)}
                                  className="font-display font-bold text-lg text-foreground hover:text-primary transition-colors"
                                  title="Click to change rank"
                                >
                                  #{level.rank_position}
                                </button>
                              )}
                            </div>

                            <div className="w-16 md:w-20 h-10 md:h-12 rounded bg-secondary overflow-hidden flex-shrink-0 relative group">
                              {uploadingThumbnail === level.id ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                              ) : thumbnailEditId === level.id ? (
                                <div className="absolute inset-0 bg-card p-1 flex items-center gap-1 z-10">
                                  <Input
                                    type="text"
                                    placeholder="URL..."
                                    value={thumbnailInputValue}
                                    onChange={(e) => setThumbnailInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && confirmThumbnailChange()}
                                    className="h-full text-xs p-1 bg-secondary flex-1"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={confirmThumbnailChange}>
                                    <Check className="w-3 h-3 text-green-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setThumbnailEditId(null)}>
                                    <X className="w-3 h-3 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id={`thumb-upload-${level.id}`}
                                    onChange={(e) => handleQuickThumbnailUpload(e, level.id)}
                                  />
                                  <div className="w-full h-full relative">
                                    {level.thumbnail_url ? (
                                      <img
                                        src={level.thumbnail_url}
                                        alt={level.name || "Level"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Image className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                                      <button
                                        onClick={() => document.getElementById(`thumb-upload-${level.id}`)?.click()}
                                        className="p-1 rounded bg-primary/80 hover:bg-primary"
                                        title="Upload image"
                                      >
                                        <ImagePlus className="w-3 h-3 text-primary-foreground" />
                                      </button>
                                      <button
                                        onClick={() => startThumbnailEdit(level)}
                                        className="p-1 rounded bg-secondary/80 hover:bg-secondary"
                                        title="Enter URL"
                                      >
                                        <Edit2 className="w-3 h-3 text-foreground" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate text-sm md:text-base">
                                {level.name || "Unnamed Level"}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {level.author || "Unknown"} • {level.points} pts
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLevel(realIndex, "up")}
                                disabled={realIndex === 0 || saving}
                                className="h-8 w-8 hidden sm:flex"
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveLevel(realIndex, "down")}
                                disabled={realIndex === levels.length - 1 || saving}
                                className="h-8 w-8 hidden sm:flex"
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(level)}
                                className="h-8 w-8"
                                title="Edit details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMoveToExtraConfirm(level)}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                                title="Move to Extra List"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                                Extra
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmLevel(level)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Remove level"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pagination */}
                    {!showAll && totalPages > 1 && (
                      <div className="p-4 border-t border-border flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="future" className="space-y-6">
              {/* Add Future Level */}
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Hourglass className="w-5 h-5 text-primary" />
                  Add Future Level
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Enter level ID"
                    value={newFutureLevelId}
                    onChange={(e) => setNewFutureLevelId(e.target.value)}
                    className="flex-1 bg-secondary border-border"
                  />
                  <Input
                    placeholder="Estimated Rank"
                    value={newFutureLevelRank}
                    onChange={(e) => setNewFutureLevelRank(e.target.value)}
                    className="w-full sm:w-32 bg-secondary border-border"
                    type="number"
                    min={1}
                  />
                  <Button onClick={addFutureLevel} disabled={addingFutureLevel || !newFutureLevelId.trim()}>
                    {addingFutureLevel ? "Adding..." : "Add Level"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Future levels are unbeaten levels. Use "Check Verified Levels" to automatically move verified levels to the main list.
                </p>
              </div>

              {/* Future Level List */}
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                      <Hourglass className="w-5 h-5 text-primary" />
                      Future Levels
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                        {filteredFutureLevels.length}{futureSearchQuery ? ` of ${futureLevels.length}` : ""} levels
                      </span>
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resyncFutureLevels}
                        disabled={resyncingFutureLevels}
                        className="gap-1 text-xs"
                      >
                        {resyncingFutureLevels ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Resync All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={checkVerifiedFutureLevels}
                        disabled={syncing}
                        className="gap-1 text-xs"
                      >
                        <Shield className="w-3 h-3" />
                        Check Verified Levels
                      </Button>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search future levels..."
                      value={futureSearchQuery}
                      onChange={(e) => setFutureSearchQuery(e.target.value)}
                      className="pl-9 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>

                {filteredFutureLevels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {futureSearchQuery ? "No matching future levels found." : "No future levels added yet."}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredFutureLevels.map((level) => (
                      <div key={level.id} className="flex items-center gap-3 p-4">
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-secondary overflow-hidden">
                          {level.thumbnail_url ? (
                            <img src={level.thumbnail_url} alt={level.name || "Level"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="w-16 flex-shrink-0">
                          <span className="font-display font-bold text-lg text-primary">
                            ~#{level.rank_position}
                          </span>
                          <div className="text-xs text-muted-foreground">{level.points} pts</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {level.name || "Unnamed Level"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            By: {level.author || "Unknown"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditFutureLevel(level)}
                            className="gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Info
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmFutureLevel(level)}
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

            {/* Extended List Tab */}
            <TabsContent value="extended" className="space-y-6">
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <List className="w-5 h-5 text-primary" />
                    Extra List
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search extra levels..."
                        value={extendedSearchQuery}
                        onChange={(e) => setExtendedSearchQuery(e.target.value)}
                        className="pl-9 bg-secondary border-border h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Add Extra Level */}
                <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="Level ID"
                      value={newExtendedLevelId}
                      onChange={(e) => {
                        setNewExtendedLevelId(e.target.value);
                        // Debounce fetch preview
                        const value = e.target.value;
                        setTimeout(() => {
                          if (value && value.length > 5) {
                            fetchExtendedLevelPreview(value);
                          }
                        }, 500);
                      }}
                      onBlur={() => fetchExtendedLevelPreview(newExtendedLevelId)}
                      className="bg-card border-border h-8"
                    />
                    {fetchingExtendedLevelInfo && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching level info...
                      </p>
                    )}
                    {extendedLevelPreview && (
                      <p className="text-xs text-primary mt-1">
                        ✓ {extendedLevelPreview.name} by {extendedLevelPreview.author}
                      </p>
                    )}
                  </div>
                  <Input
                    placeholder="Rank"
                    type="number"
                    value={newExtendedLevelRank}
                    onChange={(e) => setNewExtendedLevelRank(e.target.value)}
                    className="w-20 bg-card border-border h-8"
                  />
                  <Button
                    size="sm"
                    onClick={addExtendedLevel}
                    disabled={addingExtendedLevel || !newExtendedLevelId.trim()}
                    className="gap-1"
                  >
                    {addingExtendedLevel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resyncExtraLevels}
                    disabled={resyncingExtraLevels}
                    className="gap-1"
                  >
                    {resyncingExtraLevels ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Resync All
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={syncExtraCompletions}
                    disabled={syncingExtraCompletions}
                    className="gap-1"
                  >
                    {syncingExtraCompletions ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Sync Completions
                  </Button>
                </div>

                {/* Extra Level List */}
                {extendedLevels.filter(l => 
                  !extendedSearchQuery.trim() ||
                  l.name?.toLowerCase().includes(extendedSearchQuery.toLowerCase()) ||
                  l.author?.toLowerCase().includes(extendedSearchQuery.toLowerCase()) ||
                  l.level_id.toLowerCase().includes(extendedSearchQuery.toLowerCase())
                ).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {extendedSearchQuery ? "No matching levels found." : "No extra levels yet."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extendedLevels.filter(l => 
                      !extendedSearchQuery.trim() ||
                      l.name?.toLowerCase().includes(extendedSearchQuery.toLowerCase()) ||
                      l.author?.toLowerCase().includes(extendedSearchQuery.toLowerCase()) ||
                      l.level_id.toLowerCase().includes(extendedSearchQuery.toLowerCase())
                    ).map((level, filteredIndex) => {
                      const actualIndex = extendedLevels.findIndex(l => l.id === level.id);
                      return (
                      <div key={level.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        {/* Move up/down buttons */}
                        <div className="flex flex-col gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => moveExtendedLevel(actualIndex, "up")}
                            disabled={actualIndex === 0}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => moveExtendedLevel(actualIndex, "down")}
                            disabled={actualIndex === extendedLevels.length - 1}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="w-10 text-center font-display font-bold text-muted-foreground">
                          #{level.rank_position}
                        </div>
                        <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-secondary">
                          {level.thumbnail_url ? (
                            <img src={level.thumbnail_url} alt={level.name || ""} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{level.name || level.level_id}</div>
                          <div className="text-xs text-muted-foreground">
                            {level.creators && level.creators.length > 0 
                              ? level.creators.join(", ") 
                              : level.author || "Unknown"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-accent">
                          <span className="font-mono text-xs">{level.points} pts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 gap-1"
                            onClick={() => openEditExtendedLevel(level)}
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="hidden sm:inline text-xs">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 gap-1 text-primary border-primary/50 hover:bg-primary/10"
                            onClick={() => setMoveToMainConfirm(level)}
                            title="Move to Main List"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                            <span className="hidden sm:inline text-xs">Main</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteExtendedLevel(level)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </TabsContent>

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
                            Completed: {new Date(run.completed_at).toLocaleDateString()} • Added by: {run.added_by_admin_email}
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

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-6">
              <LevelFeedbackAdmin />
            </TabsContent>

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
                                  {player.email}
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

            {/* Bans Tab */}
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
                          <div className="font-medium text-foreground">{banned.email}</div>
                          {banned.reason && (
                            <div className="text-sm text-muted-foreground">Reason: {banned.reason}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Banned by {banned.banned_by_email} • {new Date(banned.created_at).toLocaleDateString()}
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

            {/* Deleted Levels Tab */}
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
                              Deleted by {level.deleted_by_email} on {new Date(level.deleted_at).toLocaleString()}
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

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-6">
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Discord Webhook Settings
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure individual Discord webhooks for each event type with customizable message templates
                  </p>
                </div>

                <div className="p-4 space-y-6">
                  {webhookSettings.map((webhook) => {
                    const typeLabels: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
                      main_completions: { label: 'Main List Completions', description: 'Completions & verifications on the main list (ranks 1-100)', icon: <Play className="w-5 h-5 text-primary" /> },
                      extended_completions: { label: 'Extended List Completions', description: 'Completions on levels ranked 101+', icon: <List className="w-5 h-5 text-accent" /> },
                      extra_completions: { label: 'Extra List Completions', description: 'Completions on Extra List levels', icon: <ListCollapse className="w-5 h-5 text-accent" /> },
                      rank_changes: { label: 'Rank Changes & Admin Actions', description: 'Level rank changes, additions, deletions, transfers', icon: <Settings className="w-5 h-5 text-accent" /> },
                    };
                    const info = typeLabels[webhook.webhook_type] || { label: webhook.webhook_type, description: '', icon: <Bell className="w-5 h-5" /> };
                    
                    return (
                      <div key={webhook.id} className="p-4 bg-secondary/30 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20">
                              {info.icon}
                            </div>
                            <div>
                              <h3 className="font-display font-semibold">{info.label}</h3>
                              <p className="text-xs text-muted-foreground">{info.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${webhook.enabled ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                              {webhook.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <Button
                              size="sm"
                              variant={webhook.enabled ? "outline" : "default"}
                              onClick={() => updateWebhookSetting(webhook.id, { enabled: !webhook.enabled })}
                              disabled={savingWebhook === webhook.id}
                            >
                              {webhook.enabled ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                            <Input
                              value={webhook.webhook_url}
                              onChange={(e) => updateWebhookSetting(webhook.id, { webhook_url: e.target.value })}
                              className="mt-1 bg-background border-border text-xs font-mono"
                              placeholder="https://discord.com/api/webhooks/..."
                            />
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">Message Template</Label>
                            <Textarea
                              value={webhook.custom_message_template || ""}
                              onChange={(e) => updateWebhookSetting(webhook.id, { custom_message_template: e.target.value || null })}
                              className="mt-1 bg-background border-border text-xs font-mono min-h-[80px]"
                              placeholder="Enter a message template using variables below..."
                            />
                            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                              <Label className="text-xs text-muted-foreground block mb-2">Available Variables:</Label>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                {webhook.webhook_type.includes('completions') ? (
                                  <>
                                    <span className="font-mono text-primary">{'{user}'}</span>
                                    <span className="text-muted-foreground">Player username</span>
                                    <span className="font-mono text-primary">{'{levelName}'}</span>
                                    <span className="text-muted-foreground">Level name</span>
                                    <span className="font-mono text-primary">{'{levelRank}'}</span>
                                    <span className="text-muted-foreground">Level rank position</span>
                                    <span className="font-mono text-primary">{'{completionTime}'}</span>
                                    <span className="text-muted-foreground">Formatted time</span>
                                    <span className="font-mono text-primary">{'{arrow}'}</span>
                                    <span className="text-muted-foreground">Arrow emoji</span>
                                    <span className="font-mono text-primary">{'{action}'}</span>
                                    <span className="text-muted-foreground">"completed" or "verified"</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-mono text-primary">{'{levelName}'}</span>
                                    <span className="text-muted-foreground">Level name</span>
                                    <span className="font-mono text-primary">{'{oldRank}'}</span>
                                    <span className="text-muted-foreground">Previous rank</span>
                                    <span className="font-mono text-primary">{'{newRank}'}</span>
                                    <span className="text-muted-foreground">New rank</span>
                                    <span className="font-mono text-primary">{'{emoji}'}</span>
                                    <span className="text-muted-foreground">Auto emoji based on event</span>
                                    <span className="font-mono text-primary">{'{listType}'}</span>
                                    <span className="text-muted-foreground">Main, Extended, or Extra</span>
                                    <span className="font-mono text-primary">{'{action}'}</span>
                                    <span className="text-muted-foreground">added, deleted, moved, transferred</span>
                                    <span className="font-mono text-primary">{'{adminEmail}'}</span>
                                    <span className="text-muted-foreground">Admin who performed action</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {webhookSettings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No webhook settings found
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="space-y-6">
              <div className="rounded-lg bg-card border border-border p-4 md:p-6">
                <TagPresetsManager />
              </div>
            </TabsContent>

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
                            <div className="text-sm text-foreground">{entry.admin_email}</div>
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
          </Tabs>
        </div>
      </main>

      {/* Bulk Import Modal */}
      {bulkImportOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Bulk Import Levels
            </h2>
            
            <div>
              <Label htmlFor="bulkIds">Level IDs (one per line or comma-separated)</Label>
              <Textarea
                id="bulkIds"
                value={bulkLevelIds}
                onChange={(e) => setBulkLevelIds(e.target.value)}
                placeholder="1743661104278&#10;1234567890123"
                className="mt-1 bg-secondary border-border min-h-[200px] font-mono text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="bulkStartRank">Starting Rank (optional)</Label>
              <Input
                id="bulkStartRank"
                type="number"
                min={1}
                max={levels.length + 1}
                placeholder={`Leave empty to start at ${levels.length + 1}`}
                value={bulkStartRank}
                onChange={(e) => setBulkStartRank(e.target.value)}
                className="mt-1 bg-secondary border-border"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setBulkImportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={bulkImportLevels} disabled={bulkImporting || !bulkLevelIds.trim()}>
                {bulkImporting ? "Importing..." : "Import Levels"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Manual Run Modal */}
      {addManualRunOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {editingManualRun ? "Edit Manual Run" : "Add Manual Run"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label>List Type *</Label>
                <Select value={manualRunListType} onValueChange={(v) => {
                  setManualRunListType(v as "main" | "extra");
                  setManualRunLevel(""); // Reset level when switching lists
                }}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main List</SelectItem>
                    <SelectItem value="extra">Extra List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Level *</Label>
                <Select value={manualRunLevel} onValueChange={setManualRunLevel}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualRunListType === "main" ? (
                      levels.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          #{level.rank_position} - {level.name || level.level_id}
                        </SelectItem>
                      ))
                    ) : (
                      extendedLevels.map(level => (
                        <SelectItem key={level.id} value={level.id}>
                          #{level.rank_position} - {level.name || level.level_id} (Extra)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Player *</Label>
                <Select value={manualRunProfile} onValueChange={setManualRunProfile}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.display_name || profile.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time (seconds) *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={manualRunTime}
                    onChange={(e) => setManualRunTime(e.target.value)}
                    placeholder="123.456"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={manualRunDate}
                    onChange={(e) => setManualRunDate(e.target.value)}
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
              </div>

              <div>
                <Label>Arrow</Label>
                <Select value={manualRunArrow} onValueChange={setManualRunArrow}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Energy Arrow">Energy Arrow</SelectItem>
                    <SelectItem value="Speedy Arrow">Speedy Arrow</SelectItem>
                    <SelectItem value="Narrow Arrow">Narrow Arrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="manualRunVerifier"
                  checked={manualRunVerifier}
                  onChange={(e) => setManualRunVerifier(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="manualRunVerifier">This is the verifier run</Label>
              </div>

              <div>
                <Label>Note (shown in leaderboard)</Label>
                <Input
                  value={manualRunNote}
                  onChange={(e) => setManualRunNote(e.target.value)}
                  placeholder="e.g., 'Time no longer visible on official leaderboards'"
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              <div>
                <Label>Proof Screenshot</Label>
                <div className="mt-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={manualRunProofInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadProofScreenshot(file);
                      e.target.value = '';
                    }}
                  />
                  {manualRunProofUrl ? (
                    <div className="relative">
                      <img src={manualRunProofUrl} alt="Proof" className="w-full h-32 object-cover rounded-lg border border-border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setManualRunProofUrl("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => manualRunProofInputRef.current?.click()}
                      disabled={uploadingProof}
                      className="w-full gap-2"
                    >
                      {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      {uploadingProof ? "Uploading..." : "Upload Proof Screenshot"}
                    </Button>
                  )}
                  <Input
                    value={manualRunProofUrl}
                    onChange={(e) => setManualRunProofUrl(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setAddManualRunOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveManualRun} disabled={addingManualRun}>
                {addingManualRun ? "Saving..." : editingManualRun ? "Update Run" : "Add Run"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - with scroll support for tags at bottom */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingLevel(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 my-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold">Edit Level</h2>
            
            <div className="aspect-video rounded-lg bg-secondary overflow-hidden relative group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={editThumbnailInputRef}
                onChange={handleEditThumbnailUpload}
              />
              {editThumbnail ? (
                <img src={editThumbnail} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Image className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => editThumbnailInputRef.current?.click()}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  Upload Image
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editThumbnail">Thumbnail URL</Label>
                <Input
                  id="editThumbnail"
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editName">Level Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editAuthor">Author (legacy - single)</Label>
                <Input
                  id="editAuthor"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="Single author (legacy field)"
                />
              </div>
              
              <div>
                <Label htmlFor="editCreators">Creators (multiple)</Label>
                <Textarea
                  id="editCreators"
                  value={editCreators}
                  onChange={(e) => setEditCreators(e.target.value)}
                  placeholder="Enter creator names (comma or newline separated)&#10;e.g., Creator1, Creator2"
                  className="mt-1 bg-secondary border-border min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For levels with multiple creators. Leave empty to use single Author field.
                </p>
              </div>
              
              <div>
                <Label htmlFor="editAlternativeIds">Alternative Level IDs</Label>
                <Textarea
                  id="editAlternativeIds"
                  value={editAlternativeIds}
                  onChange={(e) => setEditAlternativeIds(e.target.value)}
                  placeholder="Enter alternative level IDs (comma or newline separated)&#10;e.g., low-detail mode versions"
                  className="mt-1 bg-secondary border-border min-h-[80px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Completions on these levels will count as completions for the main level
                </p>
              </div>
              
              {/* Tags Editor */}
              <div className="border-t border-border pt-4">
                <LevelTagAssigner levelId={editingLevel.id} levelType="main" />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingLevel(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedLevel} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmLevel} onOpenChange={() => setDeleteConfirmLevel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Level?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteConfirmLevel?.name}</strong> from the list.
              All rankings will be updated automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteLevel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Future Level Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmFutureLevel} onOpenChange={() => setDeleteConfirmFutureLevel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Future Level?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteConfirmFutureLevel?.name}</strong> from the future list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteFutureLevel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Future Level Modal */}
      {editingFutureLevel && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingFutureLevel(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 my-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Edit Future Level
            </h2>
            
            <div className="space-y-4">
              {/* Thumbnail Preview with Upload */}
              <div className="aspect-video rounded-lg bg-secondary overflow-hidden relative group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={editFutureThumbnailInputRef}
                  onChange={handleFutureThumbnailUpload}
                />
                {editFutureThumbnail ? (
                  <img src={editFutureThumbnail} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => editFutureThumbnailInputRef.current?.click()}
                    disabled={uploadingFutureThumbnail}
                    className="gap-2"
                  >
                    {uploadingFutureThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    Upload Image
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="editFutureThumbnail">Thumbnail URL</Label>
                <Input
                  id="editFutureThumbnail"
                  value={editFutureThumbnail}
                  onChange={(e) => setEditFutureThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFutureRank">Estimated Rank</Label>
                  <Input
                    id="editFutureRank"
                    type="number"
                    value={editFutureRank}
                    onChange={(e) => setEditFutureRank(e.target.value)}
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="editFuturePoints">Points</Label>
                  <Input
                    id="editFuturePoints"
                    type="number"
                    value={editFuturePoints}
                    onChange={(e) => setEditFuturePoints(e.target.value)}
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editFutureName">Level Name</Label>
                <Input
                  id="editFutureName"
                  value={editFutureName}
                  onChange={(e) => setEditFutureName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editFutureAuthor">Author</Label>
                <Input
                  id="editFutureAuthor"
                  value={editFutureAuthor}
                  onChange={(e) => setEditFutureAuthor(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              {/* Tags Editor */}
              <div className="border-t border-border pt-4">
                <LevelTagAssigner levelId={editingFutureLevel.id} levelType="future" />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingFutureLevel(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedFutureLevel} disabled={savingFutureLevel}>
                {savingFutureLevel ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Extra Level Modal */}
      {editingExtendedLevel && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingExtendedLevel(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4 my-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Edit Extra Level
            </h2>
            
            <div className="space-y-4">
              {/* Thumbnail Preview with Upload */}
              <div className="aspect-video rounded-lg bg-secondary overflow-hidden relative group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={editExtendedThumbnailInputRef}
                  onChange={handleExtendedThumbnailUpload}
                />
                {editExtendedThumbnail ? (
                  <img src={editExtendedThumbnail} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => editExtendedThumbnailInputRef.current?.click()}
                    disabled={uploadingExtendedThumbnail}
                    className="gap-2"
                  >
                    {uploadingExtendedThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    Upload Image
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="editExtendedThumbnail">Thumbnail URL</Label>
                <Input
                  id="editExtendedThumbnail"
                  value={editExtendedThumbnail}
                  onChange={(e) => setEditExtendedThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editExtendedRank">Rank</Label>
                <Input
                  id="editExtendedRank"
                  type="number"
                  value={editExtendedRank}
                  onChange={(e) => setEditExtendedRank(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editExtendedName">Level Name</Label>
                <Input
                  id="editExtendedName"
                  value={editExtendedName}
                  onChange={(e) => setEditExtendedName(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label htmlFor="editExtendedAuthor">Author (legacy - single)</Label>
                <Input
                  id="editExtendedAuthor"
                  value={editExtendedAuthor}
                  onChange={(e) => setEditExtendedAuthor(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="Single author (legacy field)"
                />
              </div>
              
              <div>
                <Label htmlFor="editExtendedCreators">Creators (multiple)</Label>
                <Textarea
                  id="editExtendedCreators"
                  value={editExtendedCreators}
                  onChange={(e) => setEditExtendedCreators(e.target.value)}
                  placeholder="Enter creator names (comma or newline separated)&#10;e.g., Creator1, Creator2"
                  className="mt-1 bg-secondary border-border min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For levels with multiple creators. Leave empty to use single Author field.
                </p>
              </div>
              
              <div>
                <Label htmlFor="editExtendedVerifier">Verifier</Label>
                <Select value={editExtendedVerifier} onValueChange={setEditExtendedVerifier}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select verifier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {allProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.display_name || profile.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editExtendedAlternativeIds">Alternative Level IDs</Label>
                <Textarea
                  id="editExtendedAlternativeIds"
                  value={editExtendedAlternativeIds}
                  onChange={(e) => setEditExtendedAlternativeIds(e.target.value)}
                  placeholder="Alternative level IDs (comma or newline separated)&#10;Used for syncing completions from remakes"
                  className="mt-1 bg-secondary border-border min-h-[60px]"
                />
              </div>
              
              {/* Tags Editor */}
              <div className="border-t border-border pt-4">
                <LevelTagAssigner levelId={editingExtendedLevel.id} levelType="extra" />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingExtendedLevel(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedExtendedLevel} disabled={savingExtendedLevel}>
                {savingExtendedLevel ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Manual Run Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmManualRun} onOpenChange={() => setDeleteConfirmManualRun(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Manual Run?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this manual run from <strong>{deleteConfirmManualRun?.profile_username}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteManualRun}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submission Review Modal */}
      {reviewingSubmission && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 w-full max-w-md space-y-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Review Submission
            </h2>
            
            <div className="space-y-4">
              {reviewingSubmission.thumbnail_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={reviewingSubmission.thumbnail_url} 
                    alt={reviewingSubmission.level_name || ""} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              
              <div className="p-3 bg-secondary/50 rounded-lg">
                <div className="font-medium text-foreground">
                  {reviewingSubmission.level_name || reviewingSubmission.level_id}
                </div>
                <div className="text-sm text-muted-foreground">
                  by {reviewingSubmission.author || "Unknown"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Submitted by {reviewingSubmission.submitted_by_email}
                </div>
              </div>

              <div>
                <Label>Target List</Label>
                <select
                  value={submissionTargetList}
                  onChange={(e) => setSubmissionTargetList(e.target.value as "main" | "extra" | "future")}
                  className="mt-1 w-full h-10 px-3 bg-secondary border border-border rounded-md text-foreground text-sm"
                >
                  <option value="main">Main List</option>
                  <option value="extra">Extra List</option>
                  <option value="future">Future List</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitter requested: {reviewingSubmission.target_list === "main" ? "Main" : reviewingSubmission.target_list === "extra" ? "Extra" : "Future"}
                </p>
              </div>

              <div>
                <Label htmlFor="submissionRank">Final Rank (suggested: #{reviewingSubmission.suggested_rank})</Label>
                <Input
                  id="submissionRank"
                  type="number"
                  min={1}
                  value={submissionRank}
                  onChange={(e) => setSubmissionRank(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder={`1-${levels.length + 1}`}
                />
              </div>

              <div>
                <Label htmlFor="submissionNote">Admin Note (optional)</Label>
                <Input
                  id="submissionNote"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="Reason for approval/rejection..."
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setReviewingSubmission(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleSubmissionReview(reviewingSubmission.id, "rejected")}
                variant="outline"
                className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                disabled={processingSubmission === reviewingSubmission.id}
              >
                Reject
              </Button>
              <Button 
                onClick={() => handleSubmissionReview(reviewingSubmission.id, "approved")}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={processingSubmission === reviewingSubmission.id || !submissionRank}
              >
                {processingSubmission === reviewingSubmission.id ? "Processing..." : `Approve at #${submissionRank}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Run Submission Review Modal */}
      {reviewingRunSubmission && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Review Run Submission
            </h2>
            
            <div className="space-y-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <div className="font-medium text-foreground flex items-center gap-2">
                  {reviewingRunSubmission.username}
                  {reviewingRunSubmission.is_verifier && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Verifier</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Level: {reviewingRunSubmission.level_name || reviewingRunSubmission.level_id}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Submitted by {reviewingRunSubmission.submitted_by_email}
                </div>
                <a 
                  href={reviewingRunSubmission.proof_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm mt-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Proof
                </a>
              </div>

              <div>
                <Label htmlFor="runSubmissionTime">Time (seconds) *</Label>
                <Input
                  id="runSubmissionTime"
                  type="number"
                  step="0.001"
                  min="0"
                  value={runSubmissionTime}
                  onChange={(e) => setRunSubmissionTime(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="e.g., 123.456"
                />
              </div>

              <div>
                <Label htmlFor="runSubmissionDate">Completion Date *</Label>
                <Input
                  id="runSubmissionDate"
                  type="date"
                  value={runSubmissionDate}
                  onChange={(e) => setRunSubmissionDate(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              <div>
                <Label>Arrow</Label>
                <Select value={runSubmissionArrow} onValueChange={setRunSubmissionArrow}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Energy Arrow">Energy Arrow</SelectItem>
                    <SelectItem value="Speedy Arrow">Speedy Arrow</SelectItem>
                    <SelectItem value="Narrow Arrow">Narrow Arrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="runSubmissionNote">Admin Note (optional)</Label>
                <Input
                  id="runSubmissionNote"
                  value={runSubmissionNote}
                  onChange={(e) => setRunSubmissionNote(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="Reason for approval/rejection..."
                />
              </div>

              {/* Edit submission data section */}
              <div className="border-t border-border pt-4">
                <Label className="text-sm font-medium text-muted-foreground">Edit Submission Data</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs">Username</Label>
                    <Input
                      value={reviewingRunSubmission.username}
                      onChange={(e) => {
                        setReviewingRunSubmission({...reviewingRunSubmission, username: e.target.value});
                        updateRunSubmission(reviewingRunSubmission.id, { username: e.target.value });
                      }}
                      className="mt-1 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Level ID</Label>
                    <Input
                      value={reviewingRunSubmission.level_id}
                      onChange={(e) => {
                        setReviewingRunSubmission({...reviewingRunSubmission, level_id: e.target.value});
                        updateRunSubmission(reviewingRunSubmission.id, { level_id: e.target.value });
                      }}
                      className="mt-1 bg-secondary border-border h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="editIsVerifier"
                    checked={reviewingRunSubmission.is_verifier}
                    onChange={(e) => {
                      setReviewingRunSubmission({...reviewingRunSubmission, is_verifier: e.target.checked});
                      updateRunSubmission(reviewingRunSubmission.id, { is_verifier: e.target.checked });
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="editIsVerifier" className="text-sm">Verifier run</Label>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setReviewingRunSubmission(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleRunSubmissionReview(reviewingRunSubmission.id, "rejected")}
                variant="outline"
                className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                disabled={processingRunSubmission === reviewingRunSubmission.id}
              >
                Reject
              </Button>
              <Button 
                onClick={() => handleRunSubmissionReview(reviewingRunSubmission.id, "approved")}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={processingRunSubmission === reviewingRunSubmission.id || !runSubmissionTime || !runSubmissionDate}
              >
                {processingRunSubmission === reviewingRunSubmission.id ? "Processing..." : "Approve & Add Run"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rank Change Confirmation Dialog */}
      <AlertDialog open={!!rankConfirmLevel} onOpenChange={(open) => !open && setRankConfirmLevel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Rank Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to change the rank of <strong className="text-foreground">{rankConfirmLevel?.name || rankConfirmLevel?.level_id}</strong>
              </p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">#{rankConfirmLevel?.rank_position}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <ArrowUpDown className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">#{pendingNewRank}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will update all affected level rankings and point values. This action will be logged and a Discord notification will be sent.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRankConfirmLevel(null); setPendingNewRank(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeRankChange} className="bg-primary hover:bg-primary/90">
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Tag Manager */}
      {bulkTagManagerOpen && (
        <BulkTagAssigner onClose={() => setBulkTagManagerOpen(false)} />
      )}

      {/* Move to Main Confirmation Dialog */}
      <AlertDialog open={!!moveToMainConfirm} onOpenChange={(open) => !open && setMoveToMainConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Move to Main List?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to move <strong className="text-foreground">{moveToMainConfirm?.name || moveToMainConfirm?.level_id}</strong> from the Extra List to the Main List.
              </p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-muted-foreground">Extra #{moveToMainConfirm?.rank_position}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <ChevronUp className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">Main #{levels.length + 1}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will add the level to the main list and award points. A Discord notification will be sent.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (moveToMainConfirm) {
                  transferExtendedToMain(moveToMainConfirm);
                  setMoveToMainConfirm(null);
                }
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Move to Main
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move to Extra Confirmation Dialog */}
      <AlertDialog open={!!moveToExtraConfirm} onOpenChange={(open) => !open && setMoveToExtraConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Move to Extra List?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to move <strong className="text-foreground">{moveToExtraConfirm?.name || moveToExtraConfirm?.level_id}</strong> from the Main List to the Extra List.
              </p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-muted-foreground">Main #{moveToExtraConfirm?.rank_position}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                <ChevronDown className="w-6 h-6 text-accent" />
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">Extra #{extendedLevels.length + 1}</div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will remove the level from the main list (no points) and add it to the extra list. All main list levels will be re-ranked.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (moveToExtraConfirm) {
                  transferMainToExtended(moveToExtraConfirm);
                  setMoveToExtraConfirm(null);
                }
              }}
              className="bg-accent hover:bg-accent/90"
            >
              Move to Extra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Merge Confirmation Dialog */}
      <AlertDialog open={mergeConfirmOpen} onOpenChange={setMergeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Profile Merge
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You are about to merge:</p>
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center p-3 bg-destructive/10 rounded-lg">
                  <div className="text-lg font-bold text-destructive">{mergeSourceProfile}</div>
                  <div className="text-xs text-muted-foreground">Will be deleted</div>
                </div>
                <ChevronUp className="w-6 h-6 text-primary rotate-90" />
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">{mergeTargetProfile}</div>
                  <div className="text-xs text-muted-foreground">Will receive all data</div>
                </div>
              </div>
              {mergeDisplayName && (
                <p className="text-sm text-muted-foreground">
                  Display name will be set to: <strong className="text-foreground">{mergeDisplayName}</strong>
                </p>
              )}
              <p className="text-sm text-destructive">
                ⚠️ This action cannot be undone. All completions, runs, and verifier credits will be transferred.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={mergeProfiles}
              disabled={mergingProfiles}
              className="bg-primary hover:bg-primary/90"
            >
              {mergingProfiles ? "Merging..." : "Confirm Merge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
