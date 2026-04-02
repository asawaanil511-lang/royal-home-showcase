import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, LayoutDashboard, Trophy, Users, Receipt, UserCog, Megaphone, Loader2 } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminMatches from "@/components/admin/AdminMatches";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminBets from "@/components/admin/AdminBets";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminAnnouncements from "@/components/admin/AdminAnnouncements";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "dashboard" | "matches" | "users" | "bets" | "user-mgmt" | "announcements";

const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-primary" },
  { id: "matches", label: "Matches", icon: Trophy, color: "text-amber-400" },
  { id: "users", label: "Users", icon: Users, color: "text-cyan-400" },
  { id: "bets", label: "Bets", icon: Receipt, color: "text-purple-400" },
  { id: "user-mgmt", label: "User Mgmt", icon: UserCog, color: "text-rose-400" },
  { id: "announcements", label: "Announcements", icon: Megaphone, color: "text-emerald-400" },
];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const checkRole = async () => {
      const { data } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!data) { navigate("/matches"); return; }
      setIsAdmin(true);
      setChecking(false);
    };
    checkRole();
  }, [user, authLoading]);

  if (authLoading || checking || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Checking permissions…</p>
        </div>
      </div>
    );
  }

  const activeTabConfig = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Admin header */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground tracking-tight">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Betwic Toss Book — Management</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="mt-5 flex flex-wrap gap-1">
            {TABS.map((tab) => {
              const IconComp = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? "bg-card border border-border/60 text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <IconComp className={`h-3.5 w-3.5 ${active ? tab.color : ""}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  {active && (
                    <motion.div layoutId="admin-tab-indicator"
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full ${tab.color.replace("text-", "bg-")}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Section header */}
            <div className="flex items-center gap-2 mb-6">
              <activeTabConfig.icon className={`h-5 w-5 ${activeTabConfig.color}`} />
              <h2 className="text-base font-bold text-foreground">{activeTabConfig.label}</h2>
            </div>

            {activeTab === "dashboard" && <AdminDashboard />}
            {activeTab === "matches" && <AdminMatches />}
            {activeTab === "users" && <AdminUsers />}
            {activeTab === "bets" && <AdminBets />}
            {activeTab === "user-mgmt" && <AdminUserManagement />}
            {activeTab === "announcements" && <AdminAnnouncements />}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
