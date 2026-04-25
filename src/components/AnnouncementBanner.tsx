import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import { X, Info, AlertTriangle, Trophy, Zap, Megaphone } from "lucide-react";

type Announcement = { id: string; message: string; type: string; created_at: string };

const TYPE_COLOR: Record<string, string> = {
  info:    "#7dd3fc",
  warning: "#fcd34d",
  success: "#86efac",
  promo:   "#d8b4fe",
};

const TYPE_ICON: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: Trophy,
  promo: Zap,
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const trackRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(40);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(apiUrl("/api/announcements"));
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch { }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const visible = useMemo(
    () => announcements.filter(a => !dismissed.has(a.id)),
    [announcements, dismissed],
  );

  // Compute marquee duration based on rendered group width (≈ 80px per second)
  useEffect(() => {
    if (!groupRef.current) return;
    const w = groupRef.current.scrollWidth;
    if (w > 0) setDuration(Math.max(18, Math.min(80, w / 80)));
  }, [visible]);

  if (visible.length === 0) return null;

  const dismissAll = () => setDismissed(prev => {
    const next = new Set(prev);
    visible.forEach(a => next.add(a.id));
    return next;
  });

  // Render a single sequence of items so we can repeat it for a seamless loop
  const Item = ({ a }: { a: Announcement }) => {
    const Icon = TYPE_ICON[a.type] || Info;
    const color = TYPE_COLOR[a.type] || TYPE_COLOR.info;
    return (
      <span className="inline-flex items-center gap-2 px-6">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
        <span
          className="text-[12px] font-bold uppercase tracking-[0.18em] whitespace-nowrap"
          style={{ color }}
        >
          {a.message}
        </span>
        <span className="mx-3 text-white/25 select-none">|</span>
      </span>
    );
  };

  const Group = ({ innerRef }: { innerRef?: React.Ref<HTMLDivElement> }) => (
    <div ref={innerRef} className="flex items-center shrink-0">
      {visible.map(a => <Item key={a.id} a={a} />)}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        key="announcement-bar"
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden border-b border-white/10"
        style={{
          background: "linear-gradient(90deg, #1e1b4b 0%, #1e293b 50%, #1e1b4b 100%)",
        }}
      >
        <div className="relative flex items-center gap-2 px-3 py-2">
          {/* Leading megaphone badge */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/15">
            <Megaphone className="h-3 w-3 text-white/80" />
          </div>

          {/* Marquee viewport */}
          <div
            className="relative flex-1 overflow-hidden"
            style={{
              maskImage: "linear-gradient(90deg, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%)",
              WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%)",
            }}
          >
            <div
              ref={trackRef}
              className="flex w-max items-center"
              style={{
                animation: `announcement-marquee ${duration}s linear infinite`,
              }}
            >
              <Group innerRef={groupRef} />
              <Group />
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismissAll}
            aria-label="Dismiss announcements"
            className="shrink-0 rounded-full p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Local keyframes */}
        <style>{`
          @keyframes announcement-marquee {
            0%   { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBanner;
