import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LevelCard } from "@/components/LevelCard";
import { History, X, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

export function HistoricalListViewer({ onHistoricalData }: HistoricalListViewerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    // Get distinct dates from rank history
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

  const fetchHistoricalList = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    
    try {
      // Get the end of the selected date
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get the most recent rank for each level as of the selected date
      const { data: historyData, error } = await supabase
        .from("level_rank_history")
        .select("level_id, rank_position, points, recorded_at")
        .lte("recorded_at", endOfDay.toISOString())
        .order("recorded_at", { ascending: false });
      
      if (error) throw error;
      
      // Get current level details
      const { data: levelsData } = await supabase
        .from("levels")
        .select("id, level_id, name, author, thumbnail_url");
      
      const levelDetailsMap = new Map(levelsData?.map(l => [l.id, l]) || []);
      
      // Get the most recent rank for each level
      const levelRanks = new Map<string, { rank_position: number; points: number }>();
      historyData?.forEach(h => {
        if (!levelRanks.has(h.level_id)) {
          levelRanks.set(h.level_id, {
            rank_position: h.rank_position,
            points: h.points,
          });
        }
      });
      
      // Build historical levels list
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
      
      // Sort by rank
      historicalLevels.sort((a, b) => a.rank_position - b.rank_position);
      
      onHistoricalData(historicalLevels, selectedDate);
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
    setSelectedDate("");
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
                See how the list looked on a specific date. History tracking started today.
              </p>
            </div>
            
            <div className="space-y-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                min={availableDates[availableDates.length - 1] || undefined}
              />
              
              {availableDates.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Data available from: {availableDates[availableDates.length - 1]}
                </p>
              )}
            </div>
            
            <Button 
              onClick={fetchHistoricalList}
              disabled={!selectedDate || loading}
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
