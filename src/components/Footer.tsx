import { Link } from "react-router-dom";
import lawrenceLogo from "@/assets/lawrence-logo.jpg";
import { motion } from "framer-motion";
import { MessageCircle, Shield, Swords, Trophy, ListChecks, BookOpen, Wallet } from "lucide-react";

const footerLinks = [
  { label: "Matches",     href: "/matches",     icon: Swords },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Results",     href: "/results",     icon: ListChecks },
  { label: "Rules",       href: "/rules",       icon: BookOpen },
  { label: "Wallet",      href: "/wallet",      icon: Wallet },
];

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-card/20 backdrop-blur-sm">
      {/* Top gradient line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-10 md:flex-row md:items-start">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={lawrenceLogo}
                alt="Lawrence Toss Book"
                className="h-9 w-9 rounded-full object-cover border border-primary/30 group-hover:border-primary/60 transition-colors shadow-[0_0_10px_hsl(var(--primary)/0.15)]"
              />
              <div>
                <span className="text-base font-extrabold text-foreground">LAWRENCE</span>
                <span className="text-base font-extrabold text-primary ml-1.5">TOSS BOOK</span>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground max-w-[200px] text-center md:text-left leading-relaxed">
              The most exciting virtual cricket toss betting platform.
            </p>
            <a
              href="https://t.me/Lawrenceboss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 hover:border-primary/40 transition-all"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Contact via Telegram
            </a>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-1 gap-y-1">
            {footerLinks.map((link) => {
              const IconComp = link.icon;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary hover:bg-primary/5"
                >
                  <IconComp className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right info */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-xs text-emerald-400 font-medium">
              <Shield className="h-3.5 w-3.5" />
              Secure Platform
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Lawrence Toss Book.</p>
            <p className="text-xs text-muted-foreground/60">All rights reserved.</p>
          </div>
        </div>

        {/* Bottom gradient divider */}
        <motion.div
          className="mt-10 h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.3), transparent)" }}
        />

        <p className="text-center text-[11px] text-muted-foreground/50 mt-4 tracking-wide">
          Play responsibly. This is a virtual platform for entertainment purposes only.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
