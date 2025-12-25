import { Navbar } from "@/components/Navbar";
import { useTheme, themes, ThemeName } from "@/hooks/useTheme";
import { Check, Palette, Sparkles } from "lucide-react";
import { useState } from "react";

export default function ThemesPage() {
  const { theme, setTheme } = useTheme();
  const [hoveredTheme, setHoveredTheme] = useState<ThemeName | null>(null);
  
  const themeKeys = Object.keys(themes) as ThemeName[];
  
  const getThemeColor = (themeName: ThemeName) => {
    return `hsl(${themes[themeName].colors.primary})`;
  };
  
  const getAccentColor = (themeName: ThemeName) => {
    return `hsl(${themes[themeName].colors.accent})`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Personalize</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
            Choose Your Theme
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Customize the look and feel of Narrowlist with {themeKeys.length} unique color themes.
            Your selection is saved automatically.
          </p>
        </div>

        {/* Current Theme Preview */}
        <div className="max-w-2xl mx-auto mb-12">
          <div 
            className="rounded-2xl p-6 md:p-8 border-2 transition-all duration-300"
            style={{ 
              borderColor: getThemeColor(theme),
              background: `linear-gradient(135deg, ${getThemeColor(theme)}15, ${getAccentColor(theme)}15)`
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${getThemeColor(theme)}, ${getAccentColor(theme)})` }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Current Theme</div>
                <div className="font-display text-2xl font-bold" style={{ color: getThemeColor(theme) }}>
                  {themes[theme].name}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: getThemeColor(theme) }}
              >
                Primary Color
              </div>
              <div 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: getAccentColor(theme) }}
              >
                Accent Color
              </div>
              <div className="px-4 py-2 rounded-lg text-sm font-medium bg-card border border-border text-foreground">
                Card Style
              </div>
            </div>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {themeKeys.map((themeName) => {
            const isSelected = theme === themeName;
            const isHovered = hoveredTheme === themeName;
            
            return (
              <button
                key={themeName}
                onClick={() => setTheme(themeName)}
                onMouseEnter={() => setHoveredTheme(themeName)}
                onMouseLeave={() => setHoveredTheme(null)}
                className={`relative group rounded-xl p-4 border-2 transition-all duration-200 text-left ${
                  isSelected 
                    ? 'scale-[1.02] shadow-lg' 
                    : 'hover:scale-[1.02] hover:shadow-md'
                }`}
                style={{ 
                  borderColor: isSelected || isHovered ? getThemeColor(themeName) : 'hsl(var(--border))',
                  backgroundColor: isSelected ? `${getThemeColor(themeName)}10` : 'hsl(var(--card))'
                }}
              >
                {/* Color Preview */}
                <div className="flex gap-1.5 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: getThemeColor(themeName) }}
                  />
                  <div 
                    className="w-8 h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: getAccentColor(themeName) }}
                  />
                </div>
                
                {/* Theme Name */}
                <div className="font-display font-semibold text-sm text-foreground truncate">
                  {themes[themeName].name}
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div 
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: getThemeColor(themeName) }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Themes affect the entire website including navigation, buttons, cards, and highlights.
            <br className="hidden sm:block" />
            Your preference is saved locally and will persist across sessions.
          </p>
        </div>
      </main>
    </div>
  );
}
