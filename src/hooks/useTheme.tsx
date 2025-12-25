import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = "arrow" | "midnight" | "sunset" | "emerald" | "crimson";

interface ThemeColors {
  primary: string;
  accent: string;
  glowPrimary: string;
  glowAccent: string;
}

export const themes: Record<ThemeName, { name: string; colors: ThemeColors }> = {
  arrow: {
    name: "Arrow",
    colors: {
      primary: "235 80% 65%",
      accent: "255 75% 60%",
      glowPrimary: "235 80% 65%",
      glowAccent: "255 75% 60%",
    },
  },
  midnight: {
    name: "Midnight",
    colors: {
      primary: "260 70% 60%",
      accent: "330 80% 55%",
      glowPrimary: "260 70% 60%",
      glowAccent: "330 80% 55%",
    },
  },
  sunset: {
    name: "Sunset",
    colors: {
      primary: "25 90% 55%",
      accent: "350 80% 55%",
      glowPrimary: "25 90% 55%",
      glowAccent: "350 80% 55%",
    },
  },
  emerald: {
    name: "Emerald",
    colors: {
      primary: "160 70% 45%",
      accent: "190 80% 50%",
      glowPrimary: "160 70% 45%",
      glowAccent: "190 80% 50%",
    },
  },
  crimson: {
    name: "Crimson",
    colors: {
      primary: "350 80% 55%",
      accent: "25 90% 55%",
      glowPrimary: "350 80% 55%",
      glowAccent: "25 90% 55%",
    },
  },
};

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("narrowlist-theme") as ThemeName;
      return saved && themes[saved] ? saved : "arrow";
    }
    return "arrow";
  });

  useEffect(() => {
    const root = document.documentElement;
    const colors = themes[theme].colors;
    
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--ring", colors.primary);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--glow-primary", colors.glowPrimary);
    root.style.setProperty("--glow-accent", colors.glowAccent);
    root.style.setProperty("--sidebar-primary", colors.primary);
    root.style.setProperty("--sidebar-ring", colors.primary);
    
    localStorage.setItem("narrowlist-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}