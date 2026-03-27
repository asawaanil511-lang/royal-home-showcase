import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Receipt, TrendingUp, Clock, Trophy, XCircle, Share2,
  Download, AlertCircle, Loader2, Filter, Swords
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import supermanLogo from "@/assets/superman-logo.jpg";

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
  pending:   { label: "Pending",   color: "text-yellow-400",    bg: "bg-yellow-400/10 border-yellow-400/30",       icon: Clock },
  won:       { label: "Won",       color: "text-emerald-400",   bg: "bg-emerald-400/10 border-emerald-400/30",     icon: Trophy },
  lost:      { label: "Lost",      color: "text-red-400",       bg: "bg-red-400/10 border-red-400/30",             icon: XCircle },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bg: "bg-muted/30 border-border/50",            icon: AlertCircle },
};

const WinCard = ({ bet }: { bet: BetWithMatch }) => {
  const teamName = bet.team_picked === "A" ? bet.matches?.team_a_name : bet.matches?.team_b_name;
  return (
    <div
      id={`win-card-${bet.id}`}
      className="rounded-2xl p-6 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a2e 100%)" }}
    >
      {/* Glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full blur-3xl opacity-30" style={{ background: "hsl(var(--primary))" }} />
      </div>
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={supermanLogo} alt="Superman Toss Book" className="h-10 w-10 rounded-full object-cover border-2 border-primary/50" />
          <div className="text-left">
            <p className="text-xs font-bold text-primary tracking-widest uppercase">Superman Toss Book</p>
            <p className="text-[10px] text-gray-400">Official Win Certificate</p>
          </div>
        </div>
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-white text-lg font-bold mb-1">{bet.matches?.team_a_name} vs {bet.matches?.team_b_name}</p>
        <p className="text-gray-400 text-xs mb-4">You picked: <span className="text-primary font-semibold">{teamName}</span></p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-gray-400 text-xs mb-1">Bet Amount</p>
            <p className="text-white text-xl font-bold">₹{Number(bet.amount).toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-3 border" style={{ background: "rgba(var(--primary)/0.15)", borderColor: "hsl(var(--primary)/0.4)" }}>
            <p className="text-xs mb-1" style={{ color: "hsl(var(--primary))" }}>🎉 You Won</p>
            <p className="text-2xl font-extrabold" style={{ color: "hsl(var(--primary))" }}>
              ₹{Number(bet.potential_win).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-xs border-t border-white/10 pt-3 mt-2">
          at {bet.odds}x odds • {new Date(bet.created_at).toLocaleString("en-IN")}
        </p>
        <p className="text-gray-600 text-[10px] mt-1">superman-toss-book.com</p>
      </div>
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
  const teamPickedName = bet.team_picked === "A" ? bet.matches?.team_a_name : bet.matches?.team_b_name;
  const matchOpen = bet.matches && (bet.matches.status === "live" || bet.matches.status === "upcoming");
  const canCancel = bet.result === "pending";
  const totalReturn = Number(bet.amount) + Number(bet.potential_win);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl overflow-hidden border ${
        bet.result === "won"
          ? "border-emerald-500/40 shadow-[0_0_24px_hsl(142deg_76%_36%/0.15)]"
          : bet.result === "cancelled"
          ? "border-border/30 opacity-70"
          : "border-border/50"
      } bg-card`}
    >
      {/* Top color strip */}
      <div className={`h-1 w-full ${
        bet.result === "won" ? "bg-gradient-to-r from-emerald-500 to-primary" :
        bet.result === "lost" ? "bg-red-500" :
        bet.result === "cancelled" ? "bg-muted-foreground/40" :
        "bg-gradient-to-r from-yellow-500 to-amber-400"
      }`} />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Status badge row */}
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.bg} ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(bet.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Match VS display */}
        <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {bet.matches?.status === "live" && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/15 border border-red-400/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </span>
              )}
              {bet.matches?.status === "upcoming" && (
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/30 px-2 py-0.5 rounded-full">UPCOMING</span>
              )}
              {bet.matches?.status === "closed" && (
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted/30 border border-border/40 px-2 py-0.5 rounded-full">CLOSED</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <p className={`text-sm font-extrabold tracking-tight ${bet.team_picked === "A" && bet.result !== "cancelled" ? "text-white" : "text-white/60"}`}>
                  {bet.matches?.team_a_name || "Team A"}
                </p>
                {bet.team_picked === "A" && (
                  <span className="text-[10px] text-blue-400 font-medium">Your Pick</span>
                )}
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-white/60">
                VS
              </div>
              <div className="flex-1 text-center">
                <p className={`text-sm font-extrabold tracking-tight ${bet.team_picked === "B" && bet.result !== "cancelled" ? "text-white" : "text-white/60"}`}>
                  {bet.matches?.team_b_name || "Team B"}
                </p>
                {bet.team_picked === "B" && (
                  <span className="text-[10px] text-blue-400 font-medium">Your Pick</span>
                )}
              </div>
            </div>
          </div>
          {/* You bet on pill */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center gap-2 bg-white/5 rounded-lg py-2 px-3">
              <span className="text-xs text-white/50">You bet on:</span>
              <span className="text-xs font-bold text-white bg-primary/30 border border-primary/40 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {teamPickedName || bet.team_picked}
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="rounded-xl border border-border/40 bg-secondary/30 divide-y divide-border/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-muted-foreground">Amount</span>
            <span className="text-sm font-bold text-foreground">₹{Number(bet.amount).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-muted-foreground">Rate</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {bet.odds}x
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-muted-foreground">Potential Win</span>
            <span className={`text-sm font-bold ${bet.result === "won" ? "text-emerald-400" : "text-primary"}`}>
              ₹{Number(bet.potential_win).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-muted-foreground">Total Return</span>
            <span className={`text-sm font-bold ${bet.result === "won" ? "text-emerald-400" : "text-red-400"}`}>
              ₹{totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {bet.result === "won" && (
            <Button
              className="w-full font-bold gap-2 bg-gradient-to-r from-emerald-600 to-primary text-white shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              onClick={() => onShare(bet)}
            >
              <Share2 className="h-4 w-4" /> Share Your Win 🎉
            </Button>
          )}

          {canCancel && (
            <>
              {matchOpen ? (
                <Button
                  variant="outline"
                  className="w-full font-bold gap-2 border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/80"
                  onClick={() => onCancel(bet.id)}
                  disabled={cancelling === bet.id}
                >
                  {cancelling === bet.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
                  ) : (
                    <><XCircle className="h-4 w-4" /> Cancel Bet</>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">Bet is in inactive state — cannot cancel after match closes.</p>
                </div>
              )}
            </>
          )}
        </div>
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

    const bet = bets.find((b) => b.id === betId);
    if (!bet) return;

    // Prevent double cancellation
    if (bet.result === "cancelled") {
      toast({ title: "Already cancelled", description: "This bet has already been cancelled.", variant: "destructive" });
      return;
    }

    // Check if match is active
    const matchOpen = bet.matches && (bet.matches.status === "live" || bet.matches.status === "upcoming");
    if (!matchOpen) {
      toast({ title: "Failed to cancel bet", description: "Bet is in inactive state", variant: "destructive" });
      return;
    }

    // Optimistic UI update immediately — prevents double-click exploitation
    setBets((prev) => prev.map((b) => b.id === betId ? { ...b, result: "cancelled" as const } : b));
    setCancelling(betId);

    try {
      const { error: updateErr } = await (supabase as any).from("bets").update({
        result: "cancelled",
        settled_at: new Date().toISOString(),
      }).eq("id", betId);

      if (updateErr) {
        // Revert optimistic update on error
        setBets((prev) => prev.map((b) => b.id === betId ? { ...b, result: "pending" as const } : b));
        toast({ title: "Failed to cancel", description: updateErr.message, variant: "destructive" });
        setCancelling(null);
        return;
      }

      // Refund wallet
      const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({
          wallet_balance: profile.wallet_balance + Number(bet.amount),
        }).eq("user_id", user.id);
      }

      await refreshProfile();
      toast({
        title: "✅ Bet Cancelled",
        description: `₹${Number(bet.amount).toLocaleString()} refunded to your wallet.`,
      });
    } catch (err: any) {
      // Revert on error
      setBets((prev) => prev.map((b) => b.id === betId ? { ...b, result: "pending" as const } : b));
      toast({ title: "Failed to cancel", description: err.message, variant: "destructive" });
    }

    setCancelling(null);
  };

  const handleShare = (bet: BetWithMatch) => setShareModalBet(bet);

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
    } catch {
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
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-foreground">My Bets</h1>
                <p className="text-muted-foreground text-sm">Track your betting history and manage active bets</p>
              </div>
            </div>
          </motion.div>

          {/* Stats row */}
          {!loading && bets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
            >
              {[
                { label: "Total Bets", value: stats.total, color: "text-foreground", bg: "bg-card border-border/50" },
                { label: "Won", value: stats.won, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/20" },
                { label: "Lost", value: stats.lost, color: "text-red-400", bg: "bg-red-500/5 border-red-500/20" },
                { label: "Pending", value: stats.pending, color: "text-yellow-400", bg: "bg-yellow-500/5 border-yellow-500/20" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className={`rounded-2xl border p-4 text-center ${s.bg}`}
                >
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Total winnings banner */}
          {!loading && stats.totalWon > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-primary/20 to-emerald-600/20 border border-emerald-500/30 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Total Winnings</p>
                  <p className="text-xs text-muted-foreground">All time earnings</p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-400">
                ₹{stats.totalWon.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </motion.div>
          )}

          {/* Filters */}
          {!loading && bets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Filter className="h-4 w-4 text-muted-foreground self-center" />
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
                  {f !== "all" && <span className="ml-1 opacity-60">({bets.filter((b) => b.result === f).length})</span>}
                </button>
              ))}
            </div>
          )}

          {/* Bet list */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-card border border-border/50 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
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
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-4 sm:grid-cols-2">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShareModalBet(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <WinCard bet={shareModalBet} />
              <div className="flex gap-3 mt-4">
                <Button
                  className="flex-1 gradient-neon-primary text-primary-foreground shadow-neon font-semibold"
                  onClick={handleCapture}
                  disabled={capturing}
                >
                  {capturing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Save & Share</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShareModalBet(null)} className="border-border/50">
                  Close
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Screenshot this card to share your win! 🏆
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
