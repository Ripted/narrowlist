import { useEffect, useMemo } from "react";
import logo from "./assets/logo.png";

const NEW_SITE_URL = "https://narrowlist.net";

// The old site redirects to the new website immediately (meta refresh in
// index.html + the effect below). This page is only a fallback if both fail.
const App = () => {
  useEffect(() => {
    // location.replace so the back button doesn't land on this page again.
    window.location.replace(NEW_SITE_URL);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center space-y-8">
        <img
          src={logo}
          alt="Narrowlist"
          className="glow-primary mx-auto h-16 w-16 rounded-xl object-contain sm:h-20 sm:w-20"
        />

        <p className="font-display text-sm font-semibold tracking-[0.35em] uppercase text-muted-foreground">
          Narrowlist
        </p>

        <h1 className="gradient-text text-4xl sm:text-5xl font-bold">
          We have moved.
        </h1>

        <p className="text-muted-foreground sm:text-lg leading-relaxed">
          Narrowlist is now hosted at its own home on the web. This old website
          is no longer maintained and none of its features work here anymore.
        </p>

        <div className="border-theme-glow rounded-lg bg-theme-gradient p-6 sm:p-8 space-y-4">
          <p className="text-foreground font-medium">
            Visit the new, fully working website:
          </p>
          <a
            href={NEW_SITE_URL}
            className="glow-primary inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Continue to narrowlist.net
            <span aria-hidden="true" className="ml-2">
              &rarr;
            </span>
          </a>
          <p className="text-xs text-muted-foreground">
            You should be redirected automatically — if not, use the button
            above.
          </p>
        </div>

        <p className="text-xs text-muted-foreground/70">
          &copy; {new Date().getFullYear()} Narrowlist. Bookmark{" "}
          <a
            href={NEW_SITE_URL}
            className="underline underline-offset-2 text-muted-foreground hover:text-foreground"
          >
            narrowlist.net
          </a>{" "}
          and save a new link.
        </p>
      </div>
    </main>
  );
};

export default App;