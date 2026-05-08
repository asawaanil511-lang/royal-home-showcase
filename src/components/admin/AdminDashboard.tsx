import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, Trophy, Coins, TrendingUp, Activity, Clock,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, Trash2, AlertTriangle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

type Stats = {
  totalUsers: number; totalMatches: number; totalBets: number;
  totalBetVolume: number; liveMatches: number; pendingBets: number;
  totalWinnings: number; totalPlatformRevenue: number;
  todayBets: number; todayVolume: number; exposure: number;
};

type ActivityItem = { id: string; description: string; amount?: number; time: string };
type DailyVolume = { day: string; volume: number; bets: number };

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-secondary/60 ${className}`} />
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-foreground mb-1">{label}</p>
      <p className="text-xs text-primary">₹{Number(payload[0]?.value || 0).toLocaleString()} volume</p>
      <p className="text-xs text-muted-foreground">{payload[1]?.value || 0} bets</p>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [topBettors, setTopBettors] = useState<{ username: string; total: number; count: number; winRate: number }[]>([]);
  const [dailyVolume, setDailyVolume] = useState<DailyVolume[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setRefreshing(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);

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
    const exposure = betsArr.filter((b: any) => b.result === "pending").reduce((s: number, b: any) => s + Number(b.potential_win || 0), 0);

    setStats({
      totalUsers: users.count || (users.data || []).length,
      totalMatches: matchesArr.length, totalBets: betsArr.length, totalBetVolume,
      liveMatches, pendingBets, totalWinnings,
      totalPlatformRevenue: totalBetVolume - totalWinnings,
      todayBets: todayBets.length, todayVolume, exposure,
    });

    const days: DailyVolume[] = Array.from({ length: 7 }, (_, i) => {
      const d = startOfDay(subDays(new Date(), 6 - i));
      const next = startOfDay(subDays(new Date(), 5 - i));
      const dayBets = betsArr.filter((b: any) => {
        const t = new Date(b.created_at); return t >= d && t < next;
      });
      return {
        day: format(d, "EEE"),
        volume: dayBets.reduce((s: number, b: any) => s + Number(b.amount || 0), 0),
        bets: dayBets.length,
      };
    });
    setDailyVolume(days);

    const profileMap = new Map(profilesArr.map((p: any) => [p.user_id, p.username || "Unknown"]));
    const matchMap = new Map(matchesArr.map((m: any) => [m.id, `${m.team_a_name} vs ${m.team_b_name}`]));
    const activities: ActivityItem[] = betsArr
      .slice().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((b: any) => ({
        id: b.id,
        description: `${profileMap.get(b.user_id) || "User"} → ${matchMap.get(b.match_id) || "Match"} (Team ${b.team_picked})`,
        amount: Number(b.amount),
        time: b.created_at,
      }));
    setRecentActivity(activities);

    const bettorMap = new Map<string, { total: number; count: number; wins: number }>();
    betsArr.forEach((b: any) => {
      const e = bettorMap.get(b.user_id) || { total: 0, count: 0, wins: 0 };
      e.total += Number(b.amount || 0); e.count += 1;
      if (b.result === "won") e.wins += 1;
      bettorMap.set(b.user_id, e);
    });
    const top = Array.from(bettorMap.entries())
      .map(([uid, d]) => ({
        username: profileMap.get(uid) || uid.slice(0, 8),
        total: d.total, count: d.count,
        winRate: d.count ? Math.round((d.wins / d.count) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total).slice(0, 5);
    setTopBettors(top);

    setLastRefresh(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleResetStats = async () => {
    setResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch(apiUrl("/api/admin/reset-stats"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Reset failed", description: data.error || "Only the owner can reset stats.", variant: "destructive" });
      } else {
        toast({ title: "Stats Reset", description: "All bets and matches cleared." });
        await load();
      }
    } catch (e: any) {
      toast({ title: "Reset failed", description: e?.message, variant: "destructive" });
    } finally {
      setResetting(false);
      setShowResetDialog(false);
    }
  };

  const mainCards = stats ? [
    { label: "Players",         value: stats.totalUsers,                              icon: Users,      color: "text-primary",    bg: "bg-primary/10",    border: "border-primary/20",    sub: "registered users" },
    { label: "Total Matches",   value: stats.totalMatches,                            icon: Trophy,     color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/20",  sub: "all time" },
    { label: "Total Bets",      value: stats.totalBets,                               icon: TrendingUp, color: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/20",   sub: "all time" },
    { label: "Money Staked",    value: `₹${stats.totalBetVolume.toLocaleString()}`,   icon: Coins,      color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", sub: "total bet amount" },
    { label: "Live Now",        value: stats.liveMatches,                             icon: Activity,   color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20",    sub: "active matches" },
    { label: "Open Bets",       value: stats.pendingBets,                             icon: Clock,      color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", sub: "awaiting result" },
  ] : [];

  const secondaryCards = stats ? [
    { label: "Paid to Winners", value: `₹${stats.totalWinnings.toLocaleString()}`,        icon: ArrowUpRight,   color: "text-emerald-400", sub: "total given out to users" },
    { label: "House Profit",    value: `₹${stats.totalPlatformRevenue.toLocaleString()}`, icon: ArrowDownRight, color: "text-primary",      sub: "staked minus paid out" },
    { label: "Today",           value: stats.todayBets,                                   icon: TrendingUp,     color: "text-cyan-400",    sub: `₹${stats.todayVolume.toLocaleString()} staked today` },
    { label: "Exposure",        value: `₹${stats.exposure.toLocaleString()}`,             icon: AlertTriangle,  color: "text-orange-400",  sub: "max payout if all open bets win" },
  ] : [];

  const rankColors = [
    "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    "text-slate-300 bg-slate-300/10 border-slate-300/20",
    "text-amber-600 bg-amber-600/10 border-amber-600/20",
    "text-muted-foreground bg-secondary border-border/50",
    "text-muted-foreground bg-secondary border-border/50",
  ];

  return (
    <div className="space-y-5">
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" /> Reset All Stats?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong className="text-foreground">all bets, all matches, and the wallet ledger</strong>. User accounts and balances will remain.
              <br /><br />
              <span className="text-red-400 font-semibold">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetStats} disabled={resetting} className="bg-red-600 hover:bg-red-700 text-white">
              {resetting ? "Resetting…" : "Yes, Reset Everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last updated {lastRefresh.toLocaleTimeString()} · auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResetDialog(true)}
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/15 hover:border-red-500/50 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" /> Reset Stats
          </button>
          <button
            onClick={load} disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Main stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!stats
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-border/40 bg-card/60">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                  <Skeleton className="h-7 w-20" />
                </CardContent>
              </Card>
            ))
          : mainCards.map((c) => (
              <Card key={c.label} className={`border ${c.border} bg-card/60 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{c.label}</p>
                    <div className={`${c.bg} ${c.border} border rounded-lg p-2`}>
                      <c.icon className={`h-4 w-4 ${c.color}`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-extrabold ${c.color} tabular-nums`}>{c.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{(c as any).sub}</p>
                </CardContent>
              </Card>
            ))
        }
      </div>

      {/* Secondary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!stats
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border border-border/40 bg-card/60">
                <CardContent className="p-5 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-2.5 w-36" />
                </CardContent>
              </Card>
            ))
          : secondaryCards.map((c) => (
              <Card key={c.label} className="border border-border/40 bg-card/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <c.icon className={`h-4 w-4 ${c.color}`} />
                    <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                  </div>
                  <p className={`text-xl font-extrabold ${c.color} tabular-nums`}>{c.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{c.sub}</p>
                </CardContent>
              </Card>
            ))
        }
      </div>

      {/* Chart + Activity */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="border border-border/40 bg-card/60 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> 7-Day Bet Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!stats ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-[160px] w-full rounded-xl" />
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyVolume} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--primary)/0.06)" }} />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
                      <Bar dataKey="bets" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} opacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary opacity-85" /><span className="text-[11px] text-muted-foreground">Volume (₹)</span></div>
                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent opacity-60" /><span className="text-[11px] text-muted-foreground">Bets count</span></div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border border-border/40 bg-card/60 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Recent Bets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {!stats ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-2.5 w-full" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No activity yet</p>
              ) : (
                recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Coins className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground leading-snug truncate">{a.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{new Date(a.time).toLocaleTimeString()}</span>
                        {a.amount && <span className="text-[10px] font-bold text-primary">₹{a.amount.toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Bettors */}
      <Card className="border border-border/40 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" /> Top Bettors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-secondary/30 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              ))}
            </div>
          ) : topBettors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No bets yet</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {topBettors.map((b, i) => (
                <div key={b.username} className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-secondary/30 p-4 text-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-extrabold ${rankColors[i]}`}>#{i + 1}</div>
                  <p className="text-sm font-bold text-foreground truncate w-full">{b.username}</p>
                  <p className="text-xs font-bold text-primary">₹{b.total.toLocaleString()}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{b.count} bets</span>
                    <span className="text-emerald-400">{b.winRate}% win</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
