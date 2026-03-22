import { useState, useEffect } from "react";
import { Menu, X, Wallet, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    (supabase as any).from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }: any) => setIsAdmin(!!data));
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-neon-primary font-bold text-primary-foreground text-sm shadow-neon">
              R
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">ROYAL11</span>
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
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/wallet"
                className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 sm:flex transition-colors hover:bg-primary/20"
              >
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  ₹{(profile?.wallet_balance ?? 0).toLocaleString()}
                </span>
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
              <Link
                to="/wallet"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
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
              <Button variant="outline" size="sm" className="hidden sm:inline-flex border-primary/30 text-primary hover:bg-primary/10" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="hidden sm:inline-flex gradient-neon-primary text-primary-foreground font-semibold shadow-neon" asChild>
                <Link to="/register">Register</Link>
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
            <div className="mt-3 flex items-center justify-between">
              <Link to="/wallet" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">₹{(profile?.wallet_balance ?? 0).toLocaleString()}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut} className="border-destructive/30 text-destructive">
                Logout
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-primary/30 text-primary" asChild>
                <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
              </Button>
              <Button size="sm" className="flex-1 gradient-neon-primary text-primary-foreground font-semibold" asChild>
                <Link to="/register" onClick={() => setMobileOpen(false)}>Register</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
