import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import supermanLogo from "@/assets/superman-logo.jpg";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, MessageCircle, HelpCircle, Zap, Shield } from "lucide-react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

const TELEGRAM_URL = "https://t.me/shrey14a";

// Floating cricket particles for background
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 5 + 2,
  dur: Math.random() * 8 + 6,
  delay: Math.random() * 4,
  emoji: ["🏏", "🪙", "⚡", "🏆", "🎯"][Math.floor(Math.random() * 5)],
}));

// Animated background orb
const Orb = ({ style }: { style: React.CSSProperties }) => (
  <motion.div
    className="pointer-events-none absolute rounded-full"
    style={style}
    animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
  />
);

const Login = () => {
  const [username, setUsername] = useState(() => localStorage.getItem("stb_remember_user") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"user" | "pass" | null>(null);
  const [liveStats] = useState({
    matches: Math.floor(Math.random() * 8) + 2,
    players: Math.floor(Math.random() * 200) + 50,
  });
  const logoControls = useAnimation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    const loop = async () => {
      while (true) {
        await logoControls.start({ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1], transition: { duration: 3 } });
        await new Promise((r) => setTimeout(r, 4000));
      }
    };
    loop();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Fill in both fields", variant: "destructive" });
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
        toast({ title: "Wrong password", description: "Check your credentials", variant: "destructive" });
        setLoading(false);
        return;
      }
      localStorage.setItem("stb_remember_user", username);
      toast({ title: "Welcome to the Arena! 🏆", description: `Logged in as ${username}` });
      navigate("/matches", { replace: true });
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      // Auto-creates demo account if needed, resets wallet to 5 coins
      const response = await fetch("/api/demo-login", { method: "POST" });
      const res = await response.json();
      if (!response.ok || res.error) {
        toast({ title: "Demo unavailable", description: res.error || "Try again later", variant: "destructive" });
        setDemoLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: res.email,
        password: res.password,
      });
      if (error) {
        toast({ title: "Demo login failed", description: error.message, variant: "destructive" });
        setDemoLoading(false);
        return;
      }
      toast({ title: "Demo mode active ⚡", description: "You have ₹5 coins to explore!" });
      navigate("/matches", { replace: true });
    } catch {
      toast({ title: "Demo unavailable", variant: "destructive" });
    }
    setDemoLoading(false);
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-10 overflow-hidden"
      style={{ background: "hsl(230 25% 5%)" }}
    >
      {/* ── Animated background layer ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(160 100% 45%) 1px, transparent 1px), linear-gradient(90deg, hsl(160 100% 45%) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Neon green glow — bottom left */}
        <Orb style={{
          bottom: "-10%", left: "-10%", width: 420, height: 420,
          background: "radial-gradient(circle, hsl(160 100% 45%), transparent 70%)",
        }} />
        {/* Gold glow — top right */}
        <Orb style={{
          top: "-5%", right: "-10%", width: 320, height: 320,
          background: "radial-gradient(circle, hsl(45 100% 55%), transparent 70%)",
        }} />
        {/* Cyan faint — center */}
        <Orb style={{
          top: "40%", left: "40%", width: 200, height: 200,
          background: "radial-gradient(circle, hsl(185 100% 50%), transparent 70%)",
        }} />

        {/* Floating emoji particles */}
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute text-xs select-none"
            style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size + 8, opacity: 0 }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.12, 0],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm z-10"
      >
        <div
          className="rounded-3xl border p-7 shadow-2xl"
          style={{
            background: "linear-gradient(135deg, hsl(230 20% 10%), hsl(230 20% 13%))",
            borderColor: "hsl(160 100% 45% / 0.2)",
            boxShadow: "0 0 60px hsl(160 100% 45% / 0.08), 0 25px 50px hsl(0 0% 0% / 0.6)",
          }}
        >

          {/* ── Logo + Brand ── */}
          <div className="flex flex-col items-center mb-7">
            {/* Live badge above logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4 flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest"
              style={{
                borderColor: "hsl(160 100% 45% / 0.3)",
                background: "hsl(160 100% 45% / 0.08)",
                color: "hsl(160 100% 45%)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {liveStats.matches} LIVE · {liveStats.players} PLAYERS ONLINE
            </motion.div>

            {/* Logo with rings */}
            <div className="relative mb-5">
              {/* Rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed"
                style={{ borderColor: "hsl(160 100% 45% / 0.3)", margin: -8 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
              {/* Pulse ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: -4,
                  background: "hsl(160 100% 45% / 0.15)",
                  borderRadius: "50%",
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.img
                animate={logoControls}
                src={supermanLogo}
                alt="STB"
                className="relative h-20 w-20 rounded-full object-cover"
                style={{ border: "2.5px solid hsl(160 100% 45% / 0.5)" }}
              />
            </div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h1
                className="text-3xl font-extrabold tracking-tight leading-none mb-1"
                style={{ fontFamily: "Rajdhani, sans-serif", color: "hsl(210 40% 95%)" }}
              >
                SUPERMAN{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, hsl(160 100% 45%), hsl(185 100% 50%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  TOSS BOOK
                </span>
              </h1>
              <p className="text-xs tracking-[0.2em] font-medium" style={{ color: "hsl(220 15% 45%)" }}>
                A NEW EXPERIENCE
              </p>
            </motion.div>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "hsl(230 15% 20%)" }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: "hsl(220 15% 35%)" }}>
              SIGN IN
            </span>
            <div className="flex-1 h-px" style={{ background: "hsl(230 15% 20%)" }} />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label
                className="block text-[10px] font-bold tracking-[0.2em] mb-2"
                style={{ color: "hsl(220 15% 50%)" }}
              >
                USERNAME
              </label>
              <motion.div
                animate={{
                  boxShadow: focusedField === "user"
                    ? "0 0 0 2px hsl(160 100% 45% / 0.4), 0 0 16px hsl(160 100% 45% / 0.15)"
                    : "0 0 0 1.5px hsl(230 15% 20%)",
                }}
                className="relative rounded-xl transition-all"
              >
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: focusedField === "user" ? "hsl(160 100% 45%)" : "hsl(220 15% 40%)" }}
                />
                <input
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("user")}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="username"
                  className="w-full rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-white placeholder:text-gray-600 outline-none"
                  style={{ background: "hsl(230 18% 8%)" }}
                />
              </motion.div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-[10px] font-bold tracking-[0.2em]"
                  style={{ color: "hsl(220 15% 50%)" }}
                >
                  PASSWORD
                </label>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold tracking-[0.15em] transition-opacity hover:opacity-70"
                  style={{ color: "hsl(45 100% 55%)" }}
                >
                  FORGOT ACCESS?
                </a>
              </div>
              <motion.div
                animate={{
                  boxShadow: focusedField === "pass"
                    ? "0 0 0 2px hsl(160 100% 45% / 0.4), 0 0 16px hsl(160 100% 45% / 0.15)"
                    : "0 0 0 1.5px hsl(230 15% 20%)",
                }}
                className="relative rounded-xl"
              >
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: focusedField === "pass" ? "hsl(160 100% 45%)" : "hsl(220 15% 40%)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("pass")}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="current-password"
                  className="w-full rounded-xl pl-10 pr-12 py-3.5 text-sm text-white placeholder:text-gray-600 outline-none"
                  style={{ background: "hsl(230 18% 8%)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-all"
                  style={{ color: "hsl(220 15% 40%)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(160 100% 45%)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(220 15% 40%)")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </motion.div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full rounded-xl py-3.5 text-sm font-extrabold text-foreground tracking-wide overflow-hidden mt-2 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, hsl(160 100% 45%), hsl(185 100% 50%))",
                boxShadow: loading ? "none" : "0 0 28px hsl(160 100% 45% / 0.45), 0 4px 16px hsl(0 0% 0% / 0.3)",
                color: "hsl(230 25% 7%)",
              }}
            >
              {/* Shimmer overlay */}
              {!loading && (
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    left: "-100%",
                  }}
                  animate={{ left: ["−100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    LOGIN TO ACCOUNT
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Demo button */}
          <motion.button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full mt-3 rounded-xl py-3 text-sm font-bold tracking-wide overflow-hidden disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
            style={{
              background: "hsl(230 18% 8%)",
              border: "1.5px solid hsl(45 100% 55% / 0.3)",
              color: "hsl(45 100% 55%)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(45 100% 55% / 0.6)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px hsl(45 100% 55% / 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(45 100% 55% / 0.3)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {demoLoading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Sign in with Demo ID
              </>
            )}
          </motion.button>

          {/* ── Contact footer ── */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "hsl(230 15% 18%)" }} />
              <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "hsl(220 15% 35%)" }}>
                NEED AN ACCOUNT?
              </span>
              <div className="flex-1 h-px" style={{ background: "hsl(230 15% 18%)" }} />
            </div>

            <div className="flex items-center justify-center gap-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all"
                style={{
                  background: "hsl(160 100% 45% / 0.08)",
                  border: "1.5px solid hsl(160 100% 45% / 0.2)",
                  color: "hsl(160 100% 45%)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "hsl(160 100% 45% / 0.15)";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 16px hsl(160 100% 45% / 0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "hsl(160 100% 45% / 0.08)";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Contact on Telegram
              </a>
              <a
                href="/rules"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                style={{
                  background: "hsl(230 18% 8%)",
                  border: "1.5px solid hsl(230 15% 20%)",
                  color: "hsl(220 15% 45%)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "hsl(160 100% 45% / 0.3)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "hsl(160 100% 45%)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "hsl(230 15% 20%)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "hsl(220 15% 45%)";
                }}
                title="Game Rules"
              >
                <HelpCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom tag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[10px] mt-4 tracking-widest font-medium"
          style={{ color: "hsl(220 15% 28%)" }}
        >
          SUPERMAN TOSS BOOK © 2026 · PLAY RESPONSIBLY
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
