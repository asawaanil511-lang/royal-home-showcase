import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Wifi, RefreshCw, Clock, Swords, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MatchCard, { UserBet } from "@/components/MatchCard";
import BetDialog from "@/components/BetDialog";
import { Match } from "@/data/matches";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

type Tab = "live" | "closed";

const Matches = () => {
  const [tab, setTab] = useState<Tab>("live");
  const [betMatch, setBetMatch] = useState<Match | null>(null);
  const [betTeam, setBetTeam] = useState<"A" | "B" | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [userBets, setUserBets] = useState<Map<string, UserBet>>(new Map()); // matchId → UserBet
  const [cancellingBetId, setCancellingBetId] = useState<string | null>(null);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

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
    winner: m.winner || null,
    matchTitle: m.match_title || null,
  });

  const fetchMatches = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false });
    if (!error && data) setMatches(data.map(mapDbMatch));
    setLoading(false);
  }, []);

  const fetchUserBets = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("bets")
      .select("id, match_id, team_picked, amount, odds, potential_win, result")
      .eq("user_id", user.id)
      .eq("result", "pending");
    if (data) {
      const map = new Map<string, UserBet>();
      for (const b of data) {
        // Keep latest bet per match (should only be one pending per match ideally)
        if (!map.has(b.match_id)) {
          map.set(b.match_id, {
            id: b.id,
            team_picked: b.team_picked,
            amount: Number(b.amount),
            odds: Number(b.odds),
            potential_win: Number(b.potential_win),
          });
        }
      }
      setUserBets(map);
    }
  }, [user]);

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
      .subscribe((status: string) => setRealtimeConnected(status === "SUBSCRIBED"));

    return () => { (supabase as any).removeChannel(channel); };
  }, []);

  useEffect(() => {
    fetchUserBets();
    if (!user) return;

    // Realtime on bets table so match card updates when bet is placed/cancelled
    const ch = (supabase as any)
      .channel(`user-bets-matches-${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "bets",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchUserBets())
      .subscribe();

    return () => { (supabase as any).removeChannel(ch); };
  }, [user, fetchUserBets]);

  const handleBet = (match: Match, team?: "A" | "B") => {
    setBetMatch(match);
    setBetTeam(team);
    setDialogOpen(true);
  };

  const handleCancelBet = async (betId: string, matchId: string) => {
    if (!user) return;
    setCancellingBetId(betId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast({ title: "Not authenticated", variant: "destructive" }); return; }

      const res = await fetch(apiUrl("/api/cancel-bet"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bet_id: betId }),
      });

      let json: any = {};
      try { json = await res.json(); } catch { }

      if (!res.ok || !json.success) {
        toast({ title: "Failed to cancel", description: json.error || "Could not cancel bet", variant: "destructive" });
        return;
      }

      // Remove from local map immediately — no cancel button visible until refresh fetches DB
      setUserBets((prev) => {
        const next = new Map(prev);
        next.delete(matchId);
        return next;
      });

      await refreshProfile();
      toast({
        title: "Bet Cancelled",
        description: `₹${json.refunded?.toLocaleString() || "—"} refunded to your wallet.`,
      });
    } catch (err: any) {
      toast({ title: "Failed to cancel", description: err.message, variant: "destructive" });
    } finally {
      setCancellingBetId(null);
    }
  };

  const filteredRaw = matches
    .filter((m) => tab === "live" ? m.status === "live" || m.status === "upcoming" : m.status === "closed")
    .sort((a, b) => {
      if (tab === "live") {
        const aTime = a.closingTime ? new Date(a.closingTime).getTime() : Infinity;
        const bTime = b.closingTime ? new Date(b.closingTime).getTime() : Infinity;
        if (aTime !== bTime) return aTime - bTime;
        const statusOrder: Record<string, number> = { live: 0, upcoming: 1 };
        return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
      }
      return 0;
    });

  const filtered = tab === "closed" ? filteredRaw.slice(0, 10) : filteredRaw;
  const liveCount = matches.filter((m) => m.status === "live").length;
  const upcomingCount = matches.filter((m) => m.status === "upcoming").length;
  const closedCount = matches.filter((m) => m.status === "closed").length;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />

      <section className="relative overflow-hidden py-10 text-center">
        <div className="pointer-events-none absolute -left-40 top-0 h-[280px] w-[280px] rounded-full bg-primary/6 blur-[100px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[280px] w-[280px] rounded-full bg-accent/6 blur-[100px]" />

        <div className="relative container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Radio className="h-4 w-4" />
              Live Toss Arena
              {realtimeConnected && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Wifi className="h-3 w-3" /> Live
                </span>
              )}
            </div>
            <h1 className="mb-2 text-3xl font-extrabold text-foreground md:text-4xl">
              Real-Time <span className="text-neon">Action</span>
            </h1>
            <p className="mx-auto max-w-md text-muted-foreground text-sm">
              Live odds, instant updates. Your next win is one match away.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-center gap-2"
        >
          {[
            { key: "live" as Tab, icon: Swords, label: "Active", count: liveCount + upcomingCount, live: liveCount > 0 },
            { key: "closed" as Tab, icon: XCircle, label: "Closed", count: closedCount, live: false },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                tab === t.key
                  ? "gradient-neon-primary text-primary-foreground shadow-neon"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && (
                <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                  tab === t.key ? "bg-white/20 text-white" : "bg-destructive text-white"
                }`}>
                  {t.count}
                </span>
              )}
              {t.live && tab === t.key && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
          <button
            onClick={() => { fetchMatches(); fetchUserBets(); }}
            className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground border border-border/50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </motion.div>

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
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 130 }}
                >
                  <MatchCard
                    match={match}
                    onBet={handleBet}
                    userBet={userBets.get(match.id) ?? null}
                    onCancelBet={handleCancelBet}
                    cancellingBetId={cancellingBetId}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-5"
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

      <BetDialog
        match={betMatch}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTeam={betTeam}
      />
      <Footer />
    </div>
  );
};

export default Matches;
