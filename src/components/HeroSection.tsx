import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, LogIn, Zap, Trophy, Shield, BookOpen, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import betwicLogo from "@/assets/betwic-logo.jpg";

const stats = [
  { icon: Trophy,     label: "Live Matches",    value: "Daily",   color: "text-primary",      bg: "bg-primary/10" },
  { icon: Shield,     label: "Secure Platform", value: "100%",    color: "text-emerald-600",  bg: "bg-emerald-50 dark:bg-emerald-400/10" },
  { icon: Zap,        label: "Settlement",       value: "10 Min",  color: "text-amber-600",    bg: "bg-amber-50 dark:bg-amber-400/10" },
  { icon: TrendingUp, label: "Instant Payouts",  value: "Always",  color: "text-sky-600",      bg: "bg-sky-50 dark:bg-sky-400/10" },
];

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full blur-[130px]" style={{ background: "hsl(var(--primary)/0.06)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: "hsl(var(--accent)/0.06)" }} />

      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "64px 64px"
        }}
      />

      <div className="container relative mx-auto px-4 text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="mb-7 flex justify-center"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{ background: "hsl(var(--primary))" }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full border-2 border-dashed border-primary/20"
              style={{ inset: -10 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <img
              src={betwicLogo}
              alt="Betwic Toss Book"
              className="relative h-24 w-24 rounded-full object-cover border-2 border-primary/50 shadow-lg shadow-primary/20"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary"
            animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary)/0.2)", "0 0 0 8px hsl(var(--primary)/0)", "0 0 0 0 hsl(var(--primary)/0)"] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Live Betting Platform
            <Zap className="h-3.5 w-3.5 text-amber-500" />
          </motion.div>

          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-foreground md:text-6xl tracking-tight">
            Play. Win.{" "}
            <span className="text-primary">Repeat.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base text-muted-foreground leading-relaxed">
            The most exciting cricket toss betting platform. Bet on live matches and win virtual rewards instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="gap-2 text-sm font-bold gradient-neon-primary text-primary-foreground shadow-neon hover:opacity-90 hover:scale-105 transition-all px-7"
              asChild
            >
              <Link to="/matches">
                <Play className="h-4 w-4" />
                Start Playing
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-sm font-semibold border-border text-muted-foreground hover:bg-secondary hover:text-foreground gap-2 px-6"
              asChild
            >
              <Link to="/rules">
                <BookOpen className="h-4 w-4" />
                View Rules
              </Link>
            </Button>
            {!user && (
              <Button
                size="lg"
                variant="outline"
                className="text-sm font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-2 px-6"
                asChild
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-14 grid grid-cols-2 gap-3 max-w-lg mx-auto sm:grid-cols-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + i * 0.08 }}
              whileHover={{ y: -3, scale: 1.03 }}
              className={`flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm cursor-default transition-all hover:border-primary/30 hover:shadow-md`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-base font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium text-center">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
