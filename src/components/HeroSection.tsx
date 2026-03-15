import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Neon glow blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/8 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[hsl(270_80%_60%/0.06)] blur-[100px]" />

      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap className="h-4 w-4" />
            Live Betting Platform
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight text-foreground md:text-7xl tracking-tight">
            Play. Win. <span className="text-neon">Repeat.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            India's most exciting gaming platform. Flip coins, bet on cricket matches, spin wheels and win virtual rewards.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="gap-2 text-base font-semibold gradient-neon-primary text-primary-foreground shadow-neon hover:opacity-90" asChild>
              <Link to="/matches"><Play className="h-4 w-4" /> Start Playing</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base font-semibold border-primary/30 text-primary hover:bg-primary/10" asChild>
              <Link to="/coinflip">Coin Flip</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
