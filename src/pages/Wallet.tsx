import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const AnimatedBalance = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const [animating, setAnimating] = useState(false);
  const isCredit = value > prevRef.current;

  useEffect(() => {
    if (value === prevRef.current) {
      setDisplay(value);
      return;
    }
    setAnimating(true);
    const start = prevRef.current;
    const diff = value - start;
    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        prevRef.current = value;
        setTimeout(() => setAnimating(false), 300);
      }
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <motion.span
      key={value}
      animate={animating ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 0.5 }}
      className={`text-4xl font-extrabold tabular-nums transition-colors duration-500 ${
        animating
          ? isCredit
            ? "text-emerald-400"
            : "text-red-400"
          : "text-primary"
      }`}
    >
      ₹{display.toLocaleString()}
    </motion.span>
  );
};

const Wallet = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <WalletIcon className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Login to view wallet</h2>
          <Button className="gradient-neon-primary text-primary-foreground" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleTopUp = async (amount: number) => {
    if (!profile) return;
    const newBalance = profile.wallet_balance + amount;
    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user.id);
    await refreshProfile();
    toast({ title: "💰 Coins Added!", description: `₹${amount.toLocaleString()} added to your wallet.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-extrabold text-foreground mb-8">My Wallet</h1>

          {/* Balance card */}
          <div className="rounded-2xl border border-primary/30 bg-card p-8 mb-8 glow-border overflow-hidden relative">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <AnimatedBalance value={profile?.wallet_balance ?? 0} />
            <p className="text-xs text-muted-foreground mt-1">Virtual coins</p>
          </div>

          {/* Top up */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Add Coins
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[500, 1000, 5000, 10000].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => handleTopUp(amt)}
                >
                  + ₹{amt.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/my-bets"
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-card p-4 text-sm font-semibold text-foreground transition-all hover:glow-border"
            >
              <ArrowUpRight className="h-5 w-5 text-accent" /> My Bets
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-card p-4 text-sm font-semibold text-foreground transition-all hover:glow-border"
            >
              <ArrowDownLeft className="h-5 w-5 text-primary" /> Leaderboard
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Wallet;
