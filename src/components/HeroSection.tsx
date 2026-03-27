import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, LogIn, Zap, Trophy, Shield, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import supermanLogo from "@/assets/superman-logo.jpg";

const floatingOrbs = [
  { size: 500, x: -40, y: -40, color: "hsl(var(--primary)/0.08)", blur: 120, delay: 0 },
  { size: 400, x: "auto", y: -40, right: -40, color: "hsl(var(--accent)/0.08)", blur: 100, delay: 0.5 },
  { size: 300, x: "50%", y: "50%", color: "hsl(270 80% 60% / 0.06)", blur: 100, delay: 1 },
];

const stats = [
  { icon: Trophy, label: "Live Matches", value: "Daily" },
  { icon: Shield, label: "Secure Platform", value: "100%" },
  { icon: Zap, label: "Instant Settlement", value: "10 Min" },
];

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full blur-[120px]" style={{ background: "hsl(var(--primary)/0.08)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full blur-[100px]" style={{ background: "hsl(var(--accent)/0.08)" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full blur-[100px]" style={{ background: "hsl(270 80% 60% / 0.05)" }} />

      {/* Animated grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "64px 64px" }}
      />

      <div className="container relative mx-auto px-4 text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full blur-xl opacity-40"
              style={{ background: "hsl(var(--primary))" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <img
              src={supermanLogo}
              alt="Superman Toss Book"
              className="relative h-20 w-20 rounded-full object-cover border-2 border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
            animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary)/0.3)", "0 0 0 8px hsl(var(--primary)/0)", "0 0 0 0 hsl(var(--primary)/0)"] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Zap className="h-4 w-4" />
            Live Betting Platform
          </motion.div>

          <h1 className="mb-5 text-5xl font-extrabold leading-tight text-foreground md:text-7xl tracking-tight">
            Play. Win.{" "}
            <motion.span
              className="text-neon inline-block"
              animate={{ textShadow: ["0 0 20px hsl(var(--primary)/0.5)", "0 0 40px hsl(var(--primary)/0.8)", "0 0 20px hsl(var(--primary)/0.5)"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Repeat.
            </motion.span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            The most exciting cricket betting platform. Bet on live matches and win virtual rewards instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="gap-2 text-base font-semibold gradient-neon-primary text-primary-foreground shadow-neon hover:opacity-90 hover:scale-105 transition-transform"
              asChild
            >
              <Link to="/matches"><Play className="h-4 w-4" /> Start Playing</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base font-semibold border-border/60 text-muted-foreground hover:bg-secondary/80 hover:text-foreground gap-2"
              asChild
            >
              <Link to="/rules"><BookOpen className="h-4 w-4" /> View Rules</Link>
            </Button>
            {!user && (
              <Button
                size="lg"
                variant="outline"
                className="text-base font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-2"
                asChild
              >
                <Link to="/login"><LogIn className="h-4 w-4" /> Login</Link>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border/40 bg-card/50 p-3 backdrop-blur-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-extrabold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
