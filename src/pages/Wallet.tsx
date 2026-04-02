import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet as WalletIcon, ArrowUpRight, Trophy, Plus, ArrowDownLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TG_USERNAME = "Bittubhaji";
const WA_NUMBER = "917668700467";

const tgLink = (text: string) =>
  `https://t.me/${TG_USERNAME}?text=${encodeURIComponent(text)}`;

const waLink = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const AnimatedBalance = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const [animating, setAnimating] = useState(false);
  const isCredit = value > prevRef.current;

  useEffect(() => {
    if (value === prevRef.current) { setDisplay(value); return; }
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
      if (progress < 1) { requestAnimationFrame(tick); }
      else { prevRef.current = value; setTimeout(() => setAnimating(false), 300); }
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <motion.span
      key={value}
      animate={animating ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 0.5 }}
      className={`text-5xl font-extrabold tabular-nums transition-colors duration-500 ${
        animating ? (isCredit ? "text-emerald-400" : "text-red-400") : "text-primary"
      }`}
    >
      ₹{display.toLocaleString()}
    </motion.span>
  );
};

const Wallet = () => {
  const { user, profile } = useAuth();
  const [customAmount, setCustomAmount] = useState("");
  const [exposure, setExposure] = useState(0);
  const [activeMarkets, setActiveMarkets] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchExposure = async () => {
      const { data } = await supabase
        .from("bets").select("amount, result")
        .eq("user_id", user.id).eq("result", "pending");
      if (data) {
        setExposure(data.reduce((sum, b) => sum + (b.amount || 0), 0));
        setActiveMarkets(data.length);
      }
    };
    fetchExposure();
  }, [user]);

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

  const customAmtNum = customAmount && Number(customAmount) > 0 ? Number(customAmount) : 0;
  const customAmtLabel = customAmtNum > 0 ? `Rs.${customAmtNum}` : "custom amount";

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
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
              className="mb-5 flex items-center gap-3"
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
              transition={{ delay: 0.04 }}
              className="relative rounded-2xl border border-border/60 overflow-hidden mb-4 bg-card"
            >
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

              <div className="relative p-5">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Total Balance</p>
                  <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Exposure</p>
                </div>

                <div className="flex items-end justify-between mb-3">
                  <AnimatedBalance value={profile?.wallet_balance ?? 0} />
                  <div className="text-right">
                    <span className={`text-2xl font-extrabold tabular-nums ${exposure > 0 ? "text-orange-500 dark:text-orange-400" : "text-orange-400/50"}`}>
                      ₹{exposure.toLocaleString()}
                    </span>
                    {exposure > 0 && <p className="text-[10px] text-orange-500/60 dark:text-orange-400/60 mt-0.5">locked in bets</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-5">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Active in <span className="font-bold text-foreground">{activeMarkets}</span> market{activeMarkets !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Deposit row */}
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Deposit via</p>
                <div className="flex gap-2 mb-3">
                  <a
                    href={tgLink("Deposit/Refill")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #229ED9, #1a85bb)" }}
                  >
                    <TelegramIcon className="h-4 w-4" />
                    Telegram
                  </a>
                  <a
                    href={waLink("Deposit/Refill")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #25D366, #1da851)" }}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp
                  </a>
                </div>

                {/* Withdraw */}
                <div className="flex gap-2">
                  <a
                    href={tgLink("🦚❤️ BETWIC TOSS BOOK ❤️ 🦚\n\n━━ WITHDRAWAL FORM ━━\nUSER ID ==\nTOTAL AMOUNT =\nWITHDRAWAL A/M =\nREMAINING A/M =\n\nPAYTM =\nPHONE PAY =\nGOOGLE PAY =\n\nWITHDRAWAL ANYTIME ONCE A DAY\n\nONLY DROP 1 MSG\nTELEGRAM @bittubhaji\nWHATSAPP +917668700467\n\nDROP FORM AFTER - WAIT 30-60 MIN")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #229ED9, #1a85bb)" }}
                  >
                    <TelegramIcon className="h-4 w-4" />
                    Withdraw via TG
                  </a>
                  <a
                    href={waLink("🦚❤️ BETWIC TOSS BOOK ❤️ 🦚\n\n━━ WITHDRAWAL FORM ━━\nUSER ID ==\nTOTAL AMOUNT =\nWITHDRAWAL A/M =\nREMAINING A/M =\n\nPAYTM =\nPHONE PAY =\nGOOGLE PAY =\n\nWITHDRAWAL ANYTIME ONCE A DAY\n\nONLY DROP 1 MSG\nTELEGRAM @bittubhaji\nWHATSAPP +917668700467\n\nDROP FORM AFTER - WAIT 30-60 MIN")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #25D366, #1da851)" }}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Withdraw via WA
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Refill Coins */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-5 mb-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="text-base font-extrabold text-foreground">Refill Coins</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Pick an amount — tap a button to refill via Telegram or WhatsApp.
              </p>

              {/* Quick amounts grid */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {QUICK_AMOUNTS.map((amt) => {
                  const label = `₹${amt >= 1000 ? `${amt / 1000}K` : amt}`;
                  const fullLabel = `₹${amt.toLocaleString()}`;
                  return (
                    <div key={amt} className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-center text-muted-foreground">{label}</p>
                      <a
                        href={tgLink(`Refill Rs.${amt}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold text-white transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #229ED9, #1a85bb)" }}
                      >
                        <TelegramIcon className="h-3 w-3" />
                        Telegram
                      </a>
                      <a
                        href={waLink(`Refill ${fullLabel}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold text-white transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #25D366, #1da851)" }}
                      >
                        <WhatsAppIcon className="h-3 w-3" />
                        WhatsApp
                      </a>
                    </div>
                  );
                })}
              </div>

              {/* Custom Amount */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">Custom Amount</p>
                <div className="flex gap-2 mb-3">
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
                </div>
                <div className="flex gap-2">
                  <a
                    href={tgLink(`Refill ${customAmtLabel}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95 ${!customAmount || Number(customAmount) <= 0 ? "opacity-50 pointer-events-none" : ""}`}
                    style={{ background: "linear-gradient(135deg, #229ED9, #1a85bb)" }}
                  >
                    <TelegramIcon className="h-4 w-4" />
                    Refill via Telegram
                  </a>
                  <a
                    href={waLink(`Refill ${customAmtLabel}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95 ${!customAmount || Number(customAmount) <= 0 ? "opacity-50 pointer-events-none" : ""}`}
                    style={{ background: "linear-gradient(135deg, #25D366, #1da851)" }}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Refill via WhatsApp
                  </a>
                </div>
              </div>

              {/* Info note */}
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  After payment, contact{" "}
                  <a href={tgLink("Hi")} target="_blank" rel="noopener noreferrer" className="text-[#229ED9] font-semibold hover:underline">@Bittubhaji</a>{" "}
                  on Telegram or WhatsApp at{" "}
                  <a href={waLink("Hi")} target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-semibold hover:underline">+91 76687 00467</a>{" "}
                  to get your coins credited.
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
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:shadow-card-hover group"
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
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground transition-all hover:border-yellow-500/30 group"
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
