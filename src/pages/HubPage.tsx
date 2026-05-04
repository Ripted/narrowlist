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
  LucideIcon,
} from "lucide-react";

interface HubItem {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: "lists" | "community" | "tools" | "account" | "admin";
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
    { path: "/extended-list", label: "Extended List", description: "Levels ranked 101+", icon: List, category: "lists" },
    { path: "/extra-list", label: "Extra List", description: "Levels with extra points", icon: List, category: "lists" },
    { path: "/future-list", label: "Future List", description: "Upcoming & inactive levels", icon: Clock, category: "lists" },
    { path: "/packs", label: "Level Packs", description: "Curated level collections", icon: Package, category: "lists" },

    // Community
    { path: "/leaderboard", label: "Leaderboard", description: "Top players & creators", icon: Trophy, category: "community" },
    { path: "/recent", label: "Recent Runs", description: "Latest completions", icon: Activity, category: "community" },
    { path: "/compare", label: "Compare Players", description: "Side-by-side player stats", icon: GitCompare, category: "community" },
    { path: "/statistics", label: "Statistics", description: "Global metrics & charts", icon: BarChart3, category: "community" },
    { path: "/help-improve", label: "Help Improve Narrowlist", description: "Levels needing your votes & ratings", icon: Sparkles, category: "community" },

    // Tools
    { path: "/submit", label: "Submit", description: "Submit a level or run", icon: Send, category: "tools" },
    { path: "/guide", label: "Guide", description: "How everything works", icon: BookOpen, category: "tools" },
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
    { key: "community", title: "Community" },
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
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectionItems.map(({ path, label, description, icon: Icon }) => (
                    <Link key={path} to={path} className="group">
                      <Card className="p-5 h-full bg-card/50 border-border/50 hover:border-primary/60 hover:bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {label}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
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
