import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Trophy, List, Shield, LogOut, LogIn, User, Menu, Clock } from "lucide-react";
import logoImg from "@/assets/logo.png";

export function Navbar() {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [playerUsername, setPlayerUsername] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) {
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
    { path: "/", label: "Main List", icon: List },
    { path: "/future-list", label: "Future List", icon: Clock },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map(({ path, label, icon: Icon }) => (
        <Link key={path} to={path} onClick={() => mobile && setMobileOpen(false)}>
          <Button
            variant={isActive(path) ? "default" : "ghost"}
            size="sm"
            className={`gap-2 font-medium w-full justify-start ${mobile ? "" : ""} ${
              isActive(path) ? "glow-primary" : "hover:bg-secondary"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        </Link>
      ))}
      {playerUsername && (
        <Link to={`/player/${playerUsername}`} onClick={() => mobile && setMobileOpen(false)}>
          <Button
            variant={location.pathname === `/player/${playerUsername}` ? "default" : "ghost"}
            size="sm"
            className={`gap-2 font-medium w-full justify-start ${
              location.pathname === `/player/${playerUsername}` ? "glow-primary" : "hover:bg-secondary"
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </Button>
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin" onClick={() => mobile && setMobileOpen(false)}>
          <Button
            variant={isActive("/admin") ? "default" : "ghost"}
            size="sm"
            className={`gap-2 font-medium w-full justify-start ${
              isActive("/admin") ? "glow-accent bg-accent text-accent-foreground" : "hover:bg-secondary text-accent"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
              <img src={logoImg} alt="Narrowlist Logo" className="relative w-10 h-10 object-contain" />
            </div>
            <span className="font-display text-xl font-bold tracking-wider gradient-text">
              NARROWLIST
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLinks />
          </div>

          {/* Auth & Mobile */}
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

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-background border-border">
                <div className="flex flex-col gap-2 pt-8">
                  <NavLinks mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
