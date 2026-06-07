import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { History, X, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const HISTORY_STORAGE_KEY = "narrowlist-historical-datetime";

/** Returns the persisted historical datetime (ISO) if set, otherwise null. */
export function getPersistedHistoricalDate(): string | null {
  try {
    return localStorage.getItem(HISTORY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Subscribe to changes to the persisted historical datetime. */
export function subscribeHistoricalDate(cb: (v: string | null) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<string | null>).detail);
  window.addEventListener("historical-datetime-change", handler);
  return () => window.removeEventListener("historical-datetime-change", handler);
}

function setPersistedHistoricalDate(iso: string | null) {
  if (iso) localStorage.setItem(HISTORY_STORAGE_KEY, iso);
  else localStorage.removeItem(HISTORY_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("historical-datetime-change", { detail: iso }));
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HistoricalListViewer({ onHistoricalData }: HistoricalListViewerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIso, setActiveIso] = useState<string | null>(getPersistedHistoricalDate());
  const [draft, setDraft] = useState<string>(toLocalInput(getPersistedHistoricalDate()));

  // On mount, if a persisted datetime exists, auto-fetch
  useEffect(() => {
    if (activeIso) {
      fetchHistoricalList(activeIso);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistoricalList = async (iso: string) => {
    setLoading(true);
    try {
      const cutoff = new Date(iso).toISOString();

      const { data: historyData, error } = await supabase
        .from("level_rank_history")
        .select("level_id, rank_position, points, recorded_at")
        .lte("recorded_at", cutoff)
        .order("recorded_at", { ascending: false });

      if (error) throw error;

      const { data: levelsData } = await supabase
        .from("levels")
        .select("id, level_id, name, author, thumbnail_url, added_at, rank_position, points");

      const levelDetailsMap = new Map(levelsData?.map((l) => [l.id, l]) || []);

      const levelRanks = new Map<string, { rank_position: number; points: number }>();
      historyData?.forEach((h) => {
        if (!levelRanks.has(h.level_id)) {
          levelRanks.set(h.level_id, { rank_position: h.rank_position, points: h.points });
        }
      });

      const historicalLevels: HistoricalLevel[] = [];
      levelRanks.forEach((rankInfo, levelId) => {
        const details = levelDetailsMap.get(levelId);
        if (!details) return;
        // Exclude levels added after the cutoff
        const addedIso = (details as any).added_at as string | undefined;
        if (addedIso && new Date(addedIso) > new Date(cutoff)) return;
        historicalLevels.push({
          id: details.id,
          level_id: details.level_id,
          name: details.name,
          author: details.author,
          rank_position: rankInfo.rank_position,
          points: rankInfo.points,
          thumbnail_url: details.thumbnail_url,
        });
      });

      historicalLevels.sort((a, b) => a.rank_position - b.rank_position);

      const label = new Date(iso).toLocaleString();
      onHistoricalData(historicalLevels, label);
    } catch (err) {
      console.error("Error fetching historical list:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!draft) return;
    const iso = new Date(draft).toISOString();
    setActiveIso(iso);
    setPersistedHistoricalDate(iso);
    await fetchHistoricalList(iso);
    setOpen(false);
  };

  const clearHistorical = () => {
    setActiveIso(null);
    setDraft("");
    setPersistedHistoricalDate(null);
    onHistoricalData(null, null);
  };

  const isActive = !!activeIso;

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
          <Button variant={isActive ? "secondary" : "outline"} size="sm" className="gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isActive ? `Viewing: ${new Date(activeIso!).toLocaleDateString()}` : "View History"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">View list at any date & time</h4>
              <p className="text-xs text-muted-foreground">
                Selection persists across pages and refreshes until cleared.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hist-dt">Date & time</Label>
              <Input
                id="hist-dt"
                type="datetime-local"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>

            <Button onClick={handleApply} disabled={!draft || loading} className="w-full" size="sm">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
