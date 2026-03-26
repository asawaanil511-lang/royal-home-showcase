import { useState, useEffect } from "react";
import { Menu, X, Wallet, LogOut, User, Shield, LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import supermanLogo from "@/assets/superman-logo.jpg";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Matches", href: "/matches" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Results", href: "/results" },
];

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
            <img src={supermanLogo} alt="Superman Toss Book" className="h-9 w-9 rounded-full object-cover" />
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
              {/* Username tag with eye toggle */}
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

              {/* Wallet showcase with animation */}
              <Link
                to="/wallet"
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 transition-all hover:bg-primary/20 hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                >
                  <Wallet className="h-4 w-4 text-primary" />
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={balance}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-bold text-primary tabular-nums"
                  >
                    ₹{balance.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
              </Link>

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
              {/* Mobile username tag */}
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
