import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Coins, TrendingUp, ArrowUpRight, ArrowDownRight, Download, Filter } from "lucide-react";
import { motion } from "framer-motion";

type BetRow = {
  id: string; user_id: string; match_id: string; team_picked: string;
  amount: number; odds: number; potential_win: number; result: string;
  created_at: string;
  match?: { id: string; team_a_name: string; team_b_name: string };
  profile?: { username: string | null };
};

type MatchOption = { id: string; label: string };

const AdminBets = () => {
  const [bets, setBets] = useState<BetRow[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [matchFilter, setMatchFilter] = useState<string>("all");
  const [matchOptions, setMatchOptions] = useState<MatchOption[]>([]);
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

      setMatchOptions((matchesData || []).map((m: any) => ({
        id: m.id,
        label: `${m.team_a_name} vs ${m.team_b_name}`,
      })));
    };
    load();
  }, []);

  const filtered = bets.filter((b) => {
    if (filter !== "all" && b.result !== filter) return false;
    if (matchFilter !== "all" && b.match_id !== matchFilter) return false;
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

  const totalVolume = filtered.reduce((s, b) => s + Number(b.amount), 0);
  const totalWinnings = filtered.filter(b => b.result === "won").reduce((s, b) => s + Number(b.potential_win), 0);
  const totalLost = filtered.filter(b => b.result === "lost").reduce((s, b) => s + Number(b.amount), 0);
  const pendingCount = filtered.filter(b => b.result === "pending").length;

  const exportCSV = () => {
    const headers = ["User", "Match", "Team", "Amount", "Odds", "Potential Win", "Result", "Date"];
    const rows = filtered.map(b => [
      b.profile?.username || b.user_id.slice(0, 8),
      b.match ? `${b.match.team_a_name} vs ${b.match.team_b_name}` : b.match_id.slice(0, 8),
      `Team ${b.team_picked}`,
      b.amount,
      b.odds,
      b.potential_win,
      b.result,
      new Date(b.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bets-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const resultBadge = (result: string) => {
    const styles: Record<string, string> = {
      won: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      lost: "bg-red-500/10 text-red-400 border border-red-500/20",
      cancelled: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
      pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    };
    return (
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${styles[result] || "bg-secondary text-muted-foreground"}`}>
        {result.toUpperCase()}
      </span>
    );
  };

  const tabs = ["all", "pending", "won", "lost", "cancelled"] as const;

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Bets", value: filtered.length, icon: TrendingUp, color: "text-foreground" },
          { label: "Volume", value: `₹${totalVolume.toLocaleString()}`, icon: Coins, color: "text-primary" },
          { label: "Paid Out", value: `₹${totalWinnings.toLocaleString()}`, icon: ArrowUpRight, color: "text-emerald-400" },
          { label: "User Losses", value: `₹${totalLost.toLocaleString()}`, icon: ArrowDownRight, color: "text-red-400" },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="rounded-xl border border-border/40 bg-card/60 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
              </div>
              <p className={`text-lg font-extrabold ${c.color} tabular-nums`}>{c.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Result tabs */}
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button key={t} onClick={() => { setFilter(t); setPage(0); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filter === t
                  ? "bg-primary text-primary-foreground border-primary/50 shadow-sm"
                  : "bg-secondary/50 border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="ml-1 opacity-60">({bets.filter(b => t === "all" ? true : b.result === t).length})</span>
            </button>
          ))}
        </div>

        {/* Match filter */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-secondary/40 px-3 py-1.5 min-w-[180px]">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={matchFilter}
            onChange={(e) => { setMatchFilter(e.target.value); setPage(0); }}
            className="bg-transparent text-xs text-foreground outline-none flex-1 cursor-pointer"
          >
            <option value="all">All Matches</option>
            {matchOptions.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search user or match..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 h-9 bg-secondary/40 border-border/40 text-sm" />
        </div>

        {/* Export */}
        <Button size="sm" variant="outline" onClick={exportCSV}
          className="border-border/50 text-muted-foreground hover:text-foreground gap-1.5 h-9">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40 border-border/40 hover:bg-secondary/40">
              <TableHead className="text-xs font-bold text-muted-foreground">User</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Match</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Pick</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Amount</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Odds</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Potential</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Result</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((b, i) => (
              <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                <TableCell className="font-semibold text-foreground text-sm py-3">{b.profile?.username || b.user_id.slice(0, 8)}</TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-[140px] truncate">
                  {b.match ? `${b.match.team_a_name} vs ${b.match.team_b_name}` : b.match_id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-bold bg-secondary/50 border border-border/40 rounded-full px-2.5 py-0.5">
                    Team {b.team_picked}
                  </span>
                </TableCell>
                <TableCell className="text-amber-400 font-bold text-sm">₹{Number(b.amount).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{b.odds}x</TableCell>
                <TableCell className="text-primary font-semibold text-sm">₹{Number(b.potential_win).toLocaleString()}</TableCell>
                <TableCell>{resultBadge(b.result)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</TableCell>
              </motion.tr>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Coins className="h-8 w-8 opacity-20" />
                    <p className="text-sm">No bets found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length} bets
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="h-8 px-3 rounded-lg text-xs font-semibold border border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                  page === i ? "bg-primary text-primary-foreground" : "border border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="h-8 px-3 rounded-lg text-xs font-semibold border border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBets;
