import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MatchCard from "@/components/MatchCard";
import BetDialog from "@/components/BetDialog";
import { matches as localMatches, Match } from "@/data/matches";
import { supabase } from "@/integrations/supabase/client";

type Tab = "live" | "closed";

const Matches = () => {
  const [tab, setTab] = useState<Tab>("live");
  const [betMatch, setBetMatch] = useState<Match | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dbMatches, setDbMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await (supabase as any).from("matches").select("*").order("match_date", { ascending: false });
      if (data && data.length > 0) {
        const mapped: Match[] = data.map((m: any) => ({
          id: m.id,
          teamA: { name: m.team_a_name, logo: m.team_a_logo || "/placeholder.svg" },
          teamB: { name: m.team_b_name, logo: m.team_b_logo || "/placeholder.svg" },
          maxBet: m.max_bet,
          date: new Date(m.match_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          time: new Date(m.match_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          status: m.status as "live" | "upcoming" | "closed",
          oddsA: Number(m.odds_a),
          oddsB: Number(m.odds_b),
        }));
        setDbMatches(mapped);
      }
    };
    fetchMatches();
  }, []);

  // Use DB matches if available, fallback to local
  const allMatches = dbMatches.length > 0 ? dbMatches : localMatches;

  const filtered = allMatches.filter((m) =>
    tab === "live" ? m.status === "live" || m.status === "upcoming" : m.status === "closed"
  );

  const handleBet = (match: Match) => {
    setBetMatch(match);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Radio className="h-4 w-4" />
            Live Bet
          </div>
          <h1 className="mb-3 text-4xl font-extrabold text-foreground md:text-5xl">
            Real-Time Betting <span className="text-neon">Experience</span>
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Join the action with live odds and real-time updates.
          </p>
        </motion.div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-center gap-2">
          <button
            onClick={() => setTab("live")}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
              tab === "live"
                ? "gradient-neon-primary text-primary-foreground shadow-neon"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            LIVE BETS
          </button>
          <button
            onClick={() => setTab("closed")}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
              tab === "closed"
                ? "gradient-neon-primary text-primary-foreground shadow-neon"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            CLOSED BETS
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <MatchCard match={match} onBet={handleBet} />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">No matches found.</p>
        )}
      </div>

      <BetDialog match={betMatch} open={dialogOpen} onOpenChange={setDialogOpen} />
      <Footer />
    </div>
  );
};

export default Matches;
