import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LevelCard } from "@/components/LevelCard";
import { History, X, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistoricalLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  points: number;
  thumbnail_url: string | null;
}

interface HistoricalListViewerProps {
  onHistoricalData: (levels: HistoricalLevel[] | null, date: string | null) => void;
}

// Helper to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function HistoricalListViewer({ onHistoricalData }: HistoricalListViewerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    const { data } = await supabase
      .from("level_rank_history")
      .select("recorded_at")
      .order("recorded_at", { ascending: false });
    
    if (data) {
      const uniqueDates = [...new Set(data.map(d => 
        new Date(d.recorded_at).toISOString().split('T')[0]
      ))];
      setAvailableDates(uniqueDates);
    }
  };

  // Build period options: daily for last 14 days, weekly for older
  const periodOptions = useMemo(() => {
    if (availableDates.length === 0) return [];
    
    const options: { value: string; label: string; date: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const processedWeeks = new Set<string>();
    
    for (const dateStr of availableDates) {
      const date = new Date(dateStr);
      
      if (date >= fourteenDaysAgo) {
        // Daily for recent dates
        options.push({
          value: dateStr,
          label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          date: dateStr,
        });
      } else {
        // Weekly for older dates
        const year = date.getFullYear();
        const week = getWeekNumber(date);
        const weekKey = `${year}-W${week}`;
        
        if (!processedWeeks.has(weekKey)) {
          processedWeeks.add(weekKey);
          // Use the latest date in that week
          options.push({
            value: weekKey,
            label: `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            date: dateStr,
          });
        }
      }
    }
    
    return options;
  }, [availableDates]);

  const fetchHistoricalList = async () => {
    if (!selectedPeriod) return;
    
    setLoading(true);
    
    try {
      // Find the actual date to query
      const selectedOption = periodOptions.find(p => p.value === selectedPeriod);
      if (!selectedOption) return;
      
      const endOfDay = new Date(selectedOption.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data: historyData, error } = await supabase
        .from("level_rank_history")
        .select("level_id, rank_position, points, recorded_at")
        .lte("recorded_at", endOfDay.toISOString())
        .order("recorded_at", { ascending: false });
      
      if (error) throw error;
      
      const { data: levelsData } = await supabase
        .from("levels")
        .select("id, level_id, name, author, thumbnail_url");
      
      const levelDetailsMap = new Map(levelsData?.map(l => [l.id, l]) || []);
      
      const levelRanks = new Map<string, { rank_position: number; points: number }>();
      historyData?.forEach(h => {
        if (!levelRanks.has(h.level_id)) {
          levelRanks.set(h.level_id, {
            rank_position: h.rank_position,
            points: h.points,
          });
        }
      });
      
      const historicalLevels: HistoricalLevel[] = [];
      levelRanks.forEach((rankInfo, levelId) => {
        const details = levelDetailsMap.get(levelId);
        if (details) {
          historicalLevels.push({
            id: details.id,
            level_id: details.level_id,
            name: details.name,
            author: details.author,
            rank_position: rankInfo.rank_position,
            points: rankInfo.points,
            thumbnail_url: details.thumbnail_url,
          });
        }
      });
      
      historicalLevels.sort((a, b) => a.rank_position - b.rank_position);
      
      onHistoricalData(historicalLevels, selectedOption.label);
      setIsActive(true);
      setOpen(false);
    } catch (error) {
      console.error("Error fetching historical list:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistorical = () => {
    onHistoricalData(null, null);
    setIsActive(false);
    setSelectedPeriod("");
  };

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearHistorical}
          className="gap-2 text-yellow-500 border-yellow-500/50"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Historical</span>
        </Button>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={isActive ? "secondary" : "outline"}
            size="sm"
            className="gap-2"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">{isActive ? "Viewing History" : "View History"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">View List at Date</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Daily snapshots for the last 2 weeks, weekly for older dates.
              </p>
            </div>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select a date..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={fetchHistoricalList}
              disabled={!selectedPeriod || loading}
              className="w-full"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "View Historical List"
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
