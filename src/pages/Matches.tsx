import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Wifi, RefreshCw, Clock, Swords, XCircle } from "lucide-react";
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
    imageUrl: m.image_url || null,
    liveTime: m.live_time || null,
    closingTime: m.closing_time || null,
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
  const upcomingCount = matches.filter((m) => m.status === "upcoming").length;
  const closedCount = matches.filter((m) => m.status === "closed").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Page Hero */}
      <section className="relative overflow-hidden py-12 text-center">
        <div className="pointer-events-none absolute -left-40 top-0 h-[300px] w-[300px] rounded-full bg-primary/6 blur-[100px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[300px] w-[300px] rounded-full bg-accent/6 blur-[100px]" />

        <div className="relative container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Radio className="h-4 w-4" />
              Live Betting
              {realtimeConnected && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Wifi className="h-3 w-3" /> Connected
                </span>
              )}
            </div>
            <h1 className="mb-3 text-4xl font-extrabold text-foreground md:text-5xl">
              Real-Time <span className="text-neon">Betting</span>
            </h1>
            <p className="mx-auto max-w-lg text-muted-foreground text-sm">
              Live odds, instant updates. Your next win is one match away.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-center gap-2"
        >
          <button
            onClick={() => setTab("live")}
            className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === "live"
                ? "gradient-neon-primary text-primary-foreground shadow-neon"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            <Swords className="h-4 w-4" />
            Active
            {(liveCount + upcomingCount) > 0 && (
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                tab === "live" ? "bg-white/20 text-white" : "bg-destructive text-white"
              }`}>
                {liveCount + upcomingCount}
              </span>
            )}
            {liveCount > 0 && tab === "live" && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setTab("closed")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === "closed"
                ? "gradient-neon-primary text-primary-foreground shadow-neon"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            <XCircle className="h-4 w-4" />
            Closed
            {closedCount > 0 && (
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                tab === "closed" ? "bg-white/20 text-white" : "bg-secondary-foreground/20 text-muted-foreground"
              }`}>
                {closedCount}
              </span>
            )}
          </button>

          <button
            onClick={fetchMatches}
            className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground border border-border/50"
            title="Refresh matches"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl shimmer-bg border border-border/30" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 120 }}
                >
                  <MatchCard match={match} onBet={handleBet} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 gap-5"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card text-5xl shadow-card">
              🏏
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">
                {tab === "live" ? "No Active Matches" : "No Closed Matches"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                {tab === "live"
                  ? "No live or upcoming matches right now. Check back soon!"
                  : "No closed matches to display yet."}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <BetDialog match={betMatch} open={dialogOpen} onOpenChange={setDialogOpen} />
      <Footer />
    </div>
  );
};

export default Matches;
