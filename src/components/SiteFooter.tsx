import { Link } from "react-router-dom";

const DISCORD_LINK = "https://discord.gg/53p8cZ3SS6";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between md:items-start">
          <div className="max-w-sm space-y-2">
            <p className="font-display text-lg font-semibold tracking-wide text-foreground">
              NARROWLIST
            </p>
            <p className="text-sm text-muted-foreground">
              Community-maintained rankings for the hardest Narrow Arrow levels.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                Lists
              </span>
              <Link
                to="/main"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Main List
              </Link>
              <Link
                to="/extra-list"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Extra List
              </Link>
              <Link
                to="/future-list"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Future List
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                Resources
              </span>
              <Link
                to="/guide"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Guide
              </Link>
              <a
                href={DISCORD_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Discord
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                Legal
              </span>
              <Link
                to="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
