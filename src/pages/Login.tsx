import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import betwicLogo from "@/assets/betwic-logo.jpg";
import cricketGround from "@assets/images_1774996491972.jpeg";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, MessageCircle, HelpCircle, Zap, Shield } from "lucide-react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

const TELEGRAM_URL = "https://t.me/Lawrenceboss";

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
      toast({ title: "Welcome! 🏆", description: `Logged in as ${username}` });
      navigate("/matches", { replace: true });
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const response = await fetch("/api/demo-login", { method: "POST" });
      const res = await response.json();
      if (!response.ok || res.error) {
        toast({ title: "Demo unavailable", description: res.error || "Try again later", variant: "destructive" });
        setDemoLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: res.email, password: res.password });
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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 overflow-hidden">
      {/* ── Cricket ground background ── */}
      <div className="absolute inset-0">
        <img
          src={cricketGround}
          alt="Cricket Ground"
          className="h-full w-full object-cover object-center"
        />
        {/* Light overlay — ground stays clearly visible */}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
      </div>

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xs z-10"
      >
        <div className="rounded-3xl border border-white/25 bg-white/88 dark:bg-zinc-900/90 backdrop-blur-2xl p-5 shadow-2xl">

          {/* ── Logo + Brand ── */}
          <div className="flex flex-col items-center mb-4">
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-3 flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-widest text-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {liveStats.matches} LIVE · {liveStats.players} PLAYERS ONLINE
            </motion.div>

            {/* Logo */}
            <div className="relative mb-3">
              <motion.div
                className="absolute rounded-full border-2 border-dashed border-primary/30"
                style={{ inset: -6 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute rounded-full bg-primary/10"
                style={{ inset: -3 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.img
                animate={logoControls}
                src={betwicLogo}
                alt="Betwic Toss Book"
                className="relative h-16 w-16 rounded-full object-cover border-2 border-primary/50 shadow-lg"
              />
            </div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h1 className="text-2xl font-extrabold tracking-tight leading-none mb-0.5 text-foreground">
                BETWIC{" "}
                <span className="text-primary">TOSS BOOK</span>
              </h1>
              <p className="text-[10px] tracking-[0.25em] font-semibold text-muted-foreground">
                ESTD 2019 · THE ORIGINAL BRAND
              </p>
            </motion.div>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">SIGN IN</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Username */}
            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] mb-1.5 text-muted-foreground">
                USERNAME
              </label>
              <div className={`relative rounded-xl border transition-all ${focusedField === "user" ? "border-primary ring-2 ring-primary/20" : "border-border"} bg-background`}>
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focusedField === "user" ? "text-primary" : "text-muted-foreground"}`} />
                <input
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("user")}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="username"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
                  PASSWORD
                </label>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold tracking-[0.1em] text-amber-600 hover:text-amber-700 transition-colors"
                >
                  FORGOT ACCESS?
                </a>
              </div>
              <div className={`relative rounded-xl border transition-all ${focusedField === "pass" ? "border-primary ring-2 ring-primary/20" : "border-border"} bg-background`}>
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${focusedField === "pass" ? "text-primary" : "text-muted-foreground"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("pass")}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="current-password"
                  className="w-full rounded-xl pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="w-full rounded-xl py-3.5 text-sm font-extrabold text-primary-foreground tracking-wide mt-1 disabled:opacity-60 gradient-neon-primary shadow-neon flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  LOGIN TO ACCOUNT
                </>
              )}
            </motion.button>
          </form>

          {/* Demo button */}
          <motion.button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            className="w-full mt-3 rounded-xl py-3 text-sm font-bold tracking-wide disabled:opacity-60 flex items-center justify-center gap-2 transition-all border border-amber-500/40 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
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

          {/* ── Footer ── */}
          <div className="mt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">NEED AN ACCOUNT?</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex items-center justify-center gap-3">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all border border-primary/30 bg-primary/8 text-primary hover:bg-primary/15"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Contact on Telegram
              </a>
              <a
                href="/rules"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all border border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-primary"
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
          className="text-center text-[10px] mt-4 tracking-widest font-medium text-white/70"
        >
          BETWIC TOSS BOOK © 2026 · PLAY RESPONSIBLY
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
