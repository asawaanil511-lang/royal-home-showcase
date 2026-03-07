import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const winners = [
  { name: "Player***21", bet: 500, win: 950 },
  { name: "Lucky***89", bet: 1000, win: 1900 },
  { name: "Star***45", bet: 250, win: 475 },
  { name: "Pro***77", bet: 2000, win: 3800 },
  { name: "Mega***33", bet: 750, win: 1425 },
  { name: "King***99", bet: 1500, win: 2850 },
];

const RecentWinners = () => {
  return (
    <section className="bg-secondary/50 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <Trophy className="h-4 w-4 text-accent" />
            Recent Winners
          </div>
          <h2 className="mb-3 text-4xl font-extrabold text-foreground">
            Our Latest Champions!
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Join the winners circle! See who's been winning big on our platform.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-3">
          {winners.map((w, i) => (
            <motion.div
              key={w.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                #{i + 1}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">{w.name}</p>
                <p className="text-xs text-muted-foreground">less than a minute ago</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-success">₹{w.win.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Bet: ₹{w.bet.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentWinners;
