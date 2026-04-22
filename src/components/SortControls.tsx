import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LevelSortField,
  SortDirection,
  SORT_FIELD_OPTIONS,
  DEFAULT_SORT_DIRECTION,
} from "@/hooks/useLevelAggregates";

interface SortControlsProps {
  field: LevelSortField;
  direction: SortDirection;
  onChange: (field: LevelSortField, direction: SortDirection) => void;
}

export function SortControls({ field, direction, onChange }: SortControlsProps) {
  const handleFieldChange = (newField: string) => {
    const f = newField as LevelSortField;
    // Apply the field's natural default direction when switching fields
    onChange(f, DEFAULT_SORT_DIRECTION[f]);
  };

  const toggleDirection = () => {
    onChange(field, direction === "asc" ? "desc" : "asc");
  };

  return (
    <div className="flex items-center gap-1">
      <Select value={field} onValueChange={handleFieldChange}>
        <SelectTrigger className="h-9 w-auto min-w-[140px] gap-2 bg-secondary border-border">
          <ArrowUpDown className="w-4 h-4" />
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
          {SORT_FIELD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="h-9 px-2 bg-secondary border-border"
        onClick={toggleDirection}
        title={direction === "asc" ? "Ascending" : "Descending"}
        aria-label={`Toggle sort direction, currently ${direction}`}
      >
        {direction === "asc" ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
