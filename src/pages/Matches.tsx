import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Swords, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MatchCard, { UserBet } from "@/components/MatchCard";
import BetDialog from "@/components/BetDialog";
import { apiUrl } from "@/lib/api";
import { Match } from "@/data/matches";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Matches = () => {
  const [betMatch, setBetMatch] = useState<Match | null>(null);
  const [betTeam, setBetTeam] = useState<"A" | "B" | undefined>(undefined);
  const [betMoreTeam, setBetMoreTeam] = useState<"A" | "B" | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [userBets, setUserBets] = useState<Map<string, UserBet>>(new Map());
  const [cancellingBetId, setCancellingBetId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  // Re-evaluate time-based match visibility every 30 s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

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
        if (!map.has(b.match_id)) {
          map.set(b.match_id, {
            id: b.id,
            ids: [b.id],
            team_picked: b.team_picked,
            amount: Number(b.amount),
            odds: Number(b.odds),
            potential_win: Number(b.potential_win),
          });
        } else {
          const existing = map.get(b.match_id)!;
          map.set(b.match_id, {
            ...existing,
            ids: [...existing.ids, b.id],
            amount: existing.amount + Number(b.amount),
            potential_win: existing.potential_win + Number(b.potential_win),
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

    const ch = (supabase as any)
      .channel(`user-bets-matches-${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "bets",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchUserBets())
      .subscribe();

    return () => { (supabase as any).removeChannel(ch); };
  }, [user, fetchUserBets]);

  const handleBet = useCallback((match: Match, team?: "A" | "B", lockToTeam = false) => {
    setBetMatch(match);
    setBetTeam(team);
    setBetMoreTeam(lockToTeam ? team : undefined);
    setDialogOpen(true);
  }, []);

  const handleCancelBet = useCallback(async (matchId: string) => {
    if (!user) return;
    const betEntry = userBets.get(matchId);
    if (!betEntry) return;

    const betIds = betEntry.ids;
    const totalAmount = betEntry.amount;

    setCancellingBetId(betIds[0]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast({ title: "Not authenticated", variant: "destructive" }); return; }

      const results = await Promise.all(
        betIds.map((id) =>
          fetch(apiUrl("/api/cancel-bet"), {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ bet_id: id }),
          }).then(async (r) => {
            let j: any = {};
            try { j = await r.json(); } catch { }
            return { ok: r.ok, json: j };
          })
        )
      );

      const failures = results.filter((r) => !r.ok || !r.json.success);
      if (failures.length > 0) {
        const errMsg = failures[0]?.json?.error || "Could not cancel bet(s)";
        toast({ title: "Failed to cancel", description: errMsg, variant: "destructive" });
        return;
      }

      setUserBets((prev) => {
        const next = new Map(prev);
        next.delete(matchId);
        return next;
      });

      await refreshProfile();
      toast({
        title: "Bet cancelled",
        description: `₹${totalAmount.toLocaleString()} has been refunded to your wallet.`,
      });
    } catch (err: any) {
      toast({ title: "Failed to cancel", description: err.message, variant: "destructive" });
    } finally {
      setCancellingBetId(null);
    }
  }, [refreshProfile, toast, user, userBets]);

  // ── Time-based visibility filter ─────────────────────────────────────────
  // A match appears once live_time is reached, and disappears once closing_time passes.
  const filtered = useMemo(() => matches
    .filter((m) => {
      // If live_time is set and hasn't been reached yet → hide
      if (m.liveTime && new Date(m.liveTime) > now) return false;
      // If closing_time is set and has passed → hide
      if (m.closingTime && new Date(m.closingTime) <= now) return false;
      // Only show non-closed statuses
      return m.status === "live" || m.status === "upcoming";
    })
    .sort((a, b) => {
      const aTime = a.closingTime ? new Date(a.closingTime).getTime() : Infinity;
      const bTime = b.closingTime ? new Date(b.closingTime).getTime() : Infinity;
      if (aTime !== bTime) return aTime - bTime;
      const statusOrder: Record<string, number> = { live: 0, upcoming: 1 };
      return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
    }), [matches, now]);

  const liveCount = filtered.filter((m) => m.status === "live").length;

  // ── Exposure calculation from pending bets ────────────────────────────────
  const balance = profile?.wallet_balance ?? 0;
  const exposure = Array.from(userBets.values()).reduce((sum, b) => sum + b.amount, 0);
  const activeMarkets = userBets.size;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />

      {/* ── Balance / Exposure card (replaces the old hero) ───────────── */}
      <div className="container mx-auto px-4 pt-4 pb-2">
        <div
          className="rounded-2xl border border-border/40 p-4"
          style={{ background: "hsl(var(--card))", boxShadow: "0 2px 20px rgba(157,76,204,0.10)" }}
        >
          <div className="flex items-start justify-between mb-3">
            {/* Left: Balance */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase mb-1">
                Total Balance
              </p>
              <p className="text-3xl font-extrabold tabular-nums text-foreground">
                ₹{balance.toLocaleString()}
              </p>
              {activeMarkets > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-primary/40 text-primary">
                    <svg viewBox="0 0 16 16" className="h-2 w-2 fill-current"><circle cx="8" cy="8" r="6" /></svg>
                  </span>
                  Active in <strong className="text-foreground">{activeMarkets}</strong> market{activeMarkets !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Right: Exposure */}
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-[0.18em] text-amber-500 uppercase mb-1">
                Exposure
              </p>
              <p
                className="text-2xl font-extrabold tabular-nums"
                style={{ color: exposure > 0 ? "#f97316" : "hsl(var(--muted-foreground))" }}
              >
                ₹{exposure.toLocaleString()}
              </p>
              {realtimeConnected && (
                <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/wallet"
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold text-white transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, hsl(277 54% 55%), hsl(273 74% 29%))",
                boxShadow: "0 4px 16px rgba(157,76,204,0.35)",
              }}
            >
              <Plus className="h-4 w-4" /> Deposit
            </Link>
            <Link
              to="/wallet"
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-extrabold border border-border bg-secondary text-primary transition-all hover:bg-secondary/80 active:scale-[0.97]"
            >
              <Minus className="h-4 w-4" /> Withdraw
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 pt-3">
        {/* Status bar */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-4 py-2">
            <Swords className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Active Matches</span>
            {filtered.length > 0 && (
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                liveCount > 0 ? "bg-red-500 text-white" : "bg-primary/20 text-primary"
              }`}>
                {filtered.length}
              </span>
            )}
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {liveCount} LIVE
              </span>
            )}
          </div>
          <button
            onClick={() => { fetchMatches(); fetchUserBets(); }}
            className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground border border-border/50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

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
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="will-change-transform"
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
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center py-20 gap-5"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card text-5xl shadow-card">
              🏏
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">No Active Matches</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                No live or upcoming matches right now. Check back soon!
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
        lockToTeam={betMoreTeam}
        onBetPlaced={fetchUserBets}
      />
      <Footer />
    </div>
  );
};

export default Matches;
