import { cn } from "@/lib/utils";
import { useNow } from "@/hooks/useNow";

interface CountdownPart {
  value: number;
  label: string;
}

export function JamCountdown({ target, className }: { target: number; className?: string }) {
  const now = useNow();
  const diff = Math.max(0, target - now);

  const parts: CountdownPart[] = [
    { value: Math.floor(diff / 86_400_000), label: "days" },
    { value: Math.floor((diff % 86_400_000) / 3_600_000), label: "hours" },
    { value: Math.floor((diff % 3_600_000) / 60_000), label: "minutes" },
    { value: Math.floor((diff % 60_000) / 1_000), label: "seconds" },
  ];

  return (
    <div className={cn("flex items-start gap-2 sm:gap-3", className)}>
      {parts.map((part) => (
        <div key={part.label} className="flex flex-col items-center gap-1">
          <div className="min-w-[3.2rem] sm:min-w-[4rem] rounded-lg border border-primary/25 bg-card/80 px-2 py-2 text-center shadow-inner">
            <span className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
              {String(part.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
            {part.label}
          </span>
        </div>
      ))}
    </div>
  );
}
