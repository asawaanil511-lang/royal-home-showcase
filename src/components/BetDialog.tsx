import { useState, useEffect } from "react";
import { Match } from "@/data/matches";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Wallet, RotateCcw,
  Zap, CheckCircle2, Loader2,
  PartyPopper, Plus, TrendingUp, ArrowUpRight, IndianRupee,
} from "lucide-react";

type BetDialogProps = {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTeam?: "A" | "B";
  onBetPlaced?: () => void;
};

const PRESET_AMOUNTS = [100, 500, 2500, 10000, 20000, 50000];
const PERCENT_OPTIONS = [10, 50, 100];

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

const TeamCircle = ({
  name, logo, size = "md", selected = false,
}: {
  name: string; logo: string; size?: "sm" | "md" | "lg"; selected?: boolean;
}) => {
  const [err, setErr] = useState(false);
  const [c1, c2] = GRADIENT_PAIRS[hashName(name)];
  const abbr = getAbbr(name);
  const dim = size === "lg" ? 80 : size === "md" ? 56 : 40;
  const fontSize = size === "lg" ? "text-xl" : size === "md" ? "text-sm" : "text-xs";

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: dim, height: dim }}>
      {selected && (
        <div className="absolute inset-0 rounded-full blur-xl opacity-40" style={{ background: `radial-gradient(circle, ${c1}, transparent 70%)` }} />
      )}
      <div className="absolute inset-0 rounded-full transition-all" style={{
        boxShadow: selected ? `0 0 0 2px ${c1}, 0 0 16px ${c1}40` : `0 0 0 1.5px ${c1}30`,
      }} />
      {err || !logo || logo === "/placeholder.svg" ? (
        <div className="relative rounded-full flex items-center justify-center"
          style={{ width: dim, height: dim, background: `linear-gradient(135deg, ${c1}25, ${c2}35)`, border: `2px solid ${c1}40` }}>
          <span className={`font-black ${fontSize} tracking-tight`}
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {abbr}
          </span>
        </div>
      ) : (
        <img src={logo} alt={name} onError={() => setErr(true)} loading="lazy"
          className="relative rounded-full object-contain bg-secondary/30 p-1"
          style={{ width: dim, height: dim }} />
      )}
    </div>
  );
};

const BetDialog = ({ match, open, onOpenChange, initialTeam, onBetPlaced }: BetDialogProps) => {
  const [step, setStep] = useState<2 | 3>(2);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">("A");
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const [confirmedBet, setConfirmedBet] = useState<{
    team: "A" | "B"; teamName: string; amount: number; potentialWin: number; odds: number;
  } | null>(null);
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const balance = profile?.wallet_balance ?? 0;

  useEffect(() => {
    if (open) {
      setSelectedTeam(initialTeam ?? "A");
      setStep(2);
      setAmount("");
      setSelectedPreset(null);
      setConfirmedBet(null);
    }
  }, [open, initialTeam]);

  if (!match) return null;

  const selectedOdds = selectedTeam === "A" ? match.oddsA : match.oddsB;
  const selectedTeamName = selectedTeam === "A" ? match.teamA.name : match.teamB.name;
  const selectedTeamLogo = selectedTeam === "A" ? match.teamA.logo : match.teamB.logo;
  const betAmount = Number(amount) || 0;
  const profit = selectedOdds > 0 ? betAmount * (selectedOdds - 1) : 0;
  const totalReturn = betAmount + profit;
  const isLive = match.status === "live";

  const handlePreset = (val: number) => { setAmount(String(val)); setSelectedPreset(val); };
  const handlePercent = (pct: number) => {
    const val = Math.min(Math.floor((balance * pct) / 100), match.maxBet);
    setAmount(String(val)); setSelectedPreset(null);
  };
  const handleReset = () => { setAmount(""); setSelectedPreset(null); };
  const handleBetMore = () => {
    setStep(2);
    setSelectedTeam(initialTeam ?? "A");
    setAmount("");
    setSelectedPreset(null);
    setConfirmedBet(null);
  };

  const handlePlaceBet = async () => {
    if (!user || !profile) { toast({ title: "Login required", variant: "destructive" }); return; }
    if (!betAmount || betAmount < 100) { toast({ title: "Minimum pick is ₹100", variant: "destructive" }); return; }
    if (betAmount > match.maxBet) { toast({ title: `Max stake is ₹${match.maxBet.toLocaleString()}`, variant: "destructive" }); return; }
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
      toast({ title: "Play failed", description: error.message, variant: "destructive" });
      setPlacing(false); return;
    }
    await refreshProfile();
    onBetPlaced?.();
    setPlacing(false);
    setConfirmedBet({ team: selectedTeam, teamName: selectedTeamName, amount: betAmount, potentialWin, odds: selectedOdds });
    setStep(3);
  };

  const amountOk = betAmount >= 100 && betAmount <= balance && betAmount <= match.maxBet;
  const [tc1, tc2] = GRADIENT_PAIRS[hashName(selectedTeamName)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border border-border/60 overflow-hidden max-w-sm w-full rounded-2xl bg-card"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${tc1}cc, transparent)` }} />

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <AnimatePresence mode="wait">

          {/* ─── STEP 2: Stake Entry ─── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }} className="p-5 space-y-3.5">

              {/* Header */}
              <div className="pr-8">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  {isLive && <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                  {isLive ? "LIVE" : "UPCOMING"} · {match.teamA.name} vs {match.teamB.name}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <h2 className="text-base font-extrabold text-foreground">Place Your Pick</h2>
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1">
                    <Wallet className="h-3 w-3 text-emerald-400" />
                    <span className="text-[11px] font-bold text-emerald-400">₹{balance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Team selector */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { team: "A" as const, name: match.teamA.name, logo: match.teamA.logo, odds: match.oddsA },
                  { team: "B" as const, name: match.teamB.name, logo: match.teamB.logo, odds: match.oddsB },
                ]).map((t) => {
                  const [g1] = GRADIENT_PAIRS[hashName(t.name)];
                  const active = selectedTeam === t.team;
                  return (
                    <motion.button
                      key={t.team}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setSelectedTeam(t.team); setSelectedPreset(null); }}
                      className={`relative flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all border ${
                        active
                          ? "border-border bg-secondary"
                          : "border-border/40 bg-secondary/30 opacity-50 hover:opacity-70 hover:border-border/60"
                      }`}
                      style={active ? { boxShadow: `0 0 0 1px ${g1}30, 0 0 20px ${g1}15` } : {}}
                    >
                      {active && (
                        <div className="absolute inset-0 rounded-xl pointer-events-none opacity-10"
                          style={{ background: `radial-gradient(ellipse at 0% 50%, ${g1}, transparent 70%)` }} />
                      )}
                      <TeamCircle name={t.name} logo={t.logo} size="sm" selected={active} />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[10px] text-muted-foreground font-medium leading-none mb-0.5">Team {t.team}</p>
                        <p className="text-xs font-extrabold text-foreground truncate leading-tight">{t.name}</p>
                        <p className="text-[11px] font-bold mt-0.5 tabular-nums" style={{ color: g1 }}>{t.odds}x</p>
                      </div>
                      {active && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: g1 }} />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Quick amounts */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Quick Amounts</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_AMOUNTS.map((val) => {
                    const active = selectedPreset === val;
                    return (
                      <motion.button key={val} whileTap={{ scale: 0.94 }} onClick={() => handlePreset(val)}
                        className={`relative rounded-xl px-2 py-2 text-xs font-bold transition-all overflow-hidden border ${
                          active
                            ? "border-primary/70 text-primary bg-primary/12"
                            : "border-border/50 bg-secondary/60 text-foreground/70 hover:border-border hover:text-foreground hover:bg-secondary"
                        }`}>
                        {active && <div className="absolute inset-0 opacity-5 rounded-xl" style={{ background: `hsl(var(--primary))` }} />}
                        <span className="relative">₹{val.toLocaleString()}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* % shortcuts */}
              <div className="grid grid-cols-3 gap-1.5">
                {PERCENT_OPTIONS.map((pct) => (
                  <motion.button key={pct} whileTap={{ scale: 0.94 }} onClick={() => handlePercent(pct)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-border/50 bg-secondary/50 py-2 text-xs font-bold text-muted-foreground hover:border-primary/40 hover:bg-primary/8 hover:text-primary transition-all">
                    %{pct}
                  </motion.button>
                ))}
              </div>

              {/* Amount input */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Enter Amount</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary pointer-events-none">₹</span>
                  <input
                    type="number" inputMode="numeric" placeholder="0" value={amount}
                    onChange={(e) => { setAmount(e.target.value); setSelectedPreset(null); }}
                    className="w-full rounded-xl pl-8 pr-14 py-3 text-sm font-bold outline-none transition-all bg-secondary/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                  />
                  {betAmount > 0 && (
                    <button onClick={handleReset}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-border/60 bg-secondary/90 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      clear
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {betAmount > 0 && betAmount < 100 && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[10px] text-red-400 mt-1 ml-1">Min stake is ₹100</motion.p>
                  )}
                  {betAmount > balance && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[10px] text-red-400 mt-1 ml-1">Insufficient balance</motion.p>
                  )}
                  {betAmount > match.maxBet && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-[10px] text-amber-400 mt-1 ml-1">Max stake is ₹{match.maxBet.toLocaleString()}</motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Returns summary */}
              <AnimatePresence>
                {betAmount >= 100 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="rounded-xl border border-border/50 bg-secondary/40 overflow-hidden"
                  >
                    <div className="grid grid-cols-3 divide-x divide-border/40 text-center">
                      {[
                        { icon: IndianRupee, label: "Stake", value: `₹${betAmount.toLocaleString()}`, color: "text-foreground" },
                        { icon: TrendingUp, label: "Profit", value: `₹${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-emerald-400" },
                        { icon: ArrowUpRight, label: "Return", value: `₹${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-primary" },
                      ].map((r) => (
                        <div key={r.label} className="py-2.5 px-2">
                          <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            <r.icon className="h-2.5 w-2.5 text-muted-foreground" />
                            <p className="text-muted-foreground text-[9px] font-semibold uppercase tracking-wider">{r.label}</p>
                          </div>
                          <p className={`font-extrabold tabular-nums text-sm ${r.color}`}>{r.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2 pt-0.5">
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-secondary/60 px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
                <motion.button
                  whileTap={amountOk && !placing ? { scale: 0.98 } : {}}
                  onClick={handlePlaceBet}
                  disabled={placing || !amountOk}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold tracking-wide transition-all ${
                    amountOk && !placing
                      ? "gradient-neon-primary text-primary-foreground shadow-neon hover:opacity-95"
                      : "bg-secondary/60 text-muted-foreground cursor-not-allowed border border-border/40"
                  }`}
                >
                  {placing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Placing…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Play — ₹{betAmount > 0 ? betAmount.toLocaleString() : "0"}</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Confirmed ─── */}
          {step === 3 && confirmedBet && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22 }}
              className="p-5 flex flex-col items-center text-center gap-4"
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-8"
                style={{ background: `radial-gradient(ellipse at 50% 30%, ${tc1} 0%, transparent 65%)` }}
              />

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                className="relative flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: `linear-gradient(135deg, ${tc1}20, ${tc2}15)`, border: `2px solid ${tc1}40` }}
              >
                <PartyPopper className="h-8 w-8" style={{ color: tc1 }} />
              </motion.div>

              <div>
                <p className="text-xl font-extrabold text-foreground">Pick Placed! 🎉</p>
                <p className="text-xs text-muted-foreground mt-1">{match.teamA.name} vs {match.teamB.name}</p>
              </div>

              <div className="w-full rounded-2xl border border-border/50 bg-secondary/30 overflow-hidden">
                {[
                  { label: "Your Pick", value: confirmedBet.teamName, color: tc1 },
                  { label: "Stake Amount", value: `₹${confirmedBet.amount.toLocaleString()}`, color: "" },
                  { label: "Odds", value: `${confirmedBet.odds}x`, color: "" },
                  { label: "Potential Win", value: `₹${confirmedBet.potentialWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#22c55e" },
                ].map((r, i) => (
                  <div
                    key={r.label}
                    className={`flex items-center justify-between px-4 py-3 ${i < 3 ? "border-b border-border/30" : ""}`}
                  >
                    <span className="text-xs text-muted-foreground">{r.label}</span>
                    <span
                      className={`text-sm font-extrabold tabular-nums ${!r.color ? "text-foreground" : ""}`}
                      style={r.color ? { color: r.color } : undefined}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground leading-snug px-4">
                Results settle after the toss. Check <strong className="text-foreground/70">My Picks</strong> for updates.
              </p>

              <div className="flex w-full gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl border border-border/60 bg-secondary/60 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  Close
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBetMore}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-extrabold text-primary-foreground gradient-neon-primary shadow-neon"
                >
                  <Plus className="h-3.5 w-3.5" /> Play More
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
