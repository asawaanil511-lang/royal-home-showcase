import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-secondary/30 py-24">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />

      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-6 text-5xl font-extrabold leading-tight text-foreground md:text-6xl">
            Play. Win. <span className="text-primary">Repeat.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            India's most exciting gaming platform. Flip coins, bet on cricket matches, spin wheels and win real rewards.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="gap-2 text-base font-semibold">
              <Play className="h-4 w-4" /> Start Playing
            </Button>
            <Button size="lg" variant="outline" className="text-base font-semibold" asChild>
              <Link to="/matches">View Matches</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
