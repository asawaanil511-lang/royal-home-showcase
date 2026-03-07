import { useState } from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MatchCard from "@/components/MatchCard";
import BetDialog from "@/components/BetDialog";
import { matches, Match } from "@/data/matches";

type Tab = "live" | "closed";

const Matches = () => {
  const [tab, setTab] = useState<Tab>("live");
  const [betMatch, setBetMatch] = useState<Match | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = matches.filter((m) =>
    tab === "live" ? m.status === "live" || m.status === "upcoming" : m.status === "closed"
  );

  const handleBet = (match: Match) => {
    setBetMatch(match);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary/30 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-success">
            <Radio className="h-4 w-4" />
            Live Bet
          </div>
          <h1 className="mb-3 text-4xl font-extrabold text-foreground md:text-5xl">
            Real-Time Betting Experience
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Join the action with live odds and real-time updates. Stay ahead with instant insights for smart betting.
          </p>
        </motion.div>
      </section>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-center gap-2">
          <button
            onClick={() => setTab("live")}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
              tab === "live"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            LIVE BETS
          </button>
          <button
            onClick={() => setTab("closed")}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
              tab === "closed"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            CLOSED BETS
          </button>
        </div>

        {/* Match grid */}
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
