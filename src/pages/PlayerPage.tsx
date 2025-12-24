import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlayerLeaderboard, useLevels } from "@/hooks/useLevels";
import { useAuth } from "@/hooks/useAuth";
import { formatTime, formatDate } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Trophy, Target, Clock, Medal, UserPlus, Camera, Loader2, 
  Edit2, Check, X, Search, TrendingUp, CheckCircle, Crown, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ProfileData {
  id: string;
  user_id: string | null;
  banner_url: string | null;
  avatar_url: string | null;
  bio: string | null;
  display_name: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function PlayerPage() {
  const { username } = useParams<{ username: string }>();
  const { players, loading } = usePlayerLeaderboard();
  const { levels } = useLevels();
  const { user } = useAuth();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [userHasProfile, setUserHasProfile] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const player = players.find(
    (p) => p.username.toLowerCase() === username?.toLowerCase()
  );
  const rank = player ? players.indexOf(player) + 1 : null;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  useEffect(() => {
    if (username) {
      supabase
        .from("profiles")
        .select("id, user_id, banner_url, avatar_url, bio, display_name")
        .eq("username", username)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfileData(data);
            setBioValue(data.bio || "");
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
  const canClaim = user && !profileData?.user_id && !isOwner && !userHasProfile;

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
    return player.completions
      .map((c, i) => ({
        name: c.levelName.length > 12 ? c.levelName.slice(0, 12) + "..." : c.levelName,
        fullName: c.levelName,
        rank: levelRankMap.get(c.levelId)?.rank || 0,
        index: i,
      }))
      .sort((a, b) => b.rank - a.rank);
  }, [player, levelRankMap]);

  const filteredCompletions = useMemo(() => {
    if (!player) return [];
    if (!searchQuery.trim()) return player.completions;
    const q = searchQuery.toLowerCase();
    return player.completions.filter((c) => c.levelName.toLowerCase().includes(q));
  }, [player, searchQuery]);

  const totalPages = Math.ceil(filteredCompletions.length / ITEMS_PER_PAGE);
  const paginatedCompletions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCompletions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCompletions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleClaimProfile = async () => {
    if (!user || !profileData) return;
    setClaiming(true);
    try {
      const { error } = await supabase
        .from("profile_claim_requests")
        .insert({ profile_id: profileData.id, user_id: user.id, email: user.email || "" });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already Requested", description: "You've already submitted a claim", variant: "destructive" });
        } else throw error;
      } else {
        toast({ title: "Claim Submitted", description: "An admin will review your request" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  const uploadImage = async (file: File, type: "avatar" | "banner") => {
    if (!user || !profileData) return;
    const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingBanner;
    const setLocalUrl = type === "avatar" ? setLocalAvatarUrl : setLocalBannerUrl;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('profile-images').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(data.path);
      const updateField = type === "avatar" ? "avatar_url" : "banner_url";
      const { error: updateError } = await supabase.from("profiles").update({ [updateField]: publicUrl }).eq("id", profileData.id);
      if (updateError) throw updateError;
      setLocalUrl(publicUrl);
      toast({ title: "Success", description: `${type === "avatar" ? "Profile picture" : "Banner"} updated` });
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

  if (!player) {
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

  const getRankStyle = (r: number) => {
    if (r === 1) return "rank-gold";
    if (r === 2) return "rank-silver";
    if (r === 3) return "rank-bronze";
    return "text-foreground";
  };

  const displayAvatarUrl = localAvatarUrl || profileData?.avatar_url || player.avatarUrl;
  const displayBannerUrl = localBannerUrl || profileData?.banner_url;

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

          <div className="relative h-32 md:h-48 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 mb-8 overflow-hidden group">
            {displayBannerUrl && <img src={displayBannerUrl} alt="Banner" className="w-full h-full object-cover" />}
            {isOwner && (
              <>
                <input type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "banner")} />
                <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner} className="absolute bottom-4 right-4 p-2 rounded-lg bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 -mt-20 md:-mt-16 relative z-10">
            <div className="relative group">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 bg-background ${rank && rank <= 3 ? "border-primary glow-primary" : "border-border"}`}>
                {displayAvatarUrl ? (
                  <img src={displayAvatarUrl} alt={player.displayName || player.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-foreground">{(player.displayName || player.username).charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              {isOwner && (
                <>
                  <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
                  <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute bottom-0 right-0 p-2 rounded-full bg-background border border-border hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                </>
              )}
              {rank && rank <= 3 && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <Trophy className={`w-5 h-5 ${rank === 1 ? "text-glow-gold" : rank === 2 ? "text-glow-silver" : "text-glow-bronze"}`} />
                </div>
              )}
            </div>

            <div className="text-center md:text-left space-y-4 pt-4 flex-1">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{profileData?.display_name || player.displayName || player.username}</h1>
                {(profileData?.display_name || player.displayName) && <p className="text-muted-foreground">@{player.username}</p>}
                
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
                    {profileData?.bio ? <p className="text-muted-foreground">{profileData.bio}</p> : isOwner ? <p className="text-muted-foreground/50 italic">No bio yet</p> : null}
                    {isOwner && <Button size="sm" variant="ghost" onClick={() => setEditingBio(true)} className="mt-1 gap-1 text-xs"><Edit2 className="w-3 h-3" />{profileData?.bio ? "Edit Bio" : "Add Bio"}</Button>}
                  </div>
                )}
              </div>

              {canClaim && (
                <Button onClick={handleClaimProfile} disabled={claiming} variant="outline" className="gap-2">
                  <UserPlus className="w-4 h-4" />{claiming ? "Submitting..." : "Is this you?"}
                </Button>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 rounded-lg bg-card border border-border">
                  <div className={`font-display text-2xl font-bold ${rank ? getRankStyle(rank) : ""}`}>#{rank}</div>
                  <div className="text-xs text-muted-foreground">Global Rank</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center justify-center gap-1"><Trophy className="w-4 h-4 text-primary" /><span className="font-display text-2xl font-bold text-primary">{player.totalPoints}</span></div>
                  <div className="text-xs text-muted-foreground">Total Points</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border">
                  <div className="font-display text-2xl font-bold text-foreground">{player.completions.length}</div>
                  <div className="text-xs text-muted-foreground">Completions</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border col-span-2 md:col-span-1">
                  <div className="flex items-center justify-center gap-1"><Crown className="w-4 h-4 text-glow-gold" /><span className="font-display text-lg font-bold text-foreground">#{hardestLevel?.rank || "-"}</span></div>
                  <div className="text-xs text-muted-foreground truncate" title={hardestLevel?.name}>{hardestLevel?.name ? hardestLevel.name.slice(0, 15) + (hardestLevel.name.length > 15 ? "..." : "") : "Hardest"}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4 text-primary" /><span className="font-display text-2xl font-bold text-foreground">{verifiedCount}</span></div>
                  <div className="text-xs text-muted-foreground">Verified</div>
                </div>
              </div>
            </div>
          </div>

          {progressionData.length > 1 && (
            <div className="rounded-xl bg-card border border-border p-6 mb-8">
              <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary" />Progression</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressionData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis reversed domain={[1, 'auto']} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(220 25% 9%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '8px' }} formatter={(value: number, name: string, props: any) => [`#${value}`, props.payload.fullName]} />
                    <Line type="monotone" dataKey="rank" stroke="hsl(260 70% 60%)" strokeWidth={2} dot={{ fill: 'hsl(260 70% 60%)', strokeWidth: 0, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Completed Levels<span className="text-sm font-normal text-muted-foreground">({filteredCompletions.length})</span></h2>
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm bg-secondary border-border" />
              </div>
            </div>

            {paginatedCompletions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{searchQuery ? "No levels found." : "No completions yet."}</div>
            ) : (
              <>
                <div className="divide-y divide-border">
                  {paginatedCompletions.map((completion) => {
                    const levelData = levelRankMap.get(completion.levelId);
                    return (
                      <Link key={completion.levelId} to={`/level/${completion.levelId}`} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                        <div className="w-12 text-center flex-shrink-0">
                          <span className={`font-display font-bold text-lg ${levelData?.rank === 1 ? "rank-gold" : levelData?.rank === 2 ? "rank-silver" : levelData?.rank === 3 ? "rank-bronze" : "text-muted-foreground"}`}>#{levelData?.rank || "?"}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Medal className="w-4 h-4 text-primary" /></div>
                        <div className="flex-1 min-w-0"><div className="font-medium text-foreground truncate">{completion.levelName}</div></div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" /><span className="font-mono">{formatTime(completion.time)}</span></div>
                          <div className="flex items-center gap-1 text-primary"><Trophy className="w-4 h-4" /><span className="font-mono font-bold">+{completion.points}</span></div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="p-4 border-t border-border flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
