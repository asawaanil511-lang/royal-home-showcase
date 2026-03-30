import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, AlertTriangle, Trophy, Zap, Megaphone } from "lucide-react";

type Announcement = { id: string; message: string; type: string; created_at: string };

const TYPE_CONFIG: Record<string, { icon: any; bg: string; border: string; text: string; accent: string }> = {
  info: { icon: Info, bg: "bg-blue-500/10", border: "border-blue-500/25", text: "text-blue-300", accent: "bg-blue-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-300", accent: "bg-amber-500" },
  success: { icon: Trophy, bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300", accent: "bg-emerald-500" },
  promo: { icon: Zap, bg: "bg-purple-500/10", border: "border-purple-500/25", text: "text-purple-300", accent: "bg-purple-500" },
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/announcements");
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch { }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const ann = visible[current % visible.length];
  const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
  const IconComp = cfg.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={ann.id}
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative border-b ${cfg.border} ${cfg.bg} overflow-hidden`}
      >
        {/* Animated accent line */}
        <motion.div
          className={`absolute bottom-0 left-0 h-px ${cfg.accent} opacity-60`}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        />

        <div className="container mx-auto flex items-center gap-3 px-4 py-2.5">
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${cfg.bg} border ${cfg.border}`}>
            <IconComp className={`h-3.5 w-3.5 ${cfg.text}`} />
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Megaphone className={`h-3 w-3 shrink-0 ${cfg.text} opacity-60`} />
            <p className={`text-xs font-medium ${cfg.text} truncate`}>{ann.message}</p>
          </div>

          {visible.length > 1 && (
            <div className="flex items-center gap-1.5 shrink-0">
              {visible.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${i === current % visible.length ? `w-4 ${cfg.accent}` : "w-1.5 bg-white/20"}`} />
              ))}
            </div>
          )}

          <button onClick={() => setDismissed(prev => new Set([...prev, ann.id]))}
            className="shrink-0 rounded-full p-1 text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBanner;
