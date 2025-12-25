import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = 
  | "arrow" | "midnight" | "sunset" | "emerald" | "crimson"
  | "ocean" | "lavender" | "forest" | "amber" | "rose"
  | "slate" | "indigo" | "teal" | "coral" | "violet"
  | "mint" | "peach" | "sky" | "berry" | "gold"
  | "copper" | "sage" | "plum" | "arctic" | "flame"
  | "marine" | "lilac" | "moss" | "rust" | "ice";

interface ThemeColors {
  primary: string;
  accent: string;
  glowPrimary: string;
  glowAccent: string;
  logoHueRotate: string;
}

export const themes: Record<ThemeName, { name: string; colors: ThemeColors }> = {
  // Original themes
  arrow: {
    name: "Arrow",
    colors: {
      primary: "235 80% 65%",
      accent: "255 75% 60%",
      glowPrimary: "235 80% 65%",
      glowAccent: "255 75% 60%",
      logoHueRotate: "0deg",
    },
  },
  midnight: {
    name: "Midnight",
    colors: {
      primary: "260 70% 60%",
      accent: "330 80% 55%",
      glowPrimary: "260 70% 60%",
      glowAccent: "330 80% 55%",
      logoHueRotate: "25deg",
    },
  },
  sunset: {
    name: "Sunset",
    colors: {
      primary: "25 90% 55%",
      accent: "350 80% 55%",
      glowPrimary: "25 90% 55%",
      glowAccent: "350 80% 55%",
      logoHueRotate: "150deg",
    },
  },
  emerald: {
    name: "Emerald",
    colors: {
      primary: "160 70% 45%",
      accent: "190 80% 50%",
      glowPrimary: "160 70% 45%",
      glowAccent: "190 80% 50%",
      logoHueRotate: "-75deg",
    },
  },
  crimson: {
    name: "Crimson",
    colors: {
      primary: "350 80% 55%",
      accent: "25 90% 55%",
      glowPrimary: "350 80% 55%",
      glowAccent: "25 90% 55%",
      logoHueRotate: "115deg",
    },
  },
  // New themes
  ocean: {
    name: "Ocean",
    colors: {
      primary: "200 80% 50%",
      accent: "180 70% 45%",
      glowPrimary: "200 80% 50%",
      glowAccent: "180 70% 45%",
      logoHueRotate: "-35deg",
    },
  },
  lavender: {
    name: "Lavender",
    colors: {
      primary: "270 60% 65%",
      accent: "300 50% 60%",
      glowPrimary: "270 60% 65%",
      glowAccent: "300 50% 60%",
      logoHueRotate: "35deg",
    },
  },
  forest: {
    name: "Forest",
    colors: {
      primary: "140 50% 40%",
      accent: "100 60% 45%",
      glowPrimary: "140 50% 40%",
      glowAccent: "100 60% 45%",
      logoHueRotate: "-95deg",
    },
  },
  amber: {
    name: "Amber",
    colors: {
      primary: "40 90% 50%",
      accent: "30 85% 55%",
      glowPrimary: "40 90% 50%",
      glowAccent: "30 85% 55%",
      logoHueRotate: "165deg",
    },
  },
  rose: {
    name: "Rose",
    colors: {
      primary: "340 75% 60%",
      accent: "320 70% 55%",
      glowPrimary: "340 75% 60%",
      glowAccent: "320 70% 55%",
      logoHueRotate: "105deg",
    },
  },
  slate: {
    name: "Slate",
    colors: {
      primary: "215 25% 55%",
      accent: "220 30% 60%",
      glowPrimary: "215 25% 55%",
      glowAccent: "220 30% 60%",
      logoHueRotate: "-20deg",
    },
  },
  indigo: {
    name: "Indigo",
    colors: {
      primary: "240 70% 60%",
      accent: "260 65% 55%",
      glowPrimary: "240 70% 60%",
      glowAccent: "260 65% 55%",
      logoHueRotate: "5deg",
    },
  },
  teal: {
    name: "Teal",
    colors: {
      primary: "175 70% 45%",
      accent: "165 65% 50%",
      glowPrimary: "175 70% 45%",
      glowAccent: "165 65% 50%",
      logoHueRotate: "-60deg",
    },
  },
  coral: {
    name: "Coral",
    colors: {
      primary: "15 85% 60%",
      accent: "5 80% 55%",
      glowPrimary: "15 85% 60%",
      glowAccent: "5 80% 55%",
      logoHueRotate: "140deg",
    },
  },
  violet: {
    name: "Violet",
    colors: {
      primary: "280 70% 60%",
      accent: "290 65% 55%",
      glowPrimary: "280 70% 60%",
      glowAccent: "290 65% 55%",
      logoHueRotate: "45deg",
    },
  },
  mint: {
    name: "Mint",
    colors: {
      primary: "155 60% 50%",
      accent: "145 55% 55%",
      glowPrimary: "155 60% 50%",
      glowAccent: "145 55% 55%",
      logoHueRotate: "-80deg",
    },
  },
  peach: {
    name: "Peach",
    colors: {
      primary: "20 80% 65%",
      accent: "10 75% 60%",
      glowPrimary: "20 80% 65%",
      glowAccent: "10 75% 60%",
      logoHueRotate: "145deg",
    },
  },
  sky: {
    name: "Sky",
    colors: {
      primary: "195 85% 55%",
      accent: "205 80% 50%",
      glowPrimary: "195 85% 55%",
      glowAccent: "205 80% 50%",
      logoHueRotate: "-40deg",
    },
  },
  berry: {
    name: "Berry",
    colors: {
      primary: "330 70% 55%",
      accent: "350 65% 50%",
      glowPrimary: "330 70% 55%",
      glowAccent: "350 65% 50%",
      logoHueRotate: "95deg",
    },
  },
  gold: {
    name: "Gold",
    colors: {
      primary: "45 85% 50%",
      accent: "35 80% 45%",
      glowPrimary: "45 85% 50%",
      glowAccent: "35 80% 45%",
      logoHueRotate: "170deg",
    },
  },
  copper: {
    name: "Copper",
    colors: {
      primary: "25 70% 50%",
      accent: "15 65% 45%",
      glowPrimary: "25 70% 50%",
      glowAccent: "15 65% 45%",
      logoHueRotate: "150deg",
    },
  },
  sage: {
    name: "Sage",
    colors: {
      primary: "130 35% 50%",
      accent: "120 30% 45%",
      glowPrimary: "130 35% 50%",
      glowAccent: "120 30% 45%",
      logoHueRotate: "-105deg",
    },
  },
  plum: {
    name: "Plum",
    colors: {
      primary: "300 50% 50%",
      accent: "310 45% 45%",
      glowPrimary: "300 50% 50%",
      glowAccent: "310 45% 45%",
      logoHueRotate: "65deg",
    },
  },
  arctic: {
    name: "Arctic",
    colors: {
      primary: "210 60% 60%",
      accent: "220 55% 55%",
      glowPrimary: "210 60% 60%",
      glowAccent: "220 55% 55%",
      logoHueRotate: "-25deg",
    },
  },
  flame: {
    name: "Flame",
    colors: {
      primary: "10 90% 55%",
      accent: "25 85% 50%",
      glowPrimary: "10 90% 55%",
      glowAccent: "25 85% 50%",
      logoHueRotate: "135deg",
    },
  },
  marine: {
    name: "Marine",
    colors: {
      primary: "220 75% 55%",
      accent: "210 70% 50%",
      glowPrimary: "220 75% 55%",
      glowAccent: "210 70% 50%",
      logoHueRotate: "-15deg",
    },
  },
  lilac: {
    name: "Lilac",
    colors: {
      primary: "290 55% 65%",
      accent: "280 50% 60%",
      glowPrimary: "290 55% 65%",
      glowAccent: "280 50% 60%",
      logoHueRotate: "55deg",
    },
  },
  moss: {
    name: "Moss",
    colors: {
      primary: "110 45% 45%",
      accent: "120 40% 40%",
      glowPrimary: "110 45% 45%",
      glowAccent: "120 40% 40%",
      logoHueRotate: "-125deg",
    },
  },
  rust: {
    name: "Rust",
    colors: {
      primary: "15 75% 45%",
      accent: "5 70% 40%",
      glowPrimary: "15 75% 45%",
      glowAccent: "5 70% 40%",
      logoHueRotate: "140deg",
    },
  },
  ice: {
    name: "Ice",
    colors: {
      primary: "190 50% 60%",
      accent: "200 45% 55%",
      glowPrimary: "190 50% 60%",
      glowAccent: "200 45% 55%",
      logoHueRotate: "-45deg",
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