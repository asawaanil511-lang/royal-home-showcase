import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Coins, TrendingUp, Activity, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";

type Stats = {
  totalUsers: number;
  totalMatches: number;
  totalBets: number;
  totalBetVolume: number;
  liveMatches: number;
  pendingBets: number;
  totalWinnings: number;
  totalPlatformRevenue: number;
  todayBets: number;
  todayVolume: number;
};

type RecentActivity = {
  id: string;
  type: "bet" | "match" | "user";
  description: string;
  amount?: number;
  time: string;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalMatches: 0, totalBets: 0,
    totalBetVolume: 0, liveMatches: 0, pendingBets: 0,
    totalWinnings: 0, totalPlatformRevenue: 0,
    todayBets: 0, todayVolume: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topBettors, setTopBettors] = useState<{ username: string; total: number; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [users, matches, bets, profiles] = await Promise.all([
        (supabase as any).from("profiles").select("id, created_at", { count: "exact" }),
        (supabase as any).from("matches").select("id, status, team_a_name, team_b_name, created_at"),
        (supabase as any).from("bets").select("id, amount, result, potential_win, user_id, match_id, created_at, team_picked"),
        supabase.from("profiles").select("user_id, username, wallet_balance"),
      ]);

      const betsArr = bets.data || [];
      const matchesArr = matches.data || [];
      const profilesArr = profiles.data || [];

      const liveMatches = matchesArr.filter((m: any) => m.status === "live").length;
      const pendingBets = betsArr.filter((b: any) => b.result === "pending").length;
      const totalBetVolume = betsArr.reduce((s: number, b: any) => s + Number(b.amount || 0), 0);
      const totalWinnings = betsArr.filter((b: any) => b.result === "won").reduce((s: number, b: any) => s + Number(b.potential_win || 0), 0);
      const todayBets = betsArr.filter((b: any) => new Date(b.created_at) >= today);
      const todayVolume = todayBets.reduce((s: number, b: any) => s + Number(b.amount || 0), 0);

      setStats({
        totalUsers: users.count || (users.data || []).length,
        totalMatches: matchesArr.length,
        totalBets: betsArr.length,
        totalBetVolume,
        liveMatches,
        pendingBets,
        totalWinnings,
        totalPlatformRevenue: totalBetVolume - totalWinnings,
        todayBets: todayBets.length,
        todayVolume,
      });

      // Recent activity
      const profileMap = new Map(profilesArr.map((p: any) => [p.user_id, p.username || "Unknown"]));
      const matchMap = new Map(matchesArr.map((m: any) => [m.id, `${m.team_a_name} vs ${m.team_b_name}`]));

      const activities: RecentActivity[] = [];
      betsArr.slice(0, 8).forEach((b: any) => {
        activities.push({
          id: b.id,
          type: "bet",
          description: `${profileMap.get(b.user_id) || "User"} bet on ${matchMap.get(b.match_id) || "Match"} (Team ${b.team_picked})`,
          amount: Number(b.amount),
          time: b.created_at,
        });
      });
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 10));

      // Top bettors
      const bettorMap = new Map<string, { total: number; count: number }>();
      betsArr.forEach((b: any) => {
        const existing = bettorMap.get(b.user_id) || { total: 0, count: 0 };
        existing.total += Number(b.amount || 0);
        existing.count += 1;
        bettorMap.set(b.user_id, existing);
      });
      const top = Array.from(bettorMap.entries())
        .map(([uid, data]) => ({ username: profileMap.get(uid) || uid.slice(0, 8), ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setTopBettors(top);
    };
    load();
  }, []);

  const mainCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Matches", value: stats.totalMatches, icon: Trophy, color: "text-accent", bg: "bg-accent/10" },
    { label: "Total Bets", value: stats.totalBets, icon: TrendingUp, color: "text-[hsl(var(--neon-cyan))]", bg: "bg-[hsl(var(--neon-cyan))]/10" },
    { label: "Bet Volume", value: `₹${stats.totalBetVolume.toLocaleString()}`, icon: Coins, color: "text-[hsl(var(--neon-gold))]", bg: "bg-[hsl(var(--neon-gold))]/10" },
    { label: "Live Matches", value: stats.liveMatches, icon: Activity, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Pending Bets", value: stats.pendingBets, icon: Clock, color: "text-[hsl(var(--neon-purple))]", bg: "bg-[hsl(var(--neon-purple))]/10" },
  ];

  const secondaryCards = [
    { label: "Total Winnings Paid", value: `₹${stats.totalWinnings.toLocaleString()}`, icon: ArrowUpRight, color: "text-primary", trend: "paid out" },
    { label: "Platform Revenue", value: `₹${stats.totalPlatformRevenue.toLocaleString()}`, icon: ArrowDownRight, color: "text-accent", trend: "volume - winnings" },
    { label: "Today's Bets", value: stats.todayBets, icon: TrendingUp, color: "text-[hsl(var(--neon-cyan))]", trend: `₹${stats.todayVolume.toLocaleString()} volume` },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mainCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/50 bg-card shadow-card hover:glow-border transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <div className={`${c.bg} p-2 rounded-lg`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {secondaryCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Card className="border-border/50 bg-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.trend}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/50 bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
              {recentActivity.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.03 }}
                  className="flex items-start gap-3 rounded-lg border border-border/30 bg-secondary/30 p-3"
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    a.type === "bet" ? "bg-primary/10" : a.type === "match" ? "bg-accent/10" : "bg-[hsl(var(--neon-cyan))]/10"
                  }`}>
                    {a.type === "bet" ? <Coins className="h-3.5 w-3.5 text-primary" /> : 
                     a.type === "match" ? <Trophy className="h-3.5 w-3.5 text-accent" /> :
                     <Users className="h-3.5 w-3.5 text-[hsl(var(--neon-cyan))]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug truncate">{a.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{new Date(a.time).toLocaleString()}</span>
                      {a.amount && <span className="text-[10px] font-semibold text-primary">₹{a.amount.toLocaleString()}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Bettors */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-border/50 bg-card shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" /> Top Bettors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topBettors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No bets yet</p>
              )}
              {topBettors.map((b, i) => (
                <motion.div
                  key={b.username}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                      i === 0 ? "bg-[hsl(var(--neon-gold))]/20 text-[hsl(var(--neon-gold))]" :
                      i === 1 ? "bg-muted text-muted-foreground" :
                      i === 2 ? "bg-accent/10 text-accent" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.username}</p>
                      <p className="text-[10px] text-muted-foreground">{b.count} bets placed</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">₹{b.total.toLocaleString()}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
