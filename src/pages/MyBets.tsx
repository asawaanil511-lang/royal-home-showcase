import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Trophy, XCircle, AlertCircle, Loader2, TrendingDown,
  Search, Clock, Share2, CheckCircle2, Wallet, Target,
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
    match_title?: string | null;
  } | null;
};

const STATUS_CFG = {
  pending:   { label: "LIVE",      icon: Clock,        badgeBg: "bg-amber-500/15",   badgeText: "text-amber-400",   badgeBorder: "border-amber-400/30", cardBorder: "border-zinc-800" },
  won:       { label: "WON",       icon: Trophy,       badgeBg: "bg-emerald-500/15", badgeText: "text-emerald-400", badgeBorder: "border-emerald-500/30", cardBorder: "border-emerald-500/20" },
  lost:      { label: "LOST",      icon: XCircle,      badgeBg: "bg-red-500/10",     badgeText: "text-red-400",     badgeBorder: "border-red-400/30", cardBorder: "border-red-400/20" },
  cancelled: { label: "CANCELLED", icon: AlertCircle,  badgeBg: "bg-zinc-800",       badgeText: "text-zinc-400",    badgeBorder: "border-zinc-700/50", cardBorder: "border-zinc-800/60" },
};

const fmtAmount = (v: number) =>
  "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const fmtGroupDate = (key: string) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const yestKey  = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (key === todayKey) return "TODAY";
  if (key === yestKey)  return "YESTERDAY";
  return new Date(key + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }).toUpperCase();
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
  bet, onCancel, onShare, cancelling,
}: {
  bet: BetWithMatch;
  onCancel: (id: string) => void;
  onShare: (bet: BetWithMatch) => void;
  cancelling: string | null;
}) => {
  const cfg = STATUS_CFG[bet.result] || STATUS_CFG.pending;
  const StatusIcon = cfg.icon;
  const teamA = bet.matches?.team_a_name || "Team A";
  const teamB = bet.matches?.team_b_name || "Team B";
  const pickedName = bet.team_picked === "A" ? teamA : teamB;
  const league = bet.matches?.match_title || "";
  const matchOpen = bet.matches && (bet.matches.status === "live" || bet.matches.status === "upcoming");
  const canCancel = bet.result === "pending";
  const isCancelling = cancelling === bet.id;
  const winTotal = Number(bet.amount) + Number(bet.potential_win);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-2xl overflow-hidden border bg-zinc-900 ${cfg.cardBorder}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
          <span className="text-[12px] text-zinc-500">{fmtTime(bet.created_at)}</span>
        </div>
        <span className="text-[15px] font-extrabold text-white">{fmtAmount(Number(bet.amount))}</span>
      </div>

      {/* Match info */}
      <div className="px-4 pb-3">
        {league ? (
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">{league}</p>
        ) : null}
        <p className="text-[17px] font-extrabold text-white tracking-wide">
          {teamA} <span className="text-zinc-500 font-semibold text-sm">vs</span> {teamB}
        </p>
        <p className="text-[13px] text-zinc-400 mt-1">
          Pick: <span className="text-sky-400 font-bold">{pickedName}</span>
          <span className="text-zinc-600 mx-1.5">·</span>
          Rate <span className="font-semibold text-zinc-300">{bet.odds}x</span>
        </p>
      </div>

      {/* Bottom financials */}
      <div className="border-t border-zinc-800 bg-zinc-900/80">
        {bet.result === "cancelled" ? (
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-400 font-semibold">Refunded</span>
            </div>
            <span className="text-base font-extrabold text-zinc-300">{fmtAmount(Number(bet.amount))}</span>
          </div>
        ) : bet.result === "won" ? (
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Profit</span>
              <span className="text-sm font-bold text-emerald-400">{fmtAmount(Number(bet.potential_win))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400 font-semibold">Total return</span>
              <span className="text-[15px] font-extrabold text-emerald-400">{fmtAmount(winTotal)}</span>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Potential win</span>
              <span className="text-sm font-bold text-sky-400">{fmtAmount(Number(bet.potential_win))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400 font-semibold">If you win</span>
              <span className="text-[15px] font-extrabold text-white">{fmtAmount(winTotal)}</span>
            </div>
          </div>
        )}

        {/* Action row */}
        {(canCancel || bet.result === "won") && (
          <div className="px-4 pb-3.5 pt-1 space-y-2">
            {bet.result === "won" && (
              <Button
                size="sm"
                className="w-full font-bold gap-2 bg-sky-500 hover:bg-sky-400 text-white"
                onClick={() => onShare(bet)}
              >
                <Share2 className="h-4 w-4" /> Share Win 🎉
              </Button>
            )}
            {canCancel && matchOpen && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 font-semibold"
                onClick={() => onCancel(bet.id)}
                disabled={isCancelling}
              >
                {isCancelling
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
                  : <><XCircle className="h-4 w-4" /> Cancel Bet</>}
              </Button>
            )}
            {canCancel && !matchOpen && (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/20 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <p className="text-xs text-zinc-500">Cannot cancel — match no longer active</p>
              </div>
            )}
          </div>
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
  const [search, setSearch] = useState("");
  const [shareModalBet, setShareModalBet] = useState<BetWithMatch | null>(null);
  const [capturing, setCapturing] = useState(false);
  const { toast } = useToast();

  const fetchBets = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    const { data, error } = await (supabase as any)
      .from("bets")
      .select("*, matches(team_a_name, team_b_name, status, match_date, match_title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setBets((data as BetWithMatch[]) || []);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchBets();
    if (!user) return;
    const channel = (supabase as any)
      .channel(`my-bets-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bets", filter: `user_id=eq.${user.id}` }, () => {
        fetchBets(true);
      })
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [user]);

  const handleCancel = async (betId: string) => {
    if (!user) return;
    const bet = bets.find((b) => b.id === betId);
    if (!bet) return;
    if (bet.result !== "pending") { toast({ title: "Already settled", variant: "destructive" }); return; }
    const matchOpen = bet.matches && (bet.matches.status === "live" || bet.matches.status === "upcoming");
    if (!matchOpen) { toast({ title: "Cannot cancel", description: "Match is no longer active", variant: "destructive" }); return; }

    setCancelling(betId);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { toast({ title: "Not authenticated", variant: "destructive" }); setCancelling(null); return; }

      const res = await fetch(apiUrl("/api/cancel-bet"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bet_id: betId }),
      });

      let json: any = {};
      try { json = await res.json(); } catch { }

      if (!res.ok || !json.success) {
        toast({ title: "Failed to cancel", description: json.error || "Could not cancel bet", variant: "destructive" });
        setCancelling(null);
        return;
      }

      setBets((prev) => prev.map((b) => b.id === betId ? { ...b, result: "cancelled" as const } : b));
      fetchBets(true);
      refreshProfile();
      toast({ title: "Bet Cancelled", description: `${fmtAmount(Number(bet.amount))} refunded to your wallet.` });
    } catch (err: any) {
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
      <div className="min-h-screen bg-background dark:bg-zinc-950 pb-24 md:pb-0">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Trophy className="h-16 w-16 text-zinc-600" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-white">Login to view your bets</h2>
          <Button className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-8 rounded-full" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const totalWins      = bets.filter((b) => b.result === "won").length;
  const totalLost      = bets.filter((b) => b.result === "lost").length;
  const totalPending   = bets.filter((b) => b.result === "pending").length;
  const totalInvested  = bets.reduce((s, b) => s + Number(b.amount), 0);

  const FILTERS: { key: "all" | "pending" | "won" | "lost" | "cancelled"; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "pending",   label: "Live" },
    { key: "won",       label: "Won" },
    { key: "lost",      label: "Lost" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const searchLower = search.toLowerCase();
  const filtered = bets.filter((b) => {
    const matchesFilter = filter === "all" || b.result === filter;
    const matchesSearch = !search || (
      b.matches?.team_a_name.toLowerCase().includes(searchLower) ||
      b.matches?.team_b_name.toLowerCase().includes(searchLower) ||
      (b.matches?.match_title || "").toLowerCase().includes(searchLower)
    );
    return matchesFilter && matchesSearch;
  });

  // Group bets by calendar day (from created_at)
  const groupedMap = new Map<string, BetWithMatch[]>();
  for (const bet of filtered) {
    const key = new Date(bet.created_at).toISOString().slice(0, 10);
    if (!groupedMap.has(key)) groupedMap.set(key, []);
    groupedMap.get(key)!.push(bet);
  }
  const groupKeys = [...groupedMap.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 pb-24 md:pb-0">
      <Navbar />

      <div className="container mx-auto px-4 py-5 max-w-lg">

        {/* Stats row — 4 cards */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { icon: Target,       label: "Live",     value: loading ? "—" : totalPending,  color: "text-amber-400" },
            { icon: Trophy,       label: "Won",      value: loading ? "—" : totalWins,     color: "text-emerald-400" },
            { icon: TrendingDown, label: "Lost",     value: loading ? "—" : totalLost,     color: "text-red-400" },
            { icon: Wallet,       label: "Invested", value: loading ? "—" : `₹${totalInvested.toLocaleString("en-IN")}`, color: "text-sky-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col items-center gap-1">
              <s.icon className={`h-5 w-5 ${s.color}`} strokeWidth={1.8} />
              <p className={`text-base font-extrabold ${s.color} leading-none`}>{s.value}</p>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search league or teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-sky-500/50 transition-colors"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-xl px-4 py-1.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-sky-500 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Trophy className="h-16 w-16 text-zinc-700" strokeWidth={1.2} />
            <div className="text-center">
              <p className="text-lg font-bold text-white mb-1">No bets here</p>
              <p className="text-sm text-zinc-500">Place a bet from the dashboard.</p>
            </div>
            <Button className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-8 rounded-full mt-2" asChild>
              <Link to="/matches">Go to dashboard</Link>
            </Button>
          </div>
        )}

        {/* Bet cards grouped by date */}
        {!loading && filtered.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="space-y-5">
              {groupKeys.map((key) => (
                <div key={key}>
                  {/* Date header */}
                  <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-3">
                    {fmtGroupDate(key)}
                  </p>
                  <div className="space-y-3">
                    {groupedMap.get(key)!.map((bet) => (
                      <BetCard
                        key={bet.id}
                        bet={bet}
                        onCancel={handleCancel}
                        onShare={handleShare}
                        cancelling={cancelling}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Share / Win card modal */}
      <AnimatePresence>
        {shareModalBet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4 pb-8"
            onClick={() => setShareModalBet(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <WinCard bet={shareModalBet} />
              <div className="mt-3 flex gap-2">
                <Button
                  className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold gap-2"
                  onClick={handleCapture}
                  disabled={capturing}
                >
                  {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  {capturing ? "Saving..." : "Share / Save"}
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => setShareModalBet(null)}
                >
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
