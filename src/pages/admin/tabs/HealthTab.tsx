import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, HeartPulse, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/levels";

interface LevelRow {
  id: string;
  level_id: string;
  name: string | null;
  thumbnail_url: string | null;
}

interface HealthResults {
  apiUnreachable: boolean;
  brokenLevelIds: { list: string; level_id: string; name: string | null }[];
  missingThumbnails: { list: string; level_id: string; name: string | null }[];
  missingNames: { list: string; level_id: string }[];
  duplicateAcrossLists: { level_id: string; lists: string[] }[];
  duplicateRankHistory: number;
  staleSubmissions: { id: string; level_id: string; created_at: string }[];
}

const LIST_TABLES = [
  { key: "Main", table: "levels" },
  { key: "Extra", table: "extended_levels" },
  { key: "Future", table: "future_levels" },
] as const;

type ApiProbe = "ok" | "not-found" | "unreachable";

async function probeLevelApi(levelId: string): Promise<ApiProbe> {
  try {
    const res = await fetch(`${API_BASE_URL}/level-details/${levelId}?isCustomLevel=true`);
    return res.ok ? "ok" : "not-found";
  } catch {
    return "unreachable";
  }
}

export function HealthTab() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<HealthResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runChecks = async () => {
    setRunning(true);
    setError(null);
    setResults(null);

    try {
      // ---- DB-side checks (no external API) ----
      setProgress("Loading list rows...");
      const rowsByList: { key: string; rows: LevelRow[] }[] = [];
      for (const { key, table } of LIST_TABLES) {
        const { data, error } = await supabase.from(table).select("id, level_id, name, thumbnail_url");
        if (error) throw error;
        rowsByList.push({ key, rows: (data as LevelRow[]) ?? [] });
      }

      const missingThumbnails: HealthResults["missingThumbnails"] = [];
      const missingNames: HealthResults["missingNames"] = [];
      const idToLists = new Map<string, string[]>();

      for (const { key, rows } of rowsByList) {
        for (const row of rows) {
          if (!row.thumbnail_url) missingThumbnails.push({ list: key, level_id: row.level_id, name: row.name });
          if (!row.name) missingNames.push({ list: key, level_id: row.level_id });
          const seen = idToLists.get(row.level_id) ?? [];
          idToLists.set(row.level_id, [...seen, key]);
        }
      }
      const duplicateAcrossLists = [...idToLists.entries()]
        .filter(([, lists]) => lists.length > 1)
        .map(([level_id, lists]) => ({ level_id, lists }));

      // ---- Duplicate rank-history leftovers (trigger-dedupe verification) ----
      setProgress("Scanning rank history...");
      let duplicateRankHistory = 0;
      {
        // PostgREST caps responses at 1000 rows — page through the full table.
        const counts = new Map<string, number>();
        const PAGE = 1000;
        for (let from = 0; ; from += PAGE) {
          const { data, error } = await supabase
            .from("level_rank_history")
            .select("level_id, recorded_at")
            .range(from, from + PAGE - 1);
          if (error) throw error;
          for (const row of data ?? []) {
            const key = `${row.level_id}|${row.recorded_at}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
          }
          if (!data || data.length < PAGE) break;
        }
        for (const n of counts.values()) {
          if (n > 1) duplicateRankHistory += n - 1;
        }
      }

      // ---- Stale pending submissions (older than 14 days) ----
      setProgress("Checking submissions...");
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: stale, error: staleError } = await supabase
        .from("level_submissions")
        .select("id, level_id, created_at")
        .eq("status", "pending")
        .lt("created_at", cutoff)
        .order("created_at", { ascending: true });
      if (staleError) throw staleError;

      // ---- Game API resolution check ----
      // Probe once: if the API is unreachable from this origin (CORS/network),
      // every level would be a false positive — skip instead.
      const allRows = rowsByList.flatMap(({ key, rows }) => rows.map((r) => ({ key, ...r })));
      setProgress("Probing game API...");
      const firstProbe = allRows.length > 0 ? await probeLevelApi(allRows[0].level_id) : "ok";
      const apiUnreachable = firstProbe === "unreachable";
      const brokenLevelIds: HealthResults["brokenLevelIds"] = [];

      if (!apiUnreachable) {
        const DELAY = 150;
        const BATCH = 5;
        let done = 0;
        for (let i = 0; i < allRows.length; i += BATCH) {
          const batch = allRows.slice(i, i + BATCH);
          const results = await Promise.all(batch.map((r) => probeLevelApi(r.level_id)));
          results.forEach((res, j) => {
            if (res === "not-found") {
              brokenLevelIds.push({ list: batch[j].key, level_id: batch[j].level_id, name: batch[j].name });
            }
          });
          done += batch.length;
          setProgress(`Checking game API... ${done}/${allRows.length}`);
          if (i + BATCH < allRows.length) await new Promise((r) => setTimeout(r, DELAY));
        }
      }

      setResults({
        apiUnreachable,
        brokenLevelIds,
        missingThumbnails,
        missingNames,
        duplicateAcrossLists,
        duplicateRankHistory,
        staleSubmissions: stale ?? [],
      });
      setProgress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed");
      setProgress("");
    } finally {
      setRunning(false);
    }
  };

  const Section = ({
    title,
    count,
    children,
  }: {
    title: string;
    count: number;
    children?: ReactNode;
  }) => (
    <div className="rounded-lg bg-card border border-border p-4 md:p-6">
      <h3 className="font-display text-base font-bold mb-3 flex items-center gap-2">
        {count === 0 ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
        {title}
        <span className={`text-xs px-2 py-0.5 rounded-full ${count === 0 ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
          {count === 0 ? "OK" : count}
        </span>
      </h3>
      {count > 0 && children}
    </div>
  );

  const Item = ({ list, level_id, name }: { list: string; level_id: string; name: string | null }) => (
    <li className="text-sm">
      <span className="text-muted-foreground">{list}</span> —{" "}
      <span className="font-medium text-foreground">{name || "Unnamed"}</span>{" "}
      <span className="font-mono text-xs text-muted-foreground">({level_id})</span>
    </li>
  );

  return (
    <TabsContent value="health" className="space-y-4">
      <div className="rounded-lg bg-card border border-border p-4 md:p-6">
        <h2 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-primary" />
          Data Health
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sanity-checks the lists: level IDs that no longer resolve on the game API, missing
          thumbnails/names, levels duplicated across lists, leftover duplicate rank-history rows,
          and submissions stuck pending for over two weeks.
        </p>
        <Button onClick={runChecks} disabled={running} size="sm" className="gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? progress || "Running..." : "Run checks"}
        </Button>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </div>

      {results && (
        <>
          {results.apiUnreachable && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-sm text-yellow-500">
              Game API is unreachable from this origin — the level-resolution check was skipped to
              avoid false positives. Run this from the production site.
            </div>
          )}

          <Section title="Levels not resolving on game API" count={results.brokenLevelIds.length}>
            <ul className="space-y-1">
              {results.brokenLevelIds.map((r) => <Item key={r.level_id} {...r} />)}
            </ul>
          </Section>

          <Section title="Missing thumbnails" count={results.missingThumbnails.length}>
            <ul className="space-y-1">
              {results.missingThumbnails.map((r) => <Item key={r.level_id} {...r} />)}
            </ul>
          </Section>

          <Section title="Missing names" count={results.missingNames.length}>
            <ul className="space-y-1">
              {results.missingNames.map((r) => (
                <Item key={r.level_id} list={r.list} level_id={r.level_id} name={null} />
              ))}
            </ul>
          </Section>

          <Section title="Same level on multiple lists" count={results.duplicateAcrossLists.length}>
            <ul className="space-y-1">
              {results.duplicateAcrossLists.map((r) => (
                <li key={r.level_id} className="text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{r.level_id}</span> —{" "}
                  <span className="font-medium text-foreground">{r.lists.join(" + ")}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Duplicate rank-history rows" count={results.duplicateRankHistory} />

          <Section title="Submissions pending over 14 days" count={results.staleSubmissions.length}>
            <ul className="space-y-1">
              {results.staleSubmissions.map((s) => (
                <li key={s.id} className="text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{s.level_id}</span> —{" "}
                  <span className="text-muted-foreground">
                    pending since {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </TabsContent>
  );
}
