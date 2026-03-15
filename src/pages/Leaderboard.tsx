import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

type LeaderEntry = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  total_profit: number;
  total_wins: number;
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("leaderboard" as any)
        .select("*")
        .order("total_profit", { ascending: false })
        .limit(50);
      setEntries((data as LeaderEntry[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Top <span className="text-neon">Players</span>
          </h1>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No data yet. Start playing!</p>
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card ${
                  i < 3 ? "border-primary/30 glow-border" : "border-border/50"
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm ${
                  i === 0 ? "bg-accent/20 text-accent" : i < 3 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {i < 3 ? <Medal className="h-5 w-5" /> : `#${i + 1}`}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-card-foreground">
                    {entry.display_name || entry.username || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.total_wins} wins</p>
                </div>
                <p className="text-lg font-extrabold text-primary">
                  ₹{Number(entry.total_profit).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Leaderboard;
