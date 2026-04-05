import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Coins, Plus, Minus, Eye, ChevronDown, ChevronUp, History, Loader2, ArrowUpRight, ArrowDownRight, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UserProfile = {
  id: string; user_id: string; username: string | null;
  display_name: string | null; wallet_balance: number; created_at: string;
};

type UserBet = {
  id: string; match_id: string; team_picked: string; amount: number;
  odds: number; potential_win: number; result: string; created_at: string; matchName?: string;
};

type WalletTx = {
  id: string; action: string; amount: number; balance_before: number;
  balance_after: number; note: string | null; created_at: string;
};

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const expiresAt = session?.expires_at ?? 0;
  const nowSec = Math.floor(Date.now() / 1000);
  if (!session || expiresAt - nowSec < 60) {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token ?? "";
  }
  return session.access_token ?? "";
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [walletAction, setWalletAction] = useState<{ userId: string; type: "set" | "add" | "deduct" } | null>(null);
  const [walletValue, setWalletValue] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState<"bets" | "history">("bets");
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [walletHistory, setWalletHistory] = useState<WalletTx[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as UserProfile[]) || []);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.username || "").toLowerCase().includes(q) || (u.display_name || "").toLowerCase().includes(q);
  });

  const handleWalletUpdate = async () => {
    if (!walletAction) return;
    const val = Number(walletValue);
    if (isNaN(val) || val < 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }

    setWalletSaving(true);
    const token = await getToken();
    const res = await fetch(apiUrl("/api/admin-wallet"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: walletAction.userId, action: walletAction.type, amount: val, note: walletNote || null }),
    });
    const data = await res.json();
    setWalletSaving(false);

    if (!res.ok || data.error) {
      toast({ title: "Failed to update wallet", description: data.error, variant: "destructive" });
      return;
    }

    setWalletAction(null); setWalletValue(""); setWalletNote("");
    toast({ title: `💰 Wallet updated → ₹${data.balance_after?.toLocaleString()}` });
    fetchUsers();
  };

  const toggleExpanded = async (userId: string, view: "bets" | "history") => {
    if (expandedUser === userId && expandedView === view) { setExpandedUser(null); return; }
    setExpandedUser(userId); setExpandedView(view); setLoadingDetail(true);

    if (view === "bets") {
      const [{ data: bets }, { data: matches }] = await Promise.all([
        (supabase as any).from("bets").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        (supabase as any).from("matches").select("id, team_a_name, team_b_name"),
      ]);
      const matchMap = new Map((matches || []).map((m: any) => [m.id, `${m.team_a_name} vs ${m.team_b_name}`]));
      setUserBets((bets || []).map((b: any) => ({ ...b, matchName: matchMap.get(b.match_id) || b.match_id.slice(0, 8) })));
    } else {
      const token = await getToken();
      const res = await fetch(apiUrl(`/api/wallet-history/${userId}`), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setWalletHistory(data.transactions || []);
    }
    setLoadingDetail(false);
  };

  const resultBadge = (result: string) => {
    const styles: Record<string, string> = {
      won: "bg-emerald-500/10 text-emerald-400", lost: "bg-red-500/10 text-red-400",
      cancelled: "bg-purple-500/10 text-purple-400", pending: "bg-amber-500/10 text-amber-400",
    };
    return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${styles[result] || "bg-secondary text-muted-foreground"}`}>{result.toUpperCase()}</span>;
  };

  const actionIcon = (action: string) => {
    if (action === "add") return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />;
    if (action === "deduct") return <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />;
    return <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />;
  };

  const totalBalance = users.reduce((s, u) => s + Number(u.wallet_balance), 0);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.length, color: "text-primary" },
          { label: "Total Balance", value: `₹${totalBalance.toLocaleString()}`, color: "text-amber-400" },
          { label: "Avg Balance", value: `₹${users.length ? Math.round(totalBalance / users.length).toLocaleString() : 0}`, color: "text-cyan-400" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border/40 bg-card/60 p-4 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">{c.label}</p>
            <p className={`text-xl font-extrabold ${c.color} tabular-nums`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by username..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/40 border-border/40" />
      </div>

      {/* User list */}
      <div className="space-y-2.5">
        {filtered.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
            <div className="p-4">
              {/* User header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                    {(u.username || u.display_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{u.username || "—"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {u.display_name || "—"} · <span className="font-mono">{u.user_id.slice(0, 12)}…</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground">Balance</p>
                    <p className="text-sm font-extrabold text-amber-400 tabular-nums">₹{Number(u.wallet_balance).toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-extrabold text-amber-400 tabular-nums sm:hidden">₹{Number(u.wallet_balance).toLocaleString()}</p>
                </div>
              </div>

              {/* Wallet action form */}
              <AnimatePresence>
                {walletAction?.userId === u.user_id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {walletAction.type === "set" ? "Set balance to:" : walletAction.type === "add" ? "Add to balance:" : "Deduct from balance:"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Input type="number" value={walletValue} onChange={(e) => setWalletValue(e.target.value)}
                          className="w-32 h-9 bg-secondary/40 border-border/40 text-sm" placeholder="Amount" />
                        <Input value={walletNote} onChange={(e) => setWalletNote(e.target.value)}
                          className="flex-1 min-w-[120px] h-9 bg-secondary/40 border-border/40 text-sm" placeholder="Note (optional)" />
                        <Button size="sm" className="h-9 gradient-neon-primary text-primary-foreground gap-1.5" onClick={handleWalletUpdate} disabled={walletSaving}>
                          {walletSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          Confirm
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 border-border/40" onClick={() => { setWalletAction(null); setWalletValue(""); setWalletNote(""); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Button size="sm" variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 h-7 hover:bg-emerald-500/10 gap-1"
                  onClick={() => { setWalletAction({ userId: u.user_id, type: "add" }); setWalletValue(""); }}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
                <Button size="sm" variant="outline" className="text-xs border-red-500/30 text-red-400 h-7 hover:bg-red-500/10 gap-1"
                  onClick={() => { setWalletAction({ userId: u.user_id, type: "deduct" }); setWalletValue(""); }}>
                  <Minus className="h-3 w-3" /> Deduct
                </Button>
                <Button size="sm" variant="outline" className="text-xs border-blue-500/30 text-blue-400 h-7 hover:bg-blue-500/10 gap-1"
                  onClick={() => { setWalletAction({ userId: u.user_id, type: "set" }); setWalletValue(String(u.wallet_balance)); }}>
                  <Coins className="h-3 w-3" /> Set
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7 border-border/40 gap-1"
                  onClick={() => toggleExpanded(u.user_id, "bets")}>
                  <Eye className="h-3 w-3" /> Bets
                  {expandedUser === u.user_id && expandedView === "bets" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7 border-border/40 gap-1"
                  onClick={() => toggleExpanded(u.user_id, "history")}>
                  <History className="h-3 w-3" /> Wallet Log
                  {expandedUser === u.user_id && expandedView === "history" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>

              {/* Expanded detail panel */}
              <AnimatePresence>
                {expandedUser === u.user_id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 pt-3 border-t border-border/30">
                      {loadingDetail ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : expandedView === "bets" ? (
                        <>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Recent Bets</p>
                          {userBets.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">No bets placed</p>
                          ) : (
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                              {userBets.map((b) => (
                                <div key={b.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-foreground truncate font-medium">{b.matchName}</p>
                                    <p className="text-[10px] text-muted-foreground">Team {b.team_picked} · {b.odds}x · {new Date(b.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} {new Date(b.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <span className="text-amber-400 font-bold">₹{Number(b.amount).toLocaleString()}</span>
                                    {resultBadge(b.result)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Wallet Transaction Log</p>
                          {walletHistory.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">No admin transactions yet</p>
                          ) : (
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                              {walletHistory.map((tx) => (
                                <div key={tx.id} className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                                  <div className="shrink-0">{actionIcon(tx.action)}</div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-foreground font-medium capitalize">
                                      {tx.action} ₹{Number(tx.amount).toLocaleString()}
                                      {tx.note && <span className="text-muted-foreground font-normal"> — {tx.note}</span>}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {new Date(tx.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-[10px] text-muted-foreground">₹{Number(tx.balance_before).toLocaleString()}</p>
                                    <p className="font-bold text-amber-400">→ ₹{Number(tx.balance_after).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
