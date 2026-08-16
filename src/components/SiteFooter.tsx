import { Link } from "react-router-dom";

const DISCORD_LINK = "https://discord.gg/53p8cZ3SS6";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-4 text-xs text-muted-foreground">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold text-foreground tracking-wide">NARROWLIST</p>
            <p className="max-w-sm">The community ranking for the hardest Narrow Arrow levels.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-2">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/70 font-semibold">Lists</span>
              <Link to="/main" className="hover:text-foreground transition-colors">Main List</Link>
              <Link to="/extra-list" className="hover:text-foreground transition-colors">Extra List</Link>
              <Link to="/future-list" className="hover:text-foreground transition-colors">Future List</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/70 font-semibold">Resources</span>
              <Link to="/guide" className="hover:text-foreground transition-colors">Guide</Link>
              <Link to="/guide#api" className="hover:text-foreground transition-colors">Public API</Link>
              <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/70 font-semibold">Legal</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 pt-4">
          © {new Date().getFullYear()} Narrowlist. Not affiliated with the Narrow Arrow developers.
        </div>
      </div>
    </footer>
  );
}
