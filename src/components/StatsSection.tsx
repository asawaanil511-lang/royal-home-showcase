import { motion } from "framer-motion";
import { Users, IndianRupee, Trophy, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Winners", value: "10K+", icon: Users },
  { label: "Total Paid Out", value: "₹50L+", icon: IndianRupee },
  { label: "Biggest Win", value: "₹1.5L", icon: Trophy },
  { label: "Win Rate", value: "47%", icon: TrendingUp },
];

const StatsSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center rounded-2xl border bg-card p-8 text-center shadow-card"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="mb-1 text-3xl font-extrabold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
