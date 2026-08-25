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
import { Trophy, List, Shield, LogOut, LogIn, User, Menu, Clock, Activity, GitCompare, MoreHorizontal, ChevronDown, Send, BookOpen, Palette, Bookmark, BarChart3, Package, LayoutGrid, Dice5, CalendarDays } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { DISCORD_LINK, DiscordIcon } from "@/components/DiscordIcon";
import logoImg from "@/assets/logo.png";

export function Navbar() {
  const location = useLocation();
  const { user, isAdmin, isLevelRater, signOut } = useAuth();
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

  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Close the mobile sheet whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);


  type NavItem = { path: string; label: string; icon: typeof List };
  type NavGroup = { key: string; label: string; icon: typeof List; path: string; items: NavItem[] };

  const groups: NavGroup[] = [
    {
      key: "explore",
      label: "Explore",
      icon: LayoutGrid,
      path: "/",
      items: [],
    },
    {
      key: "lists",
      label: "Lists",
      icon: List,
      path: "/main",
      items: [
        { path: "/main", label: "Main List", icon: List },
        { path: "/extended-list", label: "Extended List", icon: List },
        { path: "/future-list", label: "Future List", icon: Clock },
        { path: "/extra-list", label: "Extra List", icon: List },
        { path: "/packs", label: "Level Packs", icon: Package },

      ],
    },
    {
      key: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      path: "/leaderboard",
      items: [],
    },
    {
      key: "activity",
      label: "Activity",
      icon: Activity,
      path: "/recent",
      items: [
        { path: "/events", label: "Events", icon: CalendarDays },
        { path: "/statistics", label: "Statistics", icon: BarChart3 },
        { path: "/recent", label: "Recent Runs", icon: Activity },
        { path: "/recently-added", label: "Recently Added", icon: Clock },
      ],
    },
    {
      key: "tools",
      label: "Tools",
      icon: Package,
      path: "/submit",
      items: [
        { path: "/submit", label: "Submit", icon: Send },
        { path: "/info", label: "Info", icon: BookOpen },
        { path: "/compare", label: "Compare Players", icon: GitCompare },
        { path: "/roulette", label: "Level Roulette", icon: Dice5 },
        ...(user ? [{ path: "/watchlist", label: "Watchlist", icon: Bookmark }] : []),
        { path: "/themes", label: "Themes", icon: Palette },
        ...(playerUsername
          ? [{ path: `/player/${playerUsername}`, label: "My Profile", icon: User }]
          : []),
      ],
    },
  ];

  const adminItem = isAdmin || isLevelRater ? { path: "/admin", label: "Admin", icon: Shield } : null;

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (group: NavGroup) =>
    group.items.length === 0
      ? location.pathname === group.path ||
        location.pathname.startsWith(group.path + "/") ||
        (group.path === "/" && location.pathname === "/hub")
      : group.items.some((i) => isActive(i.path));

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {mobile ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) =>
            group.items.length === 0 ? (
              <Link key={group.key} to={group.path} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={isGroupActive(group) ? "default" : "ghost"}
                  className="gap-3 font-medium w-full justify-start h-11 text-[15px]"
                >
                  <group.icon className="w-5 h-5" />
                  {group.label}
                </Button>
              </Link>
            ) : (
              <div key={group.key} className="flex flex-col gap-1">
                <span className="px-3 pb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                  {group.label}
                </span>
                {group.items.map(({ path, label, icon: Icon }) => (
                  <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                    <Button
                      variant={isActive(path) ? "default" : "ghost"}
                      className={`gap-3 font-medium w-full justify-start h-11 text-[15px] ${
                        isActive(path) ? "glow-primary" : "hover:bg-secondary"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </Button>
                  </Link>
                ))}
              </div>
            ),
          )}
          {adminItem && (
            <Link to={adminItem.path} onClick={() => setMobileOpen(false)}>
              <Button
                variant={isActive(adminItem.path) ? "default" : "ghost"}
                className="gap-3 font-medium w-full justify-start h-11 text-[15px] text-accent"
              >
                <Shield className="w-5 h-5" />
                {adminItem.label}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {groups.map((group) =>
            group.items.length === 0 ? (
              <Link key={group.key} to={group.path}>
                <Button
                  variant={isGroupActive(group) ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 font-medium ${isGroupActive(group) ? "glow-primary" : "hover:bg-secondary"}`}
                >
                  <group.icon className="w-4 h-4" />
                  {group.label}
                </Button>
              </Link>
            ) : (
              <DropdownMenu
                key={group.key}
                open={openGroup === group.key}
                onOpenChange={(o) => setOpenGroup(o ? group.key : null)}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isGroupActive(group) ? "default" : "ghost"}
                    size="sm"
                    className={`gap-2 font-medium transition-all duration-200 ${
                      isGroupActive(group) ? "glow-primary" : "hover:bg-secondary"
                    }`}
                  >
                    <group.icon className="w-4 h-4" />
                    {group.label}
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        openGroup === group.key ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-52 bg-card border-border z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                >
                  {group.items.map(({ path, label, icon: Icon }) => (
                    <DropdownMenuItem key={path} asChild className="transition-colors duration-150">
                      <Link
                        to={path}
                        className={`flex items-center gap-2 cursor-pointer ${isActive(path) ? "text-primary" : ""}`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          )}
          {adminItem && (
            <Link to={adminItem.path}>
              <Button
                variant={isActive(adminItem.path) ? "default" : "ghost"}
                size="sm"
                className={`gap-2 font-medium ${
                  isActive(adminItem.path) ? "glow-accent" : "hover:bg-secondary"
                } text-accent`}
              >
                <Shield className="w-4 h-4" />
                {adminItem.label}
              </Button>
            </Link>
          )}
        </>
      )}
    </>
  );


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 min-w-0 shrink">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
              <img 
                src={logoImg} 
                alt="Narrowlist Logo" 
                className="relative w-9 h-9 sm:w-10 sm:h-10 object-contain transition-all duration-300"
                style={{
                  filter: theme !== 'arrow' ? 'hue-rotate(var(--logo-hue-rotate, 0deg)) saturate(1.2)' : 'none',
                }}
              />
            </div>
            <span className="font-display text-lg sm:text-xl font-bold tracking-wide gradient-text truncate">
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
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10" aria-label="Open menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85vw] max-w-xs bg-background border-border p-0 flex flex-col"
              >
                <div className="flex items-center gap-2 px-4 h-16 border-b border-border/60 shrink-0">
                  <img src={logoImg} alt="" className="w-7 h-7 object-contain" />
                  <span className="font-display text-base font-bold tracking-wider gradient-text">
                    NARROWLIST
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
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
