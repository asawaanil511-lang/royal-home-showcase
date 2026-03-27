import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, TrendingUp, Crown } from "lucide-react";
import { motion } from "framer-motion";

type LeaderEntry = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  total_profit: number;
  total_wins: number;
};

const rankMedal = (i: number) => {
  if (i === 0) return { icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/40" };
  if (i === 1) return { icon: Medal, color: "text-slate-300", bg: "bg-slate-400/10 border-slate-400/30" };
  if (i === 2) return { icon: Medal, color: "text-amber-500", bg: "bg-amber-600/10 border-amber-600/30" };
  return { icon: null, color: "text-muted-foreground", bg: "bg-secondary/30 border-border/40" };
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Compute leaderboard from bets + profiles
        const [betsRes, profilesRes] = await Promise.all([
          (supabase as any).from("bets").select("user_id, amount, potential_win, result"),
          supabase.from("profiles").select("user_id, username, display_name"),
        ]);

        const bets = betsRes.data || [];
        const profiles = profilesRes.data || [];
        const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

        // Aggregate stats per user
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
              Top <span className="text-neon">Players</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Ranked by total profit earned on the platform</p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 max-w-2xl">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-card border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <div className="text-5xl">🏆</div>
            <p className="text-xl font-bold text-foreground">No data yet</p>
            <p className="text-muted-foreground">Start playing to appear on the leaderboard!</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const medal = rankMedal(i);
              const IconComp = medal.icon;

              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className={`flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card transition-all cursor-default ${
                    i === 0
                      ? "border-yellow-500/40 shadow-[0_0_20px_hsl(45deg_100%_60%/0.15)]"
                      : i < 3
                      ? "border-primary/30"
                      : "border-border/50"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${medal.bg} ${medal.color}`}>
                    {IconComp ? <IconComp className="h-5 w-5" /> : `#${i + 1}`}
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
                    <p className={`text-lg font-extrabold ${entry.total_profit >= 0 ? (i === 0 ? "text-yellow-400" : "text-primary") : "text-red-400"}`}>
                      {entry.total_profit >= 0 ? "+" : ""}₹{Math.abs(entry.total_profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">net profit</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Leaderboard;
