import { Link, useLocation } from "react-router-dom";
import { Home, Ticket, BookOpen, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const tabs = [
  { label: "HOME",      href: "/",        icon: Home,    authRequired: true },
  { label: "BETS",      href: "/my-bets", icon: Ticket,  authRequired: true },
  { label: "PASSBOOK",  href: "/wallet",  icon: BookOpen, authRequired: true },
  { label: "PROFILE",   href: "/profile", icon: User,    authRequired: true },
];

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Only show when logged in and not on login page
  if (!user || location.pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Top border glow */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="bg-background/95 backdrop-blur-xl border-t border-border/40 px-2 pb-safe">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = location.pathname === tab.href ||
              (tab.href === "/wallet" && location.pathname === "/wallet");

            return (
              <Link
                key={tab.label}
                to={tab.href}
                className="relative flex flex-col items-center gap-1 px-4 py-3 min-w-[64px] group"
              >
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-1 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <IconComp
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />

                <span
                  className={`text-[9px] font-bold tracking-wider transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
