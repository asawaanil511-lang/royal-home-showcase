import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type GameCardProps = {
  title: string;
  description: string;
  badge: "Popular" | "Live" | "Coming Soon";
  gradient: "gradient-game-blue" | "gradient-game-orange" | "gradient-game-pink" | "gradient-game-green";
  icon: string;
  index: number;
};

const badgeColors: Record<string, string> = {
  Popular: "bg-badge-popular",
  Live: "bg-badge-live",
  "Coming Soon": "bg-badge-coming",
};

const GameCard = ({ title, description, badge, gradient, icon, index }: GameCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer overflow-hidden rounded-2xl shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className={`${gradient} relative flex h-44 items-center justify-center`}>
        <span className="text-6xl opacity-80 transition-transform group-hover:scale-110">
          {icon}
        </span>
        <span
          className={`${badgeColors[badge]} absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold text-primary-foreground`}
        >
          {badge}
        </span>
      </div>
      <div className="bg-card p-5">
        <h3 className="mb-1 text-lg font-bold text-card-foreground">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
          Play Now <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default GameCard;
