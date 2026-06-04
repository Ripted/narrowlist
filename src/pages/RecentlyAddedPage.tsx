import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock } from "lucide-react";

type ListType = "all" | "main" | "extra" | "future";

interface AddedLevel {
  id: string;
  level_id: string;
  name: string | null;
  author: string | null;
  rank_position: number;
  thumbnail_url: string | null;
  added_at: string;
  list: "main" | "extra" | "future";
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function RecentlyAddedPage() {
  const [levels, setLevels] = useState<AddedLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ListType>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [main, extra, future] = await Promise.all([
        supabase.from("levels").select("id, level_id, name, author, rank_position, thumbnail_url, added_at").order("added_at", { ascending: false }).limit(100),
        supabase.from("extended_levels").select("id, level_id, name, author, rank_position, thumbnail_url, added_at").order("added_at", { ascending: false }).limit(100),
        supabase.from("future_levels").select("id, level_id, name, author, rank_position, thumbnail_url, added_at").order("added_at", { ascending: false }).limit(100),
      ]);

      const combined: AddedLevel[] = [
        ...(main.data || []).map((l: any) => ({ ...l, list: "main" as const })),
        ...(extra.data || []).map((l: any) => ({ ...l, list: "extra" as const })),
        ...(future.data || []).map((l: any) => ({ ...l, list: "future" as const })),
      ].sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());

      setLevels(combined);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return levels;
    return levels.filter((l) => l.list === tab);
  }, [levels, tab]);

  const listBadgeColor = (l: AddedLevel["list"]) => {
    switch (l) {
      case "main": return "bg-primary/20 text-primary border-primary/30";
      case "extra": return "bg-accent/20 text-accent border-accent/30";
      case "future": return "bg-muted text-muted-foreground border-border";
    }
  };

  const linkFor = (l: AddedLevel) => {
    if (l.list === "future") return `/future-list`;
    return `/level/${l.level_id}${l.list === "extra" ? "?extended=true" : ""}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-6 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wider">Recently Added</h1>
            <p className="text-muted-foreground text-sm">Newest levels added to the lists</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as ListType)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
            <TabsTrigger value="future">Future</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No levels found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((l) => (
              <Link
                key={`${l.list}-${l.id}`}
                to={linkFor(l)}
                className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
              >
                {l.thumbnail_url ? (
                  <img src={l.thumbnail_url} alt={l.name || l.level_id} className="w-20 h-12 object-cover rounded" loading="lazy" />
                ) : (
                  <div className="w-20 h-12 rounded bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{l.name || `Level ${l.level_id}`}</span>
                    <Badge variant="outline" className={listBadgeColor(l.list)}>
                      {l.list === "main" ? `#${l.rank_position}` : l.list === "extra" ? `Extra #${l.rank_position}` : "Future"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    by {l.author || "Unknown"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {timeAgo(l.added_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
