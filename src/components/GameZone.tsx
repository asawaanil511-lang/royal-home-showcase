import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import GameCard from "./GameCard";

const games = [
  {
    title: "Match Betting",
    description: "Bet on live cricket matches",
    badge: "Live" as const,
    gradient: "gradient-game-orange" as const,
    icon: "🏆",
    href: "/matches",
  },
  {
    title: "Leaderboard",
    description: "See top winners & rankings",
    badge: "Popular" as const,
    gradient: "gradient-game-blue" as const,
    icon: "📊",
    href: "/leaderboard",
  },
];

const GameZone = () => {
  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Gamepad2 className="h-4 w-4" />
            Game Zone
          </div>
          <h2 className="mb-3 text-4xl font-extrabold text-foreground">
            Get Ready for <span className="text-neon">Big Wins!</span>
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Place your bets on live matches and climb the leaderboard!
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
          {games.map((game, i) => (
            <GameCard key={game.title} {...game} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameZone;
