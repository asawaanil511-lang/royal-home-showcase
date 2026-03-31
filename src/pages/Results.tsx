import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Calendar, Users, TrendingUp, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ClosedMatch = {
  id: string;
  team_a_name: string;
  team_b_name: string;
  odds_a: number;
  odds_b: number;
  max_bet: number;
  match_date: string;
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

const TEAM_COLORS = [
  ["#00d4b4", "#0099ff"],
  ["#f97316", "#ef4444"],
  ["#a855f7", "#6366f1"],
  ["#22c55e", "#14b8a6"],
  ["#eab308", "#f97316"],
  ["#ec4899", "#a855f7"],
  ["#06b6d4", "#3b82f6"],
  ["#84cc16", "#22c55e"],
];

const hashColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return TEAM_COLORS[Math.abs(h) % TEAM_COLORS.length];
};

const TeamPill = ({ name, isWinner, side }: { name: string; isWinner: boolean; side: "left" | "right" }) => {
  const [c1, c2] = hashColor(name);
  const abbr = getAbbr(name);
  return (
    <div className={`flex flex-col items-center gap-2 flex-1 ${!isWinner ? "opacity-45" : ""}`}>
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full text-sm font-black transition-all"
        style={{
          background: isWinner ? `linear-gradient(135deg, ${c1}25, ${c2}20)` : "rgba(255,255,255,0.03)",
          border: isWinner ? `2px solid ${c1}60` : "2px solid rgba(255,255,255,0.08)",
          boxShadow: isWinner ? `0 0 20px ${c1}30` : "none",
        }}
      >
        {isWinner && (
          <div className="absolute inset-0 rounded-full opacity-20 blur-lg" style={{ background: `radial-gradient(circle, ${c1}, transparent 70%)` }} />
        )}
        <span className="relative font-black text-xs tracking-tight" style={{
          background: isWinner ? `linear-gradient(135deg, ${c1}, ${c2})` : "none",
          WebkitBackgroundClip: isWinner ? "text" : "unset",
          WebkitTextFillColor: isWinner ? "transparent" : "rgba(255,255,255,0.4)",
        }}>
          {abbr}
        </span>
      </div>
      <p className={`text-xs font-bold text-center leading-tight max-w-[80px] ${isWinner ? "text-white" : "text-white/40"}`}>{name}</p>
      {isWinner && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
          <Trophy className="h-2.5 w-2.5" /> WINNER
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
        (supabase as any).from("matches").select("*").in("status", ["closed", "cancelled"]).order("match_date", { ascending: false }),
        (supabase as any).from("bets").select("match_id, amount, team_picked"),
      ]);
      setMatches((matchData as ClosedMatch[]) || []);

      const statsMap = new Map<string, BetStat>();
      (betsData || []).forEach((b: any) => {
        const e = statsMap.get(b.match_id) || { total: 0, volume: 0, teamA: 0, teamB: 0 };
        e.total += 1;
        e.volume += Number(b.amount || 0);
        if (b.team_picked === "A") e.teamA += 1;
        else e.teamB += 1;
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

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-8">
        <div className="pointer-events-none absolute -left-40 top-0 h-[300px] w-[300px] rounded-full bg-amber-500/5 blur-[100px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-400">
              <Trophy className="h-4 w-4" /> Match Results
            </div>
            <h1 className="text-3xl font-extrabold text-foreground md:text-4xl mb-2">
              Closed <span className="text-neon">Matches</span>
            </h1>
            <p className="text-muted-foreground text-sm">Final results and toss outcomes</p>
          </motion.div>

          {/* Summary stats */}
          {!loading && matches.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex items-center justify-center gap-4 mt-5 flex-wrap">
              {[
                { label: "Settled", value: settledCount, color: "text-emerald-400", icon: CheckCircle2 },
                { label: "Cancelled", value: cancelledCount, color: "text-purple-400", icon: XCircle },
                { label: "Total Volume", value: `₹${totalVolume.toLocaleString()}`, color: "text-primary", icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/80 px-4 py-2.5">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
                    <p className={`text-base font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 max-w-2xl">
        {/* Filters + Search */}
        {!loading && matches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams or tournament..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <Filter className="h-4 w-4 text-muted-foreground mt-1.5 shrink-0" />
              {(["all", "settled", "cancelled"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    filter === f
                      ? f === "settled" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : f === "cancelled" ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-foreground text-background border-foreground"
                      : "bg-secondary/60 text-muted-foreground border-border/40 hover:text-foreground"
                  }`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl shimmer-bg border border-border/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card">
              <Trophy className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-bold text-foreground">{search ? "No matches found" : "No completed matches yet"}</p>
            <p className="text-muted-foreground text-sm text-center">
              {search ? "Try a different search term." : "Results will appear here after matches are settled."}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {filtered.map((m, i) => {
                const bs = betStats.get(m.id) || { total: 0, volume: 0, teamA: 0, teamB: 0 };
                const winnerName = m.winner === "A" ? m.team_a_name : m.winner === "B" ? m.team_b_name : null;
                const isCancelled = m.status === "cancelled";
                const totalPct = bs.total > 0 ? (bs.teamA / bs.total) * 100 : 50;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/20 transition-all"
                    style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.2)" }}
                  >
                    {/* Top accent line */}
                    <div className={`h-0.5 w-full ${isCancelled ? "bg-purple-500/40" : "bg-gradient-to-r from-amber-500/60 via-primary/60 to-emerald-500/60"}`} />

                    {/* Match image */}
                    {m.image_url && (
                      <div className="relative h-24 overflow-hidden">
                        <img src={m.image_url} alt="Match" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/60 to-card" />
                        {m.match_title && (
                          <div className="absolute bottom-2 left-3">
                            <p className="text-xs font-bold text-white/80 drop-shadow">{m.match_title}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5">
                      {/* Title + status */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          {m.match_title && !m.image_url && (
                            <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-0.5 truncate">{m.match_title}</p>
                          )}
                          <p className="font-extrabold text-foreground text-sm leading-snug">
                            {m.team_a_name} <span className="text-muted-foreground font-normal">vs</span> {m.team_b_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(m.match_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-full shrink-0">
                            <XCircle className="h-3 w-3" /> CANCELLED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> SETTLED
                          </span>
                        )}
                      </div>

                      {/* Teams VS display */}
                      {!isCancelled ? (
                        <div
                          className="rounded-2xl p-4 mb-4 flex items-center justify-between gap-4"
                          style={{ background: "linear-gradient(135deg, hsl(225 22% 8%) 0%, hsl(230 25% 10%) 100%)" }}
                        >
                          <TeamPill name={m.team_a_name} isWinner={m.winner === "A"} side="left" />
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold text-white/30">VS</div>
                            <div className="flex flex-col items-center text-[10px] text-muted-foreground">
                              <span>{m.odds_a}x</span>
                              <span className="text-muted-foreground/40">/</span>
                              <span>{m.odds_b}x</span>
                            </div>
                          </div>
                          <TeamPill name={m.team_b_name} isWinner={m.winner === "B"} side="right" />
                        </div>
                      ) : (
                        <div className="rounded-2xl p-3 mb-4 flex items-center justify-center gap-4 bg-purple-500/5 border border-purple-500/15">
                          <p className="text-sm font-semibold text-muted-foreground">{m.team_a_name} vs {m.team_b_name}</p>
                          <span className="text-[10px] text-purple-400">Bets refunded</span>
                        </div>
                      )}

                      {/* Winner banner */}
                      {winnerName && (
                        <div
                          className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 mb-4"
                          style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.04))", border: "1px solid rgba(234,179,8,0.25)" }}
                        >
                          <Trophy className="h-4 w-4 text-amber-400" />
                          <p className="text-sm font-bold text-amber-400">{winnerName} won the toss</p>
                        </div>
                      )}

                      {/* Bet stats */}
                      {bs.total > 0 && (
                        <div className="rounded-xl border border-border/30 bg-secondary/20 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span className="font-semibold text-foreground">{bs.total}</span> bets placed
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span className="font-bold text-primary">₹{bs.volume.toLocaleString()}</span> volume
                            </span>
                          </div>
                          {bs.total > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{m.team_a_name} ({bs.teamA})</span>
                                <span>({bs.teamB}) {m.team_b_name}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-secondary overflow-hidden flex">
                                <div className="h-full rounded-l-full bg-primary transition-all" style={{ width: `${totalPct}%` }} />
                                <div className="h-full rounded-r-full bg-accent flex-1" />
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
      </section>

      <Footer />
    </div>
  );
};

export default Results;
