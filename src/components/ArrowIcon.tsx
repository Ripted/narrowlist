import arrowSpeedy from "@/assets/arrow-speedy.png";
import arrowEnergy from "@/assets/arrow-energy.png";
import arrowNarrow from "@/assets/arrow-narrow.png";

interface ArrowIconProps {
  arrowName: string;
  className?: string;
  showName?: boolean;
}

const arrowMap: Record<string, string> = {
  "speedy": arrowSpeedy,
  "speedy arrow": arrowSpeedy,
  "energy": arrowEnergy,
  "energy arrow": arrowEnergy,
  "narrow arrow": arrowNarrow,
  "narrow": arrowNarrow,
};

export function ArrowIcon({ arrowName, className = "w-5 h-5", showName = false }: ArrowIconProps) {
  const normalizedName = arrowName.toLowerCase().trim();
  const iconSrc = arrowMap[normalizedName];

  if (iconSrc) {
    return (
      <span className="inline-flex items-center gap-1">
        <img src={iconSrc} alt={arrowName} className={className} />
        {showName && <span className="text-xs text-muted-foreground">{arrowName}</span>}
      </span>
    );
  }

  // Fallback for unknown arrows - just show name
  return <span className="text-xs text-muted-foreground">{arrowName}</span>;
}
