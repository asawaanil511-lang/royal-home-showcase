import { motion } from "framer-motion";
import { Gamepad2, ArrowRight, Swords, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const games = [
  {
    title: "Toss Plays",
    description: "Play on live cricket toss matches with real-time odds and instant settlement in 10 minutes.",
    badge: "🔴 LIVE",
    badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
    gradient: "from-red-600/20 via-orange-600/10 to-red-800/20",
    border: "border-red-500/20 hover:border-red-500/50",
    glow: "hover:shadow-[0_0_28px_hsl(0deg_80%_55%/0.15)]",
    icon: Swords,
    iconColor: "text-red-400",
    iconBg: "bg-red-500/10",
    href: "/matches",
    cta: "Bet Now",
  },
  {
    title: "Rules & Info",
    description: "Read all platform rules, deposit guidelines, and important payment information.",
    badge: "📋 Important",
    badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    gradient: "from-blue-600/15 via-indigo-600/10 to-blue-800/20",
    border: "border-blue-500/20 hover:border-blue-500/50",
    glow: "hover:shadow-[0_0_28px_hsl(217deg_91%_60%/0.12)]",
    icon: BookOpen,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    href: "/rules",
    cta: "Read Rules",
  },
];

const GameZone = () => {
  return (
    <section className="py-20 relative">
      <div className="pointer-events-none absolute inset-0 bg-card/15" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-border/80 to-transparent" />

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
          <p className="mx-auto max-w-lg text-muted-foreground text-sm">
            Place bets on live matches, win big, and master the rules!
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 max-w-2xl mx-auto">
          {games.map((game, i) => {
            const IconComp = game.icon;
            return (
              <motion.div
                key={game.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  to={game.href}
                  className={`group flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-300 h-full ${game.border} ${game.glow}`}
                >
                  {/* Gradient header area */}
                  <div className={`relative flex flex-col items-center justify-center py-8 gap-3 bg-gradient-to-br ${game.gradient}`}>
                    <motion.div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 ${game.iconBg}`}
                      whileHover={{ scale: 1.1, rotate: [0, -6, 6, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <IconComp className={`h-7 w-7 ${game.iconColor}`} />
                    </motion.div>

                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${game.badgeClass}`}>
                        {game.badge}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-2">
                    <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{game.description}</p>
                    <div className="flex items-center gap-1.5 mt-3 text-sm font-bold text-primary">
                      {game.cta}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GameZone;
