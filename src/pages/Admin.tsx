import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, CheckCircle, Trash2 } from "lucide-react";

type DBMatch = {
  id: string;
  team_a_name: string;
  team_b_name: string;
  odds_a: number;
  odds_b: number;
  max_bet: number;
  match_date: string;
  status: string;
  winner: string | null;
};

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<DBMatch[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [oddsA, setOddsA] = useState("1.90");
  const [oddsB, setOddsB] = useState("1.90");
  const [matchDate, setMatchDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const checkRole = async () => {
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
      setLoading(false);
      fetchMatches();
    };
    checkRole();
  }, [user]);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false });
    setMatches((data as DBMatch[]) || []);
  };

  const handleCreate = async () => {
    if (!teamA || !teamB || !matchDate) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    await supabase.from("matches").insert({
      team_a_name: teamA,
      team_b_name: teamB,
      odds_a: Number(oddsA),
      odds_b: Number(oddsB),
      match_date: new Date(matchDate).toISOString(),
      status: "upcoming",
    });
    setSaving(false);
    setShowForm(false);
    setTeamA(""); setTeamB(""); setOddsA("1.90"); setOddsB("1.90"); setMatchDate("");
    toast({ title: "✅ Match created!" });
    fetchMatches();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("matches").update({ status }).eq("id", id);
    toast({ title: `Match set to ${status}` });
    fetchMatches();
  };

  const handleSetWinner = async (id: string, winner: string) => {
    // Set winner and close match
    await supabase.from("matches").update({ winner, status: "closed" }).eq("id", id);

    // Settle bets
    const { data: bets } = await supabase.from("bets").select("*").eq("match_id", id).eq("result", "pending");
    if (bets) {
      for (const bet of bets) {
        const won = bet.team_picked === winner;
        await supabase.from("bets").update({
          result: won ? "won" : "lost",
          settled_at: new Date().toISOString(),
        }).eq("id", bet.id);

        if (won) {
          // Add winnings to wallet
          const { data: profile } = await supabase
            .from("profiles")
            .select("wallet_balance")
            .eq("user_id", bet.user_id)
            .single();
          if (profile) {
            await supabase.from("profiles").update({
              wallet_balance: profile.wallet_balance + bet.potential_win,
            }).eq("user_id", bet.user_id);
          }
        }
      }
    }
    toast({ title: "🏆 Match settled! Bets resolved." });
    fetchMatches();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("matches").delete().eq("id", id);
    toast({ title: "Match deleted" });
    fetchMatches();
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" /> Admin Panel
          </h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gradient-neon-primary text-primary-foreground shadow-neon"
          >
            <Plus className="h-4 w-4 mr-1" /> New Match
          </Button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="rounded-2xl border border-primary/30 bg-card p-6 mb-8 glow-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Create Match</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Team A name" value={teamA} onChange={(e) => setTeamA(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Team B name" value={teamB} onChange={(e) => setTeamB(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Odds A" type="number" step="0.05" value={oddsA} onChange={(e) => setOddsA(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Odds B" type="number" step="0.05" value={oddsB} onChange={(e) => setOddsB(e.target.value)} className="bg-secondary border-border" />
              <Input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="bg-secondary border-border sm:col-span-2" />
            </div>
            <Button onClick={handleCreate} disabled={saving} className="mt-4 gradient-neon-primary text-primary-foreground">
              {saving ? "Creating..." : "Create Match"}
            </Button>
          </div>
        )}

        {/* Matches list */}
        <div className="space-y-3">
          {matches.map((m) => (
            <div key={m.id} className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-foreground">{m.team_a_name} vs {m.team_b_name}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  m.status === "live" ? "bg-primary/10 text-primary" :
                  m.status === "closed" ? "bg-destructive/10 text-destructive" :
                  "bg-accent/10 text-accent"
                }`}>
                  {m.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {new Date(m.match_date).toLocaleString()} • Odds: {m.odds_a}x / {m.odds_b}x
                {m.winner && ` • Winner: Team ${m.winner}`}
              </p>
              <div className="flex flex-wrap gap-2">
                {m.status !== "live" && m.status !== "closed" && (
                  <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary" onClick={() => handleStatusChange(m.id, "live")}>
                    Go Live
                  </Button>
                )}
                {m.status === "live" && !m.winner && (
                  <>
                    <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary" onClick={() => handleSetWinner(m.id, "A")}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Team A Wins
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary" onClick={() => handleSetWinner(m.id, "B")}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Team B Wins
                    </Button>
                  </>
                )}
                {m.status !== "closed" && (
                  <Button size="sm" variant="outline" className="text-xs border-destructive/30 text-destructive" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
          {matches.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No matches yet. Create one above!</p>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Admin;
