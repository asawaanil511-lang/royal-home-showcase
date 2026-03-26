import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Receipt, TrendingUp, Clock, Trophy, XCircle, Share2,
  Download, AlertCircle, Loader2, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

type BetWithMatch = {
  id: string;
  match_id: string;
  team_picked: "A" | "B";
  amount: number;
  odds: number;
  potential_win: number;
  result: "pending" | "won" | "lost" | "cancelled";
  created_at: string;
  settled_at?: string;
  matches: {
    team_a_name: string;
    team_b_name: string;
    status: string;
    match_date: string;
  } | null;
};

const resultConfig = {
  pending:   { label: "Pending",   color: "text-accent",       bg: "bg-accent/10 border-accent/30",      icon: Clock },
  won:       { label: "Won",       color: "text-primary",      bg: "bg-primary/10 border-primary/30",    icon: Trophy },
  lost:      { label: "Lost",      color: "text-destructive",  bg: "bg-destructive/10 border-destructive/30", icon: XCircle },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bg: "bg-muted/30 border-border/50",  icon: AlertCircle },
};

const WinCard = ({ bet }: { bet: BetWithMatch }) => {
  const teamName = bet.team_picked === "A" ? bet.matches?.team_a_name : bet.matches?.team_b_name;
  return (
    <div
      id={`win-card-${bet.id}`}
      className="rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/50 p-6 text-center"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      <div className="text-4xl mb-3">🏆</div>
      <p className="text-sm text-primary font-semibold mb-1">SUPERMAN TOSS BOOK</p>
      <p className="text-white text-lg font-bold mb-1">{bet.matches?.team_a_name} vs {bet.matches?.team_b_name}</p>
      <p className="text-gray-400 text-xs mb-4">Picked: {teamName}</p>
      <div className="rounded-xl bg-white/10 p-4 mb-4">
        <p className="text-gray-400 text-xs mb-1">Bet Amount</p>
        <p className="text-white text-2xl font-bold">₹{Number(bet.amount).toLocaleString()}</p>
      </div>
      <div className="rounded-xl bg-primary/30 p-4 border border-primary/50">
        <p className="text-primary text-xs mb-1">🎉 YOU WON</p>
        <p className="text-primary text-3xl font-extrabold">₹{Number(bet.potential_win).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <p className="text-gray-400 text-xs mt-1">at {bet.odds}x odds</p>
      </div>
      <p className="text-gray-500 text-[10px] mt-4">{new Date(bet.created_at).toLocaleString()}</p>
    </div>
  );
};

const BetCard = ({
  bet,
  onCancel,
  onShare,
  cancelling,
}: {
  bet: BetWithMatch;
  onCancel: (id: string) => void;
  onShare: (bet: BetWithMatch) => void;
  cancelling: string | null;
}) => {
  const cfg = resultConfig[bet.result] || resultConfig.pending;
  const Icon = cfg.icon;
  const teamPicked = bet.team_picked === "A" ? bet.matches?.team_a_name : bet.matches?.team_b_name;
  const matchOpen = bet.matches && (bet.matches.status === "live" || bet.matches.status === "upcoming");
  const canCancel = bet.result === "pending" && matchOpen;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className={`rounded-2xl border bg-card shadow-card overflow-hidden ${
        bet.result === "won" ? "border-primary/40 shadow-[0_0_16px_hsl(var(--primary)/0.15)]" : "border-border/50"
      }`}
    >
      {/* Top colored strip */}
      <div className={`h-1 w-full ${
        bet.result === "won" ? "bg-gradient-to-r from-primary to-accent" :
        bet.result === "lost" ? "bg-destructive" :
        bet.result === "cancelled" ? "bg-muted-foreground" :
        "bg-accent"
      }`} />

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">
              {bet.matches ? `${bet.matches.team_a_name} vs ${bet.matches.team_b_name}` : "Match"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Picked: <span className="font-semibold text-foreground">{teamPicked || bet.team_picked}</span>
              {" • "}{bet.odds}x odds
            </p>
          </div>
          <span className={`shrink-0 flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>

        {/* Amount row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-secondary/60 p-3">
            <p className="text-[11px] text-muted-foreground mb-0.5">Bet Amount</p>
            <p className="text-base font-bold text-foreground">₹{Number(bet.amount).toLocaleString()}</p>
          </div>
          <div className={`rounded-xl p-3 ${bet.result === "won" ? "bg-primary/15 border border-primary/30" : "bg-secondary/60"}`}>
            <p className="text-[11px] text-muted-foreground mb-0.5">
              {bet.result === "won" ? "💰 Won" : "Potential Win"}
            </p>
            <p className={`text-base font-bold ${bet.result === "won" ? "text-primary" : "text-muted-foreground"}`}>
              ₹{Number(bet.potential_win).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Time & Match status */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Placed: {new Date(bet.created_at).toLocaleString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit"
            })}
          </span>
          {bet.matches && (
            <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
              bet.matches.status === "live" ? "bg-destructive/10 text-destructive" :
              bet.matches.status === "upcoming" ? "bg-accent/10 text-accent" :
              "bg-muted text-muted-foreground"
            }`}>
              Match: {bet.matches.status.toUpperCase()}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => onCancel(bet.id)}
              disabled={cancelling === bet.id}
            >
              {cancelling === bet.id ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Cancelling...</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Cancel Bet</>
              )}
            </Button>
          )}
          {bet.result === "won" && (
            <Button
              size="sm"
              className="text-xs gradient-neon-primary text-primary-foreground shadow-neon"
              onClick={() => onShare(bet)}
            >
              <Share2 className="h-3 w-3 mr-1" /> Share Win
            </Button>
          )}
        </div>

        {/* Cancel note */}
        {bet.result === "pending" && !matchOpen && (
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Cannot cancel — match is {bet.matches?.status}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const MyBets = () => {
  const { user, refreshProfile } = useAuth();
  const [bets, setBets] = useState<BetWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost" | "cancelled">("all");
  const [shareModalBet, setShareModalBet] = useState<BetWithMatch | null>(null);
  const [capturing, setCapturing] = useState(false);
  const { toast } = useToast();

  const fetchBets = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("bets")
      .select("*, matches(team_a_name, team_b_name, status, match_date)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setBets((data as BetWithMatch[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBets();

    if (!user) return;
    const channel = (supabase as any)
      .channel(`my-bets-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bets", filter: `user_id=eq.${user.id}` },
        () => fetchBets()
      )
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [user]);

  const handleCancel = async (betId: string) => {
    if (!user) return;
    setCancelling(betId);
    const bet = bets.find((b) => b.id === betId);
    if (!bet) { setCancelling(null); return; }

    const { error: updateErr } = await (supabase as any).from("bets").update({
      result: "cancelled",
      settled_at: new Date().toISOString(),
    }).eq("id", betId);

    if (updateErr) {
      toast({ title: "Failed to cancel", description: updateErr.message, variant: "destructive" });
      setCancelling(null);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({
        wallet_balance: profile.wallet_balance + Number(bet.amount),
      }).eq("user_id", user.id);
    }

    await refreshProfile();
    setBets((prev) => prev.map((b) => b.id === betId ? { ...b, result: "cancelled" } : b));
    setCancelling(null);
    toast({
      title: "✅ Bet Cancelled",
      description: `₹${Number(bet.amount).toLocaleString()} refunded to your wallet.`,
    });
  };

  const handleShare = async (bet: BetWithMatch) => {
    setShareModalBet(bet);
  };

  const handleCapture = async () => {
    if (!shareModalBet) return;
    setCapturing(true);
    try {
      const el = document.getElementById(`win-card-${shareModalBet.id}`);
      if (!el) return;
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
      const dataUrl = canvas.toDataURL("image/png");

      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "superman-toss-win.png", { type: "image/png" });
        await navigator.share({ title: "I won on Superman Toss Book! 🏆", files: [file] });
      } else {
        const link = document.createElement("a");
        link.download = "superman-toss-win.png";
        link.href = dataUrl;
        link.click();
        toast({ title: "Screenshot saved!", description: "Win card downloaded." });
      }
    } catch (e) {
      toast({ title: "Could not share", description: "Try taking a screenshot manually.", variant: "destructive" });
    }
    setCapturing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Receipt className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Login to view your bets</h2>
          <Button className="gradient-neon-primary text-primary-foreground" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = filter === "all" ? bets : bets.filter((b) => b.result === filter);
  const stats = {
    total: bets.length,
    won: bets.filter((b) => b.result === "won").length,
    lost: bets.filter((b) => b.result === "lost").length,
    pending: bets.filter((b) => b.result === "pending").length,
    totalWon: bets.filter((b) => b.result === "won").reduce((s, b) => s + Number(b.potential_win), 0),
    totalBet: bets.reduce((s, b) => s + Number(b.amount), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-10">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3 mb-1">
              <Receipt className="h-7 w-7 text-primary" /> My Bets
            </h1>
            <p className="text-muted-foreground text-sm">Track your betting history and manage active bets</p>
          </motion.div>

          {/* Stats row */}
          {!loading && bets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
            >
              <div className="rounded-2xl border border-border/50 bg-card p-4 text-center shadow-card">
                <p className="text-2xl font-extrabold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Bets</p>
              </div>
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center shadow-card">
                <p className="text-2xl font-extrabold text-primary">{stats.won}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Won</p>
              </div>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center shadow-card">
                <p className="text-2xl font-extrabold text-destructive">{stats.lost}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Lost</p>
              </div>
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-center shadow-card">
                <p className="text-2xl font-extrabold text-accent">{stats.pending}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
              </div>
            </motion.div>
          )}

          {/* Total winnings banner */}
          {!loading && stats.totalWon > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-2xl gradient-neon-primary p-4 flex items-center justify-between shadow-neon"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
                <div>
                  <p className="text-primary-foreground text-sm font-semibold">Total Winnings</p>
                  <p className="text-primary-foreground text-xs opacity-75">All time</p>
                </div>
              </div>
              <p className="text-primary-foreground text-2xl font-extrabold">
                ₹{stats.totalWon.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </motion.div>
          )}

          {/* Filters */}
          {!loading && bets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {(["all", "pending", "won", "lost", "cancelled"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === f
                      ? "gradient-neon-primary text-primary-foreground shadow-neon"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== "all" && (
                    <span className="ml-1 opacity-70">({bets.filter((b) => b.result === f).length})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Bet list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-card border border-border/50 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-5xl">{filter === "all" ? "🎲" : "🔍"}</div>
              <h3 className="text-xl font-bold text-foreground">
                {filter === "all" ? "No bets yet" : `No ${filter} bets`}
              </h3>
              {filter === "all" && (
                <>
                  <p className="text-muted-foreground text-sm">Place your first bet to see it here.</p>
                  <Button className="gradient-neon-primary text-primary-foreground shadow-neon mt-2" asChild>
                    <Link to="/matches">Browse Matches</Link>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={bet}
                    onCancel={handleCancel}
                    onShare={handleShare}
                    cancelling={cancelling}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Share Win Modal */}
      <AnimatePresence>
        {shareModalBet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShareModalBet(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <WinCard bet={shareModalBet} />
              <div className="flex gap-3 mt-4">
                <Button
                  className="flex-1 gradient-neon-primary text-primary-foreground shadow-neon"
                  onClick={handleCapture}
                  disabled={capturing}
                >
                  {capturing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Save & Share</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShareModalBet(null)}>Close</Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Screenshot this card to share your win!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default MyBets;
