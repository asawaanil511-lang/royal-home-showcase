import { motion, animate } from "framer-motion";
import { Users, Coins, Trophy, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type StatsData = {
  totalWinners: number;
  totalPaidOut: number;
  biggestWin: number;
  winRate: number;
};

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || value === 0) return;
    const controls = animate(0, value, {
      duration: 2.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

const StatsSection = () => {
  const [data, setData] = useState<StatsData>({ totalWinners: 0, totalPaidOut: 0, biggestWin: 0, winRate: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: bets } = await (supabase as any)
          .from("bets")
          .select("user_id, amount, potential_win, result");

        if (!bets || bets.length === 0) { setLoaded(true); return; }

        const wonBets = bets.filter((b: any) => b.result === "won");
        const lostBets = bets.filter((b: any) => b.result === "lost");

        const uniqueWinners = new Set(wonBets.map((b: any) => b.user_id)).size;
        const totalPaidOut = wonBets.reduce((s: number, b: any) => s + Number(b.potential_win), 0);
        const biggestWin = wonBets.length > 0
          ? Math.max(...wonBets.map((b: any) => Number(b.potential_win)))
          : 0;
        const total = wonBets.length + lostBets.length;
        const winRate = total > 0 ? Math.round((wonBets.length / total) * 100) : 0;

        setData({ totalWinners: uniqueWinners, totalPaidOut, biggestWin, winRate });
      } catch {
        // silently fail — stats are decorative
      }
      setLoaded(true);
    };
    fetchStats();
  }, []);

  const stats = [
    { label: "Total Winners",   value: data.totalWinners, prefix: "",  suffix: "+",  icon: Users,       color: "text-primary",          bg: "bg-primary/10",  borderGlow: "hover:border-primary/40 hover:shadow-[0_0_20px_hsl(160_100%_45%/0.12)]" },
    { label: "Total Paid Out",  value: data.totalPaidOut, prefix: "₹", suffix: "",   icon: Coins,       color: "text-accent",           bg: "bg-accent/10",   borderGlow: "hover:border-accent/40 hover:shadow-[0_0_20px_hsl(45_100%_55%/0.12)]" },
    { label: "Biggest Win",     value: data.biggestWin,   prefix: "₹", suffix: "",   icon: Trophy,      color: "text-yellow-400",       bg: "bg-yellow-400/10", borderGlow: "hover:border-yellow-500/40 hover:shadow-[0_0_20px_hsl(45_100%_60%/0.15)]" },
    { label: "Platform Win Rate", value: data.winRate,   prefix: "",  suffix: "%",  icon: TrendingUp,  color: "text-emerald-400",      bg: "bg-emerald-400/10", borderGlow: "hover:border-emerald-500/40 hover:shadow-[0_0_20px_hsl(142_76%_36%/0.12)]" },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-card/20" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-[0.04] blur-[80px]"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }} />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <TrendingUp className="h-4 w-4" />
            Platform Stats
          </div>
          <h2 className="text-4xl font-extrabold text-foreground">
            By The <span className="text-neon">Numbers</span>
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.04, y: -4 }}
              className={`relative flex flex-col items-center rounded-2xl border border-border/50 bg-card p-7 text-center shadow-card transition-all cursor-default overflow-hidden group ${stat.borderGlow}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/4 via-transparent to-accent/4" />

              {/* Subtle shimmer top line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <motion.div
                className={`relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 ${stat.bg}`}
                whileHover={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.5 }}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </motion.div>

              <p className={`relative mb-1 text-3xl font-extrabold ${stat.color}`}>
                {loaded ? (
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
              <p className="relative text-sm font-medium text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
