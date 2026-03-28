import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet as WalletIcon, ExternalLink, ArrowUpRight, TrendingUp, Trophy, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TELEGRAM_LINK = "https://t.me/shrey14a";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

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
      className={`text-5xl font-extrabold tabular-nums transition-colors duration-500 ${
        animating
          ? isCredit ? "text-emerald-400" : "text-red-400"
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
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-neon">
            <WalletIcon className="h-9 w-9 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Login to view wallet</h2>
          <p className="text-muted-foreground text-sm">Your balance and transaction history awaits.</p>
          <Button className="gradient-neon-primary text-primary-foreground shadow-neon px-8" asChild>
            <Link to="/login">Login Now</Link>
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

      <section className="relative overflow-hidden py-10">
        <div className="pointer-events-none absolute -left-40 top-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[300px] w-[300px] rounded-full bg-accent/5 blur-[100px]" />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-lg">

            {/* Page title */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-7 flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <WalletIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-foreground">My Wallet</h1>
                <p className="text-sm text-muted-foreground">Manage your virtual coins</p>
              </div>
            </motion.div>

            {/* Balance card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="relative rounded-3xl border border-primary/30 overflow-hidden mb-5 shadow-[0_0_40px_hsl(var(--primary)/0.1)]"
              style={{ background: "linear-gradient(135deg, hsl(230 22% 10%), hsl(230 20% 13%))" }}
            >
              {/* Top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full blur-3xl opacity-20"
                style={{ background: "hsl(var(--primary))" }} />
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

              <div className="relative p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 tracking-wide uppercase font-medium">Available Balance</p>
                    <AnimatedBalance value={profile?.wallet_balance ?? 0} />
                    <p className="text-xs text-muted-foreground mt-1.5">Virtual Coins</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30">
                    <WalletIcon className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                  <span className="text-xs text-muted-foreground">@{profile?.username || "user"}</span>
                </div>
              </div>
            </motion.div>

            {/* Add Coins */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border/50 bg-card p-6 mb-4"
            >
              <h3 className="text-lg font-bold text-foreground mb-1">Add Coins</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Select an amount — you'll be redirected to Telegram to complete payment.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    className="border-primary/25 text-primary hover:bg-primary/10 hover:border-primary/60 hover:shadow-neon text-sm font-bold h-11 gap-1.5 transition-all"
                    onClick={handleRedirect}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                  </Button>
                ))}
              </div>

              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Custom Amount</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-8 bg-secondary/50 border-border h-11"
                    />
                  </div>
                  <Button
                    className="gradient-neon-primary text-primary-foreground gap-2 shrink-0 shadow-neon font-bold h-11 px-5"
                    onClick={handleRedirect}
                    disabled={!customAmount || Number(customAmount) <= 0}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Pay
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/40 bg-secondary/30 px-4 py-3">
                <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Contact <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">@shrey14a</a> on Telegram after payment to get your coins credited.
                </p>
              </div>
            </motion.div>

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 gap-3"
            >
              <Link
                to="/my-bets"
                className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:shadow-card-hover group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold">My Bets</p>
                  <p className="text-xs text-muted-foreground">Bet history</p>
                </div>
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 text-sm font-semibold text-foreground transition-all hover:border-yellow-500/30 hover:shadow-[0_0_16px_hsl(45deg_100%_55%/0.1)] group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/10 group-hover:bg-yellow-400/20 transition-colors">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold">Leaderboard</p>
                  <p className="text-xs text-muted-foreground">Top players</p>
                </div>
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Wallet;
