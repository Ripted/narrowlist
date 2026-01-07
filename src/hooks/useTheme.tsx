import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = 
  | "arrow" | "midnight" | "sunset" | "emerald" | "crimson"
  | "ocean" | "lavender" | "forest" | "amber" | "rose"
  | "slate" | "indigo" | "teal" | "coral" | "violet"
  | "mint" | "peach" | "sky" | "berry" | "gold"
  | "copper" | "sage" | "plum" | "arctic" | "flame"
  | "marine" | "lilac" | "moss" | "rust" | "ice"
  | "spotify" | "discord" | "youtube" | "twitch" | "github"
  | "netflix" | "instagram" | "linkedin" | "slack" | "notion"
  | "figma" | "vercel" | "stripe" | "tailwind" | "react"
  | "vscode" | "atom" | "dracula" | "nord" | "monokai"
  | "solarized" | "gruvbox" | "catppuccin" | "onedark" | "tokyo"
  | "synthwave" | "cyberpunk" | "retrowave" | "vaporwave" | "neon"
  | "matrix" | "hacker" | "terminal" | "coffee" | "candy";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  logoHueRotate: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: ThemeColors;
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
  netflix: {
    name: "Netflix",
    colors: {
      primary: "0 100% 45%",
      secondary: "0 85% 35%",
      accent: "0 90% 55%",
      background: "0 0% 5%",
      logoHueRotate: "125deg",
    },
  },
  instagram: {
    name: "Instagram",
    colors: {
      primary: "330 80% 55%",
      secondary: "35 90% 55%",
      accent: "280 70% 50%",
      background: "0 0% 6%",
      logoHueRotate: "95deg",
    },
  },
  linkedin: {
    name: "LinkedIn",
    colors: {
      primary: "201 100% 35%",
      secondary: "201 80% 45%",
      accent: "201 100% 50%",
      background: "201 25% 6%",
      logoHueRotate: "-35deg",
    },
  },
  slack: {
    name: "Slack",
    colors: {
      primary: "170 60% 45%",
      secondary: "340 70% 50%",
      accent: "45 90% 50%",
      background: "280 20% 8%",
      logoHueRotate: "-65deg",
    },
  },
  notion: {
    name: "Notion",
    colors: {
      primary: "0 0% 40%",
      secondary: "0 0% 50%",
      accent: "0 0% 60%",
      background: "0 0% 6%",
      logoHueRotate: "-235deg",
    },
  },
  figma: {
    name: "Figma",
    colors: {
      primary: "340 80% 55%",
      secondary: "200 90% 50%",
      accent: "155 70% 45%",
      background: "230 15% 8%",
      logoHueRotate: "105deg",
    },
  },
  vercel: {
    name: "Vercel",
    colors: {
      primary: "0 0% 100%",
      secondary: "0 0% 70%",
      accent: "0 0% 85%",
      background: "0 0% 4%",
      logoHueRotate: "0deg",
    },
  },
  stripe: {
    name: "Stripe",
    colors: {
      primary: "250 80% 60%",
      secondary: "190 80% 55%",
      accent: "250 90% 70%",
      background: "230 25% 6%",
      logoHueRotate: "15deg",
    },
  },
  tailwind: {
    name: "Tailwind",
    colors: {
      primary: "199 89% 48%",
      secondary: "190 80% 45%",
      accent: "200 95% 55%",
      background: "210 25% 6%",
      logoHueRotate: "-35deg",
    },
  },
  react: {
    name: "React",
    colors: {
      primary: "193 95% 55%",
      secondary: "193 75% 45%",
      accent: "193 100% 65%",
      background: "220 20% 8%",
      logoHueRotate: "-45deg",
    },
  },
  vscode: {
    name: "VS Code",
    colors: {
      primary: "210 80% 55%",
      secondary: "200 70% 45%",
      accent: "215 85% 60%",
      background: "220 15% 10%",
      logoHueRotate: "-25deg",
    },
  },
  atom: {
    name: "Atom",
    colors: {
      primary: "150 60% 50%",
      secondary: "180 50% 45%",
      accent: "120 55% 55%",
      background: "200 20% 10%",
      logoHueRotate: "-85deg",
    },
  },
  dracula: {
    name: "Dracula",
    colors: {
      primary: "326 100% 74%",
      secondary: "191 97% 77%",
      accent: "265 89% 78%",
      background: "231 15% 18%",
      logoHueRotate: "90deg",
    },
  },
  nord: {
    name: "Nord",
    colors: {
      primary: "193 43% 67%",
      secondary: "179 25% 65%",
      accent: "210 34% 63%",
      background: "220 16% 22%",
      logoHueRotate: "-45deg",
    },
  },
  monokai: {
    name: "Monokai",
    colors: {
      primary: "80 76% 53%",
      secondary: "338 95% 56%",
      accent: "52 100% 50%",
      background: "70 8% 15%",
      logoHueRotate: "-155deg",
    },
  },
  solarized: {
    name: "Solarized",
    colors: {
      primary: "68 100% 30%",
      secondary: "175 59% 40%",
      accent: "45 100% 35%",
      background: "192 100% 11%",
      logoHueRotate: "-165deg",
    },
  },
  gruvbox: {
    name: "Gruvbox",
    colors: {
      primary: "27 94% 54%",
      secondary: "104 35% 62%",
      accent: "60 71% 73%",
      background: "0 0% 16%",
      logoHueRotate: "150deg",
    },
  },
  catppuccin: {
    name: "Catppuccin",
    colors: {
      primary: "316 72% 86%",
      secondary: "189 71% 73%",
      accent: "267 84% 81%",
      background: "240 21% 15%",
      logoHueRotate: "80deg",
    },
  },
  onedark: {
    name: "One Dark",
    colors: {
      primary: "29 54% 61%",
      secondary: "187 47% 55%",
      accent: "286 60% 67%",
      background: "220 13% 18%",
      logoHueRotate: "155deg",
    },
  },
  tokyo: {
    name: "Tokyo Night",
    colors: {
      primary: "230 75% 75%",
      secondary: "195 85% 70%",
      accent: "340 70% 75%",
      background: "235 20% 12%",
      logoHueRotate: "-5deg",
    },
  },
  synthwave: {
    name: "Synthwave",
    colors: {
      primary: "320 100% 60%",
      secondary: "195 100% 50%",
      accent: "280 100% 65%",
      background: "260 20% 10%",
      logoHueRotate: "85deg",
    },
  },
  cyberpunk: {
    name: "Cyberpunk",
    colors: {
      primary: "60 100% 50%",
      secondary: "180 100% 50%",
      accent: "320 100% 55%",
      background: "240 20% 8%",
      logoHueRotate: "175deg",
    },
  },
  retrowave: {
    name: "Retrowave",
    colors: {
      primary: "300 100% 65%",
      secondary: "180 100% 60%",
      accent: "330 100% 60%",
      background: "270 30% 8%",
      logoHueRotate: "65deg",
    },
  },
  vaporwave: {
    name: "Vaporwave",
    colors: {
      primary: "330 80% 70%",
      secondary: "180 80% 70%",
      accent: "300 70% 65%",
      background: "250 25% 12%",
      logoHueRotate: "95deg",
    },
  },
  neon: {
    name: "Neon",
    colors: {
      primary: "145 100% 50%",
      secondary: "280 100% 60%",
      accent: "55 100% 50%",
      background: "0 0% 5%",
      logoHueRotate: "-90deg",
    },
  },
  matrix: {
    name: "Matrix",
    colors: {
      primary: "120 100% 40%",
      secondary: "120 80% 30%",
      accent: "120 100% 50%",
      background: "120 20% 3%",
      logoHueRotate: "-115deg",
    },
  },
  hacker: {
    name: "Hacker",
    colors: {
      primary: "120 100% 45%",
      secondary: "180 100% 40%",
      accent: "60 100% 50%",
      background: "0 0% 4%",
      logoHueRotate: "-115deg",
    },
  },
  terminal: {
    name: "Terminal",
    colors: {
      primary: "145 80% 45%",
      secondary: "160 70% 40%",
      accent: "130 75% 50%",
      background: "150 10% 5%",
      logoHueRotate: "-90deg",
    },
  },
  coffee: {
    name: "Coffee",
    colors: {
      primary: "30 60% 45%",
      secondary: "20 50% 35%",
      accent: "35 70% 55%",
      background: "25 25% 6%",
      logoHueRotate: "155deg",
    },
  },
  candy: {
    name: "Candy",
    colors: {
      primary: "340 85% 65%",
      secondary: "200 85% 60%",
      accent: "45 90% 60%",
      background: "300 15% 8%",
      logoHueRotate: "105deg",
    },
  },
};

interface ThemeContextType {
  theme: ThemeName | string;
  setTheme: (theme: ThemeName | string) => void;
  favorites: string[];
  toggleFavorite: (themeName: string) => void;
  customThemes: CustomTheme[];
  addCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (id: string) => void;
  updateCustomTheme: (id: string, theme: Partial<CustomTheme>) => void;
  getThemeColors: (themeName: string) => ThemeColors | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName | string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("narrowlist-theme");
      if (saved && (themes[saved as ThemeName] || saved.startsWith("custom-"))) {
        return saved;
      }
      return "arrow";
    }
    return "arrow";
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("narrowlist-theme-favorites");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("narrowlist-custom-themes");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const getThemeColors = (themeName: string): ThemeColors | undefined => {
    if (themes[themeName as ThemeName]) {
      return themes[themeName as ThemeName].colors;
    }
    const custom = customThemes.find(t => t.id === themeName);
    return custom?.colors;
  };

  useEffect(() => {
    const root = document.documentElement;
    const colors = getThemeColors(theme);
    
    if (!colors) return;
    
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
  }, [theme, customThemes]);

  useEffect(() => {
    localStorage.setItem("narrowlist-theme-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("narrowlist-custom-themes", JSON.stringify(customThemes));
  }, [customThemes]);

  const setTheme = (newTheme: ThemeName | string) => {
    setThemeState(newTheme);
  };

  const toggleFavorite = (themeName: string) => {
    setFavorites(prev => 
      prev.includes(themeName) 
        ? prev.filter(t => t !== themeName)
        : [...prev, themeName]
    );
  };

  const addCustomTheme = (theme: CustomTheme) => {
    setCustomThemes(prev => [...prev, theme]);
  };

  const deleteCustomTheme = (id: string) => {
    setCustomThemes(prev => prev.filter(t => t.id !== id));
    // If the deleted theme was active, switch to default
    if (theme === id) {
      setTheme("arrow");
    }
  };

  const updateCustomTheme = (id: string, updates: Partial<CustomTheme>) => {
    setCustomThemes(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      favorites, 
      toggleFavorite, 
      customThemes, 
      addCustomTheme, 
      deleteCustomTheme, 
      updateCustomTheme,
      getThemeColors
    }}>
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
