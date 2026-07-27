import { useState, useEffect, useRef } from "react";
import { Menu, X, Wallet, LogOut, User, Shield, Crown, LogIn, Eye, EyeOff, Coins, BookOpen, Home, Swords, ListChecks, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import rsLogo from "@/assets/rs-toss-logo.jpg";
import AnnouncementBanner from "@/components/AnnouncementBanner";

const WHATSAPP_REGISTER_URL = "https://wa.me/917735091610?text=I%20need%20toss%20id";

const navLinks = [
  { label: "Home",    href: "/",        icon: Home },
  { label: "Matches", href: "/matches", icon: Swords },
  { label: "Results", href: "/results", icon: ListChecks },
  { label: "Rules",   href: "/rules",   icon: BookOpen },
];

const WalletShowcase = ({ balance }: { balance: number }) => {
  const controls = useAnimation();
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (prevBalance.current !== balance) {
      const increased = balance > prevBalance.current;
      prevBalance.current = balance;
      controls.start({
        scale: [1, 1.25, 0.9, 1.15, 1],
        filter: increased
          ? ["brightness(1)", "brightness(1.8)", "brightness(1.4)", "brightness(1.6)", "brightness(1)"]
          : ["brightness(1)", "brightness(0.6)", "brightness(1)", "brightness(0.8)", "brightness(1)"],
        transition: { duration: 0.6, ease: "easeOut" },
      });
    }
  }, [balance, controls]);

  return (
    <Link
      to="/wallet"
      className="relative flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 transition-all hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_16px_hsl(var(--primary)/0.3)] group"
    >
      <motion.div animate={controls} className="relative">
        <Wallet className="h-4 w-4 text-primary" />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.span
          key={balance}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.25, ease: "backOut" }}
          className="text-sm font-bold text-primary tabular-nums"
        >
          ₹{balance.toLocaleString()}
        </motion.span>
      </AnimatePresence>
      <span className="absolute -top-1 -right-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
        <Coins className="h-3 w-3 text-yellow-500" />
      </span>
    </Link>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut, isAdmin, isOwner } = useAuth();
  const location = useLocation();
  const [showUsername, setShowUsername] = useState(true);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const balance = profile?.wallet_balance ?? 0;

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <motion.img
              src={rsLogo}
              alt="RS Toss Book"
              className="h-9 w-9 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary/70 transition-colors shadow-sm"
              whileHover={{ scale: 1.08, rotate: 4 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
            <div className="hidden sm:block leading-tight">
              <div>
                <span className="text-sm font-extrabold tracking-tight text-foreground">RS </span><span className="text-sm font-extrabold tracking-tight text-primary">TOSS BOOK</span>
              </div>
              <p className="text-[9px] text-muted-foreground tracking-widest font-medium">ESTD 2019</p>
            </div>
            <div className="flex flex-col sm:hidden leading-tight">
              <div>
                <span className="text-base font-black tracking-tight text-foreground">RS </span><span className="text-base font-black tracking-tight text-primary">TOSS BOOK</span>
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => {
              const IconComp = link.icon;
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <IconComp className="relative h-3.5 w-3.5 shrink-0" />
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: User actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {showUsername ? (profile?.username || "user") : "••••••"}
                </span>
                <button
                  onClick={() => setShowUsername(!showUsername)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showUsername ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>

              <WalletShowcase balance={balance} />

              <Link
                to="/my-bets"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors md:flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-secondary"
              >
                <FileText className="h-3.5 w-3.5" />
                My Bets
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/20"
                >
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              {isOwner && (
                <Link
                  to="/owner"
                  className="flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30 dark:hover:bg-violet-500/20"
                >
                  <Crown className="h-4 w-4" /> Owner
                </Link>
              )}

              <button
                onClick={signOut}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex border-primary/40 text-primary hover:bg-primary/10 gap-1.5" asChild>
                <Link to="/login"><LogIn className="h-4 w-4" /> Login</Link>
              </Button>
              <Button size="sm" className="hidden sm:inline-flex gradient-neon-primary text-primary-foreground font-semibold shadow-neon text-xs" asChild>
                <a href={WHATSAPP_REGISTER_URL} target="_blank" rel="noopener noreferrer">Register</a>
              </Button>
            </>
          )}

          <button
            className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-background md:hidden overflow-hidden"
          >
            <div className="px-4 pt-3 pb-5">
              <div className="flex flex-col gap-0.5 mb-4">
                {navLinks.map((link) => {
                  const IconComp = link.icon;
                  const active = location.pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        active
                          ? "text-primary bg-primary/10 border border-primary/20"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <IconComp className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                      {link.label}
                      {active && <motion.span layoutId="mobile-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
                {user && (
                  <Link
                    to="/my-bets"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      location.pathname === "/my-bets"
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    My Bets
                  </Link>
                )}
              </div>

              <div className="h-px bg-border mb-4" />

              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Logged in as</p>
                      <p className="text-sm font-bold text-foreground truncate">
                        {showUsername ? (profile?.username || "user") : "••••••••"}
                      </p>
                    </div>
                    <button onClick={() => setShowUsername(!showUsername)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {showUsername ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/wallet"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 hover:bg-primary/20 transition-colors"
                    >
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-primary">₹{balance.toLocaleString()}</span>
                      <span className="ml-auto text-xs text-muted-foreground">Wallet</span>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signOut}
                      className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-primary/40 text-primary hover:bg-primary/10 gap-1.5" asChild>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      <LogIn className="h-4 w-4" /> Login
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1 gradient-neon-primary text-primary-foreground font-semibold" asChild>
                    <a href={WHATSAPP_REGISTER_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>
                      Register
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    <AnnouncementBanner />
    </>
  );
};

export default Navbar;
