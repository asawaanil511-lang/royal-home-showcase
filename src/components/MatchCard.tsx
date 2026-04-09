import { Match } from "@/data/matches";
import { Button } from "@/components/ui/button";
import {
  Bell, BellRing, Clock, Lock, Timer, Trophy, X, ZoomIn,
  Plus, XCircle, Loader2, Share2, IndianRupee, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type UserBet = {
  id: string;
  ids: string[];
  team_picked: "A" | "B";
  amount: number;
  odds: number;
  potential_win: number;
};

type MatchCardProps = {
  match: Match;
  onBet: (match: Match, team?: "A" | "B") => void;
  userBet?: UserBet | null;
  onCancelBet?: (matchId: string) => void;
  cancellingBetId?: string | null;
};

function useCountdown(target: string | null | undefined) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return remaining;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00H 00M 00S";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}H ${String(m).padStart(2, "0")}M ${String(s).padStart(2, "0")}S`;
}

function formatEndTime(utcString: string): string {
  const date = new Date(utcString);
  const today = new Date();
  const timeStr = date
    .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
    .toUpperCase();
  const todayIST = today.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  const targetIST = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  if (todayIST !== targetIST) {
    const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    return `${dateStr}, ${timeStr}`;
  }
  return timeStr;
}

const ImageLightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt="Match schedule" loading="lazy"
          className="w-full rounded-2xl object-contain max-h-[85vh]"
          style={{ boxShadow: "0 0 80px rgba(0,0,0,0.8)" }}
        />
        <button onClick={onClose}
          className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
};

type NotifState = { notifyLive: boolean; notifyResult: boolean };

const BellMenu = ({ match, onClose }: { match: Match; onClose: () => void }) => {
  const key = `notif_${match.id}`;
  const [state, setState] = useState<NotifState>(() => {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
  });

  const toggle = (field: keyof NotifState) => {
    const next = { ...state, [field]: !state[field] };
    setState(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { }
  };

  const handleShare = async () => {
    const text = `🏏 ${match.teamA.name} vs ${match.teamB.name} — Bet now on Betwic Toss Book!`;
    try {
      if (navigator.share) { await navigator.share({ title: "Betwic Toss Book", text }); }
      else { await navigator.clipboard.writeText(text); }
    } catch { }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -6 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-border/70 bg-popover shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-border/50">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Match Alerts</p>
      </div>

      {[
        { icon: Bell, label: "Notify when Live", sub: "Alert when betting opens", field: "notifyLive" as keyof NotifState },
        { icon: Trophy, label: "Notify on Result", sub: "Alert when toss is settled", field: "notifyResult" as keyof NotifState },
      ].map((item) => (
        <button
          key={item.field}
          onClick={() => toggle(item.field)}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 transition-colors ${
            state[item.field] ? "bg-primary/20 border border-primary/40" : "bg-secondary/80 border border-border/60"
          }`}>
            <item.icon className={`h-3.5 w-3.5 ${state[item.field] ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${state[item.field] ? "text-primary" : "text-foreground"}`}>{item.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{item.sub}</p>
          </div>
          {state[item.field] && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
        </button>
      ))}

      <div className="border-t border-border/50">
        <button
          onClick={handleShare}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/80 border border-border/60 shrink-0">
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">Share Match</p>
            <p className="text-[10px] text-muted-foreground">Copy or share this match</p>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

const MatchCard = ({ match, onBet, userBet, onCancelBet, cancellingBetId }: MatchCardProps) => {
  const isClosed = match.status === "closed";
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const isOpen = isLive || isUpcoming;

  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const countdownTarget = !isClosed ? (match.closingTime ?? null) : null;
  const closingMs = useCountdown(countdownTarget);
  const closingSoon = closingMs !== null && closingMs < 5 * 60 * 1000 && closingMs > 0;

  const winnerSide = match.winner;
  const winnerName = winnerSide === "A" ? match.teamA.name : winnerSide === "B" ? match.teamB.name : null;
  const hasImage = !!match.imageUrl && !imgError;

  const hasBet = !!userBet && isOpen;
  const isCancellingThis = !!(cancellingBetId && userBet?.ids?.includes(cancellingBetId));
  const potentialWin = userBet ? Number(userBet.potential_win) : 0;
  const profit = potentialWin - (userBet ? Number(userBet.amount) : 0);

  const tossRate = match.oddsA === match.oddsB ? `${match.oddsA}x` : `${match.oddsA}x / ${match.oddsB}x`;
  const endTimeLabel = match.closingTime ? formatEndTime(match.closingTime) : match.time ? match.time.toUpperCase() : "—";

  // ── Purple-only accent system ───────────────────────────────────
  // Live = red glow, everything else = purple palette
  const glowColor = isLive ? "rgba(239,68,68,0.20)" : "rgba(157,76,204,0.15)";
  const borderColor = isLive
    ? hasBet ? "rgba(157,76,204,0.45)" : "rgba(239,68,68,0.28)"
    : isUpcoming
    ? hasBet ? "rgba(157,76,204,0.40)" : "rgba(157,76,204,0.22)"
    : "hsl(var(--border))";
  const topLineGradient = isLive
    ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.70), transparent)"
    : "linear-gradient(90deg, transparent, rgba(157,76,204,0.65), transparent)";

  // Close bell menu on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  const notifKey = `notif_${match.id}`;
  const notifState: NotifState = (() => {
    try { return JSON.parse(localStorage.getItem(notifKey) || "{}"); } catch { return {}; }
  })();
  const hasNotif = notifState.notifyLive || notifState.notifyResult;

  return (
    <>
      <motion.div
        whileHover={!isClosed ? { y: -3, scale: 1.003 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`relative overflow-hidden rounded-2xl will-change-transform ${isClosed ? "opacity-65" : ""}`}
        style={{
          background: "hsl(var(--card))",
          border: `1px solid ${borderColor}`,
          boxShadow: !isClosed ? `0 0 32px ${glowColor}` : "none",
        }}
      >
        {/* Top accent line — purple or red for live */}
        <div className="h-[2px] w-full" style={{ background: topLineGradient }} />

        {/* ── Timer + Bell row ───────────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          {closingMs !== null && closingMs > 0 ? (
            <motion.span
              key={closingSoon ? "urgent" : "normal"}
              className="flex items-center gap-1.5 text-[13px] font-bold tracking-widest tabular-nums"
              style={{ color: closingSoon ? "#ef4444" : "hsl(var(--primary))" }}
              animate={closingSoon ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Timer className="h-3.5 w-3.5 shrink-0" />
              {formatCountdown(closingMs)}
            </motion.span>
          ) : isLive ? (
            <span className="flex items-center gap-2 text-[13px] font-bold text-red-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-red-500" />
              </span>
              LIVE NOW
            </span>
          ) : isUpcoming ? (
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-primary">
              <Clock className="h-3.5 w-3.5" />
              UPCOMING
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground/50">
              <Lock className="h-3.5 w-3.5" />
              CLOSED
            </span>
          )}

          {/* Bell button */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen((v) => !v)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                bellOpen ? "bg-primary/15 text-primary" : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              {hasNotif
                ? <BellRing className="h-4 w-4 text-primary" />
                : <Bell className="h-4 w-4" />}
            </button>
            <AnimatePresence>
              {bellOpen && <BellMenu match={match} onClose={() => setBellOpen(false)} />}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Match title ─────────────────────────────────── */}
        {match.matchTitle && (
          <div className="px-4 pb-2">
            <p className="text-sm font-extrabold tracking-wide leading-snug text-foreground">{match.matchTitle}</p>
          </div>
        )}

        {/* ── Match image thumbnail ────────────────────────── */}
        {hasImage && (
          <div className="px-4 pb-3">
            <div
              className="relative overflow-hidden rounded-xl cursor-pointer group"
              style={{ height: 76 }}
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={match.imageUrl!}
                alt="Match schedule"
                loading="lazy"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                <ZoomIn className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
              <div className="absolute inset-0 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        )}

        {/* ── Team pills ──────────────────────────────────── */}
        <div className="space-y-2 px-4 pb-3">
          {[
            { team: "A" as const, name: match.teamA.name },
            { team: "B" as const, name: match.teamB.name },
          ].map((t, idx) => {
            const isWinner = winnerSide === t.team;
            const isLoser = winnerSide && winnerSide !== t.team;
            const isPicked = hasBet && userBet?.team_picked === t.team;

            return (
              <div key={t.team}>
                <div
                  role={!isClosed && !hasBet ? "button" : undefined}
                  onClick={!isClosed && !hasBet ? () => onBet(match, t.team) : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-150 ${
                    isLoser ? "opacity-25" : ""
                  } ${!isClosed && !hasBet ? "cursor-pointer hover:border-primary/40 hover:bg-primary/8 active:scale-[0.98]" : ""}`}
                  style={{
                    background: isWinner
                      ? "rgba(234,179,8,0.11)"
                      : isPicked
                      ? "rgba(157,76,204,0.12)"
                      : "hsl(var(--secondary))",
                    border: isWinner
                      ? "1px solid rgba(234,179,8,0.30)"
                      : isPicked
                      ? "1px solid rgba(157,76,204,0.40)"
                      : "1px solid hsl(var(--border)/0.5)",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-extrabold tracking-widest text-foreground uppercase leading-none truncate">
                      {t.name}
                    </span>
                    {isPicked && (
                      <span
                        className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(157,76,204,0.20)",
                          color: "hsl(var(--primary))",
                          border: "1px solid rgba(157,76,204,0.35)",
                        }}
                      >
                        YOUR PICK
                      </span>
                    )}
                  </div>
                  {isWinner ? (
                    <Trophy className="h-4 w-4 shrink-0 text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]" />
                  ) : isPicked ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <IndianRupee className="h-3 w-3 text-primary" />
                      <span className="text-sm font-extrabold tabular-nums text-primary">
                        {Number(userBet!.amount).toLocaleString()}
                      </span>
                    </div>
                  ) : !isClosed && !hasBet ? (
                    <span
                      className="text-[10px] font-bold text-white px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        background: "linear-gradient(135deg, hsl(277 54% 55%), hsl(273 74% 29%))",
                        boxShadow: "0 2px 10px rgba(157,76,204,0.40)",
                      }}
                    >
                      Choose
                    </span>
                  ) : null}
                </div>

                {/* VS divider — purple */}
                {idx === 0 && (
                  <div className="flex justify-center py-1">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        border: "1.5px solid rgba(157,76,204,0.38)",
                        background: "rgba(157,76,204,0.10)",
                      }}
                    >
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: "rgba(157,76,204,0.75)" }}
                      >
                        vs
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Bet summary strip ───────────────────────────── */}
        <AnimatePresence>
          {hasBet && userBet && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-4 pb-3"
            >
              <div
                className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                style={{
                  background: "rgba(157,76,204,0.10)",
                  border: "1px solid rgba(157,76,204,0.30)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Bet Locked</p>
                    <p className="text-xs font-extrabold text-primary truncate">
                      ₹{Number(userBet.amount).toLocaleString()} · Win ₹{potentialWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-muted-foreground">Profit</p>
                  <p className="text-xs font-extrabold text-emerald-400">+₹{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Winner banner ───────────────────────────────── */}
        <AnimatePresence>
          {winnerName && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-4 pb-3"
            >
              <div
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5"
                style={{ background: "rgba(234,179,8,0.09)", border: "1px solid rgba(234,179,8,0.22)" }}
              >
                <Trophy className="h-4 w-4 shrink-0 text-yellow-400" />
                <p className="text-xs font-extrabold text-yellow-600 dark:text-yellow-300 tracking-wide">
                  <span className="text-yellow-600/55 font-medium mr-1">Won the toss:</span>
                  {winnerName}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Info grid: ENDTIME + TOSS RATE ─────────────── */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          {[
            { label: "ENDTIME", value: endTimeLabel },
            { label: "TOSS RATE", value: tossRate },
          ].map((g) => (
            <div key={g.label} className="rounded-xl px-3 py-2.5 bg-secondary border border-border/40">
              <p className="text-[9px] font-semibold tracking-[0.2em] mb-1 text-muted-foreground">{g.label}</p>
              <p className="text-sm font-bold tabular-nums text-primary">{g.value}</p>
            </div>
          ))}
        </div>

        {/* ── CTA / Bet Actions ───────────────────────────── */}
        <div className="px-4 pb-4 space-y-2">
          {isClosed ? (
            <div className="space-y-1.5">
              <div
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-bold tracking-wide"
                style={{ background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.30)", color: "#f59e0b" }}
              >
                <Lock className="h-3.5 w-3.5" />
                BETTING CLOSED
                {winnerName && <span className="ml-1 text-yellow-300 font-extrabold">· {winnerName} WON</span>}
              </div>
              <p className="text-center text-[10px] text-muted-foreground font-medium">
                Check <span className="text-primary font-bold">My Bets</span> for winnings
              </p>
            </div>
          ) : hasBet ? (
            <div className="flex gap-2">
              <Button
                className="flex-1 h-11 text-xs font-extrabold gap-1.5 tracking-wide"
                style={{
                  background: "linear-gradient(135deg, hsl(277 54% 55%), hsl(273 74% 29%))",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(157,76,204,0.35)",
                }}
                onClick={() => onBet(match, userBet!.team_picked)}
              >
                <Plus className="h-4 w-4" /> BET MORE
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 text-xs font-extrabold gap-1.5 border-red-500/40 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:border-red-500/60 tracking-wide"
                onClick={() => onCancelBet?.(match.id)}
                disabled={isCancellingThis}
              >
                {isCancellingThis
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling…</>
                  : <><XCircle className="h-4 w-4" /> CANCEL</>}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full h-12 text-sm font-extrabold tracking-[0.12em] transition-all"
              style={{
                background: "linear-gradient(135deg, hsl(277 54% 55%) 0%, hsl(273 74% 29%) 100%)",
                color: "#fff",
                border: "none",
                boxShadow: "0 4px 24px rgba(157,76,204,0.40)",
              }}
              onClick={() => onBet(match)}
            >
              BET &amp; PLAY
            </Button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {lightboxOpen && hasImage && (
          <ImageLightbox src={match.imageUrl!} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MatchCard;
