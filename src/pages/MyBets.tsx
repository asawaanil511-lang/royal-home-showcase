import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Receipt, TrendingUp, Clock, Trophy, XCircle, Share2,
  AlertCircle, Loader2, Filter, Swords, CheckCircle2,
  ArrowUpRight, IndianRupee, Target, Zap, CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import betwicLogo from "@/assets/betwic-logo.jpg";

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

const STATUS = {
  pending:   { label: "Pending",   icon: Clock,         ring: "border-amber-400/40",   bg: "bg-amber-50 dark:bg-amber-400/5",    badge: "bg-amber-400/15 text-amber-600 dark:text-amber-400 border-amber-400/30",  strip: "bg-amber-400" },
  won:       { label: "Won",       icon: Trophy,        ring: "border-emerald-500/40", bg: "bg-emerald-50 dark:bg-emerald-500/5", badge: "bg-emerald-400/15 text-emerald-700 dark:text-emerald-400 border-emerald-400/30", strip: "bg-gradient-to-r from-emerald-400 to-primary" },
  lost:      { label: "Lost",      icon: XCircle,       ring: "border-red-400/30",     bg: "bg-background",                      badge: "bg-red-400/10 text-red-600 dark:text-red-400 border-red-400/30",          strip: "bg-red-400" },
  cancelled: { label: "Cancelled", icon: AlertCircle,   ring: "border-border/40",      bg: "bg-background",                      badge: "bg-secondary text-muted-foreground border-border/50",                     strip: "bg-muted-foreground/30" },
};

const MATCH_STATUS_COLORS: Record<string, string> = {
  live:     "text-red-500 bg-red-500/10 border-red-500/30",
  upcoming: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  closed:   "text-muted-foreground bg-secondary border-border/40",
};

const WinCard = ({ bet }: { bet: BetWithMatch }) => {
  const teamName = bet.team_picked === "A" ? bet.matches?.team_a_name : bet.matches?.team_b_name;
  const profit = Number(bet.potential_win) - Number(bet.amount);
  return (
    <div
      id={`win-card-${bet.id}`}
      className="rounded-2xl p-6 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a2e 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full blur-3xl opacity-30" style={{ background: "hsl(var(--primary))" }} />
      </div>
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={betwicLogo} alt="Betwic" className="h-10 w-10 rounded-full object-cover border-2 border-primary/50" />
          <div className="text-left">
            <p className="text-xs font-bold text-primary tracking-widest uppercase">Betwic Toss Book</p>
            <p className="text-[10px] text-gray-400">Official Win Certificate</p>
          </div>
        </div>
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-white text-lg font-bold mb-1">{bet.matches?.team_a_name} vs {bet.matches?.team_b_name}</p>
        <p className="text-gray-400 text-xs mb-4">You picked: <span className="text-primary font-semibold">{teamName}</span></p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-gray-400 text-[10px] mb-1">Bet</p>
            <p className="text-white text-lg font-bold">₹{Number(bet.amount).toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-gray-400 text-[10px] mb-1">Profit</p>
            <p className="text-emerald-400 text-lg font-bold">₹{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="rounded-xl p-3 border" style={{ background: "rgba(var(--primary)/0.15)", borderColor: "hsl(var(--primary)/0.4)" }}>
            <p className="text-[10px] mb-1" style={{ color: "hsl(var(--primary))" }}>🎉 Return</p>
            <p className="text-xl font-extrabold" style={{ color: "hsl(var(--primary))" }}>
              ₹{Number(bet.potential_win).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-xs border-t border-white/10 pt-3 mt-2">
          at {bet.odds}x odds • {new Date(bet.created_at).toLocaleString("en-IN")}
        </p>
        <p className="text-gray-600 text-[10px] mt-1">betwic-toss-book.com</p>
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
  const cfg = STATUS[bet.result] || STATUS.pending;
  const StatusIcon = cfg.icon;
  const teamA = bet.matches?.team_a_name || "Team A";
  const teamB = bet.matches?.team_b_name || "Team B";
  const teamPickedName = bet.team_picked === "A" ? teamA : teamB;
  const matchOpen = bet.matches && (bet.matches.status === "live" || bet.matches.status === "upcoming");
  const canCancel = bet.result === "pending";
  const profit = Number(bet.potential_win) - Number(bet.amount);
  const matchStatusClass = MATCH_STATUS_COLORS[bet.matches?.status || ""] || MATCH_STATUS_COLORS.closed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`rounded-2xl overflow-hidden border ${cfg.ring} bg-card shadow-sm`}
    >
      {/* Top status strip */}
      <div className={`h-1 w-full ${cfg.strip}`} />

      <div className="p-4 space-y-3">
        {/* Header: status + time */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.badge}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {new Date(bet.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Match VS card */}
        <div className="rounded-xl border border-border/40 bg-secondary/40 overflow-hidden">
          {/* Match status badge */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
            {bet.matches?.status && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-full ${matchStatusClass}`}>
                {bet.matches.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                {bet.matches.status.toUpperCase()}
              </span>
            )}
          </div>

          {/* Teams display */}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1">
            <div className={`flex-1 text-center py-2 px-1 rounded-lg transition-all ${bet.team_picked === "A" ? "bg-primary/10 border border-primary/30" : ""}`}>
              <p className={`text-sm font-extrabold truncate ${bet.team_picked === "A" ? "text-primary" : "text-muted-foreground"}`}>{teamA}</p>
              {bet.team_picked === "A" && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-primary mt-0.5">
                  <Target className="h-2.5 w-2.5" /> YOUR PICK
                </span>
              )}
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-[10px] font-bold text-muted-foreground">VS</div>
            </div>

            <div className={`flex-1 text-center py-2 px-1 rounded-lg transition-all ${bet.team_picked === "B" ? "bg-primary/10 border border-primary/30" : ""}`}>
              <p className={`text-sm font-extrabold truncate ${bet.team_picked === "B" ? "text-primary" : "text-muted-foreground"}`}>{teamB}</p>
              {bet.team_picked === "B" && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-primary mt-0.5">
                  <Target className="h-2.5 w-2.5" /> YOUR PICK
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Financial breakdown — matches BetDialog: Amount / Rate / Profit / Return */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/40 bg-secondary/30 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
              <IndianRupee className="h-2.5 w-2.5" /> Amount
            </p>
            <p className="text-base font-extrabold text-foreground">₹{Number(bet.amount).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-secondary/30 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> Rate
            </p>
            <p className="text-base font-extrabold text-emerald-500">{bet.odds}x</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-secondary/30 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5" /> Profit
            </p>
            <p className={`text-base font-extrabold ${bet.result === "won" ? "text-emerald-500" : bet.result === "cancelled" ? "text-muted-foreground" : "text-primary"}`}>
              {bet.result === "cancelled" ? "—" : `₹${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </p>
          </div>
          <div className={`rounded-xl border px-3 py-2.5 ${bet.result === "won" ? "border-emerald-500/30 bg-emerald-500/8" : "border-border/40 bg-secondary/30"}`}>
            <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
              <ArrowUpRight className="h-2.5 w-2.5" /> Return
            </p>
            <p className={`text-base font-extrabold ${bet.result === "won" ? "text-emerald-500" : bet.result === "cancelled" ? "text-muted-foreground" : "text-foreground"}`}>
              {bet.result === "cancelled" ? "Refunded" : `₹${Number(bet.potential_win).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </p>
          </div>
        </div>

        {/* Won result banner */}
        {bet.result === "won" && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">You won this toss!</span>
            </div>
            <span className="text-base font-extrabold text-emerald-500">
              +₹{Number(bet.potential_win).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}

        {/* Lost result banner */}
        {bet.result === "lost" && (
          <div className="rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-2 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-500 dark:text-red-400 font-medium">Toss lost — better luck next time</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {bet.result === "won" && (
            <Button
              className="w-full font-bold gap-2 bg-gradient-to-r from-emerald-600 to-primary text-white shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              onClick={() => onShare(bet)}
            >
              <Share2 className="h-4 w-4" /> Share Win 🎉
            </Button>
          )}

          {canCancel && matchOpen && (
            <Button
              variant="outline"
              className="w-full gap-2 border-red-500/40 bg-red-500/5 text-red-500 hover:bg-red-500/15 hover:border-red-500/70 font-semibold"
              onClick={() => onCancel(bet.id)}
              disabled={cancelling === bet.id}
            >
              {cancelling === bet.id
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
                : <><XCircle className="h-4 w-4" /> Cancel Bet</>
              }
            </Button>
          )}

          {canCancel && !matchOpen && (
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">Cannot cancel — match is no longer active.</p>
            </div>
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
      .on("postgres_changes", { event: "*", schema: "public", table: "bets", filter: `user_id=eq.${user.id}` }, () => fetchBets())
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [user]);

  const handleCancel = async (betId: string) => {
    if (!user) return;
    const bet = bets.find((b) => b.id === betId);
    if (!bet) return;
    if (bet.result === "cancelled") {
      toast({ title: "Already cancelled", variant: "destructive" });
      return;
    }
    const matchOpen = bet.matches && (bet.matches.status === "live" || bet.matches.status === "upcoming");
    if (!matchOpen) {
      toast({ title: "Cannot cancel", description: "Match is no longer active", variant: "destructive" });
      return;
    }
    setBets((prev) => prev.map((b) => b.id === betId ? { ...b, result: "cancelled" as const } : b));
    setCancelling(betId);
    try {
      const { error: updateErr } = await (supabase as any).from("bets").update({
        result: "cancelled", settled_at: new Date().toISOString(),
      }).eq("id", betId);
      if (updateErr) {
        setBets((prev) => prev.map((b) => b.id === betId ? { ...b, result: "pending" as const } : b));
        toast({ title: "Failed to cancel", description: updateErr.message, variant: "destructive" });
        setCancelling(null); return;
      }
      const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance + Number(bet.amount) }).eq("user_id", user.id);
      }
      await refreshProfile();
      toast({ title: "Bet Cancelled", description: `₹${Number(bet.amount).toLocaleString()} refunded to your wallet.` });
    } catch (err: any) {
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
        const file = new File([blob], "betwic-toss-win.png", { type: "image/png" });
        await navigator.share({ title: "I won on Betwic Toss Book! 🏆", files: [file] });
      } else {
        const link = document.createElement("a");
        link.download = "betwic-toss-win.png";
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
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Receipt className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Login to view your bets</h2>
          <Button className="gradient-neon-primary text-primary-foreground" asChild><Link to="/login">Login</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = filter === "all" ? bets : bets.filter((b) => b.result === filter);

  const wonBets = bets.filter((b) => b.result === "won");
  const pendingBets = bets.filter((b) => b.result === "pending");
  const lostCount = bets.filter((b) => b.result === "lost").length;
  const totalWon = wonBets.reduce((s, b) => s + Number(b.potential_win), 0);
  const totalStaked = bets.filter((b) => b.result !== "cancelled").reduce((s, b) => s + Number(b.amount), 0);

  const FILTERS: { key: "all" | "pending" | "won" | "lost" | "cancelled"; label: string; color: string }[] = [
    { key: "all",       label: "All",       color: "" },
    { key: "pending",   label: "Pending",   color: "text-amber-600 dark:text-amber-400" },
    { key: "won",       label: "Won",       color: "text-emerald-600 dark:text-emerald-400" },
    { key: "lost",      label: "Lost",      color: "text-red-500" },
    { key: "cancelled", label: "Cancelled", color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />

      {/* Page header */}
      <div className="border-b border-border/40 bg-card/40">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">My Bets</h1>
              <p className="text-sm text-muted-foreground">Betting history & active bets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Stats row */}
        {!loading && bets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2 mb-5"
          >
            {[
              { label: "Bets", value: bets.length, color: "text-foreground", sub: "Total" },
              { label: pendingBets.length.toString(), color: "text-amber-500", sub: "Pending" },
              { label: wonBets.length.toString(), color: "text-emerald-500", sub: "Won" },
              { label: lostCount.toString(), color: "text-red-400", sub: "Lost" },
            ].map((s, i) => (
              <motion.div
                key={s.sub}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border/50 bg-card p-3 text-center"
              >
                <p className={`text-xl font-extrabold ${s.color}`}>{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Total winnings banner */}
        {!loading && totalWon > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-primary/10 to-emerald-500/15 border border-emerald-500/30 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Total Winnings</p>
                <p className="text-xs text-muted-foreground">All time returns</p>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-500">
              ₹{totalWon.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
        )}

        {/* Filter tabs */}
        {!loading && bets.length > 0 && (
          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-0.5 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {FILTERS.map((f) => {
              const count = f.key === "all" ? bets.length : bets.filter((b) => b.result === f.key).length;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border ${
                    active
                      ? "gradient-neon-primary text-primary-foreground border-transparent shadow-neon"
                      : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {f.label}
                  {f.key !== "all" && (
                    <span className={`ml-1.5 font-bold ${active ? "opacity-80" : f.color || "opacity-60"}`}>
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-card border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-card text-4xl">
              {filter === "all" ? "🎲" : "🔍"}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-1">
                {filter === "all" ? "No bets yet" : `No ${filter} bets`}
              </h3>
              {filter === "all" && (
                <>
                  <p className="text-muted-foreground text-sm mb-4">Place your first bet to see it here.</p>
                  <Button className="gradient-neon-primary text-primary-foreground shadow-neon" asChild>
                    <Link to="/matches"><Swords className="h-4 w-4 mr-1.5" /> Browse Matches</Link>
                  </Button>
                </>
              )}
            </div>
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

      {/* Share / Win modal */}
      <AnimatePresence>
        {shareModalBet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={() => setShareModalBet(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <WinCard bet={shareModalBet} />
              <div className="flex gap-2 mt-3">
                <Button
                  className="flex-1 gradient-neon-primary text-primary-foreground gap-2"
                  onClick={handleCapture}
                  disabled={capturing}
                >
                  {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  {capturing ? "Preparing..." : "Share / Download"}
                </Button>
                <Button variant="outline" className="border-border/60" onClick={() => setShareModalBet(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default MyBets;
