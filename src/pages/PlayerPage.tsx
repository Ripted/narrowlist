import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { usePlayerLeaderboard, useLevels } from "@/hooks/useLevels";
import { useAllRatingsAggregate } from "@/hooks/useLevelAggregates";
import { useAuth } from "@/hooks/useAuth";
import { formatTime, formatDate } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, Trophy, Target, Clock, Medal, UserPlus, Camera, Loader2, 
  Edit2, Check, X, Search, TrendingUp, CheckCircle, Crown, ChevronLeft, ChevronRight, Calendar, ArrowUpDown, Star, MapPin, Shield, Hammer,
  MessageCircle, Music2, Youtube, Link as LinkIcon
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { countries, getCountryByCode } from "@/config/countries";

interface ProfileData {
  id: string;
  user_id: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  bio: string | null;
  display_name: string | null;
  country_code: string | null;
  extra_points?: number;
  discord_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
}

const ITEMS_PER_PAGE = 10;
const SHOW_ALL_ITEMS = 999999;

export default function PlayerPage() {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const isCreatorView = searchParams.get("view") === "creator";
  const { players, loading } = usePlayerLeaderboard();
  const { levels } = useLevels();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [claiming, setClaiming] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [verifiedLevelIds, setVerifiedLevelIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [userHasProfile, setUserHasProfile] = useState(false);
  const [sortMode, setSortMode] = useState<"rank" | "date">("rank");
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState(isCreatorView ? "created" : "completed");
  
  // Set initial tab based on view param or creator status
  useEffect(() => {
    if (isCreatorView) {
      setActiveTab("created");
    }
  }, [isCreatorView]);
  
  // Fetch levels created by this player/creator
  const { data: createdLevels = [], isLoading: createdLevelsLoading } = useQuery({
    queryKey: ["created-levels", username],
    queryFn: async () => {
      const { data } = await supabase
        .from("levels")
        .select("id, level_id, name, author, creators, rank_position, points, thumbnail_url")
        .order("rank_position");
      
      if (!data) return [];
      
      // Filter levels where username matches author or is in creators array
      return data.filter((level: any) => {
        const authorMatch = level.author?.toLowerCase() === username?.toLowerCase();
        const creatorsMatch = (level.creators || []).some(
          (c: string) => c.toLowerCase() === username?.toLowerCase()
        );
        return authorMatch || creatorsMatch;
      });
    },
    enabled: !!username,
  });

  // Fetch extra list completions for this user
  const { data: extraCompletions = [], isLoading: extraCompletionsLoading } = useQuery({
    queryKey: ["extra-completions", username],
    queryFn: async () => {
      // First get the profile by username
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, extra_points")
        .eq("username", username)
        .maybeSingle();
      
      if (!profile) return [];
      
      // Fetch actual extra completions with level data
      const { data: completions } = await supabase
        .from("extra_completions")
        .select(`
          id,
          completion_time,
          completed_at,
          arrow_name,
          level_id,
          extended_levels!inner (
            level_id,
            name,
            rank_position,
            points,
            thumbnail_url
          )
        `)
        .eq("profile_id", profile.id)
        .order("completed_at", { ascending: false });
      
      return (completions || []).map((c: any) => ({
        id: c.id,
        levelId: c.extended_levels.level_id,
        levelName: c.extended_levels.name || c.extended_levels.level_id,
        rank: c.extended_levels.rank_position,
        points: c.extended_levels.points,
        time: c.completion_time,
        completedAt: c.completed_at,
        arrowName: c.arrow_name,
        thumbnailUrl: c.extended_levels.thumbnail_url,
      }));
    },
    enabled: !!username,
  });
  
  
  const { data: ratingsAgg } = useAllRatingsAggregate();

  const createdLevelsTotalPoints = useMemo(() => {
    return createdLevels.reduce((sum: number, l: any) => {
      const agg = ratingsAgg?.get(l.id);
      if (agg && agg.count > 0) {
        return sum + (agg.avg_overall / 10) * l.points;
      }
      return sum + l.points;
    }, 0);
  }, [createdLevels, ratingsAgg]);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const player = players.find(
    (p) => p.username.toLowerCase() === username?.toLowerCase()
  );
  const rank = player ? players.indexOf(player) + 1 : null;
  
  // Check if this is a creator-only or extra-only profile (no main list player record)
  const isCreatorOnly = !player && createdLevels.length > 0 && !loading && !createdLevelsLoading;
  const hasExtraPointsOnly = !player && extraCompletions.length > 0 && !loading && !extraCompletionsLoading;
  const isSpecialProfile = isCreatorOnly || hasExtraPointsOnly;
  
  const getRankStyle = (r: number) => {
    if (r === 1) return "rank-gold";
    if (r === 2) return "rank-silver";
    if (r === 3) return "rank-bronze";
    return "text-foreground";
  };

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  const [editingCountry, setEditingCountry] = useState(false);
  const [countryValue, setCountryValue] = useState<string | null>(null);
  const [savingCountry, setSavingCountry] = useState(false);

  useEffect(() => {
    if (username) {
      supabase
        .from("profiles")
        .select("id, user_id, banner_url, avatar_url, bio, display_name, country_code, extra_points, discord_url, tiktok_url, youtube_url")
        .eq("username", username)
        .single()
        .then(async ({ data }) => {
          if (data) {
            setProfileData(data);
            setBioValue(data.bio || "");
            setCountryValue(data.country_code || null);
            
            // Count verified levels - check both verifier_profile_id AND oldest completion
            const { data: allLevels } = await supabase
              .from("levels")
              .select("id, level_id, verifier_profile_id");
            
            if (allLevels) {
              const verifiedIds = new Set<string>();
              
              // Get levels where this profile is explicitly set as verifier
              const explicitVerifierLevels = allLevels.filter(l => l.verifier_profile_id === data.id);
              explicitVerifierLevels.forEach(l => verifiedIds.add(l.level_id));
              
              // For levels without explicit verifier, check if this user has oldest completion
              const levelsWithoutVerifier = allLevels.filter(l => !l.verifier_profile_id);
              const levelIdsWithoutVerifier = levelsWithoutVerifier.map(l => l.id);
              
              if (levelIdsWithoutVerifier.length > 0) {
                const { data: completions } = await supabase
                  .from("completions")
                  .select("level_id, profile_id, completed_at")
                  .in("level_id", levelIdsWithoutVerifier)
                  .order("completed_at", { ascending: true });
                
                // Find oldest completion per level
                const oldestCompleterMap = new Map<string, string>();
                if (completions) {
                  for (const c of completions) {
                    if (!oldestCompleterMap.has(c.level_id)) {
                      oldestCompleterMap.set(c.level_id, c.profile_id);
                    }
                  }
                }
                
                // Add levels where this user is the oldest completer
                for (const level of levelsWithoutVerifier) {
                  if (oldestCompleterMap.get(level.id) === data.id) {
                    verifiedIds.add(level.level_id);
                  }
                }
              }
              
              setVerifiedLevelIds(verifiedIds);
              setVerifiedCount(verifiedIds.size);
            }
          }
        });
    }
  }, [username]);

  // Check if current user already has a linked profile
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setUserHasProfile(!!data);
        });
    }
  }, [user]);

  const isOwner = user && profileData?.user_id === user.id;
  const canEdit = isOwner || isAdmin;
  // Allow claiming if profile is unclaimed/special. Logged-out users get redirected by handler.
  const canClaim = !isOwner && !userHasProfile && (
    (profileData && !profileData.user_id) ||
    (isSpecialProfile && !profileData)
  );

  const levelRankMap = useMemo(() => {
    const map = new Map<string, { rank: number; points: number; name: string }>();
    levels.forEach((l) => {
      map.set(l.levelInfo.level_id, { rank: l.rank, points: l.points, name: l.levelInfo.name });
    });
    return map;
  }, [levels]);

  const hardestLevel = useMemo(() => {
    if (!player || player.completions.length === 0) return null;
    let hardest = player.completions[0];
    let hardestRank = levelRankMap.get(hardest.levelId)?.rank || 999;
    let hardestName = levelRankMap.get(hardest.levelId)?.name || hardest.levelName;
    
    for (const c of player.completions) {
      const r = levelRankMap.get(c.levelId)?.rank || 999;
      if (r < hardestRank) {
        hardestRank = r;
        hardest = c;
        hardestName = levelRankMap.get(c.levelId)?.name || c.levelName;
      }
    }
    return { ...hardest, rank: hardestRank, name: hardestName };
  }, [player, levelRankMap]);

  const progressionData = useMemo(() => {
    if (!player) return [];
    
    // Sort completions by date and accumulate count
    const completionsWithDates = player.completions
      .filter(c => c.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
    
    let cumulativeCount = 0;
    return completionsWithDates.map((c) => {
      cumulativeCount++;
      const date = new Date(c.completedAt!);
      return {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        timestamp: date.getTime(), // Use actual timestamp for accurate positioning
        count: cumulativeCount,
        levelName: c.levelName,
      };
    });
  }, [player]);

  const filteredCompletions = useMemo(() => {
    if (!player) return [];
    let completions = player.completions;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      completions = completions.filter((c) => c.levelName.toLowerCase().includes(q));
    }
    
    // Apply sorting - default to rank (by level difficulty), or by date (most recent first)
    if (sortMode === "date") {
      completions = [...completions].sort((a, b) => {
        if (!a.completedAt && !b.completedAt) return 0;
        if (!a.completedAt) return 1;
        if (!b.completedAt) return -1;
        // Sort descending (most recent first)
        return Date.parse(b.completedAt) - Date.parse(a.completedAt);
      });
    } else {
      // Sort by level rank (hardest first)
      completions = [...completions].sort((a, b) => {
        const rankA = levelRankMap.get(a.levelId)?.rank || 999;
        const rankB = levelRankMap.get(b.levelId)?.rank || 999;
        return rankA - rankB;
      });
    }
    
    return completions;
  }, [player, searchQuery, sortMode, levelRankMap]);

  const itemsPerPage = showAll ? SHOW_ALL_ITEMS : ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filteredCompletions.length / itemsPerPage);
  const paginatedCompletions = useMemo(() => {
    if (showAll) return filteredCompletions;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCompletions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCompletions, currentPage, showAll]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleClaimProfile = async () => {
    if (!username) return;
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to claim this profile" });
      window.location.href = `/auth?redirect=/player/${username}`;
      return;
    }
    setClaiming(true);
    try {
      const { error } = await supabase.rpc("claim_or_create_profile", { _username: username });
      if (error) throw error;
      toast({ title: "Claim Submitted", description: "An admin will review your request" });
    } catch (error: any) {
      const msg = error?.message || "Failed to claim profile";
      if (msg.toLowerCase().includes("already")) {
        toast({ title: "Already requested", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setClaiming(false);
    }
  };

  const uploadImage = async (file: File, type: "avatar" | "banner") => {
    if (!canEdit || !profileData) return;
    const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingBanner;
    const setLocalUrl = type === "avatar" ? setLocalAvatarUrl : setLocalBannerUrl;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const uploaderId = user?.id || 'admin';
      const fileName = `${uploaderId}/${type}-${profileData.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('profile-images').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(data.path);
      const updateField = type === "avatar" ? "avatar_url" : "banner_url";
      const { error: updateError } = await supabase.from("profiles").update({ [updateField]: publicUrl }).eq("id", profileData.id);
      if (updateError) throw updateError;
      setLocalUrl(publicUrl);
      toast({ title: "Success", description: `${type === "avatar" ? "Profile picture" : "Banner"} updated${isAdmin && !isOwner ? " (Admin)" : ""}` });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveBio = async () => {
    if (!profileData) return;
    setSavingBio(true);
    try {
      const { error } = await supabase.from("profiles").update({ bio: bioValue || null }).eq("id", profileData.id);
      if (error) throw error;
      setProfileData({ ...profileData, bio: bioValue || null });
      setEditingBio(false);
      toast({ title: "Success", description: "Bio updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingBio(false);
    }
  };

  const [editingSocials, setEditingSocials] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [savingSocials, setSavingSocials] = useState(false);

  useEffect(() => {
    if (profileData) {
      setDiscordUrl(profileData.discord_url || "");
      setTiktokUrl(profileData.tiktok_url || "");
      setYoutubeUrl(profileData.youtube_url || "");
    }
  }, [profileData?.id]);

  const validateUrl = (u: string) => !u || /^https?:\/\/.+/i.test(u);

  const saveSocials = async () => {
    if (!profileData) return;
    if (![discordUrl, tiktokUrl, youtubeUrl].every(validateUrl)) {
      toast({ title: "Invalid URL", description: "Links must start with http:// or https://", variant: "destructive" });
      return;
    }
    setSavingSocials(true);
    try {
      const payload = {
        discord_url: discordUrl.trim() || null,
        tiktok_url: tiktokUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
      };
      const { error } = await supabase.from("profiles").update(payload).eq("id", profileData.id);
      if (error) throw error;
      setProfileData({ ...profileData, ...payload });
      setEditingSocials(false);
      toast({ title: "Success", description: "Socials updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingSocials(false);
    }
  };
    if (!profileData) return;
    setSavingCountry(true);
    try {
      const { error } = await supabase.from("profiles").update({ country_code: code }).eq("id", profileData.id);
      if (error) throw error;
      setProfileData({ ...profileData, country_code: code });
      setCountryValue(code);
      setEditingCountry(false);
      toast({ title: "Success", description: "Country updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingCountry(false);
    }
  };

  const currentCountry = getCountryByCode(profileData?.country_code);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Show not found only if there's no player AND no created levels AND no extra points
  if (!player && !isSpecialProfile) {
    if (loading || createdLevelsLoading || extraCompletionsLoading) {
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="pt-24 container mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-64 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="font-display text-2xl font-bold text-destructive">Player Not Found</h1>
          <Link to="/leaderboard">
            <Button variant="ghost" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Leaderboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // For creator-only profiles, use a simplified display
  const displayName = profileData?.display_name || player?.displayName || player?.username || username || "";
  const displayAvatarUrl = localAvatarUrl || profileData?.avatar_url || player?.avatarUrl;
  const displayBannerUrl = localBannerUrl || profileData?.banner_url;
  const displayUsername = player?.username || username || "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />Back to Leaderboard
            </Button>
          </Link>

          <div className="relative h-24 sm:h-32 md:h-48 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 mb-8 overflow-hidden group">
            {displayBannerUrl && <img src={displayBannerUrl} alt="Banner" className="w-full h-full object-cover" />}
            {canEdit && (
              <>
                <input type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "banner")} />
                <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner} className={`absolute bottom-4 right-4 p-2 rounded-lg bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity ${isAdmin && !isOwner ? "ring-2 ring-accent" : ""}`}>
                  {uploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className={`w-5 h-5 ${isAdmin && !isOwner ? "text-accent" : ""}`} />}
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-8 mb-8 sm:mb-12 -mt-16 sm:-mt-20 md:-mt-16 relative z-10">
            <div className="relative group">
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 bg-background ${rank && rank <= 3 ? "border-primary glow-primary" : "border-border"}`}>
                {displayAvatarUrl ? (
                  <img src={displayAvatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-foreground">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              {rank && rank <= 3 && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                  <Trophy className={`w-5 h-5 ${rank === 1 ? "text-glow-gold" : rank === 2 ? "text-glow-silver" : "text-glow-bronze"}`} />
                </div>
              )}
              {canEdit && (
                <>
                  <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
                  <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className={`absolute -top-1 -left-1 p-2 rounded-full bg-background border hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity z-20 ${isAdmin && !isOwner ? "border-accent" : "border-border"}`}>
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className={`w-4 h-4 ${isAdmin && !isOwner ? "text-accent" : ""}`} />}
                  </button>
                </>
              )}
            </div>

            <div className="text-center md:text-left space-y-4 pt-4 flex-1">
                <div>
                  <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{displayName}</h1>
                  {currentCountry && (
                    <span className="text-2xl" title={currentCountry.name}>{currentCountry.flag}</span>
                  )}
                </div>
                {displayName !== displayUsername && displayUsername && <p className="text-muted-foreground">@{displayUsername}</p>}
                
                {/* Country selector for owner or admin */}
                {canEdit && (
                  <div className="mt-2">
                    {editingCountry ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={countryValue || "none"}
                          onValueChange={(val) => saveCountry(val === "none" ? null : val)}
                          disabled={savingCountry}
                        >
                          <SelectTrigger className={`w-[200px] h-9 bg-card ${isAdmin && !isOwner ? "border-accent" : "border-border"}`}>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border max-h-[300px] z-50">
                            <SelectItem value="none">No country</SelectItem>
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                <span className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span>{c.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCountry(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setEditingCountry(true)} className={`gap-1 text-xs ${isAdmin && !isOwner ? "text-accent" : ""}`}>
                        <MapPin className="w-3 h-3" />
                        {currentCountry ? `Change Country` : "Add Country"}{isAdmin && !isOwner ? " (Admin)" : ""}
                      </Button>
                    )}
                  </div>
                )}
                
                {editingBio ? (
                  <div className="mt-3 max-w-md">
                    <Textarea value={bioValue} onChange={(e) => setBioValue(e.target.value)} placeholder="Write something about yourself..." className="bg-secondary border-border" rows={3} />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={saveBio} disabled={savingBio}>{savingBio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingBio(false); setBioValue(profileData?.bio || ""); }}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 max-w-md">
                    {profileData?.bio ? <p className="text-muted-foreground">{profileData.bio}</p> : canEdit ? <p className="text-muted-foreground/50 italic">No bio yet</p> : null}
                    {canEdit && <Button size="sm" variant="ghost" onClick={() => setEditingBio(true)} className={`mt-1 gap-1 text-xs ${isAdmin && !isOwner ? "text-accent" : ""}`}><Edit2 className="w-3 h-3" />{profileData?.bio ? "Edit Bio" : "Add Bio"}{isAdmin && !isOwner ? " (Admin)" : ""}</Button>}
                  </div>
                )}
              </div>

              {canClaim && (
                <Button onClick={handleClaimProfile} disabled={claiming} variant="outline" className="gap-2">
                  <UserPlus className="w-4 h-4" />{claiming ? "Submitting..." : "Is this you?"}
                </Button>
              )}

              {/* Creator stats section */}
              {createdLevels.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-center gap-1"><Hammer className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /><span className="font-display text-xl sm:text-2xl font-bold text-accent">{createdLevels.length}</span></div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Created</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-center gap-1"><Hammer className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /><span className="font-display text-xl sm:text-2xl font-bold text-accent">{Math.round(createdLevelsTotalPoints).toLocaleString()}</span></div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Creator Points</div>
                  </div>
                </div>
              )}

              {/* Player stats - only show if player exists */}
              {player && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-card border border-border">
                    <div className={`font-display text-xl sm:text-2xl font-bold ${rank ? getRankStyle(rank) : ""}`}>#{rank}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Global Rank</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-center gap-1"><Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-primary" /><span className="font-display text-xl sm:text-2xl font-bold text-primary">{player.totalPoints}</span></div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Total Points</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-center gap-1"><Star className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /><span className="font-display text-xl sm:text-2xl font-bold text-accent">{profileData?.extra_points || 0}</span></div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Extra Points</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-card border border-border">
                    <div className="font-display text-xl sm:text-2xl font-bold text-foreground">{player.completions.length}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Completions</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-center gap-1"><Crown className="w-3 h-3 sm:w-4 sm:h-4 text-glow-gold" /><span className="font-display text-base sm:text-lg font-bold text-foreground">#{hardestLevel?.rank || "-"}</span></div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate" title={hardestLevel?.name}>{hardestLevel?.name ? hardestLevel.name.slice(0, 12) + (hardestLevel.name.length > 12 ? "..." : "") : "Hardest"}</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" /><span className="font-display text-xl sm:text-2xl font-bold text-foreground">{verifiedCount}</span></div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Verified</div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {player && progressionData.length > 1 && (
            <div className="rounded-xl bg-card border border-border p-4 sm:p-6 mb-8">
              <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary" />Completion Progression</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressionData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      tickCount={6}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(220 25% 9%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px' }} 
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString();
                      }}
                      formatter={(value: number, name: string, props: any) => [`${value} levels`, props.payload.levelName]} 
                    />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabs for Completed vs Extra vs Created */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-secondary/50 border border-border">
              {player && (
                <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Target className="w-4 h-4" />
                  Main ({filteredCompletions.length})
                </TabsTrigger>
              )}
              {extraCompletions.length > 0 && (
                <TabsTrigger value="extra" className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  <Star className="w-4 h-4" />
                  Extra ({extraCompletions.length})
                </TabsTrigger>
              )}
              {createdLevels.length > 0 && (
                <TabsTrigger value="created" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Hammer className="w-4 h-4" />
                  Created ({createdLevels.length})
                </TabsTrigger>
              )}
            </TabsList>

            {player && (
              <TabsContent value="completed" className="mt-0">
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Completed Levels</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm bg-secondary border-border" />
                      </div>
                      <Button
                        variant={sortMode === "rank" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSortMode(sortMode === "rank" ? "date" : "rank")}
                        className="gap-2 flex-shrink-0"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="hidden sm:inline">{sortMode === "rank" ? "By Rank" : "By Date"}</span>
                      </Button>
                      <Button
                        variant={showAll ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => { setShowAll(!showAll); setCurrentPage(1); }}
                        className="flex-shrink-0"
                      >
                        {showAll ? "Paginate" : "Show All"}
                      </Button>
                    </div>
                  </div>

                  {paginatedCompletions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">{searchQuery ? "No levels found." : "No completions yet."}</div>
                  ) : (
                    <>
                      <div className="divide-y divide-border">
                        {paginatedCompletions.map((completion) => {
                          const levelData = levelRankMap.get(completion.levelId);
                          const isHardest = hardestLevel?.levelId === completion.levelId;
                          return (
                            <Link key={completion.levelId} to={`/level/${completion.levelId}`} className={`flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors ${isHardest ? "bg-glow-gold/5 border-l-2 border-glow-gold" : ""}`}>
                              <div className="w-12 text-center flex-shrink-0">
                                <span className={`font-display font-bold text-lg ${levelData?.rank === 1 ? "rank-gold" : levelData?.rank === 2 ? "rank-silver" : levelData?.rank === 3 ? "rank-bronze" : "text-muted-foreground"}`}>#{levelData?.rank || "?"}</span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Medal className="w-4 h-4 text-primary" /></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-foreground truncate">{completion.levelName}</span>
                                  {verifiedLevelIds.has(completion.levelId) && (
                                    <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                      <Shield className="w-3 h-3" />
                                      Verifier
                                    </span>
                                  )}
                                  {isHardest && (
                                    <span className="flex items-center gap-1 text-xs text-glow-gold bg-glow-gold/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                      <Star className="w-3 h-3" />
                                      Hardest
                                    </span>
                                  )}
                                  {completion.isManualRun && (
                                    <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                      Not in API
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                {completion.completedAt && (
                                  <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(completion.completedAt)}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" /><span className="font-mono">{formatTime(completion.time)}</span></div>
                                <div className="flex items-center gap-1 text-primary"><Trophy className="w-4 h-4" /><span className="font-mono font-bold">+{completion.points}</span></div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      {!showAll && totalPages > 1 && (
                        <div className="p-4 border-t border-border flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                          <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Extra completions tab */}
            {extraCompletions.length > 0 && (
              <TabsContent value="extra" className="mt-0">
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                      <Star className="w-5 h-5 text-accent" />
                      Extra List Completions
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({profileData?.extra_points || 0} extra points)
                      </span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm bg-secondary border-border" />
                      </div>
                      <Button
                        variant={sortMode === "rank" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSortMode(sortMode === "rank" ? "date" : "rank")}
                        className="gap-2 flex-shrink-0"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="hidden sm:inline">{sortMode === "rank" ? "By Rank" : "By Date"}</span>
                      </Button>
                      <Button
                        variant={showAll ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => { setShowAll(!showAll); setCurrentPage(1); }}
                        className="flex-shrink-0"
                      >
                        {showAll ? "Paginate" : "Show All"}
                      </Button>
                    </div>
                  </div>
                  {(() => {
                    let filtered = extraCompletions.filter((c: any) => 
                      !searchQuery.trim() || c.levelName.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    if (sortMode === "date") {
                      filtered = [...filtered].sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
                    } else {
                      filtered = [...filtered].sort((a: any, b: any) => a.rank - b.rank);
                    }
                    const paginated = showAll ? filtered : filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
                    const totalExtraPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
                    
                    return (
                      <>
                        <div className="divide-y divide-border">
                          {paginated.map((completion: any) => (
                            <Link key={completion.id} to={`/extra/${completion.levelId}`} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                              <div className="w-12 text-center flex-shrink-0">
                                <span className={`font-display font-bold text-lg ${completion.rank === 1 ? "rank-gold" : completion.rank === 2 ? "rank-silver" : completion.rank === 3 ? "rank-bronze" : "text-muted-foreground"}`}>
                                  #{completion.rank}
                                </span>
                              </div>
                              {completion.thumbnailUrl && (
                                <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0">
                                  <img src={completion.thumbnailUrl} alt={completion.levelName} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-foreground truncate block">{completion.levelName}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                {completion.completedAt && (
                                  <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(completion.completedAt)}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-mono">{formatTime(completion.time)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-accent">
                                  <Star className="w-4 h-4" />
                                  <span className="font-mono font-bold">+{completion.points}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        {!showAll && totalExtraPages > 1 && (
                          <div className="p-4 border-t border-border flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalExtraPages}</span>
                            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalExtraPages, p + 1))} disabled={currentPage === totalExtraPages}><ChevronRight className="w-4 h-4" /></Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
            )}

            {createdLevels.length > 0 && (
              <TabsContent value="created" className="mt-0">
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="p-4 border-b border-border bg-secondary/30">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                      <Hammer className="w-5 h-5 text-primary" />
                      Created Levels
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({createdLevelsTotalPoints.toLocaleString()} total points)
                      </span>
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {createdLevels.map((level: any) => (
                      <Link key={level.id} to={`/level/${level.level_id}`} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                        <div className="w-12 text-center flex-shrink-0">
                          <span className={`font-display font-bold text-lg ${level.rank_position === 1 ? "rank-gold" : level.rank_position === 2 ? "rank-silver" : level.rank_position === 3 ? "rank-bronze" : "text-muted-foreground"}`}>
                            #{level.rank_position}
                          </span>
                        </div>
                        {level.thumbnail_url && (
                          <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0">
                            <img src={level.thumbnail_url} alt={level.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground truncate block">{level.name || level.level_id}</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Trophy className="w-4 h-4" />
                          <span className="font-mono font-bold">{level.points}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
