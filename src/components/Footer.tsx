import { Link } from "react-router-dom";
import betwicLogo from "@/assets/betwic-logo.jpg";
import { motion } from "framer-motion";
import { MessageCircle, Shield, Swords, Trophy, ListChecks, BookOpen, Wallet } from "lucide-react";

const TELEGRAM_URL = "https://t.me/Bittubhaji";

const footerLinks = [
  { label: "Matches",     href: "/matches",     icon: Swords },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Results",     href: "/results",     icon: ListChecks },
  { label: "Rules",       href: "/rules",       icon: BookOpen },
  { label: "Wallet",      href: "/wallet",      icon: Wallet },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-sm">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={betwicLogo}
                alt="Betwic Toss Book"
                className="h-10 w-10 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary/60 transition-colors shadow-sm"
              />
              <div>
                <div>
                  <span className="text-base font-extrabold text-foreground">BETWIC</span>
                  <span className="text-base font-extrabold text-primary ml-1.5">TOSS BOOK</span>
                </div>
                <p className="text-[10px] text-muted-foreground tracking-widest">ESTD 2019 · THE ORIGINAL BRAND</p>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground max-w-[210px] text-center md:text-left leading-relaxed">
              The original and trusted virtual cricket toss gaming arena.
            </p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 hover:border-primary/50 transition-all"
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
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary hover:bg-primary/8"
                >
                  <IconComp className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right info */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 font-medium dark:bg-emerald-500/10 dark:text-emerald-400">
              <Shield className="h-3.5 w-3.5" />
              Secure Platform
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Betwic Toss Book.</p>
            <p className="text-[10px] text-muted-foreground/60">All rights reserved.</p>
          </div>
        </div>

        <motion.div
          className="mt-8 h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.25), transparent)" }}
        />

        <p className="text-center text-[11px] text-muted-foreground/60 mt-4 tracking-wide">
          Play responsibly. This is a virtual platform for entertainment purposes only.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
