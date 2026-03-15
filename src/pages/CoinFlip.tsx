import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins } from "lucide-react";
import { Link } from "react-router-dom";

const CoinFlip = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [chosenSide, setChosenSide] = useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<{ side: "heads" | "tails"; won: boolean } | null>(null);

  const handleFlip = async () => {
    if (!user || !profile) return;
    const betAmount = Number(amount);
    if (!chosenSide) {
      toast({ title: "Pick a side", description: "Choose heads or tails", variant: "destructive" });
      return;
    }
    if (!betAmount || betAmount < 10) {
      toast({ title: "Invalid amount", description: "Minimum bet is ₹10", variant: "destructive" });
      return;
    }
    if (betAmount > profile.wallet_balance) {
      toast({ title: "Insufficient balance", description: "Not enough coins in your wallet", variant: "destructive" });
      return;
    }

    setFlipping(true);
    setResult(null);

    // Simulate flip
    const resultSide: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails";
    const won = resultSide === chosenSide;
    const payout = won ? betAmount * 2 : 0;

    // Deduct bet, add payout
    const newBalance = profile.wallet_balance - betAmount + payout;

    await Promise.all([
      (supabase as any).from("coin_flips").insert({
        user_id: user.id,
        bet_amount: betAmount,
        chosen_side: chosenSide,
        result_side: resultSide,
        won,
        payout,
      }),
      supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user.id),
    ]);

    // Animation delay
    setTimeout(() => {
      setFlipping(false);
      setResult({ side: resultSide, won });
      refreshProfile();
      toast({
        title: won ? "🎉 You Won!" : "😔 You Lost",
        description: won ? `You won ₹${payout.toLocaleString()}!` : `Better luck next time!`,
      });
    }, 1500);
  };

  const quickAmounts = [50, 100, 500, 1000];

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Coins className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Login to Play Coin Flip</h2>
          <Button className="gradient-neon-primary text-primary-foreground shadow-neon" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-foreground mb-2">Coin Flip</h1>
            <p className="text-muted-foreground">50/50 chance to double your bet</p>
          </div>

          {/* Coin */}
          <div className="mb-8 flex justify-center">
            <motion.div
              animate={flipping ? { rotateY: [0, 1800] } : {}}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary/30 bg-card text-5xl shadow-neon"
            >
              {result ? (result.side === "heads" ? "👑" : "🪙") : "🪙"}
            </motion.div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`mb-6 rounded-xl p-4 text-center font-bold text-lg ${
                  result.won ? "bg-primary/10 text-primary border border-primary/30" : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}
              >
                {result.won ? `🎉 ${result.side.toUpperCase()} — You Won!` : `💀 ${result.side.toUpperCase()} — You Lost!`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Side selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setChosenSide("heads")}
              disabled={flipping}
              className={`rounded-xl border-2 p-4 text-center font-semibold transition-all ${
                chosenSide === "heads"
                  ? "border-primary bg-primary/10 text-primary shadow-neon"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              👑 Heads
            </button>
            <button
              onClick={() => setChosenSide("tails")}
              disabled={flipping}
              className={`rounded-xl border-2 p-4 text-center font-semibold transition-all ${
                chosenSide === "tails"
                  ? "border-primary bg-primary/10 text-primary shadow-neon"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              🪙 Tails
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-3 mb-6">
            <label className="text-sm font-medium text-foreground">Bet Amount (₹)</label>
            <Input
              type="number"
              placeholder="Min ₹10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={flipping}
              className="bg-card border-border"
            />
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  disabled={flipping}
                  className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  ₹{q}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full gradient-neon-primary text-primary-foreground font-semibold text-lg shadow-neon hover:opacity-90"
            size="lg"
            onClick={handleFlip}
            disabled={flipping}
          >
            {flipping ? "Flipping..." : "Flip Coin"}
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Balance: <span className="font-semibold text-primary">₹{(profile?.wallet_balance ?? 0).toLocaleString()}</span>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CoinFlip;
