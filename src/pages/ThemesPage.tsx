import { Navbar } from "@/components/Navbar";
import { useTheme, themes, ThemeName, ThemeColors, CustomTheme } from "@/hooks/useTheme";
import { Check, Palette, Sparkles, Star, Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ThemesPage() {
  const { 
    theme, 
    setTheme, 
    favorites, 
    toggleFavorite, 
    customThemes, 
    addCustomTheme, 
    deleteCustomTheme,
    getThemeColors
  } = useTheme();
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [newPrimary, setNewPrimary] = useState("235 80% 65%");
  const [newSecondary, setNewSecondary] = useState("255 75% 60%");
  const [newAccent, setNewAccent] = useState("220 70% 55%");
  const [newBackground, setNewBackground] = useState("220 25% 6%");
  
  const themeKeys = Object.keys(themes) as ThemeName[];
  
  const getThemeColor = (themeName: string) => {
    const colors = getThemeColors(themeName);
    return colors ? `hsl(${colors.primary})` : 'hsl(var(--primary))';
  };
  
  const getSecondaryColor = (themeName: string) => {
    const colors = getThemeColors(themeName);
    return colors ? `hsl(${colors.secondary})` : 'hsl(var(--secondary))';
  };
  
  const getTertiaryColor = (themeName: string) => {
    const colors = getThemeColors(themeName);
    return colors ? `hsl(${colors.accent})` : 'hsl(var(--accent))';
  };

  const getThemeName = (themeName: string): string => {
    if (themes[themeName as ThemeName]) {
      return themes[themeName as ThemeName].name;
    }
    const custom = customThemes.find(t => t.id === themeName);
    return custom?.name || themeName;
  };

  const handleCreateTheme = () => {
    if (!newThemeName.trim()) return;
    
    const id = `custom-${Date.now()}`;
    const newTheme: CustomTheme = {
      id,
      name: newThemeName,
      colors: {
        primary: newPrimary,
        secondary: newSecondary,
        accent: newAccent,
        background: newBackground,
        logoHueRotate: "0deg",
      }
    };
    
    addCustomTheme(newTheme);
    setTheme(id);
    setCreateDialogOpen(false);
    setNewThemeName("");
  };

  const ThemeCard = ({ themeName, isCustom = false }: { themeName: string; isCustom?: boolean }) => {
    const isSelected = theme === themeName;
    const isHovered = hoveredTheme === themeName;
    const isFavorite = favorites.includes(themeName);
    
    return (
      <div className="relative group">
        <button
          onClick={() => setTheme(themeName)}
          onMouseEnter={() => setHoveredTheme(themeName)}
          onMouseLeave={() => setHoveredTheme(null)}
          className={`relative w-full rounded-xl p-4 border-2 transition-all duration-200 text-left ${
            isSelected 
              ? 'scale-[1.02] shadow-lg' 
              : 'hover:scale-[1.02] hover:shadow-md'
          }`}
          style={{ 
            borderColor: isSelected || isHovered ? getThemeColor(themeName) : 'hsl(var(--border))',
            backgroundColor: isSelected ? `${getThemeColor(themeName)}15` : 'hsl(var(--card))'
          }}
        >
          {/* Color Preview - 3 colors */}
          <div className="flex gap-1 mb-3">
            <div 
              className="w-6 h-6 rounded-md shadow-sm"
              style={{ backgroundColor: getThemeColor(themeName) }}
            />
            <div 
              className="w-6 h-6 rounded-md shadow-sm"
              style={{ backgroundColor: getSecondaryColor(themeName) }}
            />
            <div 
              className="w-6 h-6 rounded-md shadow-sm"
              style={{ backgroundColor: getTertiaryColor(themeName) }}
            />
          </div>
          
          {/* Theme Name */}
          <div className="font-display font-semibold text-sm text-foreground truncate pr-8">
            {getThemeName(themeName)}
            {isCustom && (
              <span className="ml-1 text-xs text-muted-foreground">(Custom)</span>
            )}
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
        
        {/* Favorite & Delete buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isSelected && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(themeName);
                }}
                className={`p-1 rounded-full transition-colors ${
                  isFavorite 
                    ? 'bg-yellow-500/20 text-yellow-500' 
                    : 'bg-background/80 text-muted-foreground hover:text-yellow-500'
                }`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              {isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomTheme(themeName);
                  }}
                  className="p-1 rounded-full bg-background/80 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete custom theme"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const favoriteThemes = [...themeKeys.filter(t => favorites.includes(t)), ...customThemes.filter(t => favorites.includes(t.id)).map(t => t.id)];

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
            Customize the look and feel of Narrowlist with {themeKeys.length + customThemes.length} unique color themes.
            Your selection is saved automatically.
          </p>
        </div>

        {/* Current Theme Preview */}
        <div className="max-w-2xl mx-auto mb-12">
          <div 
            className="rounded-2xl p-6 md:p-8 border-2 transition-all duration-300"
            style={{ 
              borderColor: getThemeColor(theme),
              background: `linear-gradient(135deg, ${getThemeColor(theme)}15, ${getSecondaryColor(theme)}10, ${getTertiaryColor(theme)}05)`
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${getThemeColor(theme)}, ${getSecondaryColor(theme)}, ${getTertiaryColor(theme)})` }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Current Theme</div>
                <div className="font-display text-2xl font-bold" style={{ color: getThemeColor(theme) }}>
                  {getThemeName(theme)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: getThemeColor(theme) }}
              >
                Primary
              </div>
              <div 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: getSecondaryColor(theme) }}
              >
                Secondary
              </div>
              <div 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: getTertiaryColor(theme) }}
              >
                Accent
              </div>
              <div className="px-4 py-2 rounded-lg text-sm font-medium bg-card border border-border text-foreground">
                Card
              </div>
            </div>
          </div>
        </div>

        {/* Create Custom Theme */}
        <div className="max-w-2xl mx-auto mb-8">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2" variant="outline" size="lg">
                <Plus className="w-5 h-5" />
                Create Custom Theme
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary" />
                  Create Custom Theme
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="themeName">Theme Name</Label>
                  <Input
                    id="themeName"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="My Custom Theme"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary">Primary Color (HSL)</Label>
                    <Input
                      id="primary"
                      value={newPrimary}
                      onChange={(e) => setNewPrimary(e.target.value)}
                      placeholder="235 80% 65%"
                      className="mt-1 font-mono text-sm"
                    />
                    <div 
                      className="w-full h-8 rounded mt-2"
                      style={{ backgroundColor: `hsl(${newPrimary})` }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondary">Secondary Color (HSL)</Label>
                    <Input
                      id="secondary"
                      value={newSecondary}
                      onChange={(e) => setNewSecondary(e.target.value)}
                      placeholder="255 75% 60%"
                      className="mt-1 font-mono text-sm"
                    />
                    <div 
                      className="w-full h-8 rounded mt-2"
                      style={{ backgroundColor: `hsl(${newSecondary})` }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accent">Accent Color (HSL)</Label>
                    <Input
                      id="accent"
                      value={newAccent}
                      onChange={(e) => setNewAccent(e.target.value)}
                      placeholder="220 70% 55%"
                      className="mt-1 font-mono text-sm"
                    />
                    <div 
                      className="w-full h-8 rounded mt-2"
                      style={{ backgroundColor: `hsl(${newAccent})` }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="background">Background Color (HSL)</Label>
                    <Input
                      id="background"
                      value={newBackground}
                      onChange={(e) => setNewBackground(e.target.value)}
                      placeholder="220 25% 6%"
                      className="mt-1 font-mono text-sm"
                    />
                    <div 
                      className="w-full h-8 rounded mt-2 border border-border"
                      style={{ backgroundColor: `hsl(${newBackground})` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Enter colors in HSL format: "hue saturation% lightness%" (e.g., "235 80% 65%")
                </p>
                
                <Button 
                  onClick={handleCreateTheme} 
                  disabled={!newThemeName.trim()}
                  className="w-full"
                >
                  Create Theme
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Favorite Themes */}
        {favoriteThemes.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Favorites
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {favoriteThemes.map((themeName) => (
                <ThemeCard 
                  key={themeName} 
                  themeName={themeName} 
                  isCustom={themeName.startsWith('custom-')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Custom Themes */}
        {customThemes.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Custom Themes
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {customThemes.map((customTheme) => (
                <ThemeCard key={customTheme.id} themeName={customTheme.id} isCustom />
              ))}
            </div>
          </div>
        )}

        {/* All Themes */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            All Themes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {themeKeys.map((themeName) => (
              <ThemeCard key={themeName} themeName={themeName} />
            ))}
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Themes affect the entire website including backgrounds, navigation, buttons, cards, and highlights.
            <br className="hidden sm:block" />
            Your preference is saved locally and will persist across sessions.
          </p>
        </div>
      </main>
    </div>
  );
}
