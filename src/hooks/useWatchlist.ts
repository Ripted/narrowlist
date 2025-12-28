import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface WatchlistItem {
  id: string;
  level_id: string;
  created_at: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWatchlist(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const isInWatchlist = useCallback((levelDbId: string) => {
    return watchlist.some(item => item.level_id === levelDbId);
  }, [watchlist]);

  const addToWatchlist = useCallback(async (levelDbId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("user_watchlist")
      .insert({
        user_id: user.id,
        level_id: levelDbId,
      });

    if (!error) {
      await fetchWatchlist();
      return true;
    }
    return false;
  }, [user, fetchWatchlist]);

  const removeFromWatchlist = useCallback(async (levelDbId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("user_watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("level_id", levelDbId);

    if (!error) {
      await fetchWatchlist();
      return true;
    }
    return false;
  }, [user, fetchWatchlist]);

  const toggleWatchlist = useCallback(async (levelDbId: string) => {
    if (isInWatchlist(levelDbId)) {
      return removeFromWatchlist(levelDbId);
    } else {
      return addToWatchlist(levelDbId);
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  return {
    watchlist,
    loading,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    refreshWatchlist: fetchWatchlist,
  };
}
