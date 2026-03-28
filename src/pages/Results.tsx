import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Trophy, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type ClosedMatch = {
  id: string;
  team_a_name: string;
  team_b_name: string;
  team_a_logo: string | null;
  team_b_logo: string | null;
  odds_a: number;
  odds_b: number;
  match_date: string;
  winner: string | null;
};

const Results = () => {
  const [matches, setMatches] = useState<ClosedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const { data } = await (supabase as any)
        .from("matches")
        .select("*")
        .eq("status", "closed")
        .order("match_date", { ascending: false });
      setMatches((data as ClosedMatch[]) || []);
      setLoading(false);
    };
    fetchResults();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden py-12 text-center">
        <div className="pointer-events-none absolute -left-40 top-0 h-[300px] w-[300px] rounded-full bg-primary/6 blur-[100px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[300px] w-[300px] rounded-full bg-accent/6 blur-[100px]" />

        <div className="relative container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Settled Matches
            </div>
            <h1 className="text-4xl font-extrabold text-foreground md:text-5xl">
              Match <span className="text-neon">Results</span>
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">Completed matches with final outcomes</p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 max-w-2xl">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl shimmer-bg border border-border/30" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card text-5xl shadow-card">
              📋
            </div>
            <p className="text-xl font-bold text-foreground">No completed matches yet</p>
            <p className="text-muted-foreground text-sm">Results will appear here after matches are settled.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {matches.map((m, i) => {
              const winnerName = m.winner === "A" ? m.team_a_name : m.winner === "B" ? m.team_b_name : null;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-card hover:border-primary/20 hover:shadow-card-hover transition-all"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-emerald-500/50 to-primary/50" />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(m.match_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-bold text-emerald-400">
                        <CheckCircle className="h-3 w-3" /> Settled
                      </span>
                    </div>

                    {/* Teams matchup */}
                    <div className="rounded-xl overflow-hidden mb-4" style={{ background: "linear-gradient(135deg, #0d1525 0%, #1a1438 50%, #0d1525 100%)" }}>
                      <div className="p-4 flex items-center gap-3">
                        <div className={`flex-1 text-center ${m.winner === "A" ? "" : "opacity-40"}`}>
                          <p className={`font-extrabold text-sm tracking-tight ${m.winner === "A" ? "text-white" : "text-white/50"}`}>
                            {m.team_a_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{m.odds_a}x odds</p>
                          {m.winner === "A" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-400 mt-1">
                              <Trophy className="h-2.5 w-2.5" /> WINNER
                            </span>
                          )}
                        </div>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-bold text-white/40">
                          VS
                        </div>

                        <div className={`flex-1 text-center ${m.winner === "B" ? "" : "opacity-40"}`}>
                          <p className={`font-extrabold text-sm tracking-tight ${m.winner === "B" ? "text-white" : "text-white/50"}`}>
                            {m.team_b_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{m.odds_b}x odds</p>
                          {m.winner === "B" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-400 mt-1">
                              <Trophy className="h-2.5 w-2.5" /> WINNER
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Winner banner */}
                    {winnerName && (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-500/25 py-3 px-4">
                        <Trophy className="h-4 w-4 text-emerald-400" />
                        <p className="text-sm font-bold text-emerald-400">
                          {winnerName} won the toss
                        </p>
                      </div>
                    )}
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

export default Results;
