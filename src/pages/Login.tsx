import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import supermanLogo from "@/assets/superman-logo.jpg";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, MessageCircle, Send, HelpCircle, LogIn, Zap } from "lucide-react";
import { motion } from "framer-motion";

const TELEGRAM_URL = "https://t.me/shrey14a";

const Login = () => {
  const [username, setUsername] = useState(() => localStorage.getItem("stb_remember_user") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Please enter username and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/login-by-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const res = await response.json();
      if (!response.ok || res.error || !res.email) {
        toast({ title: "Login failed", description: res.error || "User not found", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: res.email, password });
      if (signInError) {
        toast({ title: "Login failed", description: "Invalid username or password", variant: "destructive" });
        setLoading(false);
        return;
      }
      localStorage.setItem("stb_remember_user", username);
      toast({ title: "Welcome back! 🎉", description: `Logged in as ${username}` });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const response = await fetch("/api/login-by-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "demo" }),
      });
      const res = await response.json();
      if (!response.ok || res.error || !res.email) {
        toast({
          title: "Demo account not set up",
          description: "Contact admin to create a demo account.",
          variant: "destructive",
        });
        setDemoLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: res.email, password: "Demo@1234" });
      if (error) {
        toast({ title: "Demo login failed", description: "Contact admin to set up the demo account.", variant: "destructive" });
        setDemoLoading(false);
        return;
      }
      toast({ title: "Demo login successful!", description: "Explore the platform" });
      navigate(from, { replace: true });
    } catch {
      toast({ title: "Demo login unavailable", variant: "destructive" });
    }
    setDemoLoading(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #060608 0%, #0d0d15 50%, #060608 100%)" }}
    >
      {/* Background glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
        <div className="absolute bottom-1/3 left-1/4 h-48 w-48 rounded-full opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div
          className="rounded-3xl border border-white/8 p-7 shadow-2xl"
          style={{ background: "rgba(15,15,22,0.95)", backdropFilter: "blur(20px)" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="relative mb-5"
            >
              <div className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
              <img
                src={supermanLogo}
                alt="Superman Toss Book"
                className="relative h-20 w-20 rounded-full object-cover border-2"
                style={{ borderColor: "#22d3ee40" }}
              />
            </motion.div>

            <h1 className="text-2xl font-extrabold text-white mb-1">
              Welcome <span style={{ color: "#22d3ee" }}>Back</span>
            </h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>Sign-in with your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold tracking-widest mb-2" style={{ color: "#9ca3af" }}>
                USERNAME
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#6b7280" }}
                />
                <input
                  type="text"
                  placeholder="CRICKET_FAN_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm font-semibold text-white placeholder:font-normal placeholder:text-gray-600 outline-none transition-all"
                  style={{
                    background: "#1a1a2a",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#22d3ee50")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold tracking-widest" style={{ color: "#9ca3af" }}>
                  PASSWORD
                </label>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold tracking-wider hover:opacity-80 transition-opacity"
                  style={{ color: "#22d3ee" }}
                >
                  FORGOT ACCESS?
                </a>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#6b7280" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-gray-600 outline-none transition-all"
                  style={{
                    background: "#1a1a2a",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#22d3ee50")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                  style={{ color: "#6b7280" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl py-3.5 text-sm font-extrabold text-white tracking-wide shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-5"
              style={{
                background: loading
                  ? "linear-gradient(135deg, #0e7490, #0284c7)"
                  : "linear-gradient(135deg, #06b6d4, #0284c7)",
                boxShadow: loading ? "none" : "0 0 24px rgba(6,182,212,0.4)",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Logging in...
                </span>
              ) : (
                <><LogIn className="h-4 w-4" /> Login to Account</>
              )}
            </motion.button>
          </form>

          {/* Demo login */}
          <motion.button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-3 rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: "transparent",
              border: "1.5px solid #22d3ee50",
              color: "#22d3ee",
            }}
          >
            {demoLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Sign in with Demo ID
          </motion.button>

          {/* Contact for new ID */}
          <div className="mt-6 text-center">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: "#4b5563" }}>
              CONTACT US FOR NEW ID
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ background: "#1a1a2a", border: "1.5px solid #22d3ee40" }}
                title="Telegram"
              >
                <MessageCircle className="h-4 w-4" style={{ color: "#22d3ee" }} />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ background: "#1a1a2a", border: "1.5px solid rgba(255,255,255,0.08)" }}
                title="Message"
              >
                <Send className="h-4 w-4" style={{ color: "#6b7280" }} />
              </a>
              <a
                href="/rules"
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ background: "#1a1a2a", border: "1.5px solid rgba(255,255,255,0.08)" }}
                title="Rules"
              >
                <HelpCircle className="h-4 w-4" style={{ color: "#6b7280" }} />
              </a>
            </div>
          </div>
        </div>

        {/* Subtle footer */}
        <p className="text-center text-xs mt-4" style={{ color: "#374151" }}>
          Superman Toss Book © 2026
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
