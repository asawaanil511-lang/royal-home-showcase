import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import lawrenceLogo from "@/assets/lawrence-logo.jpg";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🎉 Account created!", description: "Welcome to Lawrence Toss Book! Start playing now." });
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-card">
        <div className="mb-6 text-center">
          <img src={lawrenceLogo} alt="Lawrence Toss Book" className="mx-auto mb-3 h-12 w-12 rounded-xl object-cover" />
          <h1 className="text-2xl font-extrabold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join Lawrence Toss Book and start winning</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              maxLength={30}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full gap-2 font-semibold" size="lg" disabled={loading}>
            {loading ? "Creating account..." : <>Register <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
