import { useState, useEffect } from "react";
import { Match } from "@/data/matches";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, TrendingUp, Wallet, RotateCcw, Trophy, ChevronLeft, Percent,
} from "lucide-react";

type BetDialogProps = {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PRESET_AMOUNTS = [100, 500, 2500, 10000, 20000, 50000];
const PERCENT_OPTIONS = [10, 50, 100];

const BetDialog = ({ match, open, onOpenChange }: BetDialogProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();

  const balance = profile?.wallet_balance ?? 0;

  // Reset on close or match change
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

  const handleTeamSelect = (team: "A" | "B") => {
    setSelectedTeam(team);
    setStep(2);
  };

  const handlePreset = (val: number) => {
    setAmount(String(val));
    setSelectedPreset(val);
  };

  const handlePercent = (pct: number) => {
    const val = Math.floor((balance * pct) / 100);
    setAmount(String(val));
    setSelectedPreset(null);
  };

  const handleReset = () => {
    setAmount("");
    setSelectedPreset(null);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTeam(null);
    setAmount("");
    setSelectedPreset(null);
  };

  const handlePlaceBet = async () => {
    if (!user || !profile) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }
    if (!selectedTeam) {
      toast({ title: "Select a team", variant: "destructive" });
      return;
    }
    if (!betAmount || betAmount < 100) {
      toast({ title: "Minimum bet is ₹100", variant: "destructive" });
      return;
    }
    if (betAmount > match.maxBet) {
      toast({ title: `Maximum bet is ₹${match.maxBet.toLocaleString()}`, variant: "destructive" });
      return;
    }
    if (betAmount > balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }

    setPlacing(true);
    await supabase.from("profiles").update({ wallet_balance: balance - betAmount }).eq("user_id", user.id);
    const potentialWin = betAmount * selectedOdds;
    const { error: betError } = await supabase.from("bets").insert({
      user_id: user.id,
      match_id: match.id,
      team_picked: selectedTeam,
      amount: betAmount,
      odds: selectedOdds,
      potential_win: potentialWin,
    });
    if (betError) {
      await supabase.from("profiles").update({ wallet_balance: balance }).eq("user_id", user.id);
      toast({ title: "Bet failed", description: betError.message, variant: "destructive" });
      setPlacing(false);
      return;
    }
    await refreshProfile();
    setPlacing(false);
    toast({
      title: "🎉 Bet Placed!",
      description: `₹${betAmount.toLocaleString()} on ${selectedTeamName}. Potential win: ₹${potentialWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 overflow-hidden max-w-sm w-full"
        style={{ background: "#0a0a0f" }}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Team Selection ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              {/* Balance */}
              <div className="flex items-center gap-2 text-sm text-white/50 mb-5">
                <Wallet className="h-4 w-4" />
                <span>Balance: <span className="text-white font-semibold">₹{balance.toLocaleString()}</span></span>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-extrabold text-white mb-1">Place Your Bet</h2>
                <p className="text-sm text-white/40">{match.teamA.name} vs {match.teamB.name}</p>
              </div>

              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Select Team</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { team: "A" as const, name: match.teamA.name, logo: match.teamA.logo, odds: match.oddsA },
                  { team: "B" as const, name: match.teamB.name, logo: match.teamB.logo, odds: match.oddsB },
                ]).map((t) => (
                  <motion.button
                    key={t.team}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleTeamSelect(t.team)}
                    className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-white/10 bg-white/5 p-5 transition-all hover:border-primary/60 hover:bg-primary/10"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity" style={{ background: "hsl(var(--primary))" }} />
                      <img
                        src={t.logo}
                        alt={t.name}
                        className="relative h-16 w-16 rounded-full object-contain bg-white/10 p-1"
                      />
                    </div>
                    <span className="text-sm font-bold text-white text-center leading-tight">{t.name}</span>
                    <span className="rounded-full bg-primary/20 border border-primary/30 px-3 py-0.5 text-xs font-extrabold text-primary">
                      {t.odds}x
                    </span>
                  </motion.button>
                ))}
              </div>

              <p className="text-center text-xs text-white/30 mt-4">
                Max bet: ₹{match.maxBet.toLocaleString()}
              </p>
            </motion.div>
          )}

          {/* ── STEP 2: Stake Selection (Screenshot 1 design) ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-5"
            >
              {/* Header */}
              <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
                <Wallet className="h-4 w-4" />
                <span>Balance: <span className="text-white font-semibold">₹{balance.toLocaleString()}</span></span>
              </div>

              {/* Back + Title */}
              <div className="flex items-center gap-2 mb-4">
                <button onClick={handleBack} className="text-white/40 hover:text-white transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-white">Place Bet</span>
                </div>
              </div>

              {/* Selected team */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <img src={selectedTeamLogo} alt={selectedTeamName} className="h-8 w-8 rounded-full object-contain bg-white/10" />
                  <h3 className="text-xl font-extrabold text-white uppercase tracking-tight">{selectedTeamName}</h3>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white/60">Rate: </span>
                  <span className="text-sm font-extrabold text-emerald-400">{selectedOdds}</span>
                </div>
              </div>

              {/* Preset amounts */}
              <p className="text-xs font-semibold text-white/50 mb-2">Select Stake Amount</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => handlePreset(val)}
                    className={`rounded-xl px-2 py-2.5 text-sm font-bold transition-all ${
                      selectedPreset === val
                        ? "bg-red-600 text-white border-2 border-red-400"
                        : "bg-white/8 text-white/80 border-2 border-white/10 hover:border-white/30 hover:bg-white/12"
                    }`}
                  >
                    ₹{val.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Percent buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PERCENT_OPTIONS.map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handlePercent(pct)}
                    className="flex items-center justify-center gap-1 rounded-xl border-2 border-dashed border-red-500/50 bg-red-500/10 px-2 py-2 text-sm font-bold text-red-400 hover:border-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Percent className="h-3.5 w-3.5" />
                    {pct}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <p className="text-xs font-semibold text-white/50 mb-2">Or Enter Custom Amount</p>
              <Input
                type="number"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setSelectedPreset(null); }}
                className="bg-white/8 border-white/15 text-white placeholder:text-white/30 mb-3 focus:border-primary/60"
              />

              {/* Bet Summary */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500/20">
                    <Trophy className="h-3 w-3 text-red-400" />
                  </div>
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wide">Bet Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Stake:</span>
                    <span className="font-bold text-white">₹{betAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Profit:</span>
                    <span className="font-bold text-emerald-400">₹{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Rate:</span>
                    <span className="font-bold text-white/80">{selectedOdds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Total Return:</span>
                    <span className="font-bold text-red-400">₹{totalReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white/60 hover:text-white hover:bg-white/10 gap-2"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
                <Button
                  className="flex-1 font-bold text-white shadow-lg gap-2"
                  style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
                  onClick={handlePlaceBet}
                  disabled={placing || !betAmount || betAmount < 100}
                >
                  {placing ? "Placing..." : "Place Bet"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BetDialog;
