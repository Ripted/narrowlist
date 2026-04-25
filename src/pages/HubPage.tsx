import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  List,
  Trophy,
  Clock,
  Activity,
  GitCompare,
  Send,
  BookOpen,
  Palette,
  Bookmark,
  BarChart3,
  Package,
  User,
  Shield,
  Target,
} from "lucide-react";

interface HubItem {
  path: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "accent" | "muted";
}

const HubPage = () => {
  const { user, isAdmin } = useAuth();
  const [playerUsername, setPlayerUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPlayerUsername(null);
      return;
    }
    supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setPlayerUsername(data?.username ?? null));
  }, [user]);

  const lists: HubItem[] = [
    { path: "/main-list", label: "Main List", description: "Top 100 hardest levels", icon: Target, accent: "primary" },
    { path: "/extended-list", label: "Extended List", description: "Levels ranked 101+", icon: List },
    { path: "/extra-list", label: "Extra List", description: "Levels with custom Extra Points", icon: List },
    { path: "/future-list", label: "Future List", description: "Upcoming levels to watch", icon: Clock },
    { path: "/packs", label: "Level Packs", description: "Curated themed collections", icon: Package },
  ];

  const community: HubItem[] = [
    { path: "/leaderboard", label: "Leaderboard", description: "Top players by points", icon: Trophy, accent: "primary" },
    { path: "/recent", label: "Recent Runs", description: "Latest verified completions", icon: Activity },
    { path: "/compare", label: "Compare Players", description: "Side-by-side stats for up to 4 players", icon: GitCompare },
    { path: "/statistics", label: "Statistics", description: "Global community metrics", icon: BarChart3 },
  ];

  const tools: HubItem[] = [
    { path: "/submit", label: "Submit", description: "Submit a level or run", icon: Send },
    { path: "/guide", label: "Guide", description: "How everything works", icon: BookOpen },
    { path: "/themes", label: "Themes", description: "Customize the look of the site", icon: Palette },
  ];

  const personal: HubItem[] = [];
  if (user) {
    personal.push({
      path: "/watchlist",
      label: "Watchlist",
      description: "Levels and players you follow",
      icon: Bookmark,
    });
  }
  if (playerUsername) {
    personal.push({
      path: `/player/${playerUsername}`,
      label: "Your Profile",
      description: "View your runs and creator points",
      icon: User,
      accent: "accent",
    });
  }
  if (isAdmin) {
    personal.push({
      path: "/admin",
      label: "Admin",
      description: "Manage levels, packs and feedback",
      icon: Shield,
      accent: "accent",
    });
  }

  const Section = ({ title, items }: { title: string; items: HubItem[] }) => (
    <section className="space-y-4">
      <h2 className="font-display text-2xl font-bold tracking-wide gradient-text">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ path, label, description, icon: Icon, accent }) => (
          <Link key={path} to={path} className="group">
            <Card
              className={`h-full p-5 bg-card/60 backdrop-blur border-border/50 hover:border-primary/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                accent === "primary" ? "hover:shadow-primary/20" : accent === "accent" ? "hover:shadow-accent/20" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                    accent === "primary"
                      ? "bg-primary/15 text-primary group-hover:bg-primary/25"
                      : accent === "accent"
                      ? "bg-accent/15 text-accent group-hover:bg-accent/25"
                      : "bg-secondary text-foreground group-hover:bg-secondary/70"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                    {label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-snug">{description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 space-y-12">
        {/* Hero */}
        <header className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-wider gradient-text">
            NARROWLIST
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            The community-driven home for the hardest Narrow Arrow levels. Pick a section to get started.
          </p>
        </header>

        <Section title="Lists" items={lists} />
        <Section title="Community" items={community} />
        <Section title="Tools" items={tools} />
        {personal.length > 0 && <Section title="You" items={personal} />}
      </main>
    </div>
  );
};

export default HubPage;
