import { LevelTag } from "@/hooks/useLevelTags";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LevelTagBadgeProps {
  tag: LevelTag;
  variant?: "card" | "page";
  emojiOnly?: boolean;
}

export function LevelTagBadge({ tag, variant = "card", emojiOnly = false }: LevelTagBadgeProps) {
  if (variant === "card" && !tag.show_on_card) return null;
  if (variant === "page" && !tag.show_on_page) return null;

  if (emojiOnly) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center rounded-full bg-primary/20 w-6 h-6 text-sm cursor-default hover:bg-primary/30 transition-colors">
            {tag.emoji}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <span>{tag.emoji} {tag.text}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary px-2 py-0.5 text-xs font-medium">
      <span>{tag.emoji}</span>
      <span>{tag.text}</span>
    </span>
  );
}

interface LevelTagsListProps {
  tags: LevelTag[];
  variant?: "card" | "page";
  className?: string;
  emojiOnly?: boolean;
}

export function LevelTagsList({ tags, variant = "card", className = "", emojiOnly = false }: LevelTagsListProps) {
  const filteredTags = tags.filter(tag => 
    variant === "card" ? tag.show_on_card : tag.show_on_page
  );

  if (filteredTags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {filteredTags.map(tag => (
        <LevelTagBadge key={tag.id} tag={tag} variant={variant} emojiOnly={emojiOnly} />
      ))}
    </div>
  );
}
