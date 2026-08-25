import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface JamStarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: number;
}

/** Interactive 1–5 star input. Read-only when onChange is omitted. */
export function JamStarRating({ value, onChange, disabled, size = 20 }: JamStarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled || !onChange}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          className={cn(
            "transition-transform",
            onChange && !disabled ? "cursor-pointer hover:scale-110" : "cursor-default"
          )}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={cn(
              "transition-colors",
              star <= shown
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}
