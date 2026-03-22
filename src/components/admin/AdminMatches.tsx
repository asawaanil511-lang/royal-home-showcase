import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Trash2, X, Edit2, Save, AlertTriangle, Users as UsersIcon, Eye } from "lucide-react";
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
};

type MatchBetStats = { total: number; volume: number; teamA: number; teamB: number };

const AdminMatches = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<DBMatch[]>([]);
  const [betStats, setBetStats] = useState<Map<string, MatchBetStats>>(new Map());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DBMatch>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{ type: string; matchId: string; label: string } | null>(null);

  // Create form
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [oddsA, setOddsA] = useState("1.90");
  const [oddsB, setOddsB] = useState("1.90");
  const [maxBet, setMaxBet] = useState("10000");
  const [matchDate, setMatchDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMatches = async () => {
    const [{ data: matchesData }, { data: betsData }] = await Promise.all([
      (supabase as any).from("matches").select("*").order("match_date", { ascending: false }),
      (supabase as any).from("bets").select("match_id, amount, team_picked, result"),
    ]);
    setMatches((matchesData as DBMatch[]) || []);

    // Build bet stats per match
    const statsMap = new Map<string, MatchBetStats>();
    (betsData || []).forEach((b: any) => {
      const existing = statsMap.get(b.match_id) || { total: 0, volume: 0, teamA: 0, teamB: 0 };
      existing.total += 1;
      existing.volume += Number(b.amount || 0);
      if (b.team_picked === "A") existing.teamA += 1;
      else existing.teamB += 1;
      statsMap.set(b.match_id, existing);
    });
    setBetStats(statsMap);
  };

  useEffect(() => { fetchMatches(); }, []);

  const handleCreate = async () => {
    if (!teamA || !teamB || !matchDate) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    await (supabase as any).from("matches").insert({
      team_a_name: teamA, team_b_name: teamB,
      odds_a: Number(oddsA), odds_b: Number(oddsB),
      max_bet: Number(maxBet),
      match_date: new Date(matchDate).toISOString(), status: "upcoming",
    });
    setSaving(false);
    setShowForm(false);
    setTeamA(""); setTeamB(""); setOddsA("1.90"); setOddsB("1.90"); setMaxBet("10000"); setMatchDate("");
    toast({ title: "✅ Match created!" });
    fetchMatches();
  };

  const handleEdit = (m: DBMatch) => {
    setEditingId(m.id);
    setEditData({
      team_a_name: m.team_a_name, team_b_name: m.team_b_name,
      odds_a: m.odds_a, odds_b: m.odds_b, max_bet: m.max_bet,
      match_date: m.match_date.slice(0, 16),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const update: any = { ...editData };
    if (update.match_date) update.match_date = new Date(update.match_date).toISOString();
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
        await (supabase as any).from("bets").update({
          result: won ? "won" : "lost",
          settled_at: new Date().toISOString(),
        }).eq("id", bet.id);
        if (won) {
          const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", bet.user_id).single();
          if (profile) {
            await supabase.from("profiles").update({
              wallet_balance: profile.wallet_balance + bet.potential_win,
            }).eq("user_id", bet.user_id);
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
          await supabase.from("profiles").update({
            wallet_balance: profile.wallet_balance + Number(bet.amount),
          }).eq("user_id", bet.user_id);
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
    const cls = status === "live" ? "bg-destructive/10 text-destructive border border-destructive/30" :
      status === "closed" ? "bg-muted text-muted-foreground border border-border/50" :
      status === "cancelled" ? "bg-[hsl(var(--neon-purple))]/10 text-[hsl(var(--neon-purple))] border border-[hsl(var(--neon-purple))]/30" :
      "bg-primary/10 text-primary border border-primary/30";
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{status.toUpperCase()}</span>;
  };

  const filteredMatches = statusFilter === "all" ? matches : matches.filter(m => m.status === statusFilter);
  const statusTabs = ["all", "upcoming", "live", "closed", "cancelled"];

  return (
    <div>
      {/* Filters + Create */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
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
        <Button onClick={() => setShowForm(!showForm)} className="gradient-neon-primary text-primary-foreground shadow-neon">
          <Plus className="h-4 w-4 mr-1" /> New Match
        </Button>
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
              <h3 className="text-lg font-bold text-foreground mb-4">Create Match</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="Team A name" value={teamA} onChange={(e) => setTeamA(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Team B name" value={teamB} onChange={(e) => setTeamB(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Odds A" type="number" step="0.05" value={oddsA} onChange={(e) => setOddsA(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Odds B" type="number" step="0.05" value={oddsB} onChange={(e) => setOddsB(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Max Bet" type="number" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} className="bg-secondary border-border" />
                <Input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreate} disabled={saving} className="gradient-neon-primary text-primary-foreground">
                  {saving ? "Creating..." : "Create Match"}
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
                    <Input value={editData.team_a_name || ""} onChange={(e) => setEditData({ ...editData, team_a_name: e.target.value })} className="bg-secondary border-border" placeholder="Team A" />
                    <Input value={editData.team_b_name || ""} onChange={(e) => setEditData({ ...editData, team_b_name: e.target.value })} className="bg-secondary border-border" placeholder="Team B" />
                    <Input type="number" step="0.05" value={editData.odds_a || ""} onChange={(e) => setEditData({ ...editData, odds_a: Number(e.target.value) })} className="bg-secondary border-border" placeholder="Odds A" />
                    <Input type="number" step="0.05" value={editData.odds_b || ""} onChange={(e) => setEditData({ ...editData, odds_b: Number(e.target.value) })} className="bg-secondary border-border" placeholder="Odds B" />
                    <Input type="number" value={editData.max_bet || ""} onChange={(e) => setEditData({ ...editData, max_bet: Number(e.target.value) })} className="bg-secondary border-border" placeholder="Max Bet" />
                    <Input type="datetime-local" value={editData.match_date || ""} onChange={(e) => setEditData({ ...editData, match_date: e.target.value })} className="bg-secondary border-border" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} className="gradient-neon-primary text-primary-foreground"><Save className="h-3 w-3 mr-1" /> Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-3 w-3 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-foreground">{m.team_a_name} vs {m.team_b_name}</p>
                      {statusBadge(m.status)}
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                    <span>{new Date(m.match_date).toLocaleString()}</span>
                    <span>Odds: {m.odds_a}x / {m.odds_b}x</span>
                    <span>Max: ₹{Number(m.max_bet).toLocaleString()}</span>
                    {m.winner && <span className="text-primary font-semibold">Winner: Team {m.winner}</span>}
                  </div>

                  {/* Bet stats bar */}
                  <div className="flex items-center gap-3 mb-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <UsersIcon className="h-3 w-3" /> {bs.total} bets
                    </span>
                    <span className="text-primary font-semibold">₹{bs.volume.toLocaleString()}</span>
                    {bs.total > 0 && (
                      <div className="flex-1 flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">A:{bs.teamA}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${(bs.teamA / bs.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">B:{bs.teamB}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {m.status === "upcoming" && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary" onClick={() => handleStatusChange(m.id, "live")}>🔴 Go Live</Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleEdit(m)}><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>
                        <Button size="sm" variant="outline" className="text-xs border-[hsl(var(--neon-purple))]/30 text-[hsl(var(--neon-purple))]"
                          onClick={() => setConfirmAction({ type: "cancel", matchId: m.id, label: "Cancel this match and refund all bets?" })}>
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-destructive/30 text-destructive"
                          onClick={() => setConfirmAction({ type: "delete", matchId: m.id, label: "Permanently delete this match?" })}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </>
                    )}
                    {m.status === "live" && !m.winner && (
                      <>
                        <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary"
                          onClick={() => setConfirmAction({ type: "winA", matchId: m.id, label: `Settle match: ${m.team_a_name} wins? This will pay out all winning bets.` })}>
                          <CheckCircle className="h-3 w-3 mr-1" /> {m.team_a_name} Wins
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-accent/30 text-accent"
                          onClick={() => setConfirmAction({ type: "winB", matchId: m.id, label: `Settle match: ${m.team_b_name} wins? This will pay out all winning bets.` })}>
                          <CheckCircle className="h-3 w-3 mr-1" /> {m.team_b_name} Wins
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-[hsl(var(--neon-purple))]/30 text-[hsl(var(--neon-purple))]"
                          onClick={() => setConfirmAction({ type: "cancel", matchId: m.id, label: "Cancel this match and refund all pending bets?" })}>
                          <X className="h-3 w-3 mr-1" /> Cancel Match
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/30 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-muted-foreground mb-1">Team A Bets</p>
                            <p className="text-foreground font-bold text-lg">{bs.teamA}</p>
                          </div>
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-muted-foreground mb-1">Team B Bets</p>
                            <p className="text-foreground font-bold text-lg">{bs.teamB}</p>
                          </div>
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-muted-foreground mb-1">Total Volume</p>
                            <p className="text-primary font-bold text-lg">₹{bs.volume.toLocaleString()}</p>
                          </div>
                          <div className="rounded-lg bg-secondary/50 p-3">
                            <p className="text-muted-foreground mb-1">Match ID</p>
                            <p className="text-foreground font-mono text-[10px] break-all">{m.id}</p>
                          </div>
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
