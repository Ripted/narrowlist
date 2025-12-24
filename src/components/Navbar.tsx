import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, List, Shield, LogOut, LogIn, User } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [playerUsername, setPlayerUsername] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Check if user has a linked profile
      supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setPlayerUsername(data.username);
          } else {
            setPlayerUsername(null);
          }
        });
    } else {
      setPlayerUsername(null);
    }
  }, [user]);

  const navItems = [
    { path: "/", label: "Levels", icon: List },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display text-xl font-bold tracking-wider gradient-text">
              NARROWLIST
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={isActive(path) ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 font-medium ${
                    isActive(path) ? "glow-primary" : "hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
            {playerUsername && (
              <Link to={`/player/${playerUsername}`}>
                <Button
                  variant={location.pathname === `/player/${playerUsername}` ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 font-medium ${
                    location.pathname === `/player/${playerUsername}` ? "glow-primary" : "hover:bg-secondary"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={isActive("/admin") ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 font-medium ${
                    isActive("/admin") ? "glow-accent bg-accent text-accent-foreground" : "hover:bg-secondary text-accent"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2 border-primary/50 hover:border-primary hover:bg-primary/10">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}