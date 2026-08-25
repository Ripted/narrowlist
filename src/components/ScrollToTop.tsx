import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Remembered scroll offsets per history entry so back/forward returns where
// the user left off instead of resetting to the top.
const positions = new Map<string, number>();

if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

/** Scrolls to top on new navigation, restores the saved offset on back/forward. */
export function ScrollToTop() {
  const location = useLocation();
  const navType = useNavigationType();

  // Continuously record the scroll offset against the current history key.
  // Only scroll events count — recording at cleanup time would capture the
  // next page's clamped offset instead of where the user actually left off.
  useEffect(() => {
    const key = location.key;
    const onScroll = () => positions.set(key, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.key]);

  useEffect(() => {
    if (navType !== "POP") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    const y = positions.get(location.key) ?? 0;
    // Content may load asynchronously, so retry while the page grows.
    let attempts = 0;
    let timer = 0;
    const restore = () => {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      if (++attempts < 8 && window.scrollY < y) {
        timer = window.setTimeout(restore, 100);
      }
    };
    timer = window.setTimeout(restore, 0);
    return () => window.clearTimeout(timer);
  }, [location.key, navType]);

  return null;
}
