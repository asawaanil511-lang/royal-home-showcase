import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Coins, TrendingUp } from "lucide-react";

type Stats = {
  totalUsers: number;
  totalMatches: number;
  totalBets: number;
  totalBetVolume: number;
  liveMatches: number;
  pendingBets: number;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalMatches: 0, totalBets: 0,
    totalBetVolume: 0, liveMatches: 0, pendingBets: 0,
  });

  useEffect(() => {
    const load = async () => {
      const [users, matches, bets] = await Promise.all([
        (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
        (supabase as any).from("matches").select("id, status", { count: "exact" }),
        (supabase as any).from("bets").select("id, amount, result", { count: "exact" }),
      ]);

      const liveMatches = (matches.data || []).filter((m: any) => m.status === "live").length;
      const pendingBets = (bets.data || []).filter((b: any) => b.result === "pending").length;
      const totalBetVolume = (bets.data || []).reduce((s: number, b: any) => s + Number(b.amount || 0), 0);

      setStats({
        totalUsers: users.count || 0,
        totalMatches: matches.count || (matches.data || []).length,
        totalBets: bets.count || (bets.data || []).length,
        totalBetVolume,
        liveMatches,
        pendingBets,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Matches", value: stats.totalMatches, icon: Trophy, color: "text-accent" },
    { label: "Total Bets", value: stats.totalBets, icon: TrendingUp, color: "text-[hsl(var(--neon-cyan))]" },
    { label: "Bet Volume", value: `₹${stats.totalBetVolume.toLocaleString()}`, icon: Coins, color: "text-[hsl(var(--neon-gold))]" },
    { label: "Live Matches", value: stats.liveMatches, icon: Trophy, color: "text-destructive" },
    { label: "Pending Bets", value: stats.pendingBets, icon: TrendingUp, color: "text-[hsl(var(--neon-purple))]" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label} className="border-border/50 bg-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <c.icon className={`h-5 w-5 ${c.color}`} />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminDashboard;
