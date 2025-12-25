import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, themes, ThemeName } from "@/hooks/useTheme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const getThemePreviewColor = (themeName: ThemeName) => {
    const colors = themes[themeName].colors;
    return `hsl(${colors.primary})`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="Change theme"
        >
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(themes) as ThemeName[]).map((themeName) => (
          <DropdownMenuItem
            key={themeName}
            onClick={() => setTheme(themeName)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: getThemePreviewColor(themeName) }}
            />
            <span className="flex-1">{themes[themeName].name}</span>
            {theme === themeName && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}