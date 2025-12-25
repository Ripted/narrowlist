import { Navbar } from "@/components/Navbar";
import { 
  BookOpen, Trophy, List, Clock, Users, Send, GitCompare, 
  HelpCircle, ChevronDown, Star, Heart, Zap
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Guide & FAQ</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
            Welcome to Narrowlist
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The definitive ranking system for Narrow Arrow's hardest levels. 
            Track your progress, compete with others, and climb the leaderboard!
          </p>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <FeatureCard 
            icon={List}
            title="Main List"
            description="Browse the official ranked levels sorted by difficulty. Each level awards points based on its position."
          />
          <FeatureCard 
            icon={Clock}
            title="Future List"
            description="Preview upcoming levels that will be added to the main list. Get ready for new challenges!"
          />
          <FeatureCard 
            icon={Trophy}
            title="Leaderboard"
            description="See the top players ranked by total points. Compete to reach the top of the rankings!"
          />
          <FeatureCard 
            icon={GitCompare}
            title="Compare Players"
            description="Compare statistics and completions between two players side by side."
          />
          <FeatureCard 
            icon={Send}
            title="Submit Levels"
            description="Suggest new levels to be added to the list. Admins will review and rank approved submissions."
          />
          <FeatureCard 
            icon={Users}
            title="Player Profiles"
            description="View detailed statistics, completions, and rankings for any player on the site."
          />
        </div>

        {/* Points Distribution */}
        <div className="rounded-xl bg-card border border-border p-6 md:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold">Points Distribution</h2>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Points are awarded based on a level's rank position. Harder levels (lower rank numbers) 
            award more points. Here's how the system works:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <PointsExample rank={1} points={250} label="Hardest" />
            <PointsExample rank={10} points={175} label="Top 10" />
            <PointsExample rank={50} points={100} label="Top 50" />
            <PointsExample rank={100} points={55} label="Top 100" />
          </div>

          <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-4">
            <strong className="text-foreground">Formula:</strong> Points decrease as rank increases, 
            with the first level worth 250 points and gradually decreasing. The exact formula ensures 
            a fair balance between early and late levels.
          </div>
        </div>

        {/* FAQ Section */}
        <div className="rounded-xl bg-card border border-border p-6 md:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                How do I get my completions tracked?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Completions are automatically synced from the Narrow Arrow game. Make sure you're 
                logged in with the same username in both the game and on Narrowlist. If your profile 
                doesn't exist yet, it will be created automatically when you complete a ranked level.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                How can I claim my profile?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Visit your profile page and click the "Claim Profile" button. An admin will review 
                your request to verify you're the real owner. Once approved, you can customize your 
                profile with a bio, country flag, and custom images.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Why is my completion not showing?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Completions are synced periodically. If your completion just happened, wait a few 
                minutes and refresh the page. Make sure you completed the exact level that's on 
                the list (same level ID). Contact an admin if issues persist.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                How do I submit a level to be ranked?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Go to the "Submit Level" page from the navigation menu. Enter the level ID from 
                Narrow Arrow, wait for the level data to load, suggest a rank position, and submit. 
                Admins will review your submission and may approve it with an adjusted rank.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                What are the different arrow types?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Narrow Arrow has different arrow types with varying abilities: Energy Arrow (balanced), 
                Speedy Arrow (faster), and more. Completions track which arrow type was used, but all 
                arrows earn the same points for rankings.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left">
                Who decides level rankings?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Level rankings are determined by the admin team based on community feedback, 
                completion statistics, and skilled player input. Rankings may be adjusted over 
                time as more data becomes available.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Founders Section */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-6 md:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold">Created With Love</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Narrowlist was created and is maintained by passionate members of the Narrow Arrow community.
          </p>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3 px-4 py-3 bg-card/80 rounded-lg border border-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground">S</span>
              </div>
              <div>
                <div className="font-display font-semibold text-foreground">sqm</div>
                <div className="text-xs text-muted-foreground">Co-Founder</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-card/80 rounded-lg border border-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <span className="font-display font-bold text-accent-foreground">R</span>
              </div>
              <div>
                <div className="font-display font-semibold text-foreground">Ripted</div>
                <div className="text-xs text-muted-foreground">Co-Founder</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Special thanks to everyone who contributes to the community and helps make Narrowlist better!
          </p>
        </div>

        {/* Support Section */}
        <div className="rounded-xl bg-card border border-border p-6 md:p-8 text-center">
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
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="rounded-xl bg-card border border-border p-5 hover:border-primary/50 transition-colors group">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PointsExample({ rank, points, label }: { rank: number; points: number; label: string }) {
  return (
    <div className="text-center p-4 rounded-lg bg-secondary/50 border border-border">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-display font-bold text-foreground">#{rank}</div>
      <div className="text-primary font-mono font-semibold">{points} pts</div>
    </div>
  );
}
