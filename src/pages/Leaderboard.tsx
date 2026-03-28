import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, TrendingUp, Crown, Star } from "lucide-react";
import { motion } from "framer-motion";

type LeaderEntry = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  total_profit: number;
  total_wins: number;
};

const rankConfig = (i: number) => {
  if (i === 0) return {
    icon: Crown,
    color: "text-yellow-400",
    bg: "bg-yellow-500/12 border-yellow-500/40",
    glow: "shadow-[0_0_28px_hsl(45deg_100%_60%/0.2)]",
    podiumHeight: "h-36",
    podiumBg: "bg-gradient-to-t from-yellow-600/30 to-yellow-500/10",
    rank: "1st",
    rankColor: "text-yellow-400",
  };
  if (i === 1) return {
    icon: Medal,
    color: "text-slate-300",
    bg: "bg-slate-400/10 border-slate-400/30",
    glow: "shadow-[0_0_16px_hsl(220deg_15%_70%/0.1)]",
    podiumHeight: "h-28",
    podiumBg: "bg-gradient-to-t from-slate-500/20 to-slate-400/10",
    rank: "2nd",
    rankColor: "text-slate-300",
  };
  if (i === 2) return {
    icon: Medal,
    color: "text-amber-500",
    bg: "bg-amber-600/10 border-amber-600/30",
    glow: "shadow-[0_0_16px_hsl(25deg_90%_50%/0.1)]",
    podiumHeight: "h-24",
    podiumBg: "bg-gradient-to-t from-amber-600/20 to-amber-500/10",
    rank: "3rd",
    rankColor: "text-amber-500",
  };
  return {
    icon: null,
    color: "text-muted-foreground",
    bg: "bg-secondary/30 border-border/40",
    glow: "",
    podiumHeight: "",
    podiumBg: "",
    rank: `#${i + 1}`,
    rankColor: "text-muted-foreground",
  };
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [betsRes, profilesRes] = await Promise.all([
          (supabase as any).from("bets").select("user_id, amount, potential_win, result"),
          supabase.from("profiles").select("user_id, username, display_name"),
        ]);

        const bets = betsRes.data || [];
        const profiles = profilesRes.data || [];
        const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

        const statsMap = new Map<string, { total_profit: number; total_wins: number }>();
        bets.forEach((b: any) => {
          const existing = statsMap.get(b.user_id) || { total_profit: 0, total_wins: 0 };
          if (b.result === "won") {
            existing.total_profit += Number(b.potential_win) - Number(b.amount);
            existing.total_wins += 1;
          } else if (b.result === "lost") {
            existing.total_profit -= Number(b.amount);
          }
          statsMap.set(b.user_id, existing);
        });

        const leaderboard: LeaderEntry[] = Array.from(statsMap.entries())
          .map(([user_id, stats]) => {
            const profile = profileMap.get(user_id) as any;
            return {
              user_id,
              username: profile?.username || null,
              display_name: profile?.display_name || null,
              ...stats,
            };
          })
          .filter(e => e.total_wins > 0)
          .sort((a, b) => b.total_profit - a.total_profit)
          .slice(0, 50);

        setEntries(leaderboard);
      } catch {
        setEntries([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden py-12 text-center">
        <div className="pointer-events-none absolute -left-40 top-0 h-[300px] w-[300px] rounded-full bg-accent/6 blur-[100px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[300px] w-[300px] rounded-full bg-primary/6 blur-[100px]" />

        <div className="relative container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-sm font-medium text-yellow-400">
              <Trophy className="h-4 w-4" />
              Hall of Fame
            </div>
            <h1 className="text-4xl font-extrabold text-foreground md:text-5xl">
              Top <span className="text-gold">Players</span>
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">Ranked by total profit earned on the platform</p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 max-w-2xl">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl shimmer-bg border border-border/30" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card text-5xl shadow-card">🏆</div>
            <p className="text-xl font-bold text-foreground">No data yet</p>
            <p className="text-muted-foreground text-sm">Start playing to appear on the leaderboard!</p>
          </motion.div>
        ) : (
          <>
            {/* Podium for top 3 */}
            {top3.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-end justify-center gap-3"
              >
                {/* Render order: 2nd, 1st, 3rd */}
                {[
                  { entry: top3[1], rank: 1 },
                  { entry: top3[0], rank: 0 },
                  ...(top3[2] ? [{ entry: top3[2], rank: 2 }] : []),
                ].map(({ entry, rank }) => {
                  const cfg = rankConfig(rank);
                  const IconComp = cfg.icon;
                  const name = entry.display_name || entry.username || "Anon";

                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: rank === 0 ? 0 : rank === 1 ? 0.1 : 0.2, type: "spring" }}
                      className={`flex flex-col items-center gap-2 ${rank === 0 ? "order-2 z-10" : rank === 1 ? "order-1" : "order-3"}`}
                    >
                      {/* Crown/icon for rank 1 */}
                      {rank === 0 && (
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        </motion.div>
                      )}

                      {/* Avatar */}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                        rank === 0 ? "border-yellow-400 bg-yellow-500/10 shadow-[0_0_20px_hsl(45deg_100%_60%/0.4)]" :
                        rank === 1 ? "border-slate-400 bg-slate-400/10" :
                        "border-amber-500 bg-amber-500/10"
                      } ${rank === 0 ? "h-14 w-14" : ""}`}>
                        {IconComp ? <IconComp className={`h-6 w-6 ${cfg.color}`} /> : null}
                      </div>

                      {/* Name */}
                      <div className="text-center max-w-[80px]">
                        <p className={`text-xs font-bold truncate ${rank === 0 ? "text-foreground text-sm" : "text-muted-foreground"}`}>{name}</p>
                        <p className={`text-[10px] font-bold ${cfg.rankColor}`}>{cfg.rank}</p>
                      </div>

                      {/* Profit */}
                      <p className={`text-sm font-extrabold ${cfg.color}`}>
                        {entry.total_profit >= 0 ? "+" : ""}₹{Math.abs(entry.total_profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>

                      {/* Podium block */}
                      <div className={`w-20 rounded-t-xl border border-t ${cfg.podiumBg} ${cfg.podiumHeight} ${
                        rank === 0 ? "border-yellow-500/40" : rank === 1 ? "border-slate-500/30" : "border-amber-500/30"
                      } flex items-end justify-center pb-2`}>
                        <span className={`text-lg font-extrabold ${cfg.rankColor}`}>{cfg.rank}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Rest of leaderboard */}
            <div className="space-y-2.5">
              {entries.map((entry, i) => {
                const cfg = rankConfig(i);
                const IconComp = cfg.icon;

                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    className={`flex items-center gap-4 rounded-xl border bg-card p-4 transition-all cursor-default ${cfg.bg} ${cfg.glow}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${cfg.bg} ${cfg.color}`}>
                      {IconComp ? <IconComp className="h-4 w-4" /> : `#${i + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {entry.display_name || entry.username || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-semibold">{entry.total_wins} wins</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-extrabold ${entry.total_profit >= 0 ? cfg.color : "text-red-400"}`}>
                        {entry.total_profit >= 0 ? "+" : ""}₹{Math.abs(entry.total_profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">net profit</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Leaderboard;
