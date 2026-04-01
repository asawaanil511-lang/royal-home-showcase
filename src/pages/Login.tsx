import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { apiUrl } from "@/lib/api";
import betwicLogo from "@/assets/betwic-logo.jpg";
import cricketGround from "@assets/images_1774996491972.jpeg";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, HelpCircle, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TELEGRAM_URL = "https://t.me/Bittubhaji";
const WHATSAPP_URL = "https://wa.me/917668700467?text=I%20need%20toss%20id";

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
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Fill in both fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/login-by-username"), {
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
      const response = await fetch(apiUrl("/api/demo-login"), { method: "POST" });
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
        <div className="rounded-3xl border border-white/25 bg-white/88 dark:bg-zinc-900/90 backdrop-blur-2xl p-4 shadow-2xl">

          {/* ── Logo + Brand ── */}
          <div className="flex flex-col items-center mb-3">
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-2 flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-widest text-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {liveStats.matches} LIVE · {liveStats.players} PLAYERS ONLINE
            </motion.div>

            {/* Logo */}
            <div className="relative mb-2">
              <motion.div
                className="absolute rounded-full border-2 border-dashed border-primary/30"
                style={{ inset: -5 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute rounded-full bg-primary/10"
                style={{ inset: -2 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.img
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                src={betwicLogo}
                alt="Betwic Toss Book"
                className="relative h-12 w-12 rounded-full object-cover border-2 border-primary/50 shadow-lg"
              />
            </div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h1 className="text-xl font-extrabold tracking-tight leading-none mb-0.5 text-foreground">
                BETWIC{" "}
                <span className="text-primary">TOSS BOOK</span>
              </h1>
              <p className="text-[10px] tracking-[0.25em] font-semibold text-muted-foreground">
                ESTD 2019 · THE ORIGINAL BRAND
              </p>
            </motion.div>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">SIGN IN</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleLogin} className="space-y-3">
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
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 bg-transparent outline-none"
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
                  className="w-full rounded-xl pl-10 pr-12 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 bg-transparent outline-none"
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
              className="w-full rounded-xl py-2.5 text-sm font-extrabold text-primary-foreground tracking-wide mt-1 disabled:opacity-60 gradient-neon-primary shadow-neon flex items-center justify-center gap-2"
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
            className="w-full mt-2 rounded-xl py-2.5 text-sm font-bold tracking-wide disabled:opacity-60 flex items-center justify-center gap-2 transition-all border border-amber-500/40 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
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
          <div className="mt-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">NEED AN ACCOUNT?</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 w-full">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-white transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #229ED9, #1a85bb)" }}
                >
                  <TelegramIcon className="h-3.5 w-3.5 shrink-0" />
                  Contact on Telegram
                </a>
                <a
                  href="/rules"
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-all border border-border bg-secondary text-muted-foreground hover:border-primary/40 hover:text-primary shrink-0"
                  title="Game Rules"
                >
                  <HelpCircle className="h-4 w-4" />
                </a>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #25D366, #1da851)" }}
              >
                <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
                Contact on WhatsApp
              </a>

              {/* Withdrawal Proof */}
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground">PROOF</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <a
                href="https://t.me/BETWIC_ONLINE_HUBE"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                <TelegramIcon className="h-3.5 w-3.5 shrink-0" />
                WITHDRAWAL PROOF
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
