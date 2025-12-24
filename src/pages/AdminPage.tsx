import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LEVEL_IDS } from "@/config/levels";
import { PLAYER_PROFILES } from "@/config/profiles";
import { Shield, Save, Trash2, Plus, Users, Target, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [levelIds, setLevelIds] = useState<string>(LEVEL_IDS.join("\n"));
  const [profilesJson, setProfilesJson] = useState<string>(JSON.stringify(PLAYER_PROFILES, null, 2));

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({ title: "Access Denied", description: "Admin privileges required", variant: "destructive" });
      navigate("/");
    }
  }, [isAdmin, loading, navigate, toast]);

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

  if (!isAdmin) {
    return null;
  }

  const handleSaveLevels = () => {
    toast({ 
      title: "Instructions", 
      description: "Copy the level IDs and update src/config/levels.ts manually. The order determines ranking (top = hardest)." 
    });
  };

  const handleSaveProfiles = () => {
    try {
      JSON.parse(profilesJson);
      toast({ 
        title: "Instructions", 
        description: "Copy the JSON and update src/config/profiles.ts manually." 
      });
    } catch {
      toast({ title: "Invalid JSON", description: "Please check your JSON syntax", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center glow-accent">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage levels, players, and settings</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Level IDs */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Level Rankings
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {levelIds.split("\n").filter(Boolean).length} levels
                </span>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="levelIds" className="text-foreground text-sm">
                    Level IDs (one per line, order = ranking)
                  </Label>
                  <Textarea
                    id="levelIds"
                    value={levelIds}
                    onChange={(e) => setLevelIds(e.target.value)}
                    placeholder="1743661104278
1234567890123
..."
                    className="mt-2 font-mono text-sm min-h-[200px] bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    First ID = #1 (hardest, 10 points), second = #2 (8 points), etc.
                  </p>
                </div>
                
                <Button onClick={handleSaveLevels} className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  Save Level Order
                </Button>
              </div>
            </div>

            {/* Player Profiles */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Player Profiles
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {PLAYER_PROFILES.length} profiles
                </span>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="profiles" className="text-foreground text-sm">
                    Profiles JSON (username must match in-game name)
                  </Label>
                  <Textarea
                    id="profiles"
                    value={profilesJson}
                    onChange={(e) => setProfilesJson(e.target.value)}
                    className="mt-2 font-mono text-xs min-h-[200px] bg-secondary border-border"
                  />
                </div>
                
                <Button onClick={handleSaveProfiles} variant="secondary" className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  Save Profiles
                </Button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-8 rounded-xl bg-accent/10 border border-accent/30 p-6">
            <h3 className="font-display font-bold text-foreground mb-2">Configuration Files</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To persist changes, update these files directly in the codebase:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">src/config/levels.ts</code>
                <span>— Level IDs and ranking order</span>
              </li>
              <li className="flex items-center gap-2">
                <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">src/config/profiles.ts</code>
                <span>— Player display names and avatars</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
