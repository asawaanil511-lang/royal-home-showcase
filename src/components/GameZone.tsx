import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import GameCard from "./GameCard";

const games = [
  {
    title: "Coin Flip",
    description: "50/50 chance to double your bet",
    badge: "Popular" as const,
    gradient: "gradient-game-blue" as const,
    icon: "🪙",
  },
  {
    title: "Match Betting",
    description: "Bet on live cricket matches",
    badge: "Live" as const,
    gradient: "gradient-game-orange" as const,
    icon: "🏆",
  },
  {
    title: "Lucky Wheel",
    description: "Spin and win big prizes",
    badge: "Coming Soon" as const,
    gradient: "gradient-game-pink" as const,
    icon: "🎡",
  },
  {
    title: "Jackpot",
    description: "Win massive jackpot prizes",
    badge: "Coming Soon" as const,
    gradient: "gradient-game-green" as const,
    icon: "💎",
  },
];

const GameZone = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <Gamepad2 className="h-4 w-4" />
            Game Zone
          </div>
          <h2 className="mb-3 text-4xl font-extrabold text-foreground">
            Get Ready for <span className="text-accent">Big Wins!</span>
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Check out all our games! From upcoming releases to player favorites, there's always something fun waiting for you.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game, i) => (
            <GameCard key={game.title} {...game} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameZone;
