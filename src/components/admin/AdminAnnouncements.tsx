import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, Info, AlertTriangle, Zap, Trophy, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Announcement = {
  id: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
};

const TYPE_OPTIONS = [
  { value: "info", label: "Info", icon: Info, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  { value: "success", label: "Success", icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  { value: "promo", label: "Promo", icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30" },
];

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || "";
}

const AdminAnnouncements = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch(apiUrl("/api/announcements/all"), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!message.trim()) { toast({ title: "Message required", variant: "destructive" }); return; }
    setCreating(true);
    const token = await getToken();
    const res = await fetch(apiUrl("/api/announcements"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: message.trim(), type }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      toast({ title: "Failed", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "📢 Announcement posted!" });
      setMessage("");
    }
    setCreating(false);
    load();
  };

  const handleToggle = async (ann: Announcement) => {
    const token = await getToken();
    await fetch(apiUrl(`/api/announcements/${ann.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !ann.is_active }),
    });
    toast({ title: ann.is_active ? "Announcement hidden" : "Announcement shown" });
    load();
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    await fetch(apiUrl(`/api/announcements/${id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    toast({ title: "Announcement deleted" });
    load();
  };

  const getTypeConfig = (t: string) => TYPE_OPTIONS.find(o => o.value === t) || TYPE_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-2xl border border-primary/20 bg-card/60 p-6">
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground mb-4">
          <Megaphone className="h-5 w-5 text-primary" /> Post Announcement
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Active announcements display as a banner to all users across the site.
        </p>

        {/* Type selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TYPE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setType(opt.value)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                type === opt.value ? `${opt.bg} ${opt.color}` : "border-border/40 bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}>
              <opt.icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <textarea
            rows={2}
            placeholder="e.g. Server maintenance tonight at 10 PM. Bets will be paused."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 rounded-xl border border-border/40 bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none"
          />
          <Button onClick={handleCreate} disabled={creating || !message.trim()}
            className="self-end gradient-neon-primary text-primary-foreground shadow-neon gap-2 shrink-0">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Post
          </Button>
        </div>
      </div>

      {/* Announcements list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">All Announcements</h3>
          <span className="text-xs text-muted-foreground">
            {announcements.filter(a => a.is_active).length} active
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border/40">
            <Megaphone className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No announcements yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {announcements.map((ann, i) => {
              const tc = getTypeConfig(ann.type);
              return (
                <motion.div key={ann.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-xl border p-4 transition-all ${ann.is_active ? `${tc.bg}` : "border-border/30 bg-card/40 opacity-50"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ann.is_active ? tc.bg : "bg-secondary border border-border/40"}`}>
                      <tc.icon className={`h-4 w-4 ${ann.is_active ? tc.color : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{ann.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[10px] font-bold uppercase ${ann.is_active ? tc.color : "text-muted-foreground"}`}>{ann.type}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(ann.created_at).toLocaleString()}</span>
                        <span className={`text-[10px] font-bold ${ann.is_active ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {ann.is_active ? "● LIVE" : "○ HIDDEN"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggle(ann)} title={ann.is_active ? "Hide" : "Show"}
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        {ann.is_active
                          ? <ToggleRight className={`h-6 w-6 ${tc.color}`} />
                          : <ToggleLeft className="h-6 w-6" />}
                      </button>
                      <button onClick={() => handleDelete(ann.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
