import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Trophy, List, Clock, Users, Send, GitCompare, 
  HelpCircle, Star, Heart, Zap, ChevronRight, ArrowRight,
  Play, UserPlus, MapPin, Medal, Target, Eye, ListPlus,
  MessageCircle, Tag, Package, Shield, Bookmark, Activity, Palette
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
  const [admins, setAdmins] = useState<{
    champy: FounderProfile | null;
    ripted: FounderProfile | null;
    mazyx: FounderProfile | null;
  }>({
    champy: null,
    ripted: null,
    mazyx: null,
  });
  const [raters, setRaters] = useState<RaterRow[]>([]);
  const [activeTab, setActiveTab] = useState("features");

  useEffect(() => {
    if (window.location.hash === "#api") setActiveTab("api");
  }, []);

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .in("username", ["sqm", "Ripted", "Ch4mpY", "M4zyxx"]);
      
      if (data) {
        setFounders({
          sqm: data.find(p => p.username.toLowerCase() === "sqm") || null,
        });
        setAdmins({
          champy: data.find(p => p.username.toLowerCase() === "ch4mpy") || null,
          ripted: data.find(p => p.username.toLowerCase() === "ripted") || null,
          mazyx: data.find(p => p.username.toLowerCase() === "m4zyxx") || null,
        });
      }
    }
    loadProfiles();
  }, []);

  useEffect(() => {
    async function loadRaters() {
      const { data } = await supabase
        .from("level_raters")
        .select("username, can_main, can_future, can_extra")
        .order("username");
      if (!data?.length) return;

      const { data: profs } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .in("username", data.map((r) => r.username));

      setRaters(
        data.map((r) => {
          const p = profs?.find(
            (x) => x.username.toLowerCase() === r.username.toLowerCase(),
          );
          return {
            ...r,
            display_name: p?.display_name ?? null,
            avatar_url: p?.avatar_url ?? null,
          };
        }),
      );
    }
    loadRaters();
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
                onClick={() => navigate("/recent")}
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
                description="Filter the Main and Extra lists by tags and sort by rank, points or completions."
                onClick={() => navigate("/main")}
              />
              <FeatureCard
                icon={Target}
                title="Level Roulette"
                description="Get a random challenge set from any rank range, with customizable skips and level counts."
                onClick={() => navigate("/roulette")}
              />
              <FeatureCard
                icon={ListPlus}
                title="Recently Added"
                description="See which levels were added to the lists most recently, across Main, Extra and Future."
                onClick={() => navigate("/recently-added")}
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
                  A shared reference scale from D0 (easiest) to D8 (hardest), used when discussing levels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  D-ratings describe roughly how hard a level is in practice, from
                  <span className="text-foreground font-mono"> D0</span> to
                  <span className="text-foreground font-mono"> D8</span>. They are set by the
                  <span className="text-foreground font-medium"> admin team</span> using completion data and player feedback.
                </p>
                <div className="space-y-2">
                  {[
                    { d: "D8", color: "text-red-500", desc: "Impossible for humans, requires a robot or macro" },
                    { d: "D7", color: "text-red-400", desc: "The absolute limit of any human player" },
                    { d: "D6", color: "text-red-400", desc: "Nobody has beaten this yet, but a human theoretically could (e.g. Amorathis)" },
                    { d: "D5", color: "text-amber-400", desc: "The hardest levels that have actually been beaten (e.g. TapTapDash)" },
                    { d: "D4", color: "text-amber-400", desc: "Only the best players can beat these, and it takes a long time (e.g. Exaction)" },
                    { d: "D3", color: "text-amber-400", desc: "Top players can beat these with some effort (e.g. Onerous Zones of Fate)" },
                    { d: "D2", color: "text-emerald-400", desc: "Players will need some experience before clearing these (e.g. big square)" },
                    { d: "D1", color: "text-emerald-400", desc: "A tough but reachable goal for beginners (e.g. RitF)" },
                    { d: "D0", color: "text-emerald-400", desc: "Easy to finish, but you can still die if you're not careful (e.g. Circles)" },
                  ].map((t) => (
                    <div key={t.d} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                      <div className={`font-display text-lg font-bold w-10 ${t.color}`}>{t.d}</div>
                      <div className="text-sm text-muted-foreground flex-1">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Who Decides a Level's D-Rating?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• The <span className="text-foreground font-medium">admin team</span> assigns difficulty tiers, based on completion data and feedback from experienced players.</p>
                <p>• Public difficulty voting was removed — the scale above is a shared reference, not a poll.</p>
                <p>• Think a level sits in the wrong tier? Bring it up in the Narrowlist Discord.</p>
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
                    Narrowlist Discord
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
                      Join Narrowlist
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
                    description="Suggest levels for the list or send video proof of your manual completions."
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
                    icon={Package}
                    title="Explore level packs"
                    description="Work through curated collections of levels grouped by theme, creator or difficulty step-up."
                  />
                  <CommunityRow
                    icon={Target}
                    title="Spin the Level Roulette"
                    description="Get a random challenge set from any rank range and track your runs locally."
                  />
                  <CommunityRow
                    icon={Shield}
                    title="Report issues"
                    description="Spotted a wrong rank, duplicate run or broken thumbnail? Use the bug report button or ping an admin on Discord."
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
                    onClick={() => navigate("/recent")} 
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
                    Creator points are based purely on how many ranked levels you've made:
                    <strong className="text-foreground"> 1 point per Main List level</strong> you created.
                    Where the level sits on the list doesn't matter. You can see the standings on the
                    Creators leaderboard.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger className="text-left">
                  What do the D0–D8 difficulty ratings mean?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    D-ratings are a shared reference scale for how hard a level is, from D0 (very easy)
                    to D8 (not humanly possible). They're set by the admin team — public difficulty
                    voting and level ratings were removed from the site. See the Difficulty tab for the full scale.
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
                    Join the Narrowlist Discord — it's the fastest way to reach the admin team for help,
                    bug reports, or rank discussions.
                  </p>
                  <a
                    href="https://discord.gg/3PdgPKqUCP"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Open Narrowlist Discord →
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
                <ProfileLink 
                  username="M4zyxx" 
                  displayName={admins.mazyx?.display_name}
                  avatarUrl={admins.mazyx?.avatar_url}
                  role="Admin"
                />
              </div>
            </div>

            {raters.length > 0 && (
              <div>
                <h3 className="font-display font-semibold mb-1 text-foreground">Level Raters</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Trusted community members who help place levels on specific lists.
                </p>
                <div className="flex flex-wrap gap-4">
                  {raters.map((r) => (
                    <ProfileLink
                      key={r.username}
                      username={r.username}
                      displayName={r.display_name}
                      avatarUrl={r.avatar_url}
                      role={
                        [
                          r.can_main && "Main",
                          r.can_future && "Future",
                          r.can_extra && "Extra",
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Rater"
                      }
                    />
                  ))}
                </div>
              </div>
            )}

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
