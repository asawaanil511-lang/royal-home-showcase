import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Users, Coins, Trophy, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { label: "Total Winners", value: 0, prefix: "", suffix: "", icon: Users, color: "text-primary" },
  { label: "Total Paid Out", value: 0, prefix: "₹", suffix: "", icon: Coins, color: "text-accent" },
  { label: "Biggest Win", value: 0, prefix: "₹", suffix: "", icon: Trophy, color: "text-[hsl(45_100%_60%)]" },
  { label: "Win Rate", value: 0, prefix: "", suffix: "%", icon: TrendingUp, color: "text-primary" },
];

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
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 2,
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
  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="relative flex flex-col items-center rounded-2xl border border-border/50 bg-card p-8 text-center shadow-card transition-all hover:glow-border overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
              <motion.div
                className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </motion.div>
              <p className="relative mb-1 text-3xl font-extrabold text-foreground">
                <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="relative text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
