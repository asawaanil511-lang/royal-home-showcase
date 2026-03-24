import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Coins, Plus, Minus, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UserProfile = {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  wallet_balance: number;
  created_at: string;
};

type UserBet = {
  id: string;
  match_id: string;
  team_picked: string;
  amount: number;
  odds: number;
  potential_win: number;
  result: string;
  created_at: string;
  matchName?: string;
};

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [walletAction, setWalletAction] = useState<{ userId: string; type: "set" | "add" | "deduct" } | null>(null);
  const [walletValue, setWalletValue] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);

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

    const user = users.find(u => u.user_id === walletAction.userId);
    if (!user) return;

    let newBalance: number;
    if (walletAction.type === "set") newBalance = val;
    else if (walletAction.type === "add") newBalance = user.wallet_balance + val;
    else newBalance = Math.max(0, user.wallet_balance - val);

    const { error } = await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", walletAction.userId);
    if (error) {
      toast({ title: "Failed to update wallet", description: error.message, variant: "destructive" });
      return;
    }
    setWalletAction(null);
    setWalletValue("");
    toast({ title: `💰 Wallet updated to ₹${newBalance.toLocaleString()}` });
    fetchUsers();
  };

  const loadUserBets = async (userId: string) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    setLoadingBets(true);
    const [{ data: bets }, { data: matches }] = await Promise.all([
      (supabase as any).from("bets").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      (supabase as any).from("matches").select("id, team_a_name, team_b_name"),
    ]);
    const matchMap = new Map((matches || []).map((m: any) => [m.id, `${m.team_a_name} vs ${m.team_b_name}`]));
    setUserBets((bets || []).map((b: any) => ({ ...b, matchName: matchMap.get(b.match_id) || b.match_id.slice(0, 8) })));
    setLoadingBets(false);
  };

  const resultBadge = (result: string) => {
    const cls = result === "won" ? "bg-primary/10 text-primary" :
      result === "lost" ? "bg-destructive/10 text-destructive" :
      result === "cancelled" ? "bg-[hsl(var(--neon-purple))]/10 text-[hsl(var(--neon-purple))]" :
      "bg-accent/10 text-accent";
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{result.toUpperCase()}</span>;
  };

  // Summary stats
  const totalBalance = users.reduce((s, u) => s + Number(u.wallet_balance), 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Users</p>
          <p className="text-xl font-bold text-primary">{users.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Balance</p>
          <p className="text-xl font-bold text-accent">₹{totalBalance.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Avg Balance</p>
          <p className="text-xl font-bold text-[hsl(var(--neon-cyan))]">₹{users.length ? Math.round(totalBalance / users.length).toLocaleString() : 0}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
      </div>

      <div className="space-y-2">
        {filtered.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="rounded-xl border border-border/50 bg-card shadow-card overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {(u.username || u.display_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{u.username || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.display_name || "—"} • ID: <span className="font-mono text-[10px] select-all">{u.user_id}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold text-sm">₹{Number(u.wallet_balance).toLocaleString()}</span>
                </div>
              </div>

              {/* Wallet actions */}
              <AnimatePresence>
                {walletAction?.userId === u.user_id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-2">
                        {walletAction.type === "set" ? "Set wallet to:" :
                         walletAction.type === "add" ? "Add amount:" : "Deduct amount:"}
                      </p>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={walletValue}
                          onChange={(e) => setWalletValue(e.target.value)}
                          className="w-32 h-8 bg-secondary border-border text-sm"
                          placeholder="Amount"
                        />
                        <Button size="sm" className="h-8 text-xs gradient-neon-primary text-primary-foreground" onClick={handleWalletUpdate}>
                          Confirm
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setWalletAction(null); setWalletValue(""); }}>
                          ✕
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary h-7"
                  onClick={() => { setWalletAction({ userId: u.user_id, type: "add" }); setWalletValue(""); }}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
                <Button size="sm" variant="outline" className="text-xs border-destructive/30 text-destructive h-7"
                  onClick={() => { setWalletAction({ userId: u.user_id, type: "deduct" }); setWalletValue(""); }}>
                  <Minus className="h-3 w-3 mr-1" /> Deduct
                </Button>
                <Button size="sm" variant="outline" className="text-xs border-accent/30 text-accent h-7"
                  onClick={() => { setWalletAction({ userId: u.user_id, type: "set" }); setWalletValue(String(u.wallet_balance)); }}>
                  <Coins className="h-3 w-3 mr-1" /> Set
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7"
                  onClick={() => loadUserBets(u.user_id)}>
                  <Eye className="h-3 w-3 mr-1" /> Bets
                  {expandedUser === u.user_id ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>

              {/* User bets */}
              <AnimatePresence>
                {expandedUser === u.user_id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Recent Bets</p>
                      {loadingBets ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p>
                      ) : userBets.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No bets placed</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                          {userBets.map((b) => (
                            <div key={b.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground truncate">{b.matchName}</p>
                                <p className="text-[10px] text-muted-foreground">Team {b.team_picked} • {b.odds}x • {new Date(b.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-primary font-semibold">₹{Number(b.amount).toLocaleString()}</span>
                                {resultBadge(b.result)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No users found.</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
