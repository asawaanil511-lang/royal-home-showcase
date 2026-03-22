import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Coins, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

type BetRow = {
  id: string;
  user_id: string;
  match_id: string;
  team_picked: string;
  amount: number;
  odds: number;
  potential_win: number;
  result: string;
  created_at: string;
  match?: { team_a_name: string; team_b_name: string };
  profile?: { username: string | null };
};

const AdminBets = () => {
  const [bets, setBets] = useState<BetRow[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 20;

  useEffect(() => {
    const load = async () => {
      const { data: betsData } = await (supabase as any).from("bets").select("*").order("created_at", { ascending: false });
      const { data: matchesData } = await (supabase as any).from("matches").select("id, team_a_name, team_b_name");
      const { data: profilesData } = await supabase.from("profiles").select("user_id, username");

      const matchMap = new Map((matchesData || []).map((m: any) => [m.id, m]));
      const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));

      const enriched = (betsData || []).map((b: any) => ({
        ...b,
        match: matchMap.get(b.match_id),
        profile: profileMap.get(b.user_id),
      }));
      setBets(enriched);
    };
    load();
  }, []);

  const filtered = bets.filter((b) => {
    if (filter !== "all" && b.result !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = b.match ? `${b.match.team_a_name} vs ${b.match.team_b_name}`.toLowerCase() : "";
      const username = (b.profile?.username || "").toLowerCase();
      return matchName.includes(q) || username.includes(q);
    }
    return true;
  });

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // Summary stats
  const totalVolume = filtered.reduce((s, b) => s + Number(b.amount), 0);
  const totalWinnings = filtered.filter(b => b.result === "won").reduce((s, b) => s + Number(b.potential_win), 0);
  const totalLost = filtered.filter(b => b.result === "lost").reduce((s, b) => s + Number(b.amount), 0);

  const resultBadge = (result: string) => {
    const cls = result === "won" ? "bg-primary/10 text-primary" :
      result === "lost" ? "bg-destructive/10 text-destructive" :
      result === "cancelled" ? "bg-[hsl(var(--neon-purple))]/10 text-[hsl(var(--neon-purple))]" :
      "bg-accent/10 text-accent";
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{result.toUpperCase()}</span>;
  };

  const tabs = ["all", "pending", "won", "lost", "cancelled"] as const;

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Bets</p>
          <p className="text-lg font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Volume</p>
          <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
            <Coins className="h-3.5 w-3.5" /> ₹{totalVolume.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Winnings Paid</p>
          <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" /> ₹{totalWinnings.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">User Losses</p>
          <p className="text-lg font-bold text-destructive flex items-center justify-center gap-1">
            <ArrowDownRight className="h-3.5 w-3.5" /> ₹{totalLost.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => { setFilter(t); setPage(0); }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              filter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="ml-1 opacity-60">
              ({bets.filter(b => t === "all" ? true : b.result === t).length})
            </span>
          </button>
        ))}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by user or match..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10 bg-secondary border-border" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>User</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Pick</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Odds</TableHead>
              <TableHead>Potential</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((b, i) => (
              <motion.tr
                key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-border/30"
              >
                <TableCell className="font-medium text-foreground">{b.profile?.username || b.user_id.slice(0, 8)}</TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">
                  {b.match ? `${b.match.team_a_name} vs ${b.match.team_b_name}` : b.match_id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-foreground">Team {b.team_picked}</TableCell>
                <TableCell className="text-accent font-semibold">₹{Number(b.amount).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{b.odds}x</TableCell>
                <TableCell className="text-primary font-semibold">₹{Number(b.potential_win).toLocaleString()}</TableCell>
                <TableCell>{resultBadge(b.result)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</TableCell>
              </motion.tr>
            ))}
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bets found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-7 w-7 rounded text-xs font-semibold transition-colors ${
                  page === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBets;
