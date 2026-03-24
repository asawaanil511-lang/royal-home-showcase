import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DEFAULT_PASSWORD = "Abcd@1234";

const AdminUserManagement = () => {
  const { toast } = useToast();
  const [createUsername, setCreateUsername] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [resetUserId, setResetUserId] = useState("");
  const [resetting, setResetting] = useState(false);

  const [recentActions, setRecentActions] = useState<{ action: string; detail: string; time: string }[]>([]);

  const addAction = (action: string, detail: string) => {
    setRecentActions((prev) => [{ action, detail, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  };

  const handleCreate = async () => {
    if (!createUsername) {
      toast({ title: "Username required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const res = await supabase.functions.invoke("admin-create-user", {
      body: { action: "create", username: createUsername },
    });
    setCreating(false);
    if (res.error || res.data?.error) {
      toast({ title: "Failed", description: res.data?.error || res.error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ User created!", description: `Username: ${createUsername} | Default Password: ${DEFAULT_PASSWORD}` });
    addAction("Created User", `${createUsername} (pwd: ${DEFAULT_PASSWORD})`);
    setCreateUsername("");
  };

  const handleDelete = async () => {
    if (!deleteUserId) {
      toast({ title: "User ID required", variant: "destructive" });
      return;
    }
    setDeleting(true);
    const res = await supabase.functions.invoke("admin-create-user", {
      body: { action: "delete", user_id: deleteUserId },
    });
    setDeleting(false);
    if (res.error || res.data?.error) {
      toast({ title: "Failed", description: res.data?.error || res.error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "🗑️ User deleted" });
    addAction("Deleted User", deleteUserId.slice(0, 8));
    setDeleteUserId("");
  };

  const handleReset = async () => {
    if (!resetUserId) {
      toast({ title: "User ID required", variant: "destructive" });
      return;
    }
    setResetting(true);
    const res = await supabase.functions.invoke("admin-create-user", {
      body: { action: "reset_password", user_id: resetUserId },
    });
    setResetting(false);
    if (res.error || res.data?.error) {
      toast({ title: "Failed", description: res.data?.error || res.error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "🔑 Password reset to default!", description: `New password: ${DEFAULT_PASSWORD}` });
    addAction("Reset Password", `${resetUserId.slice(0, 8)} → ${DEFAULT_PASSWORD}`);
    setResetUserId("");
  };

  return (
    <div className="space-y-6">
      {/* Create User */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card p-5 shadow-card"
      >
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-2">
          <UserPlus className="h-5 w-5 text-primary" /> Create User
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Default password: <span className="text-primary font-mono">{DEFAULT_PASSWORD}</span> — user will be forced to change on first login.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Username"
            value={createUsername}
            onChange={(e) => setCreateUsername(e.target.value)}
            className="bg-secondary border-border"
          />
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="gradient-neon-primary text-primary-foreground shadow-neon"
          >
            {creating ? "Creating..." : "Create User"}
          </Button>
        </div>
      </motion.div>

      {/* Delete User */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border/50 bg-card p-5 shadow-card"
      >
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Trash2 className="h-5 w-5 text-destructive" /> Remove User
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="User ID (from Users tab)"
            value={deleteUserId}
            onChange={(e) => setDeleteUserId(e.target.value)}
            className="bg-secondary border-border"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting || !deleteUserId}>
                {deleting ? "Deleting..." : "Delete User"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the user account and all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>

      {/* Reset Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border/50 bg-card p-5 shadow-card"
      >
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-2">
          <KeyRound className="h-5 w-5 text-accent" /> Reset Password
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Resets to default: <span className="text-primary font-mono">{DEFAULT_PASSWORD}</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="User ID"
            value={resetUserId}
            onChange={(e) => setResetUserId(e.target.value)}
            className="bg-secondary border-border"
          />
          <Button
            onClick={handleReset}
            disabled={resetting}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {resetting ? "Resetting..." : "Reset to Default"}
          </Button>
        </div>
      </motion.div>

      {/* Recent Actions Log */}
      {recentActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border/50 bg-card p-5 shadow-card"
        >
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Actions</h3>
          <div className="space-y-1.5">
            {recentActions.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs rounded-lg bg-secondary/30 px-3 py-2">
                <span className="text-foreground">{a.action}: <span className="text-primary font-medium">{a.detail}</span></span>
                <span className="text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminUserManagement;
