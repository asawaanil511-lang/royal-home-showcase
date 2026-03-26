import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Wifi, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MatchCard from "@/components/MatchCard";
import BetDialog from "@/components/BetDialog";
import { Match } from "@/data/matches";
import { supabase } from "@/integrations/supabase/client";

type Tab = "live" | "closed";

const Matches = () => {
  const [tab, setTab] = useState<Tab>("live");
  const [betMatch, setBetMatch] = useState<Match | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const mapDbMatch = (m: any): Match => ({
    id: m.id,
    teamA: { name: m.team_a_name, logo: m.team_a_logo || "/placeholder.svg" },
    teamB: { name: m.team_b_name, logo: m.team_b_logo || "/placeholder.svg" },
    maxBet: m.max_bet,
    date: new Date(m.match_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    time: new Date(m.match_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    status: m.status as "live" | "upcoming" | "closed",
    oddsA: Number(m.odds_a),
    oddsB: Number(m.odds_b),
  });

  const fetchMatches = async () => {
    const { data, error } = await (supabase as any)
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false });
    if (!error && data) {
      setMatches(data.map(mapDbMatch));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();

    const channel = (supabase as any)
      .channel("matches-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, (payload: any) => {
        if (payload.eventType === "INSERT") {
          setMatches((prev) => [mapDbMatch(payload.new), ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setMatches((prev) => prev.map((m) => m.id === payload.new.id ? mapDbMatch(payload.new) : m));
        } else if (payload.eventType === "DELETE") {
          setMatches((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      })
      .subscribe((status: string) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, []);

  const filtered = matches.filter((m) =>
    tab === "live" ? m.status === "live" || m.status === "upcoming" : m.status === "closed"
  );

  const handleBet = (match: Match) => {
    setBetMatch(match);
    setDialogOpen(true);
  };

  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Radio className="h-4 w-4" />
            Live Betting
            {realtimeConnected && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Wifi className="h-3 w-3" /> Live
              </span>
            )}
          </div>
          <h1 className="mb-3 text-4xl font-extrabold text-foreground md:text-5xl">
            Real-Time Betting <span className="text-neon">Experience</span>
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Join the action with live odds and real-time updates. Matches update instantly.
          </p>
        </motion.div>
      </section>

      <div className="container mx-auto px-4 pb-12">
        <div className="mb-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setTab("live")}
            className={`relative rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
              tab === "live"
                ? "gradient-neon-primary text-primary-foreground shadow-neon"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            LIVE BETS
            {liveCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {liveCount}
              </span>
            )}
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
          <button
            onClick={fetchMatches}
            className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-card border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="text-6xl">🏏</div>
            <h3 className="text-xl font-bold text-foreground">
              {tab === "live" ? "No Active Matches" : "No Closed Matches"}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {tab === "live"
                ? "No live or upcoming matches right now. Check back soon or ask the admin to create one."
                : "No closed matches to display yet."}
            </p>
          </motion.div>
        )}
      </div>

      <BetDialog match={betMatch} open={dialogOpen} onOpenChange={setDialogOpen} />
      <Footer />
    </div>
  );
};

export default Matches;
