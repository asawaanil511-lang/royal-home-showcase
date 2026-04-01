import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, CheckCircle, Trash2, X, Edit2, Save, AlertTriangle,
  Eye, EyeOff, Clock, Image as ImageIcon, Database, Copy, Upload,
  Loader2, Trophy, TrendingUp, Users as UsersIcon, ChevronDown, ChevronUp,
  Zap, Calendar, BarChart2, CheckSquare, Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DBMatch = {
  id: string;
  team_a_name: string;
  team_b_name: string;
  odds_a: number;
  odds_b: number;
  max_bet: number;
  match_date: string;
  status: string;
  winner: string | null;
  live_time?: string | null;
  closing_time?: string | null;
  image_url?: string | null;
  match_title?: string | null;
};

type MatchBetStats = {
  total: number; volume: number; teamA: number; teamB: number;
  volumeA: number; volumeB: number; payoutA: number; payoutB: number;
};

const MIGRATION_SQL = `ALTER TABLE matches
ADD COLUMN IF NOT EXISTS live_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closing_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS match_title TEXT;`;

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  upcoming: { label: "UPCOMING", dot: "bg-primary", bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
  live: { label: "LIVE", dot: "bg-red-500 animate-pulse", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  closed: { label: "CLOSED", dot: "bg-gray-500", bg: "bg-secondary", text: "text-muted-foreground", border: "border-border/50" },
  cancelled: { label: "CANCELLED", dot: "bg-purple-500", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
};

const AdminMatches = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [matches, setMatches] = useState<DBMatch[]>([]);
  const [betStats, setBetStats] = useState<Map<string, MatchBetStats>>(new Map());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DBMatch>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; matchId: string; label: string } | null>(null);
  const [showMigrationPanel, setShowMigrationPanel] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [oddsA, setOddsA] = useState("1.90");
  const [oddsB, setOddsB] = useState("1.90");
  const [maxBet, setMaxBet] = useState("10000");
  const [matchDate, setMatchDate] = useState("");
  const [liveTime, setLiveTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [matchTitle, setMatchTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchMatches = async () => {
    const [{ data: matchesData }, { data: betsData }] = await Promise.all([
      (supabase as any).from("matches").select("*").order("match_date", { ascending: false }),
      (supabase as any).from("bets").select("match_id, amount, team_picked, result, potential_win"),
    ]);
    setMatches((matchesData as DBMatch[]) || []);
    const statsMap = new Map<string, MatchBetStats>();
    (betsData || []).filter((b: any) => b.result !== "cancelled").forEach((b: any) => {
      const e = statsMap.get(b.match_id) || { total: 0, volume: 0, teamA: 0, teamB: 0, volumeA: 0, volumeB: 0, payoutA: 0, payoutB: 0 };
      e.total += 1;
      e.volume += Number(b.amount || 0);
      if (b.team_picked === "A") { e.teamA += 1; e.volumeA += Number(b.amount || 0); e.payoutA += Number(b.potential_win || 0); }
      else { e.teamB += 1; e.volumeB += Number(b.amount || 0); e.payoutB += Number(b.potential_win || 0); }
      statsMap.set(b.match_id, e);
    });
    setBetStats(statsMap);
  };

  useEffect(() => { fetchMatches(); }, []);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl || null;
    setImageUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const response = await fetch("/api/upload-match-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64, mimeType: imageFile.type, fileName: imageFile.name }),
      });
      const result = await response.json();
      setImageUploading(false);
      if (!response.ok || result.error) {
        toast({ title: "Image upload failed", description: result.error, variant: "destructive" });
        return imageUrl || null;
      }
      return result.url;
    } catch (err: any) {
      setImageUploading(false);
      toast({ title: "Image upload failed", description: err.message, variant: "destructive" });
      return imageUrl || null;
    }
  };

  const handleCreate = async () => {
    if (!teamA || !teamB || !matchDate) {
      toast({ title: "Fill required fields (Team A, Team B, Match Date)", variant: "destructive" });
      return;
    }
    setSaving(true);
    const uploadedUrl = await uploadImage();
    const insertData: any = {
      team_a_name: teamA, team_b_name: teamB,
      odds_a: Number(oddsA), odds_b: Number(oddsB),
      max_bet: Number(maxBet),
      match_date: new Date(matchDate).toISOString(),
      status: "upcoming",
    };
    if (liveTime) insertData.live_time = new Date(liveTime).toISOString();
    if (closingTime) insertData.closing_time = new Date(closingTime).toISOString();
    if (uploadedUrl) insertData.image_url = uploadedUrl;
    if (matchTitle.trim()) insertData.match_title = matchTitle.trim();

    const { error } = await (supabase as any).from("matches").insert(insertData);
    if (error) {
      setSaving(false);
      if (error.message?.includes("column")) {
        setShowMigrationPanel(true);
        toast({ title: "Schema update needed", description: "Please run the database migration first.", variant: "destructive" });
      } else {
        toast({ title: "Failed to create match", description: error.message, variant: "destructive" });
      }
      return;
    }
    setSaving(false);
    setShowForm(false);
    setTeamA(""); setTeamB(""); setOddsA("1.90"); setOddsB("1.90"); setMaxBet("10000");
    setMatchDate(""); setLiveTime(""); setClosingTime(""); setImageUrl(""); setImageFile(null); setImagePreview(null); setMatchTitle("");
    toast({ title: "Match created!" });
    fetchMatches();
  };

  const runMigration = async () => {
    if (!user) return;
    setMigrating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "Migration applied!" });
        setShowMigrationPanel(false);
      } else if (result.manual) {
        toast({ title: "Run SQL manually", description: "Copy the SQL below and run it in Supabase Dashboard", variant: "destructive" });
      }
    } catch {
      toast({ title: "Migration failed", variant: "destructive" });
    }
    setMigrating(false);
  };

  const copyMigrationSQL = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    toast({ title: "SQL copied to clipboard!" });
  };

  const handleEdit = (m: DBMatch) => {
    setEditingId(m.id);
    setEditData({
      team_a_name: m.team_a_name, team_b_name: m.team_b_name,
      odds_a: m.odds_a, odds_b: m.odds_b, max_bet: m.max_bet,
      match_date: m.match_date.slice(0, 16),
      live_time: m.live_time ? m.live_time.slice(0, 16) : "",
      closing_time: m.closing_time ? m.closing_time.slice(0, 16) : "",
      image_url: m.image_url || "",
      match_title: m.match_title || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const update: any = { ...editData };
    if (update.match_date) update.match_date = new Date(update.match_date).toISOString();
    if (update.live_time) update.live_time = new Date(update.live_time).toISOString();
    else delete update.live_time;
    if (update.closing_time) update.closing_time = new Date(update.closing_time).toISOString();
    else delete update.closing_time;
    if (!update.image_url) delete update.image_url;
    await (supabase as any).from("matches").update(update).eq("id", editingId);
    setEditingId(null);
    toast({ title: "Match updated!" });
    fetchMatches();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await (supabase as any).from("matches").update({ status }).eq("id", id);
    toast({ title: `Match set to ${status}` });
    fetchMatches();
  };

  const handleSetWinner = async (id: string, winner: string) => {
    await (supabase as any).from("matches").update({ winner, status: "closed" }).eq("id", id);
    const { data: bets } = await (supabase as any).from("bets").select("*").eq("match_id", id).eq("result", "pending");
    if (bets) {
      for (const bet of bets as any[]) {
        const won = bet.team_picked === winner;
        await (supabase as any).from("bets").update({ result: won ? "won" : "lost", settled_at: new Date().toISOString() }).eq("id", bet.id);
        if (won) {
          const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", bet.user_id).single();
          if (profile) {
            await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance + bet.potential_win }).eq("user_id", bet.user_id);
          }
        }
      }
    }
    toast({ title: "Match settled!" });
    await autoCleanupClosedMatches();
    fetchMatches();
  };

  const handleCancel = async (id: string) => {
    await (supabase as any).from("matches").update({ status: "cancelled", winner: null }).eq("id", id);
    const { data: bets } = await (supabase as any).from("bets").select("*").eq("match_id", id).eq("result", "pending");
    if (bets) {
      for (const bet of bets as any[]) {
        await (supabase as any).from("bets").update({ result: "cancelled", settled_at: new Date().toISOString() }).eq("id", bet.id);
        const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", bet.user_id).single();
        if (profile) {
          await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance + Number(bet.amount) }).eq("user_id", bet.user_id);
        }
      }
    }
    toast({ title: "Match cancelled. Bets refunded." });
    await autoCleanupClosedMatches();
    fetchMatches();
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("matches").delete().eq("id", id);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    toast({ title: "Match deleted" });
    fetchMatches();
  };

  // Auto-delete oldest closed/cancelled matches, keeping max 10
  const autoCleanupClosedMatches = async () => {
    const { data: closedMatches } = await (supabase as any)
      .from("matches")
      .select("id, match_date")
      .in("status", ["closed", "cancelled"])
      .order("match_date", { ascending: false });
    if (closedMatches && closedMatches.length > 10) {
      const toDelete = (closedMatches as any[]).slice(10);
      const idsToDelete = toDelete.map((m: any) => m.id);
      await (supabase as any).from("matches").delete().in("id", idsToDelete);
      toast({ title: `Auto-cleaned: removed ${idsToDelete.length} old match${idsToDelete.length > 1 ? "es" : ""} (kept 10 latest)` });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    await (supabase as any).from("matches").delete().in("id", ids);
    setSelectedIds(new Set());
    toast({ title: `Deleted ${ids.length} match${ids.length > 1 ? "es" : ""}` });
    setBulkDeleting(false);
    fetchMatches();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMatches.length && filteredMatches.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMatches.map((m) => m.id)));
    }
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    const { type, matchId } = confirmAction;
    if (type === "winA") handleSetWinner(matchId, "A");
    else if (type === "winB") handleSetWinner(matchId, "B");
    else if (type === "cancel") handleCancel(matchId);
    else if (type === "delete") handleDelete(matchId);
    else if (type === "bulkDelete") handleBulkDelete();
    setConfirmAction(null);
  };

  const filteredMatches = matches.filter((m) => {
    const statusOk = statusFilter === "all" || m.status === statusFilter;
    const dateOk = !dateFilter || m.match_date.slice(0, 10) === dateFilter;
    return statusOk && dateOk;
  });

  const statusTabs = ["all", "upcoming", "live", "closed", "cancelled"];
  const counts = { all: matches.length, upcoming: 0, live: 0, closed: 0, cancelled: 0 };
  matches.forEach((m) => { if (counts[m.status as keyof typeof counts] !== undefined) counts[m.status as keyof typeof counts]++; });

  return (
    <div>
      {/* Migration Panel */}
      <AnimatePresence>
        {showMigrationPanel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5">
            <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3 mb-3">
                <Database className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-400">Database Schema Update Required</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Run this SQL in your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline">Supabase SQL Editor</a>:</p>
                </div>
              </div>
              <pre className="text-xs bg-black/40 rounded-lg p-3 text-emerald-400 mb-3 whitespace-pre-wrap font-mono">{MIGRATION_SQL}</pre>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 gap-1.5" onClick={copyMigrationSQL}><Copy className="h-3.5 w-3.5" /> Copy SQL</Button>
                <Button size="sm" className="gradient-neon-primary text-primary-foreground gap-1.5" onClick={runMigration} disabled={migrating}>
                  {migrating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running...</> : <><Database className="h-3.5 w-3.5" /> Try Auto-Migrate</>}
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setShowMigrationPanel(false)}><X className="h-3.5 w-3.5 mr-1" /> Dismiss</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {statusTabs.map((t) => {
              const cfg = STATUS_CONFIG[t] || {};
              const active = statusFilter === t;
              return (
                <button key={t} onClick={() => setStatusFilter(t)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? t === "all"
                        ? "bg-foreground text-background border-foreground"
                        : `${cfg.bg} ${cfg.text} ${cfg.border}`
                      : "bg-secondary/60 text-muted-foreground border-border/40 hover:text-foreground"
                  }`}>
                  {t !== "all" && <span className={`h-1.5 w-1.5 rounded-full ${active ? cfg.dot : "bg-muted-foreground/50"}`} />}
                  {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                  <span className="opacity-60 font-normal">({counts[t as keyof typeof counts]})</span>
                </button>
              );
            })}
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer" />
            </div>
            {dateFilter && (
              <>
                <button onClick={() => setDateFilter("")} className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border/50 bg-secondary/50 transition-colors">Clear</button>
                <span className="text-xs text-primary font-semibold">{filteredMatches.length} match{filteredMatches.length !== 1 ? "es" : ""}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={() => setConfirmAction({ type: "bulkDelete", matchId: "", label: `Permanently delete ${selectedIds.size} selected match${selectedIds.size > 1 ? "es" : ""}? This cannot be undone.` })}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete {selectedIds.size} Selected
            </Button>
          )}
          <Button variant="outline" size="sm" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 gap-1.5" onClick={() => setShowMigrationPanel(!showMigrationPanel)}>
            <Database className="h-4 w-4" /> DB Setup
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="gradient-neon-primary text-primary-foreground shadow-neon gap-1.5">
            <Plus className="h-4 w-4" /> New Match
          </Button>
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border border-primary/30 bg-card p-5 mb-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Create New Match</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Match Title</label>
                  <Input placeholder="e.g. Indian Premier League 2026" value={matchTitle} onChange={(e) => setMatchTitle(e.target.value)} className="bg-secondary border-border" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Team A *</label>
                    <Input placeholder="e.g. Mumbai Indians" value={teamA} onChange={(e) => setTeamA(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Team B *</label>
                    <Input placeholder="e.g. CSK" value={teamB} onChange={(e) => setTeamB(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Odds A</label>
                    <Input type="number" step="0.05" value={oddsA} onChange={(e) => setOddsA(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Odds B</label>
                    <Input type="number" step="0.05" value={oddsB} onChange={(e) => setOddsB(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Max Bet (₹)</label>
                    <Input type="number" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Match Date & Time *</label>
                    <Input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="bg-secondary border-border" />
                  </div>
                </div>

                {/* Auto-status times */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary">Auto-Status Times</span>
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-emerald-400/80 mb-1.5 block">🟢 Goes LIVE at</label>
                      <Input type="datetime-local" value={liveTime} onChange={(e) => setLiveTime(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-red-400/80 mb-1.5 block">🔴 Betting CLOSES at</label>
                      <Input type="datetime-local" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} className="bg-secondary border-border" />
                    </div>
                  </div>
                </div>

                {/* Image upload */}
                <div className="rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="h-4 w-4 text-accent" />
                    <span className="text-sm font-bold text-foreground">Match Image</span>
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Upload File</label>
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">{imageFile ? imageFile.name : "Click to upload"}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageFile} />
                      </label>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Or paste URL</label>
                      <Input type="url" placeholder="https://..." value={imageUrl}
                        onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(null); }}
                        className="bg-secondary border-border" />
                    </div>
                  </div>
                  {(imagePreview || imageUrl) && (
                    <div className="mt-3 rounded-lg overflow-hidden max-h-32">
                      <img src={imagePreview || imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" onError={() => setImagePreview(null)} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <Button onClick={handleCreate} disabled={saving || imageUploading} className="gradient-neon-primary text-primary-foreground gap-2">
                  {saving || imageUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4" /> Create Match</>}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match List */}
      <div className="space-y-3">
        {/* Select-all row */}
        {filteredMatches.length > 0 && (
          <div className="flex items-center gap-3 px-1 pb-1">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedIds.size === filteredMatches.length && filteredMatches.length > 0
                ? <CheckSquare className="h-4 w-4 text-primary" />
                : <Square className="h-4 w-4" />
              }
              {selectedIds.size === filteredMatches.length && filteredMatches.length > 0
                ? "Deselect all"
                : `Select all (${filteredMatches.length})`
              }
            </button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-primary font-semibold">{selectedIds.size} selected</span>
            )}
          </div>
        )}

        {filteredMatches.map((m, i) => {
          const bs = betStats.get(m.id) || { total: 0, volume: 0, teamA: 0, teamB: 0, volumeA: 0, volumeB: 0, payoutA: 0, payoutB: 0 };
          const isExpanded = expandedId === m.id;
          const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.upcoming;
          const totalPct = bs.total > 0 ? (bs.teamA / bs.total) * 100 : 50;

          const isSelected = selectedIds.has(m.id);

          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`rounded-2xl border bg-card overflow-hidden shadow-card transition-all ${
                isSelected ? "border-primary/50 ring-1 ring-primary/20" : "border-border/50"
              }`}>

              {editingId === m.id ? (
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground">Edit Match</span>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="text-xs text-muted-foreground mb-1 block">Team A</label><Input value={editData.team_a_name || ""} onChange={(e) => setEditData({ ...editData, team_a_name: e.target.value })} className="bg-secondary border-border" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Team B</label><Input value={editData.team_b_name || ""} onChange={(e) => setEditData({ ...editData, team_b_name: e.target.value })} className="bg-secondary border-border" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Odds A</label><Input type="number" step="0.05" value={editData.odds_a || ""} onChange={(e) => setEditData({ ...editData, odds_a: Number(e.target.value) })} className="bg-secondary border-border" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Odds B</label><Input type="number" step="0.05" value={editData.odds_b || ""} onChange={(e) => setEditData({ ...editData, odds_b: Number(e.target.value) })} className="bg-secondary border-border" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Max Bet</label><Input type="number" value={editData.max_bet || ""} onChange={(e) => setEditData({ ...editData, max_bet: Number(e.target.value) })} className="bg-secondary border-border" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Match Date</label><Input type="datetime-local" value={editData.match_date || ""} onChange={(e) => setEditData({ ...editData, match_date: e.target.value })} className="bg-secondary border-border" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">🟢 Live Time</label><Input type="datetime-local" value={editData.live_time || ""} onChange={(e) => setEditData({ ...editData, live_time: e.target.value })} className="bg-secondary border-border" /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">🔴 Closing Time</label><Input type="datetime-local" value={editData.closing_time || ""} onChange={(e) => setEditData({ ...editData, closing_time: e.target.value })} className="bg-secondary border-border" /></div>
                    <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Image URL</label><Input type="url" value={editData.image_url || ""} onChange={(e) => setEditData({ ...editData, image_url: e.target.value })} className="bg-secondary border-border" placeholder="https://..." /></div>
                    <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Match Title</label><Input value={editData.match_title || ""} onChange={(e) => setEditData({ ...editData, match_title: e.target.value })} className="bg-secondary border-border" placeholder="e.g. Indian Premier League 2026" /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} className="gradient-neon-primary text-primary-foreground"><Save className="h-3 w-3 mr-1.5" /> Save Changes</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Image strip */}
                  {m.image_url && (
                    <div className="relative h-20 overflow-hidden">
                      <img src={m.image_url} alt="Match" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/90" />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelect(m.id)}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        title="Select match"
                      >
                        {isSelected
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        {m.match_title && <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5 truncate">{m.match_title}</p>}
                        <p className="font-extrabold text-foreground text-base leading-tight truncate">{m.team_a_name} vs {m.team_b_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {m.winner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              <Trophy className="h-2.5 w-2.5" /> Team {m.winner} Won
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setExpandedId(isExpanded ? null : m.id)}
                        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all shrink-0 ${
                          isExpanded ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary/60 text-muted-foreground border-border/40 hover:text-foreground"
                        }`}>
                        <BarChart2 className="h-3.5 w-3.5" />
                        P&L
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.match_date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      <span>Odds: <span className="text-foreground font-semibold">{m.odds_a}x / {m.odds_b}x</span></span>
                      <span>Max: <span className="text-foreground font-semibold">₹{Number(m.max_bet).toLocaleString()}</span></span>
                    </div>

                    {/* Auto-times */}
                    {(m.live_time || m.closing_time) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {m.live_time && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/8 border border-emerald-500/20 rounded-full px-2 py-0.5"><Clock className="h-2.5 w-2.5" /> Live: {new Date(m.live_time).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                        {m.closing_time && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/8 border border-red-500/20 rounded-full px-2 py-0.5"><Clock className="h-2.5 w-2.5" /> Closes: {new Date(m.closing_time).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                      </div>
                    )}

                    {/* Bet bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="flex items-center gap-1 text-muted-foreground"><UsersIcon className="h-3 w-3" /> {bs.total} bets · <span className="text-primary font-bold">₹{bs.volume.toLocaleString()}</span></span>
                        {bs.total > 0 && <span className="text-muted-foreground">A: {bs.teamA} · B: {bs.teamB}</span>}
                      </div>
                      {bs.total > 0 && (
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden flex">
                          <div className="h-full rounded-l-full bg-primary transition-all" style={{ width: `${totalPct}%` }} />
                          <div className="h-full rounded-r-full bg-accent flex-1" />
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {m.status === "upcoming" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1" onClick={() => handleStatusChange(m.id, "live")}>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Go Live
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleEdit(m)}>
                            <Edit2 className="h-3 w-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10 gap-1"
                            onClick={() => setConfirmAction({ type: "cancel", matchId: m.id, label: "Cancel this match and refund all bets?" })}>
                            <X className="h-3 w-3" /> Cancel
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
                            onClick={() => setConfirmAction({ type: "delete", matchId: m.id, label: "Permanently delete this match?" })}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </>
                      )}
                      {(m.status === "live" || m.status === "closed") && !m.winner && (
                        <>
                          {m.status === "closed" && (
                            <p className="w-full text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Betting closed — settle the result:
                            </p>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1"
                            onClick={() => setConfirmAction({ type: "winA", matchId: m.id, label: `Settle: ${m.team_a_name} wins? This will pay out all winning bets.` })}>
                            <CheckCircle className="h-3 w-3" /> {m.team_a_name} Wins
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-accent/30 text-accent hover:bg-accent/10 gap-1"
                            onClick={() => setConfirmAction({ type: "winB", matchId: m.id, label: `Settle: ${m.team_b_name} wins? This will pay out all winning bets.` })}>
                            <CheckCircle className="h-3 w-3" /> {m.team_b_name} Wins
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10 gap-1"
                            onClick={() => setConfirmAction({ type: "cancel", matchId: m.id, label: "Cancel this match and refund all pending bets?" })}>
                            <X className="h-3 w-3" /> Cancel
                          </Button>
                        </>
                      )}
                    </div>

                    {/* P&L Expanded panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mt-4 pt-4 border-t border-border/30">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <TrendingUp className="h-3 w-3" /> Match P&L Breakdown
                            </p>

                            {bs.total === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">No bets placed yet</p>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                                    <p className="text-[10px] text-muted-foreground mb-1 truncate">{m.team_a_name}</p>
                                    <p className="text-lg font-extrabold text-foreground">{bs.teamA} <span className="text-xs font-normal text-muted-foreground">bets</span></p>
                                    <p className="text-xs text-primary font-semibold mt-0.5">₹{bs.volumeA.toLocaleString()} staked</p>
                                  </div>
                                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
                                    <p className="text-[10px] text-muted-foreground mb-1 truncate">{m.team_b_name}</p>
                                    <p className="text-lg font-extrabold text-foreground">{bs.teamB} <span className="text-xs font-normal text-muted-foreground">bets</span></p>
                                    <p className="text-xs text-accent font-semibold mt-0.5">₹{bs.volumeB.toLocaleString()} staked</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                                    <p className="text-[10px] text-muted-foreground mb-1">If {m.team_a_name} Wins</p>
                                    <p className={`text-base font-extrabold ${bs.volume - bs.payoutA >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                      {bs.volume - bs.payoutA >= 0 ? "+" : ""}₹{Math.abs(Math.round(bs.volume - bs.payoutA)).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">house profit</p>
                                  </div>
                                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                                    <p className="text-[10px] text-muted-foreground mb-1">If {m.team_b_name} Wins</p>
                                    <p className={`text-base font-extrabold ${bs.volume - bs.payoutB >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                      {bs.volume - bs.payoutB >= 0 ? "+" : ""}₹{Math.abs(Math.round(bs.volume - bs.payoutB)).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">house profit</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 text-[10px]">
                                  <span className="rounded-full bg-secondary/60 border border-border/40 px-2.5 py-1">Total: <span className="text-primary font-bold">₹{bs.volume.toLocaleString()}</span></span>
                                  <span className="rounded-full bg-secondary/60 border border-border/40 px-2.5 py-1">Payout A: <span className="font-bold">₹{Math.round(bs.payoutA).toLocaleString()}</span></span>
                                  <span className="rounded-full bg-secondary/60 border border-border/40 px-2.5 py-1">Payout B: <span className="font-bold">₹{Math.round(bs.payoutB).toLocaleString()}</span></span>
                                  <span className="rounded-full bg-secondary/60 border border-border/40 px-2.5 py-1 font-mono text-muted-foreground">ID: {m.id.slice(0, 12)}…</span>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
        {filteredMatches.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Trophy className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No matches found</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Confirm Action
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">{confirmAction?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeConfirmAction} className="gradient-neon-primary text-primary-foreground">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMatches;
