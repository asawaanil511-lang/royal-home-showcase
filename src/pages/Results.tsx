import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy, Calendar, Users, TrendingUp, CheckCircle2, XCircle,
  Search, Filter, Target, ArrowUpRight, Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ClosedMatch = {
  id: string;
  team_a_name: string;
  team_b_name: string;
  odds_a: number;
  odds_b: number;
  max_bet: number;
  match_date: string;
  closing_time?: string | null;
  status: string;
  winner: string | null;
  image_url?: string | null;
  match_title?: string | null;
};

type BetStat = {
  total: number;
  volume: number;
  teamA: number;
  teamB: number;
};

const getAbbr = (name: string) => {
  const skip = new Set(["the", "of", "and", "women", "men", "a"]);
  const words = name.split(/\s+/).filter((w) => w.length > 1 && !skip.has(w.toLowerCase()));
  if (!words.length) return name.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (words.length >= 3) return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
};

const TEAM_GRADIENTS = [
  { from: "#00d4b4", to: "#0099ff" },
  { from: "#f97316", to: "#ef4444" },
  { from: "#a855f7", to: "#6366f1" },
  { from: "#22c55e", to: "#14b8a6" },
  { from: "#eab308", to: "#f97316" },
  { from: "#ec4899", to: "#a855f7" },
  { from: "#06b6d4", to: "#3b82f6" },
  { from: "#84cc16", to: "#22c55e" },
];

const hashGradient = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return TEAM_GRADIENTS[Math.abs(h) % TEAM_GRADIENTS.length];
};

const TeamBubble = ({ name, isWinner }: { name: string; isWinner: boolean }) => {
  const { from, to } = hashGradient(name);
  const abbr = getAbbr(name);
  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 transition-opacity ${!isWinner ? "opacity-35" : ""}`}>
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full text-xs font-black"
        style={{
          background: isWinner ? `linear-gradient(135deg, ${from}22, ${to}18)` : "hsl(var(--secondary))",
          border: isWinner ? `2px solid ${from}60` : "2px solid hsl(var(--border))",
          boxShadow: isWinner ? `0 0 16px ${from}35` : "none",
        }}
      >
        <span
          className="font-black text-[11px] tracking-tight"
          style={isWinner
            ? { background: `linear-gradient(135deg, ${from}, ${to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
            : { color: "hsl(var(--muted-foreground))" }
          }
        >
          {abbr}
        </span>
      </div>
      <p className={`text-xs font-bold text-center leading-tight max-w-[72px] truncate ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
        {name}
      </p>
      {isWinner && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
          <Crown className="h-2 w-2" /> WINNER
        </span>
      )}
    </div>
  );
};

const Results = () => {
  const [matches, setMatches] = useState<ClosedMatch[]>([]);
  const [betStats, setBetStats] = useState<Map<string, BetStat>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "settled" | "cancelled">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      const [{ data: matchData }, { data: betsData }] = await Promise.all([
        (supabase as any).from("matches").select("*").in("status", ["closed", "cancelled"]).order("closing_time", { ascending: false, nullsFirst: false }),
        (supabase as any).from("bets").select("match_id, amount, team_picked").neq("result", "cancelled"),
      ]);
      setMatches((matchData as ClosedMatch[]) || []);
      const statsMap = new Map<string, BetStat>();
      (betsData || []).forEach((b: any) => {
        const e = statsMap.get(b.match_id) || { total: 0, volume: 0, teamA: 0, teamB: 0 };
        e.total += 1;
        e.volume += Number(b.amount || 0);
        if (b.team_picked === "A") e.teamA += 1; else e.teamB += 1;
        statsMap.set(b.match_id, e);
      });
      setBetStats(statsMap);
      setLoading(false);
    };
    fetchResults();
  }, []);

  const filtered = matches.filter((m) => {
    const filterOk =
      filter === "all" ||
      (filter === "settled" && m.status === "closed") ||
      (filter === "cancelled" && m.status === "cancelled");
    const searchOk =
      !search ||
      m.team_a_name.toLowerCase().includes(search.toLowerCase()) ||
      m.team_b_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.match_title || "").toLowerCase().includes(search.toLowerCase());
    return filterOk && searchOk;
  });

  const settledCount = matches.filter((m) => m.status === "closed").length;
  const cancelledCount = matches.filter((m) => m.status === "cancelled").length;
  const totalVolume = Array.from(betStats.values()).reduce((s, b) => s + b.volume, 0);
  const totalBets = Array.from(betStats.values()).reduce((s, b) => s + b.total, 0);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />

      {/* Header */}
      <div className="border-b border-border/40 bg-card/50">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Match Results</h1>
              <p className="text-sm text-muted-foreground">Final toss outcomes & bet results</p>
            </div>
          </div>

          {/* Summary stats */}
          {!loading && matches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2"
            >
              {[
                { label: "Settled", value: settledCount, icon: CheckCircle2, color: "text-emerald-500", border: "border-emerald-500/20 bg-emerald-500/5" },
                { label: "Cancelled", value: cancelledCount, icon: XCircle, color: "text-purple-500", border: "border-purple-500/20 bg-purple-500/5" },
                { label: "Bets", value: totalBets, icon: Target, color: "text-primary", border: "border-primary/20 bg-primary/5" },
                { label: "Volume", value: `₹${totalVolume >= 1000 ? (totalVolume / 1000).toFixed(1) + "k" : totalVolume}`, icon: TrendingUp, color: "text-amber-500", border: "border-amber-500/20 bg-amber-500/5" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-2.5 text-center ${s.border}`}>
                  <s.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${s.color}`} />
                  <p className={`text-base font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 max-w-2xl">
        {/* Search + Filter */}
        {!loading && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 space-y-3"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams or tournament..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {(["all", "settled", "cancelled"] as const).map((f) => {
                const active = filter === f;
                const styles = {
                  all: active ? "gradient-neon-primary text-primary-foreground border-transparent shadow-neon" : "bg-background border-border text-foreground",
                  settled: active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40" : "bg-background border-border text-foreground",
                  cancelled: active ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/40" : "bg-background border-border text-foreground",
                };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:text-foreground ${styles[f]}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Match cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 rounded-2xl shimmer-bg border border-border/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card">
              <Trophy className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{search ? "No matches found" : "No results yet"}</p>
              <p className="text-muted-foreground text-sm mt-1">{search ? "Try a different search term." : "Results will appear here after matches are settled."}</p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {filtered.map((m, i) => {
                const bs = betStats.get(m.id) || { total: 0, volume: 0, teamA: 0, teamB: 0 };
                const winnerName = m.winner === "A" ? m.team_a_name : m.winner === "B" ? m.team_b_name : null;
                const isCancelled = m.status === "cancelled";
                const teamAPct = bs.total > 0 ? (bs.teamA / bs.total) * 100 : 50;
                const { from: winnerColor } = hashGradient(winnerName || "");

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-2xl border bg-card overflow-hidden transition-all hover:border-primary/40 ${
                      isCancelled ? "border-border/70" : "border-border"
                    }`}
                  >
                    {/* Top accent strip */}
                    <div className={`h-0.5 w-full ${isCancelled ? "bg-purple-500/40" : "bg-gradient-to-r from-amber-400/60 via-primary/60 to-emerald-400/60"}`} />

                    {/* Match image */}
                    {m.image_url && (
                      <div className="relative h-28 overflow-hidden">
                        <img src={m.image_url} alt="Match" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-card/80" />
                        {m.match_title && (
                          <div className="absolute bottom-2 left-3">
                            <p className="text-xs font-bold text-white drop-shadow-sm">{m.match_title}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4">
                      {/* Match title + status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          {m.match_title && !m.image_url && (
                            <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5 truncate">{m.match_title}</p>
                          )}
                          <p className="font-extrabold text-foreground text-sm leading-snug">
                            {m.team_a_name} <span className="text-muted-foreground font-normal text-xs">vs</span> {m.team_b_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(m.match_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-full shrink-0">
                            <XCircle className="h-3 w-3" /> CANCELLED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> SETTLED
                          </span>
                        )}
                      </div>

                      {/* Teams VS */}
                      {!isCancelled ? (
                        <div className="rounded-xl bg-secondary border border-border/60 p-3 mb-3 flex items-center justify-between gap-3">
                          <TeamBubble name={m.team_a_name} isWinner={m.winner === "A"} />
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-[10px] font-bold text-muted-foreground">VS</div>
                            <div className="text-[9px] text-muted-foreground/60 text-center">
                              <div>{m.odds_a}x</div>
                              <div>{m.odds_b}x</div>
                            </div>
                          </div>
                          <TeamBubble name={m.team_b_name} isWinner={m.winner === "B"} />
                        </div>
                      ) : (
                        <div className="rounded-xl bg-purple-500/5 border border-purple-500/15 p-3 mb-3 flex items-center justify-between">
                          <p className="text-sm font-medium text-muted-foreground">{m.team_a_name} vs {m.team_b_name}</p>
                          <span className="text-[10px] text-purple-500 font-semibold">Bets refunded</span>
                        </div>
                      )}

                      {/* Winner banner */}
                      {winnerName && (
                        <div
                          className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 mb-3"
                          style={{ background: `linear-gradient(135deg, ${winnerColor}12, ${winnerColor}06)`, border: `1px solid ${winnerColor}35` }}
                        >
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <p className="text-sm font-bold text-foreground">{winnerName} <span className="text-muted-foreground font-normal text-xs">won the toss</span></p>
                        </div>
                      )}

                      {/* Bet stats */}
                      {bs.total > 0 && (
                        <div className="rounded-xl border border-border/60 bg-secondary/60 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span className="font-semibold text-foreground">{bs.total}</span> bets placed
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              <span className="font-bold text-primary">₹{bs.volume.toLocaleString()}</span> volume
                            </span>
                          </div>
                          {bs.total > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span className="font-medium">{m.team_a_name} ({bs.teamA})</span>
                                <span className="font-medium">({bs.teamB}) {m.team_b_name}</span>
                              </div>
                              <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
                                <div
                                  className="h-full rounded-l-full transition-all"
                                  style={{ width: `${teamAPct}%`, background: "hsl(var(--primary))" }}
                                />
                                <div className="h-full rounded-r-full flex-1" style={{ background: "hsl(var(--accent))" }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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

export default Results;
