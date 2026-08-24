import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Trophy } from "lucide-react";

interface Suggestion {
  level_id: string;
  name: string | null;
  rank_position: number;
}

const NotFound = () => {
  const location = useLocation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const lastSegment = decodeURIComponent(
    location.pathname.split("/").filter(Boolean).pop() || ""
  ).replace(/[-_]+/g, " ");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    async function loadSuggestions() {
      if (lastSegment.length < 2) return;
      const { data } = await supabase
        .from("levels")
        .select("level_id, name, rank_position")
        .ilike("name", `%${lastSegment}%`)
        .order("rank_position", { ascending: true })
        .limit(3);
      if (data) setSuggestions(data);
    }
    loadSuggestions();
  }, [location.pathname, lastSegment]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4 max-w-md">
        <h1 className="mb-2 font-display text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">
          This page doesn't exist on the Narrowlist.
        </p>

        {suggestions.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Did you mean one of these levels?</p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <Link key={s.level_id} to={`/level/${s.level_id}`}>
                  <Button variant="outline" className="w-full gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    #{s.rank_position} {s.name || "Unnamed level"}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/main">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Main List
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="outline" className="gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
