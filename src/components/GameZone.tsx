import { motion } from "framer-motion";
import { Gamepad2, Zap, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const games = [
  {
    title: "Match Betting",
    description: "Bet on live cricket matches with real-time odds and instant settlement",
    badge: "🔴 LIVE",
    badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
    gradient: "from-orange-600/30 via-red-600/20 to-orange-800/30",
    border: "border-orange-500/30 hover:border-orange-500/60",
    glow: "hover:shadow-[0_0_24px_hsl(25deg_90%_40%/0.2)]",
    icon: "🏏",
    href: "/matches",
    cta: "Bet Now",
  },
  {
    title: "Leaderboard",
    description: "See top winners and compete for the highest rankings on the platform",
    badge: "🔥 Popular",
    badgeClass: "bg-primary/20 text-primary border-primary/30",
    gradient: "from-primary/20 via-cyan-600/15 to-primary/25",
    border: "border-primary/30 hover:border-primary/60",
    glow: "hover:shadow-neon",
    icon: "📊",
    href: "/leaderboard",
    cta: "View Rankings",
  },
  {
    title: "Rules & Info",
    description: "Read all the platform rules, deposit guidelines and important info",
    badge: "📋 Important",
    badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    gradient: "from-blue-600/20 via-indigo-600/15 to-blue-800/25",
    border: "border-blue-500/30 hover:border-blue-500/60",
    glow: "hover:shadow-[0_0_24px_hsl(217deg_91%_60%/0.2)]",
    icon: "📖",
    href: "/rules",
    cta: "Read Rules",
  },
];

const GameZone = () => {
  return (
    <section className="py-20 relative">
      <div className="pointer-events-none absolute inset-0 bg-card/20" />
      <div className="container relative mx-auto px-4">
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
            Place your bets on live matches, climb the leaderboard, and know the rules!
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-3 max-w-4xl mx-auto">
          {games.map((game, i) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Link
                to={game.href}
                className={`group flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-300 ${game.border} ${game.glow}`}
              >
                {/* Gradient top area */}
                <div className={`relative flex items-center justify-center py-8 bg-gradient-to-br ${game.gradient}`}>
                  <motion.div
                    className="text-5xl"
                    whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {game.icon}
                  </motion.div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${game.badgeClass}`}>
                      {game.badge}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-2">
                  <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{game.description}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm font-semibold text-primary">
                    {game.cta}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameZone;
