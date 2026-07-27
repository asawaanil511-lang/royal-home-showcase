import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/hooks/useNotifications";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Moon, Sun, Bell, BellOff, BookOpen, KeyRound, LogOut, ChevronRight,
  Monitor, Smartphone, Shield, User, Lock, Eye, EyeOff,
  Edit3, CheckCircle, Ban, Trash2, RefreshCw, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import rsLogo from "@/assets/rs-toss-logo.jpg";

const DEMO_USERNAME = "demo";

const formatLastSeen = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 2) return "Active now";
  if (min < 60) return `Last active about ${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Last active about ${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `Last active about ${day} day${day === 1 ? "" : "s"} ago`;
  return `Last active on ${new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
};

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

const Toggle = ({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) => (
  <button
    onClick={disabled ? undefined : onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
    } ${enabled ? "bg-primary" : "bg-secondary border border-border"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const SettingRow = ({
  icon: IconComp, iconColor, iconBg, label, subtitle, right, onClick, href, locked,
}: {
  icon: any; iconColor: string; iconBg: string; label: string;
  subtitle?: string; right?: React.ReactNode; onClick?: () => void;
  href?: string; locked?: boolean;
}) => {
  const inner = (
    <div className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-secondary/60 ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {locked ? <Ban className="h-5 w-5 text-muted-foreground" /> : <IconComp className={`h-5 w-5 ${iconColor}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="shrink-0">
        {right ?? (locked
          ? <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">LOCKED</span>
          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
  if (locked) return <div>{inner}</div>;
  if (href) return <Link to={href}>{inner}</Link>;
  if (onClick) return <button className="w-full text-left" onClick={onClick}>{inner}</button>;
  return inner;
};

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isDemo = profile?.username === DEMO_USERNAME;

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [notifEnabled, setNotifEnabled] = useState(
    () => localStorage.getItem("stb_notifications") === "true" && Notification.permission === "granted"
  );

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  type SessionRecord = {
    id: string; browser: string; os: string; device_type: string;
    session_token: string; created_at: string; last_seen: string; is_current: boolean;
  };
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const getDeviceToken = () => localStorage.getItem("device_session_token") || "";

  const fetchSessions = async () => {
    if (!user) return;
    setSessionsLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      if (!token) return;
      const res = await fetch(apiUrl("/api/sessions"), {
        headers: { Authorization: `Bearer ${token}`, "x-session-token": getDeviceToken() },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } finally {
      setSessionsLoading(false);
    }
  };

  const revokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      await fetch(apiUrl(`/api/sessions/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "x-session-token": getDeviceToken() },
      });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Session revoked" });
    } finally {
      setRevokingId(null);
    }
  };

  const revokeAllOther = async () => {
    setRevokingAll(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const token = currentSession?.access_token;
      await fetch(apiUrl("/api/sessions"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "x-session-token": getDeviceToken() },
      });
      setSessions((prev) => prev.filter((s) => s.is_current));
      toast({ title: "All other sessions revoked" });
    } finally {
      setRevokingAll(false);
    }
  };

  useEffect(() => { fetchSessions(); }, [user]);

  const deviceInfo = getBrowserInfo();
  const username = profile?.username || user?.email?.split("@")[0] || "User";
  const initials = username.substring(0, 2).toUpperCase();

  const handleNotificationsToggle = async () => {
    if (notifEnabled) {
      // Turn off
      setNotifEnabled(false);
      localStorage.setItem("stb_notifications", "false");
      toast({ title: "Notifications disabled" });
      return;
    }

    // Turn on — request permission first
    if (typeof Notification === "undefined") {
      toast({ title: "Notifications not supported", description: "Your browser doesn't support push notifications.", variant: "destructive" });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);

      if (permission === "granted") {
        setNotifEnabled(true);
        localStorage.setItem("stb_notifications", "true");
        toast({ title: "Notifications enabled!", description: "You'll get alerts for bet results." });
        // Send a welcome notification
        setTimeout(() => {
          sendNotification(
            "RS Toss Book 🏏",
            "Notifications are now active! You'll be alerted when your bets are settled."
          );
        }, 500);
      } else if (permission === "denied") {
        toast({
          title: "Permission denied",
          description: "Please allow notifications in your browser settings.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Permission not granted", description: "You can enable notifications later.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Could not request permission", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (!newPw || !confirmPw) { toast({ title: "Fill in all fields", variant: "destructive" }); return; }
    if (newPw !== confirmPw) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (newPw.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }

    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed!", description: "You'll be signed out shortly." });
      setPasswordDialogOpen(false);
      setTimeout(async () => { await supabase.auth.signOut(); navigate("/login"); }, 1500);
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

  const notifSubtitle = notifPermission === "denied"
    ? "Blocked in browser settings"
    : notifEnabled ? "Push alerts on" : "Push alerts off";

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
            <div className="h-20 w-20 rounded-full overflow-hidden bg-card shadow-neon border-2 border-primary/50">
              <img
                src={profile?.avatar_url || rsLogo}
                alt={username}
                className="h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = rsLogo; }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary border-2 border-background">
              <Edit3 className="h-3 w-3 text-background" />
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <p className="text-xl font-extrabold text-foreground">{username}</p>
              {isDemo && (
                <span className="text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full">
                  DEMO
                </span>
              )}
            </div>
            {profile?.display_name && profile.display_name !== username && (
              <p className="text-sm text-muted-foreground">{profile.display_name}</p>
            )}
            <div className="flex items-center gap-1.5 justify-center mt-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">
                {isDemo ? "Demo account" : "Active account"}
              </span>
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

            {/* Dark / Light Mode */}
            <SettingRow
              icon={isDark ? Moon : Sun}
              iconColor={isDark ? "text-primary" : "text-yellow-400"}
              iconBg={isDark ? "bg-primary/10" : "bg-yellow-400/10"}
              label={isDark ? "Dark Mode" : "Light Mode"}
              subtitle={isDark ? "Switch to light theme" : "Switch to dark theme"}
              right={<Toggle enabled={isDark} onChange={toggleTheme} />}
            />

            {/* Notifications */}
            <SettingRow
              icon={notifEnabled ? Bell : BellOff}
              iconColor={notifEnabled ? "text-primary" : "text-muted-foreground"}
              iconBg={notifEnabled ? "bg-primary/10" : "bg-secondary"}
              label="Notifications"
              subtitle={notifSubtitle}
              right={
                notifPermission === "denied"
                  ? <span className="text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">BLOCKED</span>
                  : <Toggle enabled={notifEnabled} onChange={handleNotificationsToggle} />
              }
              onClick={notifPermission !== "denied" ? handleNotificationsToggle : undefined}
            />

            {/* App Rules */}
            <SettingRow
              icon={BookOpen}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              label="App Rules"
              subtitle="Platform rules & guidelines"
              href="/rules"
            />

            {/* Change Password — locked for demo */}
            <SettingRow
              icon={KeyRound}
              iconColor="text-yellow-400"
              iconBg="bg-yellow-400/10"
              label="Change Password"
              subtitle={isDemo ? "Not available on demo account" : "Update your login password"}
              locked={isDemo}
              onClick={isDemo ? undefined : () => { setNewPw(""); setConfirmPw(""); setPasswordDialogOpen(true); }}
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
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              Security &amp; Sessions
            </p>
            <button
              onClick={fetchSessions}
              disabled={sessionsLoading}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${sessionsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {(() => {
            if (sessionsLoading) {
              return (
                <div className="rounded-2xl border border-border/50 bg-card flex items-center justify-center py-6">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-xs text-muted-foreground">Loading sessions…</span>
                </div>
              );
            }
            if (sessions.length === 0) {
              return (
                <div className="rounded-2xl border border-border/50 bg-card px-4 py-5 text-center">
                  <p className="text-xs text-muted-foreground">No recorded sessions yet. Sessions are recorded when you log in.</p>
                </div>
              );
            }

            const current = sessions.find((s) => s.is_current);
            const others = sessions.filter((s) => !s.is_current);

            const SessionIcon = ({ s }: { s: SessionRecord }) => {
              const isMob = s.device_type === "Mobile";
              return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border/40">
                  {isMob
                    ? <Smartphone className="h-4 w-4 text-muted-foreground" />
                    : <Monitor className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              );
            };

            return (
              <div className="space-y-3">
                {/* Current device — highlighted card */}
                {current && (
                  <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-blue-500" />
                    <div className="flex items-center gap-3 px-4 py-3.5 pl-5">
                      <SessionIcon s={current} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[15px] font-bold text-foreground truncate">
                            {current.browser} on {current.os}
                          </p>
                          <span className="text-[10px] font-bold bg-blue-500 text-white px-2.5 py-0.5 rounded-full shrink-0 tracking-wider shadow-[0_2px_8px_rgba(59,130,246,0.35)]">
                            THIS DEVICE
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Active now</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* View all sessions toggle */}
                {others.length > 0 && (
                  <button
                    onClick={() => setShowAllSessions((v) => !v)}
                    className="w-full flex items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3.5 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {showAllSessions ? "Hide all sessions" : "View all sessions"}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-500">{others.length}</span>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform ${showAllSessions ? "rotate-90" : ""}`}
                      />
                    </span>
                  </button>
                )}

                {/* Past sessions list */}
                {showAllSessions && others.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3.5"
                  >
                    <SessionIcon s={s} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-foreground truncate">
                        {s.browser} on {s.os}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {formatLastSeen(s.last_seen)}
                      </p>
                    </div>
                    <button
                      onClick={() => revokeSession(s.id)}
                      disabled={revokingId === s.id}
                      className="shrink-0 text-[11px] font-extrabold tracking-wider text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors px-1"
                    >
                      {revokingId === s.id ? "REVOKING…" : "TERMINATE"}
                    </button>
                  </div>
                ))}

                {/* Revoke all others */}
                {showAllSessions && others.length > 1 && (
                  <button
                    onClick={revokeAllOther}
                    disabled={revokingAll}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    {revokingAll
                      ? <><RefreshCw className="h-3 w-3 animate-spin" /> Terminating all…</>
                      : <><AlertTriangle className="h-3 w-3" /> Terminate all other sessions</>
                    }
                  </button>
                )}
              </div>
            );
          })()}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-border/50 bg-card py-4 text-sm font-bold text-red-500 dark:text-red-400 transition-all hover:bg-red-500/5 hover:border-red-500/30"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          <p className="mt-6 text-center text-[11px] font-bold tracking-[0.22em] text-muted-foreground/70 uppercase">
            Version 0.1.0
          </p>
        </motion.div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/60 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight">
              Change password
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground">
              Choose a strong password you have not used elsewhere.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                New password
              </label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  placeholder="New password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="h-12 pr-10 bg-background border-border/70 rounded-xl text-[15px] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Confirm password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="h-12 pr-10 bg-background border-border/70 rounded-xl text-[15px] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPasswordDialogOpen(false)}
                disabled={changingPw}
                className="flex-1 h-12 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-semibold text-[15px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={changingPw || !newPw || !confirmPw}
                className="flex-1 h-12 rounded-xl gradient-neon-primary text-primary-foreground font-bold text-[15px] shadow-neon"
              >
                {changingPw ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Updating...
                  </span>
                ) : "Update password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Profile;
