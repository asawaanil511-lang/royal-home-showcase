import { useState, useEffect } from "react";
import { Match } from "@/data/matches";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, TrendingUp, Wallet, RotateCcw, Trophy, ChevronLeft,
  Percent, Zap, CheckCircle2, ArrowRight, Loader2,
} from "lucide-react";

type BetDialogProps = {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PRESET_AMOUNTS = [100, 500, 2500, 10000, 20000, 50000];
const PERCENT_OPTIONS = [10, 50, 100];

// ── Same gradient system as MatchCard ─────────────────────────────────────
const GRADIENT_PAIRS: [string, string][] = [
  ["#00d4b4", "#0099ff"],
  ["#f97316", "#ef4444"],
  ["#a855f7", "#6366f1"],
  ["#22c55e", "#14b8a6"],
  ["#eab308", "#f97316"],
  ["#ec4899", "#a855f7"],
  ["#06b6d4", "#3b82f6"],
  ["#84cc16", "#22c55e"],
];
const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h) % GRADIENT_PAIRS.length;
};
const getAbbr = (name: string): string => {
  const skip = new Set(["the", "of", "and", "women", "men", "a"]);
  const words = name.split(/\s+/).filter((w) => w.length > 1 && !skip.has(w.toLowerCase()));
  if (!words.length) return name.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (words.length >= 3) return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
};

// ── Mini team avatar ───────────────────────────────────────────────────────
const TeamBadge = ({ name, logo, size = "md" }: { name: string; logo: string; size?: "sm" | "md" | "lg" }) => {
  const [err, setErr] = useState(false);
  const [c1, c2] = GRADIENT_PAIRS[hashName(name)];
  const abbr = getAbbr(name);
  const dim = size === "lg" ? 72 : size === "md" ? 52 : 36;
  const fontSize = size === "lg" ? "text-lg" : size === "md" ? "text-sm" : "text-xs";

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: dim, height: dim }}>
      <div className="absolute inset-0 rounded-full blur-xl opacity-30"
        style={{ background: `radial-gradient(circle, ${c1}, transparent 70%)` }} />
      <div className="absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 0 1.5px ${c1}40, 0 0 12px ${c1}20` }} />
      {err || !logo || logo === "/placeholder.svg" ? (
        <div className="relative rounded-full flex items-center justify-center"
          style={{ width: dim, height: dim, background: `linear-gradient(135deg, ${c1}25, ${c2}35)`, border: `1.5px solid ${c1}45` }}>
          <span className={`font-black ${fontSize} tracking-tight`}
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {abbr}
          </span>
        </div>
      ) : (
        <img src={logo} alt={name} onError={() => setErr(true)}
          className="relative rounded-full object-contain bg-white/5 p-1"
          style={{ width: dim, height: dim }} />
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const BetDialog = ({ match, open, onOpenChange }: BetDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const balance = profile?.wallet_balance ?? 0;

  useEffect(() => {
    if (!open) {
      setTimeout(() => { setStep(1); setSelectedTeam(null); setAmount(""); setSelectedPreset(null); }, 300);
    }
  }, [open]);

  if (!match) return null;

  const selectedOdds = selectedTeam === "A" ? match.oddsA : selectedTeam === "B" ? match.oddsB : 0;
  const selectedTeamName = selectedTeam === "A" ? match.teamA.name : selectedTeam === "B" ? match.teamB.name : "";
  const selectedTeamLogo = selectedTeam === "A" ? match.teamA.logo : selectedTeam === "B" ? match.teamB.logo : "";
  const betAmount = Number(amount) || 0;
  const profit = selectedOdds > 0 ? betAmount * (selectedOdds - 1) : 0;
  const totalReturn = betAmount + profit;
  const isLive = match.status === "live";
  const [tc1] = GRADIENT_PAIRS[hashName(selectedTeamName)];

  const handleTeamSelect = (team: "A" | "B") => { setSelectedTeam(team); setStep(2); };
  const handlePreset = (val: number) => { setAmount(String(val)); setSelectedPreset(val); };
  const handlePercent = (pct: number) => {
    const val = Math.min(Math.floor((balance * pct) / 100), match.maxBet);
    setAmount(String(val)); setSelectedPreset(null);
  };
  const handleReset = () => { setAmount(""); setSelectedPreset(null); };
  const handleBack = () => { setStep(1); setSelectedTeam(null); setAmount(""); setSelectedPreset(null); };

  const handlePlaceBet = async () => {
    if (!user || !profile) { toast({ title: "Login required", variant: "destructive" }); return; }
    if (!selectedTeam) { toast({ title: "Select a team", variant: "destructive" }); return; }
    if (!betAmount || betAmount < 100) { toast({ title: "Minimum bet is ₹100", variant: "destructive" }); return; }
    if (betAmount > match.maxBet) { toast({ title: `Max bet is ₹${match.maxBet.toLocaleString()}`, variant: "destructive" }); return; }
    if (betAmount > balance) { toast({ title: "Insufficient balance", variant: "destructive" }); return; }

    setPlacing(true);
    await supabase.from("profiles").update({ wallet_balance: balance - betAmount }).eq("user_id", user.id);
    const potentialWin = betAmount * selectedOdds;
    const { error } = await supabase.from("bets").insert({
      user_id: user.id, match_id: match.id, team_picked: selectedTeam,
      amount: betAmount, odds: selectedOdds, potential_win: potentialWin,
    });
    if (error) {
      await supabase.from("profiles").update({ wallet_balance: balance }).eq("user_id", user.id);
      toast({ title: "Bet failed", description: error.message, variant: "destructive" });
      setPlacing(false); return;
    }
    await refreshProfile();
    setPlacing(false);
    toast({ title: "🎉 Bet Placed!", description: `₹${betAmount.toLocaleString()} on ${selectedTeamName}. Potential win: ₹${potentialWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}` });
    onOpenChange(false);
  };

  const amountOk = betAmount >= 100 && betAmount <= balance && betAmount <= match.maxBet;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border border-primary/20 overflow-hidden max-w-sm w-full rounded-2xl"
        style={{ background: "linear-gradient(160deg, #0c0e1a 0%, #0a0c15 100%)" }}
      >
        {/* Glow accent top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-48 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "hsl(var(--primary))" }} />

        {/* Close */}
        <button onClick={() => onOpenChange(false)}
          className="absolute right-3.5 top-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-all">
          <X className="h-3.5 w-3.5" />
        </button>

        <AnimatePresence mode="wait">
          {/* ────────────── STEP 1: Team Selection ────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }} className="p-5">

              {/* Balance pill */}
              <div className="flex items-center gap-1.5 mb-5">
                <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-white/50">Balance:</span>
                  <span className="text-xs font-bold text-primary">₹{balance.toLocaleString()}</span>
                </div>
                {isLive && (
                  <span className="flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white">
                    <span className="h-1 w-1 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="mb-5">
                <h2 className="text-xl font-extrabold text-white tracking-tight mb-0.5">Place Your Bet</h2>
                <p className="text-xs text-white/35">{match.teamA.name} vs {match.teamB.name}</p>
                <p className="text-[11px] text-white/25 mt-0.5">Max ₹{match.maxBet.toLocaleString()}</p>
              </div>

              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3">Choose a Team</p>

              {/* Team cards */}
              <div className="space-y-2.5">
                {([
                  { team: "A" as const, name: match.teamA.name, logo: match.teamA.logo, odds: match.oddsA },
                  { team: "B" as const, name: match.teamB.name, logo: match.teamB.logo, odds: match.oddsB },
                ]).map((t) => {
                  const [g1, g2] = GRADIENT_PAIRS[hashName(t.name)];
                  return (
                    <motion.button key={t.team} whileTap={{ scale: 0.98 }} onClick={() => handleTeamSelect(t.team)}
                      className="group w-full flex items-center gap-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3.5 transition-all hover:border-primary/40 hover:bg-primary/8"
                      style={{ "--g1": g1, "--g2": g2 } as any}>
                      <TeamBadge name={t.name} logo={t.logo} size="md" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold text-white truncate">{t.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                          <span className="text-xs text-emerald-400 font-semibold">{t.odds}x payout</span>
                        </div>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
                        <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-primary transition-colors" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ────────────── STEP 2: Stake Entry ────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }} className="p-5 space-y-4">

              {/* Top row: balance + back */}
              <div className="flex items-center justify-between">
                <button onClick={handleBack}
                  className="flex items-center gap-1 text-white/40 hover:text-white transition-colors text-xs font-semibold">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5">
                  <Wallet className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-bold text-primary">₹{balance.toLocaleString()}</span>
                </div>
              </div>

              {/* Selected team hero */}
              <div className="relative flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/3 py-4 overflow-hidden">
                {/* subtle glow behind */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${tc1} 0%, transparent 60%)` }} />
                <TeamBadge name={selectedTeamName} logo={selectedTeamLogo} size="lg" />
                <p className="text-base font-extrabold text-white tracking-tight text-center">{selectedTeamName}</p>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">Rate: {selectedOdds}x</span>
                </div>
              </div>

              {/* Preset amount grid */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Quick Amounts</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((val) => {
                    const active = selectedPreset === val;
                    return (
                      <motion.button key={val} whileTap={{ scale: 0.95 }} onClick={() => handlePreset(val)}
                        className={`relative rounded-xl px-2 py-2.5 text-xs font-bold transition-all overflow-hidden ${
                          active
                            ? "border border-primary/60 text-primary"
                            : "border border-white/10 bg-white/5 text-white/70 hover:border-primary/30 hover:text-white/90"
                        }`}
                        style={active ? { background: "hsl(var(--primary)/0.12)" } : {}}>
                        {active && (
                          <motion.div layoutId="preset-bg" className="absolute inset-0 rounded-xl"
                            style={{ background: "hsl(var(--primary)/0.1)" }} />
                        )}
                        <span className="relative">₹{val.toLocaleString()}</span>
                        {active && <CheckCircle2 className="absolute top-1 right-1 h-2.5 w-2.5 text-primary" />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* % of balance row */}
              <div className="grid grid-cols-3 gap-2">
                {PERCENT_OPTIONS.map((pct) => (
                  <motion.button key={pct} whileTap={{ scale: 0.95 }} onClick={() => handlePercent(pct)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-primary/30 bg-primary/6 py-2 text-xs font-bold text-primary/80 hover:border-primary/60 hover:bg-primary/12 hover:text-primary transition-all">
                    <Percent className="h-3 w-3" />{pct}
                  </motion.button>
                ))}
              </div>

              {/* Custom amount input — explicit dark styling to prevent white-on-white */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Custom Amount</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary pointer-events-none">₹</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setSelectedPreset(null); }}
                    style={{
                      colorScheme: "dark",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    className="w-full rounded-xl pl-8 pr-16 py-3 text-sm font-bold outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-white/20"
                    onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary)/0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                  />
                  {betAmount > 0 && (
                    <button onClick={handleReset}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/8 px-2 py-1 text-[10px] text-white/50 hover:text-white/80 transition-colors">
                      clear
                    </button>
                  )}
                </div>
                {/* validation hint */}
                <AnimatePresence>
                  {betAmount > 0 && betAmount < 100 && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[10px] text-red-400 mt-1.5 ml-1">Min bet is ₹100</motion.p>
                  )}
                  {betAmount > balance && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[10px] text-red-400 mt-1.5 ml-1">Insufficient balance</motion.p>
                  )}
                  {betAmount > match.maxBet && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[10px] text-amber-400 mt-1.5 ml-1">Max bet is ₹{match.maxBet.toLocaleString()}</motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Bet Summary */}
              <div className="rounded-2xl border border-primary/15 overflow-hidden"
                style={{ background: "rgba(0,212,180,0.04)" }}>
                <div className="flex items-center gap-2 border-b border-primary/10 px-4 py-2.5">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold text-primary/70 uppercase tracking-widest">Bet Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-white/4 text-xs">
                  {[
                    { label: "Stake", value: `₹${betAmount.toLocaleString()}`, color: "text-white" },
                    { label: "Profit", value: `₹${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-emerald-400" },
                    { label: "Rate", value: `${selectedOdds}x`, color: "text-white/70" },
                    { label: "Total Return", value: `₹${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-primary" },
                  ].map((row) => (
                    <div key={row.label} className="flex flex-col gap-0.5 bg-[#0c0e1a] px-4 py-3">
                      <span className="text-white/40">{row.label}</span>
                      <span className={`font-extrabold tabular-nums ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/8 transition-all">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
                <motion.button
                  whileTap={amountOk && !placing ? { scale: 0.98 } : {}}
                  onClick={handlePlaceBet}
                  disabled={placing || !amountOk}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold tracking-wide transition-all ${
                    amountOk && !placing
                      ? "gradient-neon-primary text-primary-foreground shadow-neon hover:opacity-95"
                      : "bg-white/8 text-white/30 cursor-not-allowed border border-white/8"
                  }`}
                >
                  {placing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Placing…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Place Bet</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BetDialog;
