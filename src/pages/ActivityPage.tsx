import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowDown, ArrowUp, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { formatTime } from "@/lib/api";

type ActivityType = "all" | "runs" | "ranks" | "levels";

interface FeedItem {
  id: string;
  type: "run" | "rank" | "level";
  at: string;
  // run
  username?: string;
  displayName?: string | null;
  levelName?: string | null;
  levelStringId?: string;
  completionTime?: number;
  // rank
  fromRank?: number;
  toRank?: number;
  // level
  list?: "main" | "extra" | "future";
  rankPosition?: number;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
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

const LIST_LABEL: Record<string, string> = { main: "Main", extra: "Extra", future: "Future" };

interface CompletionRow {
  id: string;
  profile_id: string;
  level_id: string;
  completion_time: number | null;
  completed_at: string;
}

interface RankRow {
  level_id: string;
  recorded_at: string;
  rank_position: number;
  previous_rank: number | null;
}

interface LevelRow {
  id: string;
  level_id: string;
  name: string | null;
  rank_position: number;
  added_at: string;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
}


export default function ActivityPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityType>("all");
  const [visible, setVisible] = useState(50);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [runsRes, ranksRes, mainRes, extraRes, futureRes] = await Promise.all([
        supabase
          .from("completions")
          .select("id, profile_id, level_id, completion_time, completed_at")
          .order("completed_at", { ascending: false })
          .limit(100),
        supabase
          .from("level_rank_history")
          .select("level_id, recorded_at, rank_position, previous_rank")
          .order("recorded_at", { ascending: false })
          .limit(100),
        supabase
          .from("levels")
          .select("id, level_id, name, rank_position, added_at")
          .order("added_at", { ascending: false })
          .limit(50),
        supabase
          .from("extended_levels")
          .select("id, level_id, name, rank_position, added_at")
          .order("added_at", { ascending: false })
          .limit(50),
        supabase
          .from("future_levels")
          .select("id, level_id, name, rank_position, added_at")
          .order("added_at", { ascending: false })
          .limit(50),
      ]);

      const completions = (runsRes.data || []) as CompletionRow[];
      const rankRows = (ranksRes.data || []) as RankRow[];

      // Resolve names for runs
      const profileIds = [...new Set(completions.map((c) => c.profile_id))];
      const levelDbIds = [
        ...new Set([
          ...completions.map((c) => c.level_id),
          ...rankRows.map((r) => r.level_id),
        ]),
      ];

      const [profilesRes, levelsRes] = await Promise.all([
        profileIds.length
          ? supabase.from("profiles").select("id, username, display_name").in("id", profileIds)
          : Promise.resolve({ data: [] as ProfileRow[] }),
        levelDbIds.length
          ? supabase.from("levels").select("id, level_id, name").in("id", levelDbIds)
          : Promise.resolve({ data: [] as LevelRow[] }),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));
      const levelMap = new Map((levelsRes.data || []).map((l) => [l.id, l]));

      const feed: FeedItem[] = [];

      for (const c of completions) {
        const profile = profileMap.get(c.profile_id);
        const level = levelMap.get(c.level_id);
        feed.push({
          id: `run-${c.id}`,
          type: "run",
          at: c.completed_at,
          username: profile?.username,
          displayName: profile?.display_name,
          levelName: level?.name ?? null,
          levelStringId: level?.level_id,
          completionTime: c.completion_time,
        });
      }

      for (const r of rankRows) {
        if (r.previous_rank == null || r.previous_rank === r.rank_position) continue;
        const level = levelMap.get(r.level_id);
        feed.push({
          id: `rank-${r.level_id}-${r.recorded_at}`,
          type: "rank",
          at: r.recorded_at,
          levelName: level?.name ?? null,
          levelStringId: level?.level_id,
          fromRank: r.previous_rank,
          toRank: r.rank_position,
        });
      }

      const addLevels = (rows: LevelRow[] | null, list: "main" | "extra" | "future") => {
        for (const l of rows || []) {
          feed.push({
            id: `level-${list}-${l.id}`,
            type: "level",
            at: l.added_at,
            levelName: l.name,
            levelStringId: l.level_id,
            list,
            rankPosition: l.rank_position,
          });
        }
      };
      addLevels(mainRes.data, "main");
      addLevels(extraRes.data, "extra");
      addLevels(futureRes.data, "future");

      feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setItems(feed);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "runs") return items.filter((i) => i.type === "run");
    if (filter === "ranks") return items.filter((i) => i.type === "rank");
    return items.filter((i) => i.type === "level");
  }, [items, filter]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-7 h-7 text-primary" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Activity</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              ["all", "All"],
              ["runs", "Completions"],
              ["ranks", "Rank Changes"],
              ["levels", "New Levels"],
            ] as [ActivityType, string][]
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(key);
                setVisible(50);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-muted-foreground text-sm py-12 text-center">Loading activity…</div>
        ) : shown.length === 0 ? (
          <div className="text-muted-foreground text-sm py-12 text-center">No activity yet.</div>
        ) : (
          <div className="space-y-2">
            {shown.map((item) => (
              <Card key={item.id} className="bg-card/60">
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  {item.type === "run" && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                  {item.type === "rank" &&
                    (item.toRank! < item.fromRank! ? (
                      <ArrowUp className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-500 shrink-0" />
                    ))}
                  {item.type === "level" && (
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  )}

                  <div className="flex-1 min-w-0 text-sm">
                    {item.type === "run" && (
                      <span>
                        <Link
                          to={`/player/${item.username}`}
                          className="font-medium hover:underline"
                        >
                          {item.displayName || item.username}
                        </Link>{" "}
                        completed{" "}
                        {item.levelStringId ? (
                          <Link
                            to={`/level/${item.levelStringId}`}
                            className="font-medium hover:underline"
                          >
                            {item.levelName || "a level"}
                          </Link>
                        ) : (
                          <span className="font-medium">{item.levelName || "a level"}</span>
                        )}
                        {item.completionTime != null && (
                          <span className="text-muted-foreground">
                            {" "}
                            in {formatTime(item.completionTime)}
                          </span>
                        )}
                      </span>
                    )}
                    {item.type === "rank" && (
                      <span>
                        {item.levelStringId ? (
                          <Link
                            to={`/level/${item.levelStringId}`}
                            className="font-medium hover:underline"
                          >
                            {item.levelName || "A level"}
                          </Link>
                        ) : (
                          <span className="font-medium">{item.levelName || "A level"}</span>
                        )}{" "}
                        moved from #{item.fromRank} to #{item.toRank}
                      </span>
                    )}
                    {item.type === "level" && (
                      <span>
                        {item.levelStringId ? (
                          <Link
                            to={`/level/${item.levelStringId}`}
                            className="font-medium hover:underline"
                          >
                            {item.levelName || "New level"}
                          </Link>
                        ) : (
                          <span className="font-medium">{item.levelName || "New level"}</span>
                        )}{" "}
                        added to the {LIST_LABEL[item.list!]} List at #{item.rankPosition}
                      </span>
                    )}
                  </div>

                  {item.type === "level" && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {LIST_LABEL[item.list!]}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {timeAgo(item.at)}
                  </span>
                </CardContent>
              </Card>
            ))}

            {filtered.length > visible && (
              <div className="pt-4 text-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + 50)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Show more ({filtered.length - visible} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
