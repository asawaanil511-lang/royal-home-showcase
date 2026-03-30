import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, CheckCircle, Trash2, X, Edit2, Save, AlertTriangle, Users as UsersIcon,
  Eye, Clock, Image as ImageIcon, Database, Copy, Upload, Loader2,
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
};

type MatchBetStats = {
  total: number; volume: number; teamA: number; teamB: number;
  volumeA: number; volumeB: number; payoutA: number; payoutB: number;
};

const MIGRATION_SQL = `ALTER TABLE matches
ADD COLUMN IF NOT EXISTS live_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closing_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS image_url TEXT;`;

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

  // Create form state
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
  const [saving, setSaving] = useState(false);

  const fetchMatches = async () => {
    const [{ data: matchesData }, { data: betsData }] = await Promise.all([
      (supabase as any).from("matches").select("*").order("match_date", { ascending: false }),
      (supabase as any).from("bets").select("match_id, amount, team_picked, result, potential_win"),
    ]);
    setMatches((matchesData as DBMatch[]) || []);
    const statsMap = new Map<string, MatchBetStats>();
    (betsData || []).forEach((b: any) => {
      const existing = statsMap.get(b.match_id) || { total: 0, volume: 0, teamA: 0, teamB: 0, volumeA: 0, volumeB: 0, payoutA: 0, payoutB: 0 };
      existing.total += 1;
      existing.volume += Number(b.amount || 0);
      if (b.team_picked === "A") { existing.teamA += 1; existing.volumeA += Number(b.amount || 0); existing.payoutA += Number(b.potential_win || 0); }
      else { existing.teamB += 1; existing.volumeB += Number(b.amount || 0); existing.payoutB += Number(b.potential_win || 0); }
      statsMap.set(b.match_id, existing);
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
      team_a_name: teamA,
      team_b_name: teamB,
      odds_a: Number(oddsA),
      odds_b: Number(oddsB),
      max_bet: Number(maxBet),
      match_date: new Date(matchDate).toISOString(),
      status: "upcoming",
    };

    if (liveTime) insertData.live_time = new Date(liveTime).toISOString();
    if (closingTime) insertData.closing_time = new Date(closingTime).toISOString();
    if (uploadedUrl) insertData.image_url = uploadedUrl;

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
    setTeamA(""); setTeamB(""); setOddsA("0.95"); setOddsB("0.95"); setMaxBet("10000");
    setMatchDate(""); setLiveTime(""); setClosingTime(""); setImageUrl(""); setImageFile(null); setImagePreview(null);
    toast({ title: "✅ Match created!" });
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
        toast({ title: "✅ Migration applied!" });
        setShowMigrationPanel(false);
      } else if (result.manual) {
        toast({ title: "⚠️ Run SQL manually", description: "Copy the SQL below and run it in Supabase Dashboard", variant: "destructive" });
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
      team_a_name: m.team_a_name,
      team_b_name: m.team_b_name,
      odds_a: m.odds_a,
      odds_b: m.odds_b,
      max_bet: m.max_bet,
      match_date: m.match_date.slice(0, 16),
      live_time: m.live_time ? m.live_time.slice(0, 16) : "",
      closing_time: m.closing_time ? m.closing_time.slice(0, 16) : "",
      image_url: m.image_url || "",
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
    toast({ title: "✅ Match updated!" });
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
    toast({ title: "🏆 Match settled!" });
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
    toast({ title: "❌ Match cancelled. Bets refunded." });
    fetchMatches();
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("matches").delete().eq("id", id);
    toast({ title: "Match deleted" });
    fetchMatches();
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    const { type, matchId } = confirmAction;
    if (type === "winA") handleSetWinner(matchId, "A");
    else if (type === "winB") handleSetWinner(matchId, "B");
    else if (type === "cancel") handleCancel(matchId);
    else if (type === "delete") handleDelete(matchId);
    setConfirmAction(null);
  };

  const statusBadge = (status: string) => {
    const cls = status === "live" ? "bg-red-500/15 text-red-400 border border-red-500/30" :
      status === "closed" ? "bg-muted text-muted-foreground border border-border/50" :
      status === "cancelled" ? "bg-purple-500/10 text-purple-400 border border-purple-500/30" :
      "bg-primary/10 text-primary border border-primary/30";
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{status.toUpperCase()}</span>;
  };

  const filteredMatches = matches.filter((m) => {
    const statusOk = statusFilter === "all" || m.status === statusFilter;
    const dateOk = !dateFilter || m.match_date.slice(0, 10) === dateFilter;
    return statusOk && dateOk;
  });
  const statusTabs = ["all", "upcoming", "live", "closed", "cancelled"];

  return (
    <div>
      {/* Migration Panel */}
      <AnimatePresence>
        {showMigrationPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3 mb-3">
                <Database className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-400">Database Schema Update Required</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The matches table needs new columns for live time, closing time and image URL. Run this SQL in your{" "}
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline">
                      Supabase SQL Editor
                    </a>
                    :
                  </p>
                </div>
              </div>
              <pre className="text-xs bg-black/40 rounded-lg p-3 text-emerald-400 mb-3 whitespace-pre-wrap font-mono">{MIGRATION_SQL}</pre>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 gap-1.5" onClick={copyMigrationSQL}>
                  <Copy className="h-3.5 w-3.5" /> Copy SQL
                </Button>
                <Button size="sm" className="gradient-neon-primary text-primary-foreground gap-1.5" onClick={runMigration} disabled={migrating}>
                  {migrating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running...</> : <><Database className="h-3.5 w-3.5" /> Try Auto-Migrate</>}
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setShowMigrationPanel(false)}>
                  <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters + Create */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((t) => (
              <button key={t} onClick={() => setStatusFilter(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  statusFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t !== "all" && <span className="ml-1 opacity-60">({matches.filter(m => m.status === t).length})</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground font-medium">Date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg border border-border/50 bg-secondary/50 transition-colors"
              >
                Clear
              </button>
            )}
            {dateFilter && (
              <span className="text-xs text-primary font-semibold">
                {filteredMatches.length} match{filteredMatches.length !== 1 ? "es" : ""} on {new Date(dateFilter + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 gap-1.5"
            onClick={() => setShowMigrationPanel(!showMigrationPanel)}
          >
            <Database className="h-4 w-4" /> DB Setup
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="gradient-neon-primary text-primary-foreground shadow-neon">
            <Plus className="h-4 w-4 mr-1" /> New Match
          </Button>
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-primary/30 bg-card p-6 mb-6 glow-border">
              <h3 className="text-lg font-bold text-foreground mb-4">Create New Match</h3>

              <div className="space-y-4">
                {/* Teams */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Team A Name *</label>
                    <Input placeholder="e.g. Mumbai Indians" value={teamA} onChange={(e) => setTeamA(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Team B Name *</label>
                    <Input placeholder="e.g. CSK" value={teamB} onChange={(e) => setTeamB(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Odds A (e.g. 0.95)</label>
                    <Input type="number" step="0.05" value={oddsA} onChange={(e) => setOddsA(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Odds B (e.g. 0.95)</label>
                    <Input type="number" step="0.05" value={oddsB} onChange={(e) => setOddsB(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Bet (₹)</label>
                    <Input type="number" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Match Date & Time *</label>
                    <Input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="bg-secondary border-border" />
                  </div>
                </div>

                {/* Time automation */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-primary">Auto-Status Times</span>
                    <span className="text-xs text-muted-foreground">(optional — server updates status automatically)</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        🟢 Live Time — match goes LIVE at this time
                      </label>
                      <Input
                        type="datetime-local"
                        value={liveTime}
                        onChange={(e) => setLiveTime(e.target.value)}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        🔴 Closing Time — betting CLOSES at this time
                      </label>
                      <Input
                        type="datetime-local"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Image */}
                <div className="rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="h-4 w-4 text-accent" />
                    <span className="text-sm font-bold text-foreground">Match Schedule Image</span>
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Upload Image</label>
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">
                          {imageFile ? imageFile.name : "Click to upload"}
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageFile} />
                      </label>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Or paste image URL</label>
                      <Input
                        type="url"
                        placeholder="https://example.com/schedule.jpg"
                        value={imageUrl}
                        onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(null); }}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </div>

                  {(imagePreview || imageUrl) && (
                    <div className="mt-3 rounded-lg overflow-hidden max-h-36">
                      <img
                        src={imagePreview || imageUrl}
                        alt="Preview"
                        className="w-full h-36 object-cover rounded-lg"
                        onError={() => setImagePreview(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreate} disabled={saving || imageUploading} className="gradient-neon-primary text-primary-foreground gap-2">
                  {saving || imageUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create Match"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match List */}
      <div className="space-y-3">
        {filteredMatches.map((m, i) => {
          const bs = betStats.get(m.id) || { total: 0, volume: 0, teamA: 0, teamB: 0 };
          const isExpanded = expandedId === m.id;

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border/50 bg-card shadow-card overflow-hidden"
            >
              {editingId === m.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Team A</label>
                      <Input value={editData.team_a_name || ""} onChange={(e) => setEditData({ ...editData, team_a_name: e.target.value })} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Team B</label>
                      <Input value={editData.team_b_name || ""} onChange={(e) => setEditData({ ...editData, team_b_name: e.target.value })} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Odds A</label>
                      <Input type="number" step="0.05" value={editData.odds_a || ""} onChange={(e) => setEditData({ ...editData, odds_a: Number(e.target.value) })} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Odds B</label>
                      <Input type="number" step="0.05" value={editData.odds_b || ""} onChange={(e) => setEditData({ ...editData, odds_b: Number(e.target.value) })} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Max Bet</label>
                      <Input type="number" value={editData.max_bet || ""} onChange={(e) => setEditData({ ...editData, max_bet: Number(e.target.value) })} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Match Date</label>
                      <Input type="datetime-local" value={editData.match_date || ""} onChange={(e) => setEditData({ ...editData, match_date: e.target.value })} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">🟢 Live Time</label>
                      <Input type="datetime-local" value={editData.live_time || ""} onChange={(e) => setEditData({ ...editData, live_time: e.target.value })} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">🔴 Closing Time</label>
                      <Input type="datetime-local" value={editData.closing_time || ""} onChange={(e) => setEditData({ ...editData, closing_time: e.target.value })} className="bg-secondary border-border" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Image URL</label>
                      <Input type="url" value={editData.image_url || ""} onChange={(e) => setEditData({ ...editData, image_url: e.target.value })} className="bg-secondary border-border" placeholder="https://..." />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} className="gradient-neon-primary text-primary-foreground"><Save className="h-3 w-3 mr-1" /> Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-3 w-3 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  {/* Image preview */}
                  {m.image_url && (
                    <div className="mb-3 rounded-lg overflow-hidden h-24">
                      <img src={m.image_url} alt="Match" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-foreground">{m.team_a_name} vs {m.team_b_name}</p>
                      {statusBadge(m.status)}
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : m.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                    <span>{new Date(m.match_date).toLocaleString()}</span>
                    <span>Odds: {m.odds_a}x / {m.odds_b}x</span>
                    <span>Max: ₹{Number(m.max_bet).toLocaleString()}</span>
                    {m.winner && <span className="text-primary font-semibold">Winner: Team {m.winner}</span>}
                  </div>

                  {/* Auto-status times */}
                  {(m.live_time || m.closing_time) && (
                    <div className="flex flex-wrap gap-3 text-xs mb-2">
                      {m.live_time && (
                        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                          <Clock className="h-3 w-3" />
                          Live: {new Date(m.live_time).toLocaleString()}
                        </span>
                      )}
                      {m.closing_time && (
                        <span className="flex items-center gap-1 text-red-400 bg-red-500/10 rounded-full px-2 py-0.5">
                          <Clock className="h-3 w-3" />
                          Closes: {new Date(m.closing_time).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bet stats */}
                  <div className="flex items-center gap-3 mb-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <UsersIcon className="h-3 w-3" /> {bs.total} bets
                    </span>
                    <span className="text-primary font-semibold">₹{bs.volume.toLocaleString()}</span>
                    {bs.total > 0 && (
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">A:{bs.teamA}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(bs.teamA / bs.total) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">B:{bs.teamB}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {m.status === "upcoming" && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => handleStatusChange(m.id, "live")}>🔴 Go Live</Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleEdit(m)}><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>
                        <Button size="sm" variant="outline" className="text-xs border-purple-500/30 text-purple-400"
                          onClick={() => setConfirmAction({ type: "cancel", matchId: m.id, label: "Cancel this match and refund all bets?" })}>
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-destructive/30 text-destructive"
                          onClick={() => setConfirmAction({ type: "delete", matchId: m.id, label: "Permanently delete this match?" })}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </>
                    )}
                    {(m.status === "live" || m.status === "closed") && !m.winner && (
                      <>
                        {m.status === "closed" && (
                          <span className="text-[10px] text-amber-400 font-semibold w-full">⏰ Betting closed — settle the result:</span>
                        )}
                        <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary"
                          onClick={() => setConfirmAction({ type: "winA", matchId: m.id, label: `Settle: ${m.team_a_name} wins? This will pay out all winning bets.` })}>
                          <CheckCircle className="h-3 w-3 mr-1" /> {m.team_a_name} Wins
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-accent/30 text-accent"
                          onClick={() => setConfirmAction({ type: "winB", matchId: m.id, label: `Settle: ${m.team_b_name} wins? This will pay out all winning bets.` })}>
                          <CheckCircle className="h-3 w-3 mr-1" /> {m.team_b_name} Wins
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-purple-500/30 text-purple-400"
                          onClick={() => setConfirmAction({ type: "cancel", matchId: m.id, label: "Cancel this match and refund all pending bets?" })}>
                          <X className="h-3 w-3 mr-1" /> Cancel Match
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Expanded P&L details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/30 overflow-hidden"
                      >
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Match P&L Breakdown</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                          <div className="rounded-lg bg-secondary/50 border border-border/30 p-3">
                            <p className="text-muted-foreground mb-1 text-[10px]">{m.team_a_name} Bets</p>
                            <p className="text-foreground font-bold text-base">{bs.teamA}</p>
                            <p className="text-primary text-[10px] mt-0.5">₹{bs.volumeA.toLocaleString()} staked</p>
                          </div>
                          <div className="rounded-lg bg-secondary/50 border border-border/30 p-3">
                            <p className="text-muted-foreground mb-1 text-[10px]">{m.team_b_name} Bets</p>
                            <p className="text-foreground font-bold text-base">{bs.teamB}</p>
                            <p className="text-accent text-[10px] mt-0.5">₹{bs.volumeB.toLocaleString()} staked</p>
                          </div>
                          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                            <p className="text-muted-foreground mb-1 text-[10px]">If {m.team_a_name} Wins</p>
                            <p className="text-emerald-400 font-bold text-base">₹{Math.round(bs.volume - bs.payoutA).toLocaleString()}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">house profit</p>
                          </div>
                          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                            <p className="text-muted-foreground mb-1 text-[10px]">If {m.team_b_name} Wins</p>
                            <p className="text-blue-400 font-bold text-base">₹{Math.round(bs.volume - bs.payoutB).toLocaleString()}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">house profit</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          <span className="rounded-full bg-secondary/60 px-2.5 py-1">Total staked: <span className="text-primary font-bold">₹{bs.volume.toLocaleString()}</span></span>
                          <span className="rounded-full bg-secondary/60 px-2.5 py-1">Payout if A wins: <span className="text-foreground font-bold">₹{Math.round(bs.payoutA).toLocaleString()}</span></span>
                          <span className="rounded-full bg-secondary/60 px-2.5 py-1">Payout if B wins: <span className="text-foreground font-bold">₹{Math.round(bs.payoutB).toLocaleString()}</span></span>
                          <span className="rounded-full bg-secondary/60 font-mono px-2.5 py-1 truncate max-w-full">ID: {m.id.slice(0, 16)}…</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
        {filteredMatches.length === 0 && <p className="text-center text-muted-foreground py-12">No matches found.</p>}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Confirm Action
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirmAction?.label}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeConfirmAction} className="gradient-neon-primary text-primary-foreground">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMatches;
