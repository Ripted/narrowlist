import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = 
  | "arrow" | "midnight" | "sunset" | "emerald" | "crimson"
  | "ocean" | "lavender" | "forest" | "amber" | "rose"
  | "slate" | "indigo" | "teal" | "coral" | "violet"
  | "mint" | "peach" | "sky" | "berry" | "gold"
  | "copper" | "sage" | "plum" | "arctic" | "flame"
  | "marine" | "lilac" | "moss" | "rust" | "ice"
  | "spotify" | "discord" | "youtube" | "twitch" | "github";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  logoHueRotate: string;
}

export const themes: Record<ThemeName, { name: string; colors: ThemeColors }> = {
  // Original themes
  arrow: {
    name: "Default",
    colors: {
      primary: "235 80% 65%",
      secondary: "255 75% 60%",
      accent: "220 70% 55%",
      background: "220 25% 6%",
      logoHueRotate: "0deg",
    },
  },
  midnight: {
    name: "Midnight",
    colors: {
      primary: "260 70% 60%",
      secondary: "330 80% 55%",
      accent: "280 65% 50%",
      background: "260 30% 6%",
      logoHueRotate: "25deg",
    },
  },
  sunset: {
    name: "Sunset",
    colors: {
      primary: "25 90% 55%",
      secondary: "350 80% 55%",
      accent: "15 85% 50%",
      background: "15 25% 6%",
      logoHueRotate: "150deg",
    },
  },
  emerald: {
    name: "Emerald",
    colors: {
      primary: "160 70% 45%",
      secondary: "190 80% 50%",
      accent: "140 60% 40%",
      background: "160 25% 6%",
      logoHueRotate: "-75deg",
    },
  },
  crimson: {
    name: "Crimson",
    colors: {
      primary: "350 80% 55%",
      secondary: "25 90% 55%",
      accent: "0 70% 50%",
      background: "350 25% 6%",
      logoHueRotate: "115deg",
    },
  },
  ocean: {
    name: "Ocean",
    colors: {
      primary: "200 80% 50%",
      secondary: "180 70% 45%",
      accent: "210 75% 55%",
      background: "200 30% 6%",
      logoHueRotate: "-35deg",
    },
  },
  lavender: {
    name: "Lavender",
    colors: {
      primary: "270 60% 65%",
      secondary: "300 50% 60%",
      accent: "280 55% 55%",
      background: "270 25% 6%",
      logoHueRotate: "35deg",
    },
  },
  forest: {
    name: "Forest",
    colors: {
      primary: "140 50% 40%",
      secondary: "100 60% 45%",
      accent: "120 45% 35%",
      background: "140 30% 5%",
      logoHueRotate: "-95deg",
    },
  },
  amber: {
    name: "Amber",
    colors: {
      primary: "40 90% 50%",
      secondary: "30 85% 55%",
      accent: "45 80% 45%",
      background: "35 25% 6%",
      logoHueRotate: "165deg",
    },
  },
  rose: {
    name: "Rose",
    colors: {
      primary: "340 75% 60%",
      secondary: "320 70% 55%",
      accent: "350 65% 50%",
      background: "340 25% 6%",
      logoHueRotate: "105deg",
    },
  },
  slate: {
    name: "Slate",
    colors: {
      primary: "215 25% 55%",
      secondary: "220 30% 60%",
      accent: "210 20% 50%",
      background: "215 20% 6%",
      logoHueRotate: "-20deg",
    },
  },
  indigo: {
    name: "Indigo",
    colors: {
      primary: "240 70% 60%",
      secondary: "260 65% 55%",
      accent: "230 60% 50%",
      background: "240 30% 6%",
      logoHueRotate: "5deg",
    },
  },
  teal: {
    name: "Teal",
    colors: {
      primary: "175 70% 45%",
      secondary: "165 65% 50%",
      accent: "180 60% 40%",
      background: "175 30% 5%",
      logoHueRotate: "-60deg",
    },
  },
  coral: {
    name: "Coral",
    colors: {
      primary: "15 85% 60%",
      secondary: "5 80% 55%",
      accent: "20 75% 50%",
      background: "15 25% 6%",
      logoHueRotate: "140deg",
    },
  },
  violet: {
    name: "Violet",
    colors: {
      primary: "280 70% 60%",
      secondary: "290 65% 55%",
      accent: "270 60% 50%",
      background: "280 30% 6%",
      logoHueRotate: "45deg",
    },
  },
  mint: {
    name: "Mint",
    colors: {
      primary: "155 60% 50%",
      secondary: "145 55% 55%",
      accent: "160 50% 45%",
      background: "155 25% 5%",
      logoHueRotate: "-80deg",
    },
  },
  peach: {
    name: "Peach",
    colors: {
      primary: "20 80% 65%",
      secondary: "10 75% 60%",
      accent: "25 70% 55%",
      background: "20 25% 6%",
      logoHueRotate: "145deg",
    },
  },
  sky: {
    name: "Sky",
    colors: {
      primary: "195 85% 55%",
      secondary: "205 80% 50%",
      accent: "190 75% 45%",
      background: "200 30% 6%",
      logoHueRotate: "-40deg",
    },
  },
  berry: {
    name: "Berry",
    colors: {
      primary: "330 70% 55%",
      secondary: "350 65% 50%",
      accent: "320 60% 45%",
      background: "330 30% 6%",
      logoHueRotate: "95deg",
    },
  },
  gold: {
    name: "Gold",
    colors: {
      primary: "45 85% 50%",
      secondary: "35 80% 45%",
      accent: "50 75% 40%",
      background: "40 25% 5%",
      logoHueRotate: "170deg",
    },
  },
  copper: {
    name: "Copper",
    colors: {
      primary: "25 70% 50%",
      secondary: "15 65% 45%",
      accent: "30 60% 40%",
      background: "25 25% 5%",
      logoHueRotate: "150deg",
    },
  },
  sage: {
    name: "Sage",
    colors: {
      primary: "130 35% 50%",
      secondary: "120 30% 45%",
      accent: "140 25% 40%",
      background: "130 20% 5%",
      logoHueRotate: "-105deg",
    },
  },
  plum: {
    name: "Plum",
    colors: {
      primary: "300 50% 50%",
      secondary: "310 45% 45%",
      accent: "290 40% 40%",
      background: "300 30% 5%",
      logoHueRotate: "65deg",
    },
  },
  arctic: {
    name: "Arctic",
    colors: {
      primary: "210 60% 60%",
      secondary: "220 55% 55%",
      accent: "200 50% 50%",
      background: "210 25% 6%",
      logoHueRotate: "-25deg",
    },
  },
  flame: {
    name: "Flame",
    colors: {
      primary: "10 90% 55%",
      secondary: "25 85% 50%",
      accent: "0 80% 45%",
      background: "10 30% 5%",
      logoHueRotate: "135deg",
    },
  },
  marine: {
    name: "Marine",
    colors: {
      primary: "220 75% 55%",
      secondary: "210 70% 50%",
      accent: "230 65% 45%",
      background: "220 30% 6%",
      logoHueRotate: "-15deg",
    },
  },
  lilac: {
    name: "Lilac",
    colors: {
      primary: "290 55% 65%",
      secondary: "280 50% 60%",
      accent: "300 45% 55%",
      background: "290 25% 6%",
      logoHueRotate: "55deg",
    },
  },
  moss: {
    name: "Moss",
    colors: {
      primary: "110 45% 45%",
      secondary: "120 40% 40%",
      accent: "100 35% 35%",
      background: "110 25% 5%",
      logoHueRotate: "-125deg",
    },
  },
  rust: {
    name: "Rust",
    colors: {
      primary: "15 75% 45%",
      secondary: "5 70% 40%",
      accent: "20 65% 35%",
      background: "15 30% 5%",
      logoHueRotate: "140deg",
    },
  },
  ice: {
    name: "Ice",
    colors: {
      primary: "190 50% 60%",
      secondary: "200 45% 55%",
      accent: "180 40% 50%",
      background: "190 25% 6%",
      logoHueRotate: "-45deg",
    },
  },
  // Popular brand themes
  spotify: {
    name: "Spotify",
    colors: {
      primary: "141 73% 42%",
      secondary: "141 63% 35%",
      accent: "141 80% 50%",
      background: "0 0% 7%",
      logoHueRotate: "-95deg",
    },
  },
  discord: {
    name: "Discord",
    colors: {
      primary: "235 86% 65%",
      secondary: "235 51% 52%",
      accent: "235 100% 70%",
      background: "223 7% 20%",
      logoHueRotate: "0deg",
    },
  },
  youtube: {
    name: "YouTube",
    colors: {
      primary: "0 100% 50%",
      secondary: "0 90% 40%",
      accent: "0 100% 60%",
      background: "0 0% 7%",
      logoHueRotate: "125deg",
    },
  },
  twitch: {
    name: "Twitch",
    colors: {
      primary: "264 100% 64%",
      secondary: "264 80% 50%",
      accent: "264 100% 75%",
      background: "260 20% 8%",
      logoHueRotate: "30deg",
    },
  },
  github: {
    name: "GitHub",
    colors: {
      primary: "215 14% 45%",
      secondary: "215 10% 35%",
      accent: "215 20% 55%",
      background: "215 20% 6%",
      logoHueRotate: "-20deg",
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
    
    // Primary theme colors
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--ring", colors.primary);
    
    // Secondary and accent
    root.style.setProperty("--accent", colors.secondary);
    root.style.setProperty("--theme-tertiary", colors.accent);
    
    // Glow colors
    root.style.setProperty("--glow-primary", colors.primary);
    root.style.setProperty("--glow-accent", colors.secondary);
    
    // Background with theme tint
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--card", colors.background.replace(/(\d+)%\s*\)?\s*$/, (_, l) => `${Math.min(parseInt(l) + 3, 15)}%`));
    
    // Sidebar
    root.style.setProperty("--sidebar-primary", colors.primary);
    root.style.setProperty("--sidebar-ring", colors.primary);
    
    // Logo
    root.style.setProperty("--logo-hue-rotate", colors.logoHueRotate);
    
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
