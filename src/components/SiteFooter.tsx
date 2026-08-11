import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} NarrowList — a community project, not affiliated with Narrow Arrow.</p>
        <nav className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
          <Link to="/guide" className="hover:text-foreground transition-colors">Guide</Link>
        </nav>
      </div>
    </footer>
  );
}
