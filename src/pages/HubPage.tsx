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
  BarChart3,
  Send,
  BookOpen,
  Palette,
  Bookmark,
  Package,
  User,
  Shield,
  Target,
  Sparkles,
  Dice5,
  CalendarDays,

  LucideIcon,
} from "lucide-react";

interface HubItem {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: "lists" | "leaderboards" | "activity" | "tools" | "account" | "admin";
}

const HubPage = () => {
  const { user, isAdmin } = useAuth();
  const [playerUsername, setPlayerUsername] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setPlayerUsername(data?.username ?? null));
    } else {
      setPlayerUsername(null);
    }
  }, [user]);

  const items: HubItem[] = [
    // Lists
    { path: "/main", label: "Main List", description: "Top 100 hardest levels", icon: Target, category: "lists" },
    { path: "/extended-list", label: "Extended List", description: "Ranks 101 and beyond", icon: List, category: "lists" },
    { path: "/extra-list", label: "Extra List", description: "Levels with extra points", icon: List, category: "lists" },
    { path: "/future-list", label: "Future List", description: "Upcoming & inactive levels", icon: Clock, category: "lists" },
    { path: "/packs", label: "Level Packs", description: "Curated level collections", icon: Package, category: "lists" },

    // Leaderboards
    { path: "/leaderboard", label: "Leaderboard", description: "Top players & creators", icon: Trophy, category: "leaderboards" },
    { path: "/compare", label: "Compare Players", description: "Side-by-side player stats", icon: GitCompare, category: "leaderboards" },

    // Activity
    { path: "/recent", label: "Recent Runs", description: "Latest completions", icon: Activity, category: "activity" },
    { path: "/recently-added", label: "Recently Added", description: "Newest levels on the lists", icon: Sparkles, category: "activity" },
    { path: "/statistics", label: "Statistics", description: "Global metrics & charts", icon: BarChart3, category: "activity" },
    { path: "/events", label: "Events", description: "Level jams & competitions", icon: CalendarDays, category: "activity" },

    // Tools
    { path: "/submit", label: "Submit", description: "Submit a level or run", icon: Send, category: "tools" },
    { path: "/info", label: "Info", description: "How everything works", icon: BookOpen, category: "tools" },
    { path: "/roulette", label: "Level Roulette", description: "Random level challenges", icon: Dice5, category: "tools" },
    { path: "/themes", label: "Themes", description: "Customize site appearance", icon: Palette, category: "tools" },
  ];

  if (user) {
    items.push({ path: "/watchlist", label: "Watchlist", description: "Your saved levels", icon: Bookmark, category: "account" });
  }
  if (playerUsername) {
    items.push({ path: `/player/${playerUsername}`, label: "My Profile", description: "Your stats & runs", icon: User, category: "account" });
  }
  if (isAdmin) {
    items.push({ path: "/admin", label: "Admin Panel", description: "Manage levels & users", icon: Shield, category: "admin" });
  }

  const categories: { key: HubItem["category"]; title: string }[] = [
    { key: "lists", title: "Lists" },
    { key: "leaderboards", title: "Leaderboards" },
    { key: "activity", title: "Activity" },
    { key: "tools", title: "Tools" },
    { key: "account", title: "Your Account" },
    { key: "admin", title: "Admin" },
  ];


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-3">
            Explore Narrowlist
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every page in one place — pick where you want to go.
          </p>
        </div>

        <div className="space-y-10">
          {categories.map(({ key, title }) => {
            const sectionItems = items.filter((i) => i.category === key);
            if (sectionItems.length === 0) return null;
            return (
              <section key={key}>
                <h2 className="font-display text-xs font-semibold mb-4 flex items-center gap-2 uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectionItems.map(({ path, label, description, icon: Icon }) => (
                    <Link key={path} to={path} className="group">
                      <Card className="relative overflow-hidden p-5 h-full bg-card/40 border-border/60 hover:border-primary/40 hover:bg-card/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.04] pointer-events-none" />
                        <div className="relative flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/10 text-primary group-hover:from-primary/25 group-hover:to-accent/15 group-hover:border-primary/30 group-hover:scale-[1.04] transition-all duration-300">
                            <Icon className="w-5 h-5" strokeWidth={2.25} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight">
                              {label}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                              {description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default HubPage;
