import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";

const winners = [
  { name: "Player***21", bet: 500, win: 950 },
  { name: "Lucky***89", bet: 1000, win: 1900 },
  { name: "Star***45", bet: 250, win: 475 },
  { name: "Pro***77", bet: 2000, win: 3800 },
  { name: "Mega***33", bet: 750, win: 1425 },
  { name: "King***99", bet: 1500, win: 2850 },
];

const rankStyles = [
  { bg: "bg-yellow-500/15 border-yellow-500/40", text: "text-yellow-400", glow: "shadow-[0_0_16px_hsl(45deg_100%_60%/0.2)]" },
  { bg: "bg-slate-400/10 border-slate-400/30", text: "text-slate-300", glow: "" },
  { bg: "bg-amber-600/10 border-amber-600/30", text: "text-amber-500", glow: "" },
];

const RecentWinners = () => {
  return (
    <section className="py-20">
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
            Our Latest <span className="text-neon">Champions!</span>
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Join the winners circle! See who's been winning big on our platform.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-3">
          {winners.map((w, i) => {
            const rank = rankStyles[i] || { bg: "bg-secondary/50 border-border/50", text: "text-muted-foreground", glow: "" };
            const multiplier = (w.win / w.bet).toFixed(1);

            return (
              <motion.div
                key={w.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className={`flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card transition-all cursor-default ${rank.bg} ${rank.glow}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold ${rank.bg} ${rank.text}`}>
                  {i < 3 ? <Trophy className="h-4 w-4" /> : `#${i + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{w.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">{multiplier}x return</span>
                    <span className="text-xs text-muted-foreground">• just now</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-extrabold text-lg ${i === 0 ? "text-yellow-400" : "text-primary"}`}>
                    ₹{w.win.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Bet: ₹{w.bet.toLocaleString()}</p>
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
