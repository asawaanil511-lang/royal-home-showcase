import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet as WalletIcon, ExternalLink, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TELEGRAM_LINK = "https://t.me/shrey14a";

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
  const { user, profile } = useAuth();
  const [customAmount, setCustomAmount] = useState("");

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

  const handleRedirect = () => {
    window.open(TELEGRAM_LINK, "_blank");
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

          {/* Add Coins */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Add Coins</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select an amount or enter a custom value — you'll be redirected to complete payment.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[500, 1000, 5000, 10000].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10 gap-2"
                  onClick={handleRedirect}
                >
                  <ExternalLink className="h-4 w-4" /> ₹{amt.toLocaleString()}
                </Button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mb-2">Custom Amount</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  min={1}
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-7 bg-secondary border-border"
                />
              </div>
              <Button
                className="gradient-neon-primary text-primary-foreground gap-2 shrink-0"
                onClick={handleRedirect}
                disabled={!customAmount || Number(customAmount) <= 0}
              >
                <ExternalLink className="h-4 w-4" /> Pay Now
              </Button>
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
