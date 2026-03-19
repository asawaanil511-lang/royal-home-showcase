import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type BetRow = {
  id: string;
  user_id: string;
  match_id: string;
  team_picked: string;
  amount: number;
  odds: number;
  potential_win: number;
  result: string;
  created_at: string;
  match?: { team_a_name: string; team_b_name: string };
  profile?: { username: string | null };
};

const AdminBets = () => {
  const [bets, setBets] = useState<BetRow[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost" | "cancelled">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      // Fetch bets, matches, and profiles separately then join client-side
      const { data: betsData } = await (supabase as any).from("bets").select("*").order("created_at", { ascending: false });
      const { data: matchesData } = await (supabase as any).from("matches").select("id, team_a_name, team_b_name");
      const { data: profilesData } = await supabase.from("profiles").select("user_id, username");

      const matchMap = new Map((matchesData || []).map((m: any) => [m.id, m]));
      const profileMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));

      const enriched = (betsData || []).map((b: any) => ({
        ...b,
        match: matchMap.get(b.match_id),
        profile: profileMap.get(b.user_id),
      }));
      setBets(enriched);
    };
    load();
  }, []);

  const filtered = bets.filter((b) => {
    if (filter !== "all" && b.result !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = b.match ? `${b.match.team_a_name} vs ${b.match.team_b_name}`.toLowerCase() : "";
      const username = (b.profile?.username || "").toLowerCase();
      return matchName.includes(q) || username.includes(q);
    }
    return true;
  });

  const resultBadge = (result: string) => {
    const cls = result === "won" ? "bg-primary/10 text-primary" :
      result === "lost" ? "bg-destructive/10 text-destructive" :
      result === "cancelled" ? "bg-[hsl(var(--neon-purple))]/10 text-[hsl(var(--neon-purple))]" :
      "bg-accent/10 text-accent";
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{result.toUpperCase()}</span>;
  };

  const tabs = ["all", "pending", "won", "lost", "cancelled"] as const;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${filter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by user or match..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>User</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Pick</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Odds</TableHead>
              <TableHead>Potential</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium text-foreground">{b.profile?.username || b.user_id.slice(0, 8)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{b.match ? `${b.match.team_a_name} vs ${b.match.team_b_name}` : b.match_id.slice(0, 8)}</TableCell>
                <TableCell className="text-foreground">Team {b.team_picked}</TableCell>
                <TableCell className="text-accent font-semibold">₹{Number(b.amount).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{b.odds}x</TableCell>
                <TableCell className="text-primary font-semibold">₹{Number(b.potential_win).toLocaleString()}</TableCell>
                <TableCell>{resultBadge(b.result)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bets found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminBets;
