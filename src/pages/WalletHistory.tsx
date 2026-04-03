import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft, ArrowUpRight, RotateCcw, Trophy, XCircle, Clock,
  SlidersHorizontal, Download, Search, Loader2, Wallet, FileSpreadsheet,
  CalendarRange, TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type TxType = "add" | "deduct" | "set" | "placed" | "won" | "lost" | "refunded";

type Tx = {
  id: string;
  type: TxType;
  amount: string;
  balance_before: string | null;
  balance_after: string | null;
  note: string | null;
  created_at: string;
  match_name: string | null;
  team_picked: string | null;
  odds: string | null;
  result: string | null;
};

const TYPE_CFG: Record<TxType, { label: string; icon: any; color: string; bg: string; border: string; sign: "+" | "-" | "=" }> = {
  add:      { label: "Deposit",    icon: ArrowUpRight,  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", sign: "+" },
  deduct:   { label: "Withdrawal", icon: ArrowDownLeft, color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     sign: "-" },
  set:      { label: "Set",        icon: RotateCcw,     color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20",     sign: "=" },
  placed:   { label: "Bet Placed", icon: Clock,         color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   sign: "-" },
  won:      { label: "Bet Won",    icon: Trophy,        color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", sign: "+" },
  lost:     { label: "Bet Lost",   icon: XCircle,       color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     sign: "-" },
  refunded: { label: "Refunded",   icon: RotateCcw,     color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20",     sign: "+" },
};

const ALL_TYPES: TxType[] = ["add", "deduct", "set", "placed", "won", "lost", "refunded"];

const fmt = (v: number) =>
  "₹" + Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const WalletHistory = () => {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TxType | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const params = new URLSearchParams();
    if (fromDate) params.set("from_date", fromDate);
    if (toDate) params.set("to_date", toDate);
    const res = await fetch(apiUrl(`/api/my-wallet-history?${params}`), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTxs(data.transactions || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [user, fromDate, toDate]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return txs.filter((t) => {
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchSearch = !q || (t.match_name || "").toLowerCase().includes(q) || (t.note || "").toLowerCase().includes(q) || t.type.includes(q);
      return matchType && matchSearch;
    });
  }, [txs, typeFilter, search]);

  const stats = useMemo(() => {
    const totalIn  = filtered.filter(t => ["add", "won", "refunded"].includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = filtered.filter(t => ["deduct", "placed", "lost"].includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    return { totalIn, totalOut, net: totalIn - totalOut, count: filtered.length };
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["Date", "Type", "Amount", "Balance Before", "Balance After", "Match", "Note"];
    const rows = filtered.map((t) => {
      const cfg = TYPE_CFG[t.type];
      return [
        fmtDate(t.created_at),
        cfg?.label ?? t.type,
        `${cfg?.sign ?? ""}${Number(t.amount).toFixed(2)}`,
        t.balance_before ?? "",
        t.balance_after ?? "",
        t.match_name ?? "",
        t.note ?? "",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const headers = ["Date", "Type", "Amount", "Balance Before", "Balance After", "Match", "Note"];
    const rows = filtered.map((t) => {
      const cfg = TYPE_CFG[t.type];
      return [
        fmtDate(t.created_at),
        cfg?.label ?? t.type,
        `${cfg?.sign ?? ""}${Number(t.amount).toFixed(2)}`,
        t.balance_before != null ? Number(t.balance_before).toFixed(2) : "",
        t.balance_after != null ? Number(t.balance_after).toFixed(2) : "",
        t.match_name ?? "",
        t.note ?? "",
      ];
    });
    let tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
    const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-history-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Wallet className="h-14 w-14 text-zinc-600" />
          <p className="text-lg font-bold text-white">Login to view your transaction history</p>
          <Button className="bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-full px-8" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />

      <div className="container mx-auto px-4 py-5 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
              <TrendingUp className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white leading-tight">Transaction History</h1>
              <p className="text-xs text-zinc-500">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                showFilters ? "border-sky-500/50 bg-sky-500/10 text-sky-400" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              title="Export Excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-1">Total In</p>
            <p className="text-sm font-extrabold text-emerald-400">{fmt(stats.totalIn)}</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-1">Total Out</p>
            <p className="text-sm font-extrabold text-red-400">{fmt(stats.totalOut)}</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-1">Net</p>
            <p className={`text-sm font-extrabold ${stats.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {stats.net >= 0 ? "+" : "-"}{fmt(stats.net)}
            </p>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search match or note..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-sky-500/50"
                  />
                </div>

                {/* Type chips */}
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-2">Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setTypeFilter("all")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        typeFilter === "all" ? "bg-sky-500 text-white" : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    {ALL_TYPES.map((t) => {
                      const cfg = TYPE_CFG[t];
                      const active = typeFilter === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                            active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
                    <CalendarRange className="h-3 w-3" /> Date Range
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">From</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">To</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/50"
                      />
                    </div>
                  </div>
                  {(fromDate || toDate) && (
                    <button
                      onClick={() => { setFromDate(""); setToDate(""); }}
                      className="mt-2 text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                      Clear dates
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3">
            <TrendingUp className="h-14 w-14 text-zinc-700" strokeWidth={1.2} />
            <p className="text-lg font-bold text-white">No transactions found</p>
            <p className="text-sm text-zinc-500">Try adjusting your filters</p>
          </div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && (
          <AnimatePresence>
            <div className="space-y-2">
              {filtered.map((tx, i) => {
                const cfg = TYPE_CFG[tx.type] || TYPE_CFG.placed;
                const Icon = cfg.icon;
                const amount = Number(tx.amount);
                return (
                  <motion.div
                    key={tx.id + i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className={`flex items-center gap-3 rounded-2xl border ${cfg.border} ${cfg.bg} px-4 py-3`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.bg} border ${cfg.border}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                        <span className={`text-sm font-extrabold ${cfg.color}`}>
                          {cfg.sign}{fmt(amount)}
                        </span>
                      </div>
                      {tx.match_name && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {tx.match_name}
                          {tx.team_picked && <span className="text-zinc-500"> · Team {tx.team_picked}</span>}
                          {tx.odds && <span className="text-zinc-500"> · {Number(tx.odds)}x</span>}
                        </p>
                      )}
                      {tx.note && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{tx.note}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-zinc-600">{fmtDate(tx.created_at)}</span>
                        {tx.balance_before != null && tx.balance_after != null && (
                          <span className="text-[10px] text-zinc-600">
                            {fmt(Number(tx.balance_before))} → {fmt(Number(tx.balance_after))}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default WalletHistory;
