import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlayerLeaderboard } from "@/hooks/useLevels";
import { useAuth } from "@/hooks/useAuth";
import { getPlayerProfile } from "@/config/profiles";
import { formatTime } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Target, Clock, Medal, UserPlus, Camera, Loader2 } from "lucide-react";

export default function PlayerPage() {
  const { username } = useParams<{ username: string }>();
  const { players, loading } = usePlayerLeaderboard();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [claiming, setClaiming] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const player = players.find(
    (p) => p.username.toLowerCase() === username?.toLowerCase()
  );
  const profile = username ? getPlayerProfile(username) : undefined;
  const rank = player ? players.indexOf(player) + 1 : null;

  // Check if current user owns this profile
  const [profileData, setProfileData] = useState<{ id: string; user_id: string | null; banner_url: string | null } | null>(null);
  
  useState(() => {
    if (username) {
      supabase
        .from("profiles")
        .select("id, user_id, banner_url")
        .eq("username", username)
        .single()
        .then(({ data }) => {
          if (data) setProfileData(data);
        });
    }
  });

  const isOwner = user && profileData?.user_id === user.id;
  const canClaim = user && !profileData?.user_id && !isOwner;

  const handleClaimProfile = async () => {
    if (!user || !profileData) return;
    
    setClaiming(true);
    try {
      const { error } = await supabase
        .from("profile_claim_requests")
        .insert({
          profile_id: profileData.id,
          user_id: user.id,
          email: user.email || "",
        });
      
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already Requested", description: "You've already submitted a claim for this profile", variant: "destructive" });
        } else {
          throw error;
        }
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
      
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);
      
      const updateField = type === "avatar" ? "avatar_url" : "banner_url";
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ [updateField]: publicUrl })
        .eq("id", profileData.id);
      
      if (updateError) throw updateError;
      
      setLocalUrl(publicUrl);
      toast({ title: "Success", description: `${type === "avatar" ? "Profile picture" : "Banner"} updated` });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
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
          <Link to="/players">
            <Button variant="ghost" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Button>
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

  const displayAvatarUrl = localAvatarUrl || profile?.avatarUrl || player.avatarUrl;
  const displayBannerUrl = localBannerUrl || profileData?.banner_url;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/players">
            <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Players
            </Button>
          </Link>

          {/* Banner */}
          <div className="relative h-32 md:h-48 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 mb-8 overflow-hidden group">
            {displayBannerUrl && (
              <img src={displayBannerUrl} alt="Banner" className="w-full h-full object-cover" />
            )}
            {isOwner && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={bannerInputRef}
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "banner")}
                />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="absolute bottom-4 right-4 p-2 rounded-lg bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 -mt-20 md:-mt-16 relative z-10">
            {/* Avatar */}
            <div className="relative group">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 bg-background ${rank && rank <= 3 ? "border-primary glow-primary" : "border-border"}`}>
                {displayAvatarUrl ? (
                  <img src={displayAvatarUrl} alt={player.displayName || player.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-foreground">
                      {(player.displayName || player.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {isOwner && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={avatarInputRef}
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-background border border-border hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                </>
              )}
              {rank && rank <= 3 && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <Trophy className={`w-5 h-5 ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-400" : "text-orange-400"}`} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left space-y-4 pt-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {player.displayName || player.username}
                </h1>
                {player.displayName && <p className="text-muted-foreground">@{player.username}</p>}
                {profile?.bio && <p className="text-muted-foreground mt-2">{profile.bio}</p>}
              </div>

              {/* Claim Button */}
              {canClaim && (
                <Button onClick={handleClaimProfile} disabled={claiming} variant="outline" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  {claiming ? "Submitting..." : "Is this you?"}
                </Button>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-6">
                <div className="text-center">
                  <div className={`font-display text-3xl font-bold ${rank ? getRankStyle(rank) : ""}`}>#{rank}</div>
                  <div className="text-xs text-muted-foreground">Global Rank</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="font-display text-3xl font-bold text-primary">{player.totalPoints}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Total Points</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="font-display text-3xl font-bold text-foreground">{player.completions.length}</div>
                  <div className="text-xs text-muted-foreground">Completions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Completions */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Completed Levels
              </h2>
            </div>

            {player.completions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No completions yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {player.completions.map((completion) => (
                  <Link
                    key={completion.levelId}
                    to={`/level/${completion.levelId}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Medal className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{completion.levelName}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono">{formatTime(completion.time)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Trophy className="w-4 h-4" />
                        <span className="font-mono font-bold">+{completion.points}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}