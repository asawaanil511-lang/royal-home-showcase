import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";

type Bet = {
  id: string;
  match_id: string;
  team_picked: string;
  amount: number;
  odds_at_bet: number;
  potential_win: number;
  result: string;
  created_at: string;
};

const MyBets = () => {
  const { user } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchBets = async () => {
      const { data } = await supabase
        .from("bets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBets((data as Bet[]) || []);
      setLoading(false);
    };
    fetchBets();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Receipt className="h-16 w-16 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Login to view bets</h2>
          <Button className="gradient-neon-primary text-primary-foreground" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-extrabold text-foreground mb-8">My Bets</h1>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        ) : bets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">You haven't placed any bets yet.</p>
            <Button className="gradient-neon-primary text-primary-foreground shadow-neon" asChild>
              <Link to="/matches">Browse Matches</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-card"
              >
                <div>
                  <p className="font-semibold text-card-foreground">
                    Team {bet.team_picked} • {bet.odds_at_bet}x
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(bet.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">₹{bet.amount.toLocaleString()}</p>
                  <p
                    className={`text-xs font-semibold ${
                      bet.result === "won"
                        ? "text-primary"
                        : bet.result === "lost"
                        ? "text-destructive"
                        : "text-accent"
                    }`}
                  >
                    {bet.result === "pending" ? "Pending" : bet.result === "won" ? `Won ₹${bet.potential_win}` : "Lost"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default MyBets;
