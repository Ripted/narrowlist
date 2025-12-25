import { useState, useEffect, useRef } from "react";
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
  ListCollapse, List, Play, Send, MessageSquare
} from "lucide-react";
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
  added_by_admin_email: string;
  created_at: string;
  level_name?: string;
  profile_username?: string;
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
  final_rank: number | null;
  submitted_by_email: string;
  status: string;
  admin_note: string | null;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Submission review
  const [reviewingSubmission, setReviewingSubmission] = useState<LevelSubmission | null>(null);
  const [submissionRank, setSubmissionRank] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [processingSubmission, setProcessingSubmission] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  
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
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editVerifier, setEditVerifier] = useState<string>("");
  
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
  const [addingManualRun, setAddingManualRun] = useState(false);

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
      fetchClaimRequests();
      fetchApprovedPlayers();
      fetchChangelog();
      fetchManualRuns();
      fetchAllProfiles();
      fetchLevelSubmissions();
    }
  }, [isAdmin]);

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

  const handleSubmissionReview = async (submissionId: string, action: "approved" | "rejected") => {
    const submission = levelSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    setProcessingSubmission(submissionId);

    try {
      if (action === "approved") {
        const rank = parseInt(submissionRank) || submission.suggested_rank;
        
        // Shift existing levels
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

        await logAction("Approved level submission", `${submission.level_name || submission.level_id} at rank #${rank} (submitted by ${submission.submitted_by_email})`);
        toast({ title: "Level Approved", description: `Added to main list at rank #${rank}` });
        fetchLevels();
      } else {
        await logAction("Rejected level submission", `${submission.level_name || submission.level_id} (submitted by ${submission.submitted_by_email})`);
        toast({ title: "Submission Rejected" });
      }

      // Update submission status
      await supabase
        .from("level_submissions")
        .update({ 
          status: action,
          final_rank: action === "approved" ? (parseInt(submissionRank) || submission.suggested_rank) : null,
          admin_note: submissionNote || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      setReviewingSubmission(null);
      setSubmissionRank("");
      setSubmissionNote("");
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
  const checkAndMoveEmptyLevels = async (currentLevels: Level[]) => {
    const { fetchLeaderboard } = await import("@/lib/api");
    const emptyLevels: Level[] = [];
    
    for (const level of currentLevels) {
      const leaderboard = await fetchLeaderboard(level.level_id);
      if (leaderboard.length === 0) {
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
    if (rank === 1) return 10;
    if (rank === 2) return 8;
    if (rank === 3) return 7;
    if (rank === 4) return 6;
    if (rank === 5) return 5;
    if (rank >= 6 && rank <= 10) return 4;
    if (rank >= 11 && rank <= 25) return 3;
    if (rank >= 26 && rank <= 50) return 2;
    return 1;
  };

  // Pagination
  const totalPages = Math.ceil(levels.length / ITEMS_PER_PAGE);
  const paginatedLevels = showAll 
    ? levels 
    : levels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

    const newLevels = [...levels];
    newLevels.splice(currentIndex, 1);
    newLevels.splice(targetIndex, 0, levelToMove);

    const updatedLevels = newLevels.map((l, i) => ({
      ...l,
      rank_position: i + 1,
      points: calculatePoints(i + 1),
    }));

    await logAction("Changed level rank", `${levelToMove.name} from #${currentIndex + 1} to #${newRank}`);
    setLevels(updatedLevels);
    setRankInputId(null);
    await updateRanks(updatedLevels);
    fetchChangelog();
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
      toast({ title: "Success", description: "Thumbnail updated" });
      setLevels(prev => prev.map(l => 
        l.id === thumbnailEditId ? { ...l, thumbnail_url: thumbnailInputValue || null } : l
      ));
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
        setLevels(prev => prev.map(l => l.id === levelId ? { ...l, thumbnail_url: url } : l));
        toast({ title: "Success", description: "Thumbnail uploaded" });
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
    setEditThumbnail(level.thumbnail_url || "");
    setEditVerifier(level.verifier_profile_id || "");
  };

  const saveEditedLevel = async () => {
    if (!editingLevel) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("levels")
      .update({
        name: editName || null,
        author: editAuthor || null,
        thumbnail_url: editThumbnail || null,
        verifier_profile_id: editVerifier || null,
      })
      .eq("id", editingLevel.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update level", variant: "destructive" });
    } else {
      const verifierName = allProfiles.find(p => p.id === editVerifier)?.username || "none";
      await logAction("Edited level", `${editName || editingLevel.level_id} (verifier: ${verifierName})`);
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
    setAddManualRunOpen(true);
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
          })
          .eq("id", editingManualRun.id);

        if (error) throw error;
        await logAction("Updated manual run", `${manualRunTime}s for profile ${manualRunProfile}`);
        toast({ title: "Success", description: "Manual run updated" });
      } else {
        // Create new
        const { error } = await supabase.from("manual_runs").insert({
          level_id: manualRunLevel,
          profile_id: manualRunProfile,
          completion_time: completionTime,
          arrow_name: manualRunArrow,
          is_verifier: manualRunVerifier,
          completed_at: new Date(manualRunDate).toISOString(),
          note: manualRunNote || null,
          added_by_admin_id: user!.id,
          added_by_admin_email: user!.email || "unknown",
        });

        if (error) throw error;
        await logAction("Added manual run", `${manualRunTime}s for profile ${manualRunProfile}`);
        toast({ title: "Success", description: "Manual run added" });
      }

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
            
            <div className="flex gap-2">
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

          <Tabs defaultValue="submissions" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-1 h-auto p-1">
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
              <TabsTrigger value="manual-runs" className="text-xs sm:text-sm flex-shrink-0">Runs ({manualRuns.length})</TabsTrigger>
              <TabsTrigger value="players" className="text-xs sm:text-sm flex-shrink-0">Players ({approvedPlayers.length})</TabsTrigger>
              <TabsTrigger value="changelog" className="text-xs sm:text-sm flex-shrink-0">Log</TabsTrigger>
            </TabsList>

            {/* Level Submissions Tab */}
            <TabsContent value="submissions" className="space-y-6">
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Level Submissions
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                      {levelSubmissions.filter(s => s.status === 'pending').length} pending
                    </span>
                  </h2>
                </div>

                {levelSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No level submissions yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {levelSubmissions.map(submission => (
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
                              </>
                            ) : (
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${
                                submission.status === 'approved' 
                                  ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                                  : 'bg-destructive/10 text-destructive border-destructive/30'
                              }`}>
                                {submission.status === 'approved' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                <span className="capitalize">{submission.status}</span>
                                {submission.final_rank && <span>at #{submission.final_rank}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        {submission.admin_note && (
                          <div className="mt-2 text-sm text-accent">
                            Note: {submission.admin_note}
                          </div>
                        )}
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
                <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5 text-primary" />
                    Level Rankings
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded ml-2">
                      {levels.length} levels
                    </span>
                  </h2>
                  <div className="flex gap-2">
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

                {levels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No levels added yet.
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
                <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Hourglass className="w-5 h-5 text-primary" />
                    Future Levels
                  </h2>
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

                {futureLevels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No future levels added yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {futureLevels.map((level) => (
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

            <TabsContent value="players" className="space-y-6">
              <div className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Approved Players
                  </h2>
                </div>

                {approvedPlayers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No approved players yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {approvedPlayers.map((player) => (
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
                <Label>Level *</Label>
                <Select value={manualRunLevel} onValueChange={setManualRunLevel}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(level => (
                      <SelectItem key={level.id} value={level.id}>
                        #{level.rank_position} - {level.name || level.level_id}
                      </SelectItem>
                    ))}
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

      {/* Edit Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
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
                <Label htmlFor="editAuthor">Author</Label>
                <Input
                  id="editAuthor"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              
              <div>
                <Label>Verifier</Label>
                <Select value={editVerifier} onValueChange={setEditVerifier}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Select verifier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No verifier set</SelectItem>
                    {allProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.display_name || profile.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
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
    </div>
  );
}
