import { useState, useEffect } from "react";
import { Match } from "@/data/matches";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Wallet, RotateCcw, ChevronLeft,
  Percent, Zap, CheckCircle2, Loader2,
  Swords, PartyPopper, Plus,
} from "lucide-react";

type BetDialogProps = {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const dim = size === "lg" ? 80 : size === "md" ? 64 : 44;
  const fontSize = size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-xs";

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: dim, height: dim }}
    >
      {selected && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-50"
          style={{ background: `radial-gradient(circle, ${c1}, transparent 70%)` }}
        />
      )}
      <div
        className="absolute inset-0 rounded-full transition-all"
        style={{
          boxShadow: selected
            ? `0 0 0 2px ${c1}, 0 0 20px ${c1}40`
            : `0 0 0 1.5px ${c1}40`,
        }}
      />
      {err || !logo || logo === "/placeholder.svg" ? (
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: dim, height: dim,
            background: `linear-gradient(135deg, ${c1}30, ${c2}40)`,
            border: `2px solid ${c1}50`,
          }}
        >
          <span
            className={`font-black ${fontSize} tracking-tight`}
            style={{
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {abbr}
          </span>
        </div>
      ) : (
        <img
          src={logo} alt={name} onError={() => setErr(true)}
          className="relative rounded-full object-contain bg-white/5 p-1"
          style={{ width: dim, height: dim }}
        />
      )}
    </div>
  );
};

const BetDialog = ({ match, open, onOpenChange }: BetDialogProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
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
    if (!open) {
      setTimeout(() => {
        setStep(1); setSelectedTeam(null); setAmount("");
        setSelectedPreset(null); setConfirmedBet(null);
      }, 300);
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

  const handleTeamSelect = (team: "A" | "B") => { setSelectedTeam(team); setStep(2); };
  const handlePreset = (val: number) => { setAmount(String(val)); setSelectedPreset(val); };
  const handlePercent = (pct: number) => {
    const val = Math.min(Math.floor((balance * pct) / 100), match.maxBet);
    setAmount(String(val)); setSelectedPreset(null);
  };
  const handleReset = () => { setAmount(""); setSelectedPreset(null); };
  const handleBack = () => { setStep(1); setSelectedTeam(null); setAmount(""); setSelectedPreset(null); };
  const handleBetMore = () => { setStep(1); setSelectedTeam(null); setAmount(""); setSelectedPreset(null); setConfirmedBet(null); };

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
    setConfirmedBet({ team: selectedTeam, teamName: selectedTeamName, amount: betAmount, potentialWin, odds: selectedOdds });
    setStep(3);
  };

  const amountOk = betAmount >= 100 && betAmount <= balance && betAmount <= match.maxBet;
  const [tc1, tc2] = selectedTeamName ? GRADIENT_PAIRS[hashName(selectedTeamName)] : ["#00d4b4", "#0099ff"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border border-white/10 overflow-hidden max-w-sm w-full rounded-2xl"
        style={{ background: "linear-gradient(160deg, #0c0e1a 0%, #0a0c15 100%)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3.5 top-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <AnimatePresence mode="wait">

          {/* ─── STEP 1: Team Selection ─── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }} className="p-5">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                    {isLive ? "● LIVE" : "UPCOMING"}
                  </p>
                  <h2 className="text-lg font-extrabold text-white mt-0.5">Pick Your Side</h2>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">₹{balance.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-[11px] text-white/35 mb-5 text-center">
                {match.teamA.name} vs {match.teamB.name} · Max ₹{match.maxBet.toLocaleString()}
              </p>

              {/* VS row — both team circles */}
              <div className="flex items-center justify-center gap-6 mb-6">
                {([
                  { team: "A" as const, name: match.teamA.name, logo: match.teamA.logo, odds: match.oddsA },
                  { team: "B" as const, name: match.teamB.name, logo: match.teamB.logo, odds: match.oddsB },
                ]).map((t, idx) => {
                  const [g1] = GRADIENT_PAIRS[hashName(t.name)];
                  return (
                    <div key={t.team} className="flex flex-col items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleTeamSelect(t.team)}
                        className="group flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-5 py-4 transition-all hover:border-white/20 hover:bg-white/8 active:scale-95"
                      >
                        <TeamCircle name={t.name} logo={t.logo} size="lg" />
                        <p className="text-xs font-bold text-white/90 text-center max-w-[80px] leading-tight">{t.name}</p>
                        <div
                          className="rounded-full px-3 py-1 text-xs font-extrabold"
                          style={{
                            background: `${g1}20`,
                            color: g1,
                            border: `1px solid ${g1}40`,
                          }}
                        >
                          {t.odds}x
                        </div>
                      </motion.button>
                      {idx === 0 && (
                        <div className="absolute left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5">
                          <Swords className="h-3.5 w-3.5 text-white/40" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Stake Entry ─── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }} className="p-5 space-y-4">

              {/* Back + balance */}
              <div className="flex items-center justify-between">
                <button onClick={handleBack}
                  className="flex items-center gap-1 text-white/40 hover:text-white transition-colors text-xs font-semibold">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
                  <Wallet className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-bold text-primary">₹{balance.toLocaleString()}</span>
                </div>
              </div>

              {/* Selected team hero */}
              <div
                className="relative flex items-center gap-4 rounded-2xl border border-white/10 px-4 py-3 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${tc1}12, ${tc2}08)` }}
              >
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 0% 50%, ${tc1} 0%, transparent 60%)` }}
                />
                <TeamCircle name={selectedTeamName} logo={selectedTeamLogo} size="sm" selected />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40 font-medium">Your Pick</p>
                  <p className="text-sm font-extrabold text-white truncate">{selectedTeamName}</p>
                </div>
                <div
                  className="rounded-xl px-3 py-1.5 text-sm font-extrabold shrink-0"
                  style={{ background: `${tc1}20`, color: tc1, border: `1px solid ${tc1}40` }}
                >
                  {selectedOdds}x
                </div>
              </div>

              {/* Quick amounts */}
              <div>
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Quick Amounts</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((val) => {
                    const active = selectedPreset === val;
                    return (
                      <motion.button key={val} whileTap={{ scale: 0.95 }} onClick={() => handlePreset(val)}
                        className={`relative rounded-xl px-2 py-2.5 text-xs font-bold transition-all overflow-hidden ${
                          active
                            ? "border border-primary/60 text-primary"
                            : "border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white/90"
                        }`}
                        style={active ? { background: "hsl(var(--primary)/0.12)" } : {}}>
                        {active && <CheckCircle2 className="absolute top-1 right-1 h-2.5 w-2.5 text-primary" />}
                        <span className="relative">₹{val.toLocaleString()}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* % shortcuts */}
              <div className="grid grid-cols-3 gap-2">
                {PERCENT_OPTIONS.map((pct) => (
                  <motion.button key={pct} whileTap={{ scale: 0.95 }} onClick={() => handlePercent(pct)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-dashed border-primary/30 bg-primary/5 py-2 text-xs font-bold text-primary/70 hover:border-primary/60 hover:bg-primary/12 hover:text-primary transition-all">
                    <Percent className="h-3 w-3" />{pct}
                  </motion.button>
                ))}
              </div>

              {/* Custom input */}
              <div>
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Enter Amount</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary pointer-events-none">₹</span>
                  <input
                    type="number" inputMode="numeric" placeholder="0" value={amount}
                    onChange={(e) => { setAmount(e.target.value); setSelectedPreset(null); }}
                    style={{ colorScheme: "dark", background: "rgba(255,255,255,0.05)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.12)" }}
                    className="w-full rounded-xl pl-8 pr-16 py-3 text-sm font-bold outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-white/20"
                  />
                  {betAmount > 0 && (
                    <button onClick={handleReset}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/8 px-2 py-1 text-[10px] text-white/50 hover:text-white/80 transition-colors">
                      clear
                    </button>
                  )}
                </div>
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

              {/* Returns summary */}
              {betAmount >= 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-primary/15 overflow-hidden"
                  style={{ background: "rgba(0,212,180,0.04)" }}
                >
                  <div className="grid grid-cols-3 divide-x divide-white/6 text-center text-xs">
                    {[
                      { label: "Bet", value: `₹${betAmount.toLocaleString()}`, color: "text-white" },
                      { label: "Profit", value: `₹${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-emerald-400" },
                      { label: "Return", value: `₹${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-primary" },
                    ].map((r) => (
                      <div key={r.label} className="py-3 px-2">
                        <p className="text-white/35 text-[10px] mb-0.5">{r.label}</p>
                        <p className={`font-extrabold tabular-nums ${r.color}`}>{r.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

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
                    <><Zap className="h-4 w-4" /> Place Bet — ₹{betAmount > 0 ? betAmount.toLocaleString() : "0"}</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Bet Confirmed ─── */}
          {step === 3 && confirmedBet && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="p-5 flex flex-col items-center text-center gap-4"
            >
              {/* Confetti-like glow */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ background: `radial-gradient(ellipse at 50% 30%, ${tc1} 0%, transparent 65%)` }}
              />

              {/* Success icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                className="relative flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: `linear-gradient(135deg, ${tc1}25, ${tc2}20)`, border: `2px solid ${tc1}50` }}
              >
                <PartyPopper className="h-8 w-8" style={{ color: tc1 }} />
              </motion.div>

              <div>
                <p className="text-xl font-extrabold text-white">Bet Placed!</p>
                <p className="text-xs text-white/40 mt-1">{match.teamA.name} vs {match.teamB.name}</p>
              </div>

              {/* Bet summary card */}
              <div
                className="w-full rounded-2xl border border-white/10 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                {[
                  { label: "Your Team", value: confirmedBet.teamName, color: tc1 },
                  { label: "Bet Amount", value: `₹${confirmedBet.amount.toLocaleString()}`, color: "white" },
                  { label: "Odds", value: `${confirmedBet.odds}x`, color: "white" },
                  { label: "Potential Win", value: `₹${confirmedBet.potentialWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#22c55e" },
                ].map((r, i) => (
                  <div
                    key={r.label}
                    className={`flex items-center justify-between px-4 py-3 ${i < 3 ? "border-b border-white/6" : ""}`}
                  >
                    <span className="text-xs text-white/40">{r.label}</span>
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: r.color }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-white/30 leading-snug px-4">
                Results are settled after the toss. Check <strong className="text-white/50">My Bets</strong> for updates.
              </p>

              {/* Actions */}
              <div className="flex w-full gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl border border-white/12 bg-white/5 py-3 text-xs font-semibold text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"
                >
                  Close
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBetMore}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold gradient-neon-primary text-primary-foreground shadow-neon"
                >
                  <Plus className="h-4 w-4" /> Bet More
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
