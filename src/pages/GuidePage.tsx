import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Trophy, List, Clock, Users, Send, GitCompare, 
  HelpCircle, Star, Heart, Zap, ChevronRight, ArrowRight,
  Play, UserPlus, MapPin, Medal, Target, Eye, ListPlus,
  MessageCircle, Tag, Package, Shield, Award, Bookmark, Activity, Palette
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FounderProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function GuidePage() {
  const navigate = useNavigate();
  const [founders, setFounders] = useState<{ sqm: FounderProfile | null }>({
    sqm: null,
  });
  const [admins, setAdmins] = useState<{ champy: FounderProfile | null; ripted: FounderProfile | null }>({
    champy: null,
    ripted: null,
  });
  const [activeTab, setActiveTab] = useState("getting-started");

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .in("username", ["sqm", "Ripted", "Ch4mpY"]);
      
      if (data) {
        setFounders({
          sqm: data.find(p => p.username.toLowerCase() === "sqm") || null,
        });
        setAdmins({
          champy: data.find(p => p.username.toLowerCase() === "ch4mpy") || null,
          ripted: data.find(p => p.username.toLowerCase() === "ripted") || null,
        });
      }
    }
    loadProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Interactive Guide</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
            Welcome to Narrowlist
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The definitive ranking system for Narrow Arrow's hardest levels. 
            Click on any section below to learn more and navigate directly!
          </p>
        </div>

        {/* Interactive Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-8">
            <TabsTrigger value="getting-started" className="gap-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Get Started</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Points</span>
            </TabsTrigger>
            <TabsTrigger value="difficulty" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Difficulty</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <InteractiveCard
                icon={Eye}
                title="1. Browse the Lists"
                description="Explore the Main List to see all ranked levels by difficulty."
                action="View Main List"
                onClick={() => navigate("/main")}
              />
              <InteractiveCard
                icon={Play}
                title="2. Complete a Level"
                description="Beat any level in Narrow Arrow that's on our lists."
                action="See What's Ranked"
                onClick={() => navigate("/main")}
              />
              <InteractiveCard
                icon={Clock}
                title="3. Wait for Sync"
                description="Completions are automatically synced every 3 minutes from the game."
                action="Check Recent Runs"
                onClick={() => navigate("/recent-runs")}
              />
              <InteractiveCard
                icon={UserPlus}
                title="4. Claim Your Profile"
                description="Once you have completions, claim your profile to customize it."
                action="Find Your Profile"
                onClick={() => navigate("/leaderboard")}
              />
            </div>

            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Jump right into the action with these quick links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate("/main")} className="gap-2">
                    <List className="w-4 h-4" />
                    Main List
                  </Button>
                  <Button onClick={() => navigate("/extra-list")} variant="secondary" className="gap-2">
                    <ListPlus className="w-4 h-4" />
                    Extra List
                  </Button>
                  <Button onClick={() => navigate("/leaderboard")} variant="secondary" className="gap-2">
                    <Trophy className="w-4 h-4" />
                    Leaderboard
                  </Button>
                  <Button onClick={() => navigate("/submit")} variant="outline" className="gap-2">
                    <Send className="w-4 h-4" />
                    Submit Level
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard 
                icon={List}
                title="Main List"
                description="The top 100 hardest levels in Narrow Arrow. Each level awards points based on its ranking position."
                onClick={() => navigate("/main")}
              />
              <FeatureCard 
                icon={Clock}
                title="Future List"
                description="Preview upcoming levels that will be added to the main list. Get ready for new challenges!"
                onClick={() => navigate("/future-list")}
              />
              <FeatureCard 
                icon={ListPlus}
                title="Extra List"
                description="Levels that don't meet main list standards. Ranked separately with their own Extra Points system."
                onClick={() => navigate("/extra-list")}
              />
              <FeatureCard 
                icon={Trophy}
                title="Leaderboard"
                description="See the top players ranked by total points. Compete to reach the top of the rankings!"
                onClick={() => navigate("/leaderboard")}
              />
              <FeatureCard 
                icon={GitCompare}
                title="Compare Players"
                description="Compare statistics and completions between two players side by side."
                onClick={() => navigate("/compare")}
              />
              <FeatureCard 
                icon={Send}
                title="Submit Levels"
                description="Suggest new levels to be added to the list. Admins will review and rank approved submissions."
                onClick={() => navigate("/submit")}
              />
              <FeatureCard 
                icon={Users}
                title="Player Profiles"
                description="View detailed statistics, completions, and rankings for any player on the site."
                onClick={() => navigate("/leaderboard")}
              />
              <FeatureCard 
                icon={MapPin}
                title="Statistics"
                description="View global stats about completion rates, popular levels, and more."
                onClick={() => navigate("/statistics")}
              />
              <FeatureCard 
                icon={Medal}
                title="Recent Runs"
                description="See the latest completions from all players in real-time."
                onClick={() => navigate("/recent")}
              />
              <FeatureCard
                icon={Package}
                title="Level Packs"
                description="Curated collections of levels grouped by theme, difficulty or creator."
                onClick={() => navigate("/packs")}
              />
              <FeatureCard
                icon={Bookmark}
                title="Watchlist"
                description="Bookmark levels you want to come back to. Available once you sign in."
                onClick={() => navigate("/watchlist")}
              />
              <FeatureCard
                icon={Tag}
                title="Tags & Filters"
                description="Filter the main list by any combination of community tags to find your style."
                onClick={() => navigate("/main")}
              />
              <FeatureCard
                icon={Award}
                title="Ratings & Difficulty"
                description="Vote on enjoyment, gameplay, design, decoration and difficulty of completed levels."
                onClick={() => navigate("/main")}
              />
              <FeatureCard
                icon={Palette}
                title="Themes"
                description="Switch between 60+ visual themes to make Narrowlist yours."
                onClick={() => navigate("/themes")}
              />
            </div>
          </TabsContent>

          {/* Points Tab */}
          <TabsContent value="points" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Main List Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Main List Points
                  </CardTitle>
                  <CardDescription>
                    Points awarded based on a level's ranking in the top 100
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <PointsRow rank="#1 (Hardest)" points={28} highlight />
                    <PointsRow rank="#2" points={24} />
                    <PointsRow rank="#3" points={21} />
                    <PointsRow rank="#4" points={18} />
                    <PointsRow rank="#5" points={16} />
                    <PointsRow rank="#6 - #10" points={13} />
                    <PointsRow rank="#11 - #20" points={10} />
                    <PointsRow rank="#21 - #30" points={7} />
                    <PointsRow rank="#31 - #50" points={4} />
                    <PointsRow rank="#51 - #70" points={2} />
                    <PointsRow rank="#71 - #100" points={1} />
                  </div>
                  <Button 
                    onClick={() => navigate("/main")} 
                    variant="outline" 
                    className="w-full mt-4 gap-2"
                  >
                    View Main List
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Extra List Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-accent" />
                    Extra List Points
                  </CardTitle>
                  <CardDescription>
                    Separate points for levels that don't meet main list standards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <PointsRow rank="#1 (Hardest)" points={10} highlight />
                    <PointsRow rank="#2" points={8} />
                    <PointsRow rank="#3" points={7} />
                    <PointsRow rank="#4" points={6} />
                    <PointsRow rank="#5" points={5} />
                    <PointsRow rank="#6 - #10" points={3} />
                    <PointsRow rank="#11 - #25" points={2} />
                    <PointsRow rank="#26+" points={1} />
                  </div>
                  <Button 
                    onClick={() => navigate("/extra-list")} 
                    variant="outline" 
                    className="w-full mt-4 gap-2"
                  >
                    View Extra List
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-secondary/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1">How the Lists Work</h3>
                    <p className="text-muted-foreground">
                      <strong>Main List</strong> (top 100): The 100 hardest levels, awarding points based on rank.{' '}
                      <strong>Extra List</strong>: Separate list for levels that don't meet main list standards, with their own point system.{' '}
                      <strong>Future List</strong>: Upcoming levels not yet ranked.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Difficulty Tab */}
          <TabsContent value="difficulty" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Difficulty Rating System
                </CardTitle>
                <CardDescription>
                  Community-driven difficulty scores from D0 (easiest) to D8 (hardest), in 0.1 increments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Every level on the Main, Extended and Extra lists can receive a difficulty
                  vote. Each vote is a single number from <span className="text-foreground font-mono">0.0</span> to
                  <span className="text-foreground font-mono"> 8.0</span>. The displayed difficulty is the
                  <span className="text-foreground font-medium"> average of all votes</span>.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="font-display text-lg font-bold text-emerald-400">D0 – D2</div>
                    <div className="text-xs text-muted-foreground mt-1">Beginner / Easy levels</div>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="font-display text-lg font-bold text-amber-400">D3 – D5</div>
                    <div className="text-xs text-muted-foreground mt-1">Intermediate to Hard</div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="font-display text-lg font-bold text-red-400">D6 – D8</div>
                    <div className="text-xs text-muted-foreground mt-1">Expert / Extreme</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Who Can Vote?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Players who have <span className="text-foreground font-medium">completed</span> the level (manual or synced run).</p>
                <p>• <span className="text-foreground font-medium">Admins</span> can vote on any level and adjust ratings.</p>
                <p>• Each user's vote can be updated or removed at any time.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Where It Shows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• On every level page in the <span className="text-foreground">Difficulty</span> panel.</p>
                <p>• Sortable on the Main, Extended and Extra list pages.</p>
                <p>• Aggregated on the Statistics page (Hardest Levels).</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/10 to-[#5865F2]/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                    Narrow Arrow Discord
                  </CardTitle>
                  <CardDescription>
                    The official community for the game itself. Chat with players, get game updates and find people to play with.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="https://discord.gg/HZbg89FREr"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white">
                      <MessageCircle className="w-4 h-4" />
                      Join Narrow Arrow
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Narrow List Discord
                  </CardTitle>
                  <CardDescription>
                    The home of Narrowlist. Discuss rankings, submit runs, suggest levels and follow site updates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="https://discord.gg/3PdgPKqUCP"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Join Narrow List
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  How to participate
                </CardTitle>
                <CardDescription>
                  There's more to the community than just beating levels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  <CommunityRow
                    icon={Send}
                    title="Submit levels & runs"
                    description="Suggest levels for the list or send proof of your manual completions."
                  />
                  <CommunityRow
                    icon={Award}
                    title="Rate & vote on difficulty"
                    description="Once you complete a level you can rate enjoyment, gameplay, design and difficulty."
                  />
                  <CommunityRow
                    icon={Tag}
                    title="Tag levels"
                    description="Help describe levels (e.g. spam, memory, tech) so others can find their favorite styles."
                  />
                  <CommunityRow
                    icon={Activity}
                    title="Follow recent runs"
                    description="Watch the activity feed in real-time and cheer on top performances."
                  />
                  <CommunityRow
                    icon={Bookmark}
                    title="Build a watchlist"
                    description="Bookmark levels you want to attempt next so you don't lose track of them."
                  />
                  <CommunityRow
                    icon={Shield}
                    title="Report issues"
                    description="Spotted a wrong rank, duplicate run or broken thumbnail? Ping an admin on Discord."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  How do I get my completions tracked?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>
                    Completions are automatically synced from the Narrow Arrow game every 3 minutes. 
                    Make sure you're using the same username in both the game and on Narrowlist.
                  </p>
                  <Button 
                    onClick={() => navigate("/recent-runs")} 
                    variant="link" 
                    className="h-auto p-0 text-primary"
                  >
                    Check recent runs to see if yours appeared →
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  How can I claim my profile?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>
                    Visit your profile page and click the "Is this you?" button. 
                    An admin will review your request to verify you're the real owner. 
                    Once approved, you can customize your profile with a bio, country flag, and custom images.
                  </p>
                  <Button 
                    onClick={() => navigate("/leaderboard")} 
                    variant="link" 
                    className="h-auto p-0 text-primary"
                  >
                    Find yourself on the leaderboard →
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Why is my completion not showing?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Completions are synced every 3 minutes. If your completion just happened, wait a few 
                    minutes and refresh the page. Make sure you completed the exact level that's on 
                    the list (same level ID). Contact an admin if issues persist.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  How do I submit a level to be ranked?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>
                    Go to the Submit page, enter the level ID from Narrow Arrow, wait for the level 
                    data to load, suggest a rank position and target list, then submit. 
                    Admins will review your submission.
                  </p>
                  <Button 
                    onClick={() => navigate("/submit")} 
                    variant="link" 
                    className="h-auto p-0 text-primary"
                  >
                    Submit a level now →
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  How do I submit a manual run?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Video proof is required</strong> for all manual run submissions 
                    that are not tracked by the API. Go to the Submit page and select the "Submit Run" tab. 
                    Upload a video file showing your completion with clear evidence of the time and level. 
                    Screenshots are no longer accepted.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left">
                  Who decides level rankings?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Level rankings are determined by the admin team based on community feedback, 
                    completion statistics, and skilled player input. Rankings may be adjusted over 
                    time as more data becomes available.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left">
                  What happened to my completions when I changed my username?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Our sync system now detects username changes! When you change your in-game username, 
                    your completions will automatically be merged to your existing profile during the next sync. 
                    If you notice any issues, contact an admin.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger className="text-left">
                  How do creator points work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Creator points are calculated from the average rating each of your levels receives,
                    multiplied by the level's base points and a quality factor. The leaderboard ranks
                    creators by total accumulated quality-weighted points across all of their levels.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger className="text-left">
                  How do I rate or vote on the difficulty of a level?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Open the level page after you've completed it. You'll see panels to rate
                    enjoyment, gameplay, design and decoration, and to vote on the difficulty (D-rating).
                    Only completed levels are eligible to keep ratings honest.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger className="text-left">
                  What's a Level Pack?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    Level Packs are admin-curated collections of levels grouped together — for example,
                    by creator, theme, or difficulty step-up. You can browse them on the Packs page.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-11">
                <AccordionTrigger className="text-left">
                  Where can I get help or report a bug?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>
                    Join the Narrow List Discord — it's the fastest way to reach the admin team for help,
                    bug reports, or rank discussions.
                  </p>
                  <a
                    href="https://discord.gg/3PdgPKqUCP"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Open Narrow List Discord →
                  </a>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        {/* Team Section */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Created With Love
            </CardTitle>
            <CardDescription>
              Narrowlist was created and is maintained by passionate members of the Narrow Arrow community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-display font-semibold mb-3 text-foreground">Founder</h3>
              <div className="flex flex-wrap gap-4">
                <ProfileLink 
                  username="sqm" 
                  displayName={founders.sqm?.display_name}
                  avatarUrl={founders.sqm?.avatar_url}
                  role="Founder"
                />
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold mb-3 text-foreground">Admins</h3>
              <div className="flex flex-wrap gap-4">
                <ProfileLink 
                  username="Ch4mpY" 
                  displayName={admins.champy?.display_name}
                  avatarUrl={admins.champy?.avatar_url}
                  role="Admin"
                />
                <ProfileLink 
                  username="Ripted" 
                  displayName={admins.ripted?.display_name}
                  avatarUrl={admins.ripted?.avatar_url}
                  role="Admin"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">Support Our Development</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Narrowlist is built with Lovable. If you'd like to support our continued development 
              and help us add more features, use our invite link!
            </p>
            <a 
              href="https://lovable.dev/invite/VXJ6L3W" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gap-2 glow-primary">
                <Heart className="w-4 h-4" />
                Support via Lovable
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Interactive Card Component
function InteractiveCard({ icon: Icon, title, description, action, onClick }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 group"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          {action}
          <ArrowRight className="w-4 h-4" />
        </span>
      </CardContent>
    </Card>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, onClick }: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  onClick: () => void;
}) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:border-primary/50 hover:bg-secondary/30 group"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <span className="text-xs text-primary mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to visit
          <ArrowRight className="w-3 h-3" />
        </span>
      </CardContent>
    </Card>
  );
}

// Points Row Component
function PointsRow({ rank, points, highlight = false }: { rank: string; points: number; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2 px-3 rounded ${highlight ? 'bg-primary/10' : 'hover:bg-secondary/50'} transition-colors`}>
      <span className={`${highlight ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{rank}</span>
      <span className={`font-mono font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{points} pts</span>
    </div>
  );
}

// Profile Link Component
function ProfileLink({ username, displayName, avatarUrl, role }: {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: string;
}) {
  return (
    <Link 
      to={`/player/${username}`} 
      className="flex items-center gap-3 px-4 py-3 bg-card/80 rounded-lg border border-border hover:border-primary/50 transition-all hover:-translate-y-0.5"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display font-bold text-primary-foreground">
            {(displayName || username).charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div>
        <div className="font-display font-semibold text-foreground">{displayName || username}</div>
        <div className="text-xs text-muted-foreground">{role}</div>
      </div>
    </Link>
  );
}

// Community Row Component
function CommunityRow({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
      <div className="p-2 rounded-md bg-primary/10 text-primary flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-sm text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </div>
  );
}
