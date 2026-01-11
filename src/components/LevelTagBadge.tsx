import { LevelTag } from "@/hooks/useLevelTags";

interface LevelTagBadgeProps {
  tag: LevelTag;
  variant?: "card" | "page";
}

export function LevelTagBadge({ tag, variant = "card" }: LevelTagBadgeProps) {
  if (variant === "card" && !tag.show_on_card) return null;
  if (variant === "page" && !tag.show_on_page) return null;

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
}

export function LevelTagsList({ tags, variant = "card", className = "" }: LevelTagsListProps) {
  const filteredTags = tags.filter(tag => 
    variant === "card" ? tag.show_on_card : tag.show_on_page
  );

  if (filteredTags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {filteredTags.map(tag => (
        <LevelTagBadge key={tag.id} tag={tag} variant={variant} />
      ))}
    </div>
  );
}
