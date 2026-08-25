import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  ListOrdered,
  BarChart3,
  Wrench,
  CalendarDays,
} from "lucide-react";
import { DISCORD_LINK, DiscordIcon } from "@/components/DiscordIcon";
import logoImg from "@/assets/logo.png";

const features = [
  {
    icon: ListOrdered,
    title: "Ranked lists",
    description: "Main, extended, future, and extra lists in one place.",
  },
  {
    icon: BarChart3,
    title: "Leaderboards and statistics",
    description: "Player rankings, rank history, and completion tracking.",
  },
  {
    icon: Wrench,
    title: "Many tools",
    description: "Watchlist, player comparison, level roulette, and more.",
  },
  {
    icon: CalendarDays,
    title: "Frequent events",
    description: "Regular community events and list jams to take part in.",
  },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Authentication failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: isLogin ? "Welcome back" : "Account created",
          description: isLogin ? "You have been signed in." : "Check your inbox to confirm your email.",
        });
        if (isLogin) {
          navigate("/");
        } else {
          setIsLogin(true);
        }
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand panel */}
      <aside className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-border/60 bg-card/40">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
            <img src={logoImg} alt="Narrowlist" className="relative w-10 h-10 object-contain" />
          </div>
          <span className="font-display text-xl font-bold tracking-wide gradient-text">NARROWLIST</span>
        </Link>

        <div className="max-w-md">
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
            The hardest level ranking list for Narrow Arrow
          </h1>
          <p className="text-muted-foreground mt-3">
            Sign in to rate levels, manage your watchlist, and follow the rankings.
          </p>

          <ul className="mt-10 space-y-5">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <DiscordIcon className="w-4 h-4" />
                Join the Discord
              </Button>
            </a>
            <p className="text-sm text-muted-foreground max-w-52">
              Announcements are posted on our Discord server.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src={logoImg} alt="Narrowlist" className="w-10 h-10 object-contain" />
            <span className="font-display text-xl font-bold tracking-wide gradient-text">NARROWLIST</span>
          </Link>

          <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border p-6 sm:p-8 shadow-2xl">
            {/* Mode switcher */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1 mb-8">
              {(["Sign in", "Create account"] as const).map((label, i) => {
                const active = isLogin === (i === 0);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsLogin(i === 0)}
                    className={`rounded-md py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-background text-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {isLogin
                  ? "Enter your credentials to continue."
                  : "Takes less than a minute."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters.</p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2 font-semibold">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign in" : "Create account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing, you agree to the{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className="lg:hidden">
              <Button variant="outline" size="sm" className="gap-2">
                <DiscordIcon className="w-4 h-4" />
                Join the Discord
              </Button>
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
