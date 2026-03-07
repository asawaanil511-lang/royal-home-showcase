import { useState } from "react";
import { Bell, Menu, X, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Live Matches", href: "/matches" },
  { label: "Coin Flip", href: "#" },
  { label: "History", href: "#" },
  { label: "Rules", href: "#" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm">
              R
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">ROYAL11</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-1.5 rounded-full border bg-secondary px-3 py-1.5 sm:flex">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  ₹{(profile?.wallet_balance ?? 0).toLocaleString()}
                </span>
              </div>
              <span className="hidden text-sm font-medium text-muted-foreground md:block">
                {profile?.display_name || profile?.username || "Player"}
              </span>
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
              <button className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Bell className="h-5 w-5" />
              </button>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" asChild>
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
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {user ? (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">₹{(profile?.wallet_balance ?? 0).toLocaleString()}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
