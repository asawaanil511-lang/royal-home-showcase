import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import supermanLogo from "@/assets/superman-logo.jpg";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState(() => localStorage.getItem("stb_remember_user") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("stb_remember_user"));
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Look up email from username via API
      const response = await fetch("/api/login-by-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const res = await response.json();

      if (!response.ok || res.error) {
        toast({ title: "Login failed", description: res.error || "Unknown error", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { email } = res;
      if (!email) {
        toast({ title: "Login failed", description: "User not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Step 2: Sign in directly on the client with the resolved email
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        toast({ title: "Login failed", description: "Invalid username or password", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Remember me
      if (rememberMe) {
        localStorage.setItem("stb_remember_user", username);
      } else {
        localStorage.removeItem("stb_remember_user");
      }

      toast({ title: "Welcome back! 🎉" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-card">
        <div className="mb-6 text-center">
          <img src={supermanLogo} alt="Superman Toss Book" className="mx-auto mb-3 h-14 w-14 rounded-full object-cover" />
          <h1 className="text-2xl font-extrabold text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Login to your Superman Toss Book account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Remember me
            </label>
          </div>

          <Button type="submit" className="w-full gap-2 font-semibold" size="lg" disabled={loading}>
            {loading ? "Logging in..." : <>Login <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a href="https://t.me/shrey14a" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
            Register via Telegram
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
