import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trophy, List, Shield, LogOut, LogIn, User, Menu, Clock, Activity, GitCompare, MoreHorizontal, ChevronDown, Send, BookOpen, Palette } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import logoImg from "@/assets/logo.png";

const DISCORD_LINK = "https://discord.gg/53p8cZ3SS6";

// Discord SVG icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
  </svg>
);

export function Navbar() {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { theme } = useTheme();
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

  const [moreOpen, setMoreOpen] = useState(false);

  const mainNavItems = [
    { path: "/", label: "Main List", icon: List },
    { path: "/future-list", label: "Future List", icon: Clock },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  // Admin is now a main item (not in more)
  const adminItem = isAdmin ? { path: "/admin", label: "Admin", icon: Shield } : null;

  const getMoreNavItems = () => {
    const items = [
      { path: "/recent", label: "Recent Runs", icon: Activity },
      { path: "/compare", label: "Compare Players", icon: GitCompare },
      { path: "/submit", label: "Submit", icon: Send },
      { path: "/guide", label: "Guide", icon: BookOpen },
      { path: "/themes", label: "Themes", icon: Palette },
    ];
    
    if (playerUsername) {
      items.push({ path: `/player/${playerUsername}`, label: "Profile", icon: User });
    }
    
    return items;
  };

  const moreNavItems = getMoreNavItems();

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreNavItems.some(item => isActive(item.path)) || location.pathname.startsWith('/player/');

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {mainNavItems.map(({ path, label, icon: Icon }) => (
        <Link key={path} to={path} onClick={() => mobile && setMobileOpen(false)}>
          <Button
            variant={isActive(path) ? "default" : "ghost"}
            size="sm"
            className={`gap-2 font-medium w-full justify-start ${
              isActive(path) ? "glow-primary" : "hover:bg-secondary"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        </Link>
      ))}

      {/* Admin button - separate from more menu */}
      {adminItem && (
        <Link to={adminItem.path} onClick={() => mobile && setMobileOpen(false)}>
          <Button
            variant={isActive(adminItem.path) ? "default" : "ghost"}
            size="sm"
            className={`gap-2 font-medium w-full justify-start ${
              isActive(adminItem.path) ? "glow-accent" : "hover:bg-secondary"
            } text-accent`}
          >
            <Shield className="w-4 h-4" />
            {adminItem.label}
          </Button>
        </Link>
      )}

      {/* More dropdown - Desktop only */}
      {!mobile && (
        <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isMoreActive ? "default" : "ghost"}
              size="sm"
              className={`gap-2 font-medium transition-all duration-200 ${isMoreActive ? "glow-primary" : "hover:bg-secondary"}`}
            >
              <MoreHorizontal className={`w-4 h-4 transition-transform duration-200 ${moreOpen ? "rotate-90" : ""}`} />
              More
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-card border-border z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          >
            {moreNavItems.map(({ path, label, icon: Icon }) => (
              <DropdownMenuItem key={path} asChild className="transition-colors duration-150">
                <Link 
                  to={path} 
                  className={`flex items-center gap-2 cursor-pointer ${isActive(path) || location.pathname === path ? "text-primary" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* More items - Mobile (flat list) */}
      {mobile && moreNavItems.map(({ path, label, icon: Icon }) => (
        <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
          <Button
            variant={isActive(path) || location.pathname === path ? "default" : "ghost"}
            size="sm"
            className={`gap-2 font-medium w-full justify-start ${
              isActive(path) || location.pathname === path ? "glow-primary" : "hover:bg-secondary"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        </Link>
      ))}
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
              <img 
                src={logoImg} 
                alt="Narrowlist Logo" 
                className="relative w-10 h-10 object-contain transition-all duration-300"
                style={{
                  filter: theme !== 'arrow' ? 'hue-rotate(var(--logo-hue-rotate, 0deg)) saturate(1.2)' : 'none',
                }}
              />
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
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[#5865F2] hover:bg-[#5865F2]/10"
                title="Join Discord"
              >
                <DiscordIcon className="w-5 h-5" />
              </Button>
            </a>
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
