import { motion } from "framer-motion";
import { Trophy, TrendingUp, Flame } from "lucide-react";

const winners = [
  { name: "Player***21", bet: 500,  win: 950,  team: "MI" },
  { name: "Lucky***89", bet: 1000, win: 1900, team: "CSK" },
  { name: "Star***45",  bet: 250,  win: 475,  team: "RCB" },
  { name: "Pro***77",   bet: 2000, win: 3800, team: "KKR" },
  { name: "Mega***33",  bet: 750,  win: 1425, team: "DC" },
  { name: "King***99",  bet: 1500, win: 2850, team: "PBKS" },
];

const rankStyles = [
  {
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/8",
    rankBg: "bg-yellow-500/15 border-yellow-500/40",
    rankText: "text-yellow-400",
    winText: "text-yellow-400",
    glow: "shadow-[0_0_20px_hsl(45deg_100%_60%/0.18)]",
  },
  {
    border: "border-slate-400/30",
    bg: "bg-slate-400/5",
    rankBg: "bg-slate-400/10 border-slate-400/30",
    rankText: "text-slate-300",
    winText: "text-primary",
    glow: "",
  },
  {
    border: "border-amber-600/30",
    bg: "bg-amber-600/5",
    rankBg: "bg-amber-600/10 border-amber-600/30",
    rankText: "text-amber-500",
    winText: "text-primary",
    glow: "",
  },
];

const RecentWinners = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-accent/4 blur-[120px]" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-sm font-medium text-yellow-400">
            <Trophy className="h-4 w-4" />
            Recent Winners
          </div>
          <h2 className="mb-3 text-4xl font-extrabold text-foreground">
            Our Latest <span className="text-gold">Champions!</span>
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground text-sm">
            Join the winners circle. See who's been winning big on our platform.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-3">
          {winners.map((w, i) => {
            const rank = rankStyles[i] || {
              border: "border-border/40",
              bg: "",
              rankBg: "bg-secondary/50 border-border/50",
              rankText: "text-muted-foreground",
              winText: "text-primary",
              glow: "",
            };
            const multiplier = (w.win / w.bet).toFixed(1);
            const profit = w.win - w.bet;

            return (
              <motion.div
                key={w.name}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className={`flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card transition-all cursor-default ${rank.border} ${rank.bg} ${rank.glow}`}
              >
                {/* Rank badge */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold ${rank.rankBg} ${rank.rankText}`}>
                  {i < 3 ? <Trophy className="h-4 w-4" /> : `#${i + 1}`}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground truncate">{w.name}</p>
                    {i === 0 && <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">{multiplier}x return</span>
                    <span className="text-xs text-muted-foreground">· {w.team}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-extrabold text-lg ${rank.winText}`}>
                    ₹{w.win.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-muted-foreground">+₹{profit.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground">profit</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RecentWinners;
