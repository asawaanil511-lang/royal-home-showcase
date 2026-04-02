import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone, Plus, Trash2, ToggleLeft, ToggleRight,
  Info, AlertTriangle, Zap, Trophy, Loader2, Eye, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Announcement = {
  id: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
};

const TYPE_OPTIONS = [
  { value: "info",    label: "Info",    icon: Info,          color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/30",    previewBg: "bg-blue-500/10",    previewBorder: "border-blue-500/25",    previewText: "text-blue-700 dark:text-blue-300",    accent: "bg-blue-500" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/30",   previewBg: "bg-amber-500/10",   previewBorder: "border-amber-500/25",   previewText: "text-amber-700 dark:text-amber-300",  accent: "bg-amber-500" },
  { value: "success", label: "Success", icon: Trophy,        color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", previewBg: "bg-emerald-500/10", previewBorder: "border-emerald-500/25", previewText: "text-emerald-700 dark:text-emerald-300", accent: "bg-emerald-500" },
  { value: "promo",   label: "Promo",   icon: Zap,           color: "text-purple-400",  bg: "bg-purple-400/10 border-purple-400/30",  previewBg: "bg-purple-500/10",  previewBorder: "border-purple-500/25",  previewText: "text-purple-700 dark:text-purple-300", accent: "bg-purple-500" },
];

const EMOJI_SHORTCUTS = ["🏏", "🎉", "🔥", "⚡", "📢", "💰", "🚨", "✅", "⚠️", "🎊", "💎", "🏆"];

const MAX_CHARS = 300;

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
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const token = await getToken();
    try {
      const res = await fetch(apiUrl("/api/announcements/all"), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!message.trim()) { toast({ title: "Message required", variant: "destructive" }); return; }
    if (message.length > MAX_CHARS) { toast({ title: `Max ${MAX_CHARS} characters`, variant: "destructive" }); return; }
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
      setShowPreview(false);
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
    setDeleteConfirm(null);
    load();
  };

  const insertEmoji = (emoji: string) => setMessage((prev) => prev + emoji);
  const getTypeConfig = (t: string) => TYPE_OPTIONS.find(o => o.value === t) || TYPE_OPTIONS[0];
  const selectedType = getTypeConfig(type);
  const charsLeft = MAX_CHARS - message.length;
  const charColor = charsLeft < 0 ? "text-red-400" : charsLeft < 30 ? "text-amber-400" : "text-muted-foreground";

  return (
    <div className="space-y-6">

      {/* ── Create form ── */}
      <div className="rounded-2xl border border-primary/20 bg-card/60 p-6 space-y-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Megaphone className="h-5 w-5 text-primary" /> Post Announcement
        </h3>
        <p className="text-xs text-muted-foreground -mt-2">
          Active announcements display as a scrolling banner to all users across the site.
        </p>

        {/* Type selector */}
        <div className="flex flex-wrap gap-2">
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

        {/* Emoji shortcuts */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Quick Emojis</p>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_SHORTCUTS.map((emoji) => (
              <button key={emoji} onClick={() => insertEmoji(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-secondary/50 text-base hover:bg-secondary hover:border-border transition-all active:scale-95"
                title={`Insert ${emoji}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea + char counter */}
        <div>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="e.g. 🚨 Server maintenance tonight at 10 PM. Bets will be paused temporarily."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_CHARS + 10}
              className="w-full rounded-xl border border-border/40 bg-secondary/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none transition-colors"
            />
            {message && (
              <button onClick={() => setMessage("")}
                className="absolute top-2.5 right-2.5 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className={`text-[11px] font-medium tabular-nums ${charColor}`}>
              {charsLeft < 0 ? `${Math.abs(charsLeft)} over limit` : `${charsLeft} left`}
            </span>
            <div className="flex items-center gap-2">
              {message.trim() && (
                <button onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors">
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? "Hide" : "Preview"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <AnimatePresence>
          {showPreview && message.trim() && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }} className="overflow-hidden">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Banner Preview</p>
              <div className={`relative border-b ${selectedType.previewBorder} ${selectedType.previewBg} overflow-hidden rounded-lg`}>
                <motion.div className={`absolute bottom-0 left-0 h-px ${selectedType.accent} opacity-60`}
                  initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear", repeat: Infinity }} />
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${selectedType.previewBg} border ${selectedType.previewBorder}`}>
                    <selectedType.icon className={`h-3.5 w-3.5 ${selectedType.previewText}`} />
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <Megaphone className={`h-3 w-3 shrink-0 ${selectedType.previewText} opacity-60`} />
                    <p className={`text-xs font-medium ${selectedType.previewText} truncate`}>{message}</p>
                  </div>
                  <div className="shrink-0 rounded-full p-1 text-muted-foreground">
                    <X className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleCreate}
          disabled={creating || !message.trim() || charsLeft < 0}
          className="w-full gradient-neon-primary text-primary-foreground shadow-neon gap-2"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {creating ? "Posting…" : "Post Announcement"}
        </Button>
      </div>

      {/* ── Announcements list ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">All Announcements</h3>
          <span className="text-xs text-muted-foreground">
            {announcements.filter(a => a.is_active).length} active · {announcements.length} total
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/30 bg-card/40 p-4 flex items-start gap-3">
                <div className="animate-pulse h-8 w-8 rounded-lg bg-secondary/60 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="animate-pulse h-3.5 w-3/4 rounded bg-secondary/60" />
                  <div className="animate-pulse h-2.5 w-1/3 rounded bg-secondary/40" />
                </div>
              </div>
            ))}
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
              const isConfirmDelete = deleteConfirm === ann.id;
              return (
                <motion.div key={ann.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-xl border p-4 transition-all ${ann.is_active ? tc.bg : "border-border/30 bg-card/40 opacity-60"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ann.is_active ? tc.bg : "bg-secondary border border-border/40"}`}>
                      <tc.icon className={`h-4 w-4 ${ann.is_active ? tc.color : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{ann.message}</p>
                      <div className="flex items-center flex-wrap gap-3 mt-1.5">
                        <span className={`text-[10px] font-bold uppercase ${ann.is_active ? tc.color : "text-muted-foreground"}`}>{ann.type}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(ann.created_at).toLocaleString()}</span>
                        <span className={`text-[10px] font-bold ${ann.is_active ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {ann.is_active ? "● LIVE" : "○ HIDDEN"}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{ann.message.length} chars</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button onClick={() => handleToggle(ann)} title={ann.is_active ? "Hide" : "Show"}
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        {ann.is_active
                          ? <ToggleRight className={`h-6 w-6 ${tc.color}`} />
                          : <ToggleLeft className="h-6 w-6" />}
                      </button>
                      {isConfirmDelete ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(ann.id)}
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-colors">
                            Confirm
                          </button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="rounded-lg border border-border/40 bg-secondary/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(ann.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
