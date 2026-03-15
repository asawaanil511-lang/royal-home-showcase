import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";

type ClosedMatch = {
  id: string;
  team_a_name: string;
  team_b_name: string;
  team_a_logo: string | null;
  team_b_logo: string | null;
  odds_a: number;
  odds_b: number;
  match_date: string;
  winner: string | null;
};

const Results = () => {
  const [matches, setMatches] = useState<ClosedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from("matches")
        .select("*")
        .eq("status", "closed")
        .order("match_date", { ascending: false });
      setMatches((data as ClosedMatch[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-foreground">
            Match <span className="text-neon">Results</span>
          </h1>
          <p className="text-muted-foreground mt-2">Completed matches and outcomes</p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : matches.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No completed matches yet.</p>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {matches.map((m) => (
              <div key={m.id} className="rounded-xl border border-border/50 bg-card p-5 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.match_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <CheckCircle className="h-3 w-3" /> Settled
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className={`font-bold ${m.winner === "A" ? "text-primary" : "text-muted-foreground"}`}>
                      {m.team_a_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.odds_a}x</p>
                  </div>
                  <span className="text-muted-foreground font-bold mx-4">vs</span>
                  <div className="text-center flex-1">
                    <p className={`font-bold ${m.winner === "B" ? "text-primary" : "text-muted-foreground"}`}>
                      {m.team_b_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.odds_b}x</p>
                  </div>
                </div>
                {m.winner && (
                  <p className="mt-3 text-center text-sm font-semibold text-primary">
                    🏆 Winner: {m.winner === "A" ? m.team_a_name : m.team_b_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Results;
