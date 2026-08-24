import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_SORT_DIRECTION, LevelSortField, SortDirection } from "@/hooks/useLevelAggregates";

const SORT_FIELDS = new Set<string>(["rank", "name", "points", "votes", "completions"]);
const VIEW_KEYS = ["q", "sort", "dir", "uncompleted", "tags", "tagMode", "page"] as const;

interface StoredPrefs {
  q?: string;
  sort?: string;
  dir?: string;
  uncompleted?: boolean;
  tags?: string[];
  tagMode?: string;
}

interface Options {
  // localStorage key, e.g. "narrowlist-view-main"
  storageKey: string;
  withTags?: boolean;
  withPage?: boolean;
}

function parseSort(params: URLSearchParams): LevelSortField | null {
  const v = params.get("sort");
  return v && SORT_FIELDS.has(v) ? (v as LevelSortField) : null;
}

function parseDir(params: URLSearchParams, field: LevelSortField): SortDirection {
  const v = params.get("dir");
  return v === "asc" || v === "desc" ? v : DEFAULT_SORT_DIRECTION[field];
}

/**
 * Keeps list-view filters (search, sort, uncompleted, tags, page) in the URL so
 * they are shareable and survive refresh, and mirrors them into localStorage so
 * the view comes back on the next visit.
 */
export function useListViewPrefs({ storageKey, withTags = false, withPage = false }: Options) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialized = useRef(false);

  // On first mount, restore prefs from localStorage if the URL has none
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (VIEW_KEYS.some((k) => searchParams.has(k))) return;
    let prefs: StoredPrefs;
    try {
      prefs = JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return;
    }
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (prefs.q) {
      next.set("q", prefs.q);
      changed = true;
    }
    if (prefs.sort && SORT_FIELDS.has(prefs.sort)) {
      next.set("sort", prefs.sort);
      changed = true;
    }
    if (prefs.dir === "asc" || prefs.dir === "desc") {
      next.set("dir", prefs.dir);
      changed = true;
    }
    if (prefs.uncompleted) {
      next.set("uncompleted", "1");
      changed = true;
    }
    if (withTags && prefs.tags?.length) {
      next.set("tags", prefs.tags.join(","));
      changed = true;
    }
    if (withTags && (prefs.tagMode === "any" || prefs.tagMode === "all")) {
      next.set("tagMode", prefs.tagMode);
      changed = true;
    }
    if (changed) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortField = useMemo(() => parseSort(searchParams) ?? "rank", [searchParams]);
  const sortDirection = useMemo<SortDirection>(
    () => parseDir(searchParams, sortField),
    [searchParams, sortField]
  );

  // Mirror current view into localStorage
  useEffect(() => {
    const prefs: StoredPrefs = {
      q: searchParams.get("q") || undefined,
      sort: parseSort(searchParams) ?? undefined,
      dir: searchParams.get("dir") || undefined,
      uncompleted: searchParams.get("uncompleted") === "1" || undefined,
      tags: withTags ? searchParams.get("tags")?.split(",").filter(Boolean) : undefined,
      tagMode: withTags ? searchParams.get("tagMode") || undefined : undefined,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {
      // storage unavailable
    }
  }, [searchParams, storageKey, withTags]);

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          // keep URLs clean
          for (const k of ["q", "sort", "dir", "uncompleted", "tags", "tagMode", "page"] as const) {
            const v = next.get(k);
            if (!v || (k === "page" && v === "1")) next.delete(k);
          }
          if (resetPage) next.delete("page");
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const searchQuery = searchParams.get("q") ?? "";
  const showOnlyUncompleted = searchParams.get("uncompleted") === "1";
  const selectedTags = useMemo(
    () => new Set(searchParams.get("tags")?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );
  const tagMatchMode = (searchParams.get("tagMode") === "all" ? "all" : "any") as "any" | "all";
  const page = withPage ? Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1) : 1;

  return {
    searchQuery,
    setSearchQuery: (q: string) => update((p) => p.set("q", q)),
    sortField,
    setSort: (field: LevelSortField, direction: SortDirection) =>
      update((p) => {
        p.set("sort", field);
        p.set("dir", direction);
      }),
    sortDirection,
    showOnlyUncompleted,
    toggleUncompleted: () =>
      update((p) =>
        p.get("uncompleted") === "1" ? p.delete("uncompleted") : p.set("uncompleted", "1")
      ),
    selectedTags,
    setSelectedTags: (tags: Set<string> | ((prev: Set<string>) => Set<string>)) =>
      update((p) => {
        const prev = new Set(p.get("tags")?.split(",").filter(Boolean) ?? []);
        const next = typeof tags === "function" ? tags(prev) : tags;
        if (next.size) p.set("tags", [...next].join(","));
        else p.delete("tags");
      }),
    tagMatchMode,
    setTagMatchMode: (mode: "any" | "all") => update((p) => p.set("tagMode", mode)),
    page,
    setPage: (n: number) =>
      update(
        (p) => {
          if (n > 1) p.set("page", String(n));
          else p.delete("page");
        },
        false
      ),
    update,
  };
}
