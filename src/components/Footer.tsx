import { Link } from "react-router-dom";
import supermanLogo from "@/assets/superman-logo.jpg";
import { motion } from "framer-motion";
import { MessageCircle, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={supermanLogo} alt="Superman Toss Book" className="h-8 w-8 rounded-full object-cover border border-primary/30" />
              <div>
                <span className="text-base font-extrabold text-foreground">SUPERMAN</span>
                <span className="text-base font-extrabold text-primary ml-1.5">TOSS BOOK</span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground max-w-[200px] text-center md:text-left">
              The most exciting virtual cricket betting platform.
            </p>
            <a
              href="https://t.me/shrey14a"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Contact via Telegram
            </a>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <Link to="/matches" className="transition-colors hover:text-primary">Matches</Link>
            <Link to="/leaderboard" className="transition-colors hover:text-primary">Leaderboard</Link>
            <Link to="/results" className="transition-colors hover:text-primary">Results</Link>
            <Link to="/rules" className="transition-colors hover:text-primary">Rules</Link>
            <Link to="/wallet" className="transition-colors hover:text-primary">Wallet</Link>
          </div>

          {/* Copyright */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secure Platform</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Superman Toss Book.</p>
            <p className="text-xs text-muted-foreground">All rights reserved.</p>
          </div>
        </div>

        {/* Bottom gradient line */}
        <motion.div
          className="mt-8 h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.4), transparent)" }}
        />
      </div>
    </footer>
  );
};

export default Footer;
