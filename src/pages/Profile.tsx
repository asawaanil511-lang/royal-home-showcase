import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Moon, Bell, BookOpen, KeyRound, LogOut, ChevronRight,
  Monitor, Smartphone, Shield, User, Lock, Eye, EyeOff,
  Edit3, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = "Browser";
  let os = "Unknown OS";

  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";

  if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  const isMobile = /Android|iPhone|iPad/i.test(ua);
  return { browser, os, isMobile };
};

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      enabled ? "bg-primary" : "bg-secondary border border-border"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const SettingRow = ({
  icon: IconComp,
  iconColor,
  iconBg,
  label,
  subtitle,
  right,
  onClick,
  href,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) => {
  const inner = (
    <div className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/3 cursor-pointer">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <IconComp className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="shrink-0">
        {right ?? <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </div>
  );

  if (href) return <Link to={href}>{inner}</Link>;
  if (onClick) return <button className="w-full text-left" onClick={onClick}>{inner}</button>;
  return inner;
};

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState(() =>
    localStorage.getItem("stb_notifications") === "true"
  );
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const deviceInfo = getBrowserInfo();
  const username = profile?.username || user?.email?.split("@")[0] || "User";
  const initials = username.substring(0, 2).toUpperCase();

  const handleNotificationsToggle = () => {
    const newVal = !notifications;
    setNotifications(newVal);
    localStorage.setItem("stb_notifications", String(newVal));
    toast({ title: newVal ? "Notifications enabled" : "Notifications disabled" });
  };

  const handleChangePassword = async () => {
    if (!newPw || !confirmPw) {
      toast({ title: "Fill in all fields", variant: "destructive" }); return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (newPw.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return;
    }

    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed!", description: "You'll be signed out shortly." });
      setPasswordDialogOpen(false);
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/login");
      }, 1500);
    }
    setChangingPw(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <User className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Login to view profile</h2>
          <Button className="gradient-neon-primary text-primary-foreground shadow-neon px-8" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-lg">

        {/* Avatar + username */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 mb-8"
        >
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/80 to-cyan-400/80 flex items-center justify-center text-2xl font-extrabold text-background shadow-neon border-2 border-primary/50">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary border-2 border-background">
              <Edit3 className="h-3 w-3 text-background" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-foreground">{username}</p>
            {profile?.display_name && profile.display_name !== username && (
              <p className="text-sm text-muted-foreground">{profile.display_name}</p>
            )}
            <div className="flex items-center gap-1.5 justify-center mt-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Active account</span>
            </div>
          </div>
        </motion.div>

        {/* Settings & Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-5"
        >
          <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase px-1 mb-2">
            Settings &amp; Preferences
          </p>
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/40">
            <SettingRow
              icon={Moon}
              iconColor="text-primary"
              iconBg="bg-primary/10"
              label="Dark Mode"
              subtitle="Currently active"
              right={<Toggle enabled={true} onChange={() => {}} />}
            />
            <SettingRow
              icon={Bell}
              iconColor={notifications ? "text-primary" : "text-muted-foreground"}
              iconBg={notifications ? "bg-primary/10" : "bg-secondary"}
              label="Notifications"
              subtitle={notifications ? "Push alerts on" : "Push alerts off"}
              right={<Toggle enabled={notifications} onChange={handleNotificationsToggle} />}
            />
            <SettingRow
              icon={BookOpen}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              label="App Rules"
              subtitle="Platform rules & guidelines"
              href="/rules"
            />
            <SettingRow
              icon={KeyRound}
              iconColor="text-yellow-400"
              iconBg="bg-yellow-400/10"
              label="Change Password"
              subtitle="Update your login password"
              onClick={() => {
                setCurrentPw(""); setNewPw(""); setConfirmPw("");
                setPasswordDialogOpen(true);
              }}
            />
          </div>
        </motion.div>

        {/* Security & Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="mb-5"
        >
          <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase px-1 mb-2">
            Security &amp; Sessions
          </p>
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/40">
            {/* Current device */}
            <div className="flex items-center gap-4 px-4 py-4 border-l-2 border-primary">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                {deviceInfo.isMobile
                  ? <Smartphone className="h-5 w-5 text-muted-foreground" />
                  : <Monitor className="h-5 w-5 text-muted-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {deviceInfo.browser} on {deviceInfo.os}
                  </p>
                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    THIS DEVICE
                  </span>
                </div>
                <p className="text-xs text-emerald-400 mt-0.5">Active now</p>
              </div>
            </div>

            {/* Secured badge */}
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Account Secured</p>
                <p className="text-xs text-muted-foreground mt-0.5">Password protected login</p>
              </div>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/8 py-4 text-sm font-bold text-red-400 transition-all hover:bg-red-500/15 hover:border-red-500/40 hover:shadow-[0_0_20px_hsl(0deg_80%_55%/0.1)]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </motion.div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type={showNewPw ? "text" : "password"}
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="pl-10 pr-10 bg-secondary/50 border-border h-11"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type={showCurrentPw ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="pl-10 pr-10 bg-secondary/50 border-border h-11"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPw || !newPw || !confirmPw}
              className="w-full gradient-neon-primary text-primary-foreground font-bold h-11 shadow-neon"
            >
              {changingPw ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Updating...
                </span>
              ) : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Profile;
