import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, KeyRound, Search, Loader2, Clock, ChevronDown, Copy, Check } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type UserOption = { user_id: string; username: string | null; display_name: string | null };

async function callAdminApi(body: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || "";
  const response = await fetch("/api/admin-create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { data, error: response.ok ? null : { message: data.error || "Request failed" } };
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="ml-1.5 text-muted-foreground hover:text-primary transition-colors" title="Copy">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

const UserSearchDropdown = ({
  users, value, onChange, placeholder,
}: { users: UserOption[]; value: string; onChange: (id: string, name: string) => void; placeholder: string }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selected = users.find(u => u.user_id === value);
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.username || "").toLowerCase().includes(q) || (u.display_name || "").toLowerCase().includes(q);
  });

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-secondary/40 px-4 py-2.5 text-sm text-left transition-colors hover:border-primary/30">
        <span className={selected ? "text-foreground font-medium" : "text-muted-foreground"}>
          {selected ? (selected.username || selected.display_name || selected.user_id.slice(0, 12)) : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border/30">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" placeholder="Search user..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-secondary/50 rounded-lg outline-none text-foreground placeholder:text-muted-foreground" />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
              ) : (
                filtered.map(u => (
                  <button key={u.user_id} type="button"
                    onClick={() => { onChange(u.user_id, u.username || u.display_name || u.user_id); setOpen(false); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary/60 transition-colors ${value === u.user_id ? "bg-primary/10" : ""}`}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                      {(u.username || u.display_name || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{u.username || "—"}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{u.user_id.slice(0, 20)}…</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminUserManagement = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [createUsername, setCreateUsername] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [resetting, setResetting] = useState(false);
  const [recentActions, setRecentActions] = useState<{ action: string; detail: string; time: string }[]>([]);
  const [lastCreatedPwd, setLastCreatedPwd] = useState<string | null>(null);
  const [lastResetPwd, setLastResetPwd] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("user_id, username, display_name").order("created_at", { ascending: false })
      .then(({ data }) => setUsers((data as UserOption[]) || []));
  }, []);

  const refreshUsers = () => {
    supabase.from("profiles").select("user_id, username, display_name").order("created_at", { ascending: false })
      .then(({ data }) => setUsers((data as UserOption[]) || []));
  };

  const addAction = (action: string, detail: string) => {
    setRecentActions((prev) => [{ action, detail, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  };

  const handleCreate = async () => {
    if (!createUsername.trim()) { toast({ title: "Username required", variant: "destructive" }); return; }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(createUsername.trim())) {
      toast({ title: "Invalid username", description: "Use only letters, numbers, underscores (3–30 chars)", variant: "destructive" });
      return;
    }
    setCreating(true);
    setLastCreatedPwd(null);
    const res = await callAdminApi({ action: "create", username: createUsername.trim() });
    setCreating(false);
    if (res.error || res.data?.error) {
      toast({ title: "Failed", description: res.data?.error || res.error?.message, variant: "destructive" });
      return;
    }
    const pwd = res.data?.default_password as string | undefined;
    if (pwd) setLastCreatedPwd(pwd);
    toast({ title: "User created!", description: `${createUsername} — check password below` });
    addAction("Created", createUsername.trim());
    setCreateUsername("");
    refreshUsers();
  };

  const handleDelete = async () => {
    if (!deleteUserId) { toast({ title: "Select a user", variant: "destructive" }); return; }
    if (deleteUserId === currentUser?.id) {
      toast({ title: "Cannot delete yourself", description: "Admins cannot delete their own account.", variant: "destructive" });
      return;
    }
    setDeleting(true);
    const res = await callAdminApi({ action: "delete", user_id: deleteUserId });
    setDeleting(false);
    if (res.error || res.data?.error) {
      toast({ title: "Failed", description: res.data?.error || res.error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "User deleted" });
    addAction("Deleted", deleteUsername || deleteUserId.slice(0, 8));
    setDeleteUserId(""); setDeleteUsername("");
    refreshUsers();
  };

  const handleReset = async () => {
    if (!resetUserId) { toast({ title: "Select a user", variant: "destructive" }); return; }
    setResetting(true);
    setLastResetPwd(null);
    const res = await callAdminApi({ action: "reset_password", user_id: resetUserId });
    setResetting(false);
    if (res.error || res.data?.error) {
      toast({ title: "Failed", description: res.data?.error || res.error?.message, variant: "destructive" });
      return;
    }
    const pwd = res.data?.default_password as string | undefined;
    if (pwd) setLastResetPwd(pwd);
    toast({ title: "Password reset — check password below" });
    addAction("Reset Password", resetUsername || resetUserId.slice(0, 8));
    setResetUserId(""); setResetUsername("");
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Create User */}
        <div className="rounded-2xl border border-emerald-500/20 bg-card/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <UserPlus className="h-4 w-4 text-emerald-400" />
            </div>
            Create User
          </h3>
          <p className="text-xs text-muted-foreground mb-4">A secure default password is set automatically.</p>
          <div className="space-y-2.5">
            <Input placeholder="Username" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="bg-secondary/40 border-border/40" />
            <Button onClick={handleCreate} disabled={creating || !createUsername} className="w-full gradient-neon-primary text-primary-foreground gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create User
            </Button>
            {lastCreatedPwd && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Password:</span>
                <span className="font-mono font-bold text-emerald-400">{lastCreatedPwd}</span>
                <CopyButton text={lastCreatedPwd} />
              </div>
            )}
          </div>
        </div>

        {/* Delete User */}
        <div className="rounded-2xl border border-red-500/20 bg-card/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
              <Trash2 className="h-4 w-4 text-red-400" />
            </div>
            Remove User
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Permanently deletes the account and all data.</p>
          <div className="space-y-2.5">
            <UserSearchDropdown users={users.filter(u => u.user_id !== currentUser?.id)} value={deleteUserId}
              onChange={(id, name) => { setDeleteUserId(id); setDeleteUsername(name); }}
              placeholder="Select user to delete…" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!deleteUserId} className="w-full gap-2">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete {deleteUsername || "User"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{deleteUsername}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the account, profile, and all data. Cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Reset Password */}
        <div className="rounded-2xl border border-amber-500/20 bg-card/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
              <KeyRound className="h-4 w-4 text-amber-400" />
            </div>
            Reset Password
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Resets to a secure default — shown once after reset.</p>
          <div className="space-y-2.5">
            <UserSearchDropdown users={users} value={resetUserId}
              onChange={(id, name) => { setResetUserId(id); setResetUsername(name); }}
              placeholder="Select user to reset…" />
            <Button onClick={handleReset} disabled={resetting || !resetUserId}
              className="w-full bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 gap-2">
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Reset {resetUsername || "Password"}
            </Button>
            {lastResetPwd && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-xs">
                <span className="text-muted-foreground">New pwd:</span>
                <span className="font-mono font-bold text-amber-400">{lastResetPwd}</span>
                <CopyButton text={lastResetPwd} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Actions Log */}
      <AnimatePresence>
        {recentActions.length > 0 && (
          <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-3">
              <Clock className="h-4 w-4" /> Session Log
            </h3>
            <div className="space-y-1.5">
              {recentActions.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs rounded-lg bg-secondary/30 px-3 py-2">
                  <span className="text-foreground">{a.action}: <span className="text-primary font-medium">{a.detail}</span></span>
                  <span className="text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUserManagement;
