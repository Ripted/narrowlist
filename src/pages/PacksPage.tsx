import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Package, ArrowLeft, Target } from "lucide-react";

interface Pack {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  item_count?: number;
}

interface PackItem {
  id: string;
  level_id: string;
  level_type: "main" | "extended";
  display_order: number;
  level: {
    id: string;
    level_id: string;
    name: string | null;
    author: string | null;
    rank_position: number;
    thumbnail_url: string | null;
  } | null;
}

export default function PacksPage() {
  const { packId } = useParams<{ packId?: string }>();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [items, setItems] = useState<PackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadList() {
      setLoading(true);
      const { data: packsData } = await supabase
        .from("level_packs")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: itemsData } = await supabase.from("level_pack_items").select("pack_id");
      const counts = new Map<string, number>();
      (itemsData || []).forEach((i: any) => counts.set(i.pack_id, (counts.get(i.pack_id) || 0) + 1));
      setPacks((packsData || []).map((p: any) => ({ ...p, item_count: counts.get(p.id) || 0 })));
      setLoading(false);
    }
    async function loadDetail() {
      setLoading(true);
      const { data: pack } = await supabase.from("level_packs").select("*").eq("id", packId).maybeSingle();
      if (!pack) { setActivePack(null); setLoading(false); return; }
      setActivePack(pack as Pack);
      const { data: itemRows } = await supabase
        .from("level_pack_items")
        .select("*")
        .eq("pack_id", packId)
        .order("display_order");

      const mainIds = (itemRows || []).filter((r: any) => r.level_type === "main").map((r: any) => r.level_id);
      const extIds = (itemRows || []).filter((r: any) => r.level_type === "extended").map((r: any) => r.level_id);

      const [{ data: mains }, { data: exts }] = await Promise.all([
        mainIds.length ? supabase.from("levels").select("id, level_id, name, author, rank_position, thumbnail_url").in("id", mainIds) : Promise.resolve({ data: [] }),
        extIds.length ? supabase.from("extended_levels").select("id, level_id, name, author, rank_position, thumbnail_url").in("id", extIds) : Promise.resolve({ data: [] }),
      ]);
      const map = new Map<string, any>();
      (mains || []).forEach((l: any) => map.set(`main:${l.id}`, l));
      (exts || []).forEach((l: any) => map.set(`extended:${l.id}`, l));

      setItems((itemRows || []).map((r: any) => ({ ...r, level: map.get(`${r.level_type}:${r.level_id}`) || null })));
      setLoading(false);
    }
    if (packId) loadDetail(); else loadList();
  }, [packId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <main className="relative pt-24 pb-12">
        <section className="container mx-auto px-4">
          {packId ? (
            <>
              <Link to="/packs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" /> All Packs
              </Link>
              {loading ? (
                <div className="h-64 rounded-xl bg-card border border-border animate-pulse" />
              ) : !activePack ? (
                <div className="text-center py-12 text-muted-foreground">Pack not found.</div>
              ) : (
                <>
                  <div className="rounded-xl bg-card border border-border p-6 mb-6 flex gap-4">
                    {activePack.cover_url ? (
                      <img src={activePack.cover_url} alt={activePack.name} className="w-24 h-24 rounded-lg object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h1 className="font-display text-2xl font-bold">{activePack.name}</h1>
                      {activePack.description && <p className="text-muted-foreground mt-1">{activePack.description}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{items.length} levels</p>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">This pack has no levels yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {items.map((it) => {
                        if (!it.level) return null;
                        const linkPath = it.level_type === "main" ? `/level/${it.level.level_id}` : `/level/${it.level.level_id}?extended=1`;
                        return (
                          <Link key={it.id} to={linkPath} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition">
                            <div className="relative h-40 bg-muted">
                              {it.level.thumbnail_url ? (
                                <img src={it.level.thumbnail_url} alt={it.level.name || ""} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Target className="w-8 h-8 text-muted-foreground/40" /></div>
                              )}
                              <div className="absolute top-2 left-2 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-xs font-bold">
                                {it.level_type === "main" ? `#${it.level.rank_position}` : `Extra #${it.level.rank_position}`}
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="font-medium truncate">{it.level.name || "Unnamed"}</div>
                              <div className="text-xs text-muted-foreground truncate">{it.level.author || "Unknown"}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-5 h-5 text-primary" />
                <h1 className="font-display text-2xl font-bold">Level Packs</h1>
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded font-mono">{packs.length}</span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-card border border-border animate-pulse" />)}
                </div>
              ) : packs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No packs yet. Check back later!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packs.map((pack) => (
                    <Link key={pack.id} to={`/packs/${pack.id}`} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition">
                      <div className="relative aspect-square bg-muted">
                        {pack.cover_url ? (
                          <img src={pack.cover_url} alt={pack.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-muted-foreground/40" /></div>
                        )}
                      </div>
                      <div className="p-4">
                        <h2 className="font-display font-semibold text-lg truncate">{pack.name}</h2>
                        {pack.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{pack.description}</p>}
                        <p className="text-xs text-muted-foreground mt-2">{pack.item_count} levels</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
