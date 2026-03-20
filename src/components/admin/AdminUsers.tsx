import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Coins } from "lucide-react";

type UserProfile = {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  wallet_balance: number;
  created_at: string;
};

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [walletValue, setWalletValue] = useState("");

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as UserProfile[]) || []);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.username || "").toLowerCase().includes(q) || (u.display_name || "").toLowerCase().includes(q);
  });

  const handleWalletUpdate = async (userId: string) => {
    const val = Number(walletValue);
    if (isNaN(val) || val < 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    const { error } = await supabase.from("profiles").update({ wallet_balance: val }).eq("user_id", userId);
    if (error) {
      console.error("Wallet update error:", error);
      toast({ title: "Failed to update wallet", description: error.message, variant: "destructive" });
      return;
    }
    setEditingWallet(null);
    toast({ title: "💰 Wallet updated!" });
    fetchUsers();
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Username</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.username || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{u.display_name || "—"}</TableCell>
                <TableCell>
                  {editingWallet === u.user_id ? (
                    <div className="flex gap-2 items-center">
                      <Input type="number" value={walletValue} onChange={(e) => setWalletValue(e.target.value)} className="w-28 h-8 bg-secondary border-border text-sm" />
                      <Button size="sm" className="h-8 text-xs" onClick={() => handleWalletUpdate(u.user_id)}>Save</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditingWallet(null)}>✕</Button>
                    </div>
                  ) : (
                    <span className="text-primary font-semibold">₹{Number(u.wallet_balance).toLocaleString()}</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary" onClick={() => { setEditingWallet(u.user_id); setWalletValue(String(u.wallet_balance)); }}>
                    <Coins className="h-3 w-3 mr-1" /> Edit Wallet
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
