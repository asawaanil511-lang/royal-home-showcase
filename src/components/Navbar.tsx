import { useState, useEffect, useRef } from "react";
import { Menu, X, Wallet, LogOut, User, Shield, LogIn, Eye, EyeOff, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import supermanLogo from "@/assets/superman-logo.jpg";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Matches", href: "/matches" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Results", href: "/results" },
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
      className="relative flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 transition-all hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_16px_hsl(var(--primary)/0.4)] group"
    >
      {/* Animated pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary pointer-events-none" style={{ animationDuration: "3s" }} />

      <motion.div animate={controls} className="relative">
        <motion.div
          animate={{
            rotate: [0, -12, 12, -8, 8, 0],
            y: [0, -2, 2, -1, 1, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
        >
          <Wallet className="h-4 w-4 text-primary" />
        </motion.div>
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

      {/* Sparkles on hover */}
      <motion.span
        className="absolute -top-1 -right-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <Coins className="h-3 w-3 text-yellow-400" />
      </motion.span>
    </Link>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUsername, setShowUsername] = useState(true);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    (supabase as any).from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }: any) => setIsAdmin(!!data));
  }, [user]);

  const balance = profile?.wallet_balance ?? 0;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <motion.img
              src={supermanLogo}
              alt="Superman Toss Book"
              className="h-9 w-9 rounded-full object-cover"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
            <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">SUPERMAN TOSS BOOK</span>
            <span className="text-lg font-bold tracking-tight text-foreground sm:hidden">STB</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Username tag */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5">
                <User className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-semibold text-accent">
                  {showUsername ? (profile?.username || "user") : "••••••"}
                </span>
                <button
                  onClick={() => setShowUsername(!showUsername)}
                  className="ml-0.5 text-muted-foreground hover:text-accent transition-colors"
                >
                  {showUsername ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>

              {/* Animated Wallet showcase */}
              <WalletShowcase balance={balance} />

              <Link
                to="/my-bets"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors md:block"
              >
                My Bets
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
                >
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
              <button
                onClick={signOut}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex border-primary/30 text-primary hover:bg-primary/10 gap-1.5" asChild>
                <Link to="/login"><LogIn className="h-4 w-4" /> Login</Link>
              </Button>
              <Button size="sm" className="hidden sm:inline-flex gradient-neon-primary text-primary-foreground font-semibold shadow-neon" asChild>
                <a href="https://t.me/shrey14a" target="_blank" rel="noopener noreferrer">Register</a>
              </Button>
            </>
          )}
          <button
            className="rounded-lg p-2 text-muted-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/my-bets"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                My Bets
              </Link>
            )}
          </div>
          {user ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-accent">
                  {showUsername ? (profile?.username || "user") : "••••••"}
                </span>
                <button onClick={() => setShowUsername(!showUsername)} className="text-muted-foreground">
                  {showUsername ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <Link to="/wallet" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">₹{balance.toLocaleString()}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut} className="border-destructive/30 text-destructive">
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-primary/30 text-primary" asChild>
                <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
              </Button>
              <Button size="sm" className="flex-1 gradient-neon-primary text-primary-foreground font-semibold" asChild>
                <a href="https://t.me/shrey14a" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>Register</a>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
