import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bug, Loader2, Trash2, ExternalLink } from "lucide-react";

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  page_url: string | null;
  reporter_email: string | null;
  user_id: string | null;
  admin_note: string | null;
  created_at: string;
}

const severityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-destructive/20 text-destructive",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  resolved: "bg-green-500/20 text-green-400",
  wont_fix: "bg-muted text-muted-foreground",
};

export function BugReportsAdmin() {
  const { toast } = useToast();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReports((data ?? []) as BugReport[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bug_reports").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast({ title: "Status updated" });
    }
  };

  const saveNote = async (id: string) => {
    const note = editing[id] ?? "";
    const { error } = await supabase.from("bug_reports").update({ admin_note: note }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, admin_note: note } : r)));
      toast({ title: "Note saved" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this bug report?")) return;
    const { error } = await supabase.from("bug_reports").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Bug Reports ({reports.length})</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="wont_fix">Won't Fix</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No bug reports.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-4 bg-card space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{r.title}</h3>
                    <Badge className={severityColors[r.severity] ?? ""}>{r.severity}</Badge>
                    <Badge className={statusColors[r.status] ?? ""}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                    {r.reporter_email && ` • ${r.reporter_email}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                    <SelectTrigger className="w-36 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="wont_fix">Won't Fix</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(r.id)}
                    className="text-destructive h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm whitespace-pre-wrap">{r.description}</p>

              {r.page_url && (
                <a
                  href={r.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  {r.page_url}
                </a>
              )}

              <div className="space-y-2">
                <Textarea
                  placeholder="Admin note..."
                  value={editing[r.id] ?? r.admin_note ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p, [r.id]: e.target.value }))}
                  className="min-h-[60px] text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => saveNote(r.id)}>
                  Save Note
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
