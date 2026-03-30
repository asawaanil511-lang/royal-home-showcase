import { Match } from "@/data/matches";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Lock, Timer, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type MatchCardProps = {
  match: Match;
  onBet: (match: Match) => void;
};

// ─── Countdown hook ───────────────────────────────────────────────────────────

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
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
    .toUpperCase()
    .replace("AM", "AM")
    .replace("PM", "PM");

  const todayIST = today.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  const targetIST = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

  if (todayIST !== targetIST) {
    const dateStr = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
    return `${dateStr}, ${timeStr}`;
  }
  return timeStr;
}

// ─── MatchCard ─────────────────────────────────────────────────────────────────

const MatchCard = ({ match, onBet }: MatchCardProps) => {
  const isClosed = match.status === "closed";
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const [imgError, setImgError] = useState(false);

  // Countdown runs for both live & upcoming (toward closing time)
  const countdownTarget = !isClosed ? (match.closingTime ?? null) : null;
  const closingMs = useCountdown(countdownTarget);
  const closingSoon = closingMs !== null && closingMs < 5 * 60 * 1000 && closingMs > 0;

  const winnerSide = match.winner;
  const winnerName =
    winnerSide === "A" ? match.teamA.name : winnerSide === "B" ? match.teamB.name : null;

  const hasImage = !!match.imageUrl && !imgError;

  const tossRate =
    match.oddsA === match.oddsB
      ? `${match.oddsA}x`
      : `${match.oddsA}x / ${match.oddsB}x`;

  const endTimeLabel = match.closingTime
    ? formatEndTime(match.closingTime)
    : match.time
    ? match.time.toUpperCase()
    : "—";

  const accentColor = isLive ? "#ef4444" : "#00b4ff";
  const borderColor = isLive
    ? "rgba(239,68,68,0.22)"
    : isUpcoming
    ? "rgba(0,180,255,0.14)"
    : "rgba(255,255,255,0.06)";

  return (
    <motion.div
      whileHover={!isClosed ? { y: -4, scale: 1.006 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl ${isClosed ? "opacity-70" : ""}`}
      style={{
        background: "hsl(225 22% 8%)",
        border: `1px solid ${borderColor}`,
        boxShadow: !isClosed
          ? `0 0 32px ${accentColor}0d`
          : "none",
      }}
    >
      {/* top accent line */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}99, transparent)`,
        }}
      />

      {/* ── Timer + Bell row ────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        {closingMs !== null && closingMs > 0 ? (
          <motion.span
            key={closingSoon ? "urgent" : "normal"}
            className="flex items-center gap-1.5 text-[13px] font-bold tracking-widest tabular-nums"
            style={{ color: closingSoon ? "#ef4444" : "#e91e8c" }}
            animate={closingSoon ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Timer className="h-3.5 w-3.5 shrink-0" />
            {formatCountdown(closingMs)}
          </motion.span>
        ) : isLive ? (
          <span className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "#ef4444" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-red-500" />
            </span>
            LIVE NOW
          </span>
        ) : isUpcoming ? (
          <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "#00b4ff" }}>
            <Clock className="h-3.5 w-3.5" />
            UPCOMING
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-white/25">
            <Lock className="h-3.5 w-3.5" />
            CLOSED
          </span>
        )}

        <button
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.30)" }}
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>

      {/* ── Match image + label row ────────────────────────── */}
      {hasImage && (
        <div className="flex items-center gap-3 px-4 pb-3">
          <div
            className="relative shrink-0 overflow-hidden rounded-xl"
            style={{ width: 76, height: 58 }}
          >
            <img
              src={match.imageUrl!}
              alt="Match"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-white leading-snug tracking-wide truncate">
              {match.date} · {match.time}
            </p>
            <p
              className="mt-0.5 text-[11px] font-bold tracking-[0.18em]"
              style={{ color: "#00b4ff" }}
            >
              CRICKET
            </p>
          </div>
        </div>
      )}

      {/* ── Team pills ─────────────────────────────────────── */}
      <div className="space-y-2 px-4 pb-3">
        {/* Team A */}
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition-opacity duration-300 ${
            winnerSide === "B" ? "opacity-25" : ""
          }`}
          style={{
            background:
              winnerSide === "A"
                ? "rgba(234,179,8,0.11)"
                : "rgba(255,255,255,0.045)",
            border:
              winnerSide === "A"
                ? "1px solid rgba(234,179,8,0.25)"
                : "1px solid transparent",
          }}
        >
          <span className="text-sm font-extrabold tracking-widest text-white uppercase leading-none">
            {match.teamA.name}
          </span>
          {winnerSide === "A" && (
            <Trophy className="h-4 w-4 shrink-0 text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]" />
          )}
        </div>

        {/* VS divider */}
        <div className="flex justify-center py-0.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              border: "1.5px solid rgba(0,180,255,0.35)",
              background: "rgba(0,180,255,0.05)",
            }}
          >
            <span
              className="text-[11px] font-bold"
              style={{ color: "rgba(0,180,255,0.75)" }}
            >
              vs
            </span>
          </div>
        </div>

        {/* Team B */}
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition-opacity duration-300 ${
            winnerSide === "A" ? "opacity-25" : ""
          }`}
          style={{
            background:
              winnerSide === "B"
                ? "rgba(234,179,8,0.11)"
                : "rgba(255,255,255,0.045)",
            border:
              winnerSide === "B"
                ? "1px solid rgba(234,179,8,0.25)"
                : "1px solid transparent",
          }}
        >
          <span className="text-sm font-extrabold tracking-widest text-white uppercase leading-none">
            {match.teamB.name}
          </span>
          {winnerSide === "B" && (
            <Trophy className="h-4 w-4 shrink-0 text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]" />
          )}
        </div>
      </div>

      {/* ── Winner banner ──────────────────────────────────── */}
      <AnimatePresence>
        {winnerName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-4 pb-3"
          >
            <div
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5"
              style={{
                background: "rgba(234,179,8,0.09)",
                border: "1px solid rgba(234,179,8,0.22)",
              }}
            >
              <Trophy className="h-4 w-4 shrink-0 text-yellow-400" />
              <p className="text-xs font-extrabold text-yellow-300 tracking-wide">
                <span className="text-yellow-500/55 font-medium mr-1">Won the toss:</span>
                {winnerName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Info grid: ENDTIME + TOSS RATE ─────────────────── */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        <div
          className="rounded-xl px-3.5 py-3"
          style={{ background: "rgba(255,255,255,0.038)" }}
        >
          <p
            className="text-[9px] font-semibold tracking-[0.2em] mb-1.5"
            style={{ color: "rgba(255,255,255,0.30)" }}
          >
            ENDTIME
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: "#00b4ff" }}>
            {endTimeLabel}
          </p>
        </div>

        <div
          className="rounded-xl px-3.5 py-3"
          style={{ background: "rgba(255,255,255,0.038)" }}
        >
          <p
            className="text-[9px] font-semibold tracking-[0.2em] mb-1.5"
            style={{ color: "rgba(255,255,255,0.30)" }}
          >
            TOSS RATE
          </p>
          <p className="text-sm font-bold" style={{ color: "#00b4ff" }}>
            {tossRate}
          </p>
        </div>
      </div>

      {/* ── CTA button ─────────────────────────────────────── */}
      <div className="px-4 pb-4">
        <Button
          className="w-full h-12 text-sm font-extrabold tracking-[0.15em] transition-all"
          style={
            isClosed
              ? {
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.20)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "not-allowed",
                  boxShadow: "none",
                }
              : {
                  background: "linear-gradient(135deg, #00b4ff 0%, #0055ff 100%)",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 4px 24px rgba(0,180,255,0.30)",
                }
          }
          disabled={isClosed}
          onClick={() => onBet(match)}
        >
          {isClosed ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              BETTING CLOSED
            </>
          ) : (
            "BET ON TOSS"
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default MatchCard;
