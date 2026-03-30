import { Match } from "@/data/matches";
import { Button } from "@/components/ui/button";
import { Clock, Lock, Zap, ChevronRight, Swords, Trophy, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

type MatchCardProps = {
  match: Match;
  onBet: (match: Match) => void;
};

// ─── helpers ───────────────────────────────────────────────────────────────

const getAbbr = (name: string): string => {
  const skip = new Set(["the", "of", "and", "women", "men", "a"]);
  const words = name.split(/\s+/).filter((w) => w.length > 1 && !skip.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (words.length >= 3) return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
};

const GRADIENT_PAIRS = [
  ["#00d4b4", "#0099ff"],
  ["#f97316", "#ef4444"],
  ["#a855f7", "#6366f1"],
  ["#22c55e", "#14b8a6"],
  ["#eab308", "#f97316"],
  ["#ec4899", "#a855f7"],
  ["#06b6d4", "#3b82f6"],
  ["#84cc16", "#22c55e"],
];

const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h) % GRADIENT_PAIRS.length;
};

// ─── Countdown hook ─────────────────────────────────────────────────────────

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
  if (ms <= 0) return "Closed";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

// ─── TeamAvatar ──────────────────────────────────────────────────────────────

const TeamAvatar = ({
  src, name, isLive, isWinner = false, isLoser = false,
}: { src: string; name: string; isLive: boolean; isWinner?: boolean; isLoser?: boolean }) => {
  const [error, setError] = useState(false);
  const abbr = getAbbr(name);
  const [c1, c2] = GRADIENT_PAIRS[hashName(name)];

  const ringColor = isWinner
    ? "rgba(234,179,8,0.7)"
    : isLive
    ? "rgba(239,68,68,0.4)"
    : "rgba(0,212,180,0.2)";

  const content =
    error || !src || src === "/placeholder.svg" || src === "" ? (
      <div
        className="h-[72px] w-[72px] rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${c1}28, ${c2}40)`,
          border: `1.5px solid ${c1}50`,
        }}
      >
        <span
          className="text-lg font-black tracking-tight"
          style={{
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {abbr}
        </span>
      </div>
    ) : (
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        className="h-[72px] w-[72px] rounded-full object-contain bg-secondary/50 p-1.5"
      />
    );

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: 72, height: 72 }}>
      {/* colour bloom */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-35"
        style={{ background: `radial-gradient(circle, ${c1}, transparent 70%)` }}
      />
      {/* ring */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-500"
        style={{ boxShadow: `0 0 0 2px ${ringColor}, 0 0 ${isWinner ? "18px" : "10px"} ${ringColor}` }}
      />
      <div className="relative">{content}</div>
      {/* winner crown */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0, y: 4 }}
          animate={{ scale: 1, y: 0 }}
          className="absolute -top-3 left-1/2 -translate-x-1/2"
        >
          <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
        </motion.div>
      )}
    </div>
  );
};

// ─── OddsBadge ───────────────────────────────────────────────────────────────

const OddsBadge = ({ value, isLive, isWinner }: { value: number; isLive: boolean; isWinner?: boolean }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-extrabold tracking-wide border transition-all ${
      isWinner
        ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/30"
        : isLive
        ? "bg-red-500/10 text-red-400 border-red-500/25"
        : "bg-primary/10 text-primary border-primary/25"
    }`}
  >
    {value}x
  </span>
);

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const StatusBadge = ({
  isLive, isUpcoming, isClosed,
}: { isLive: boolean; isUpcoming: boolean; isClosed: boolean }) => {
  if (isLive)
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white shadow-[0_0_14px_rgba(239,68,68,0.6)] tracking-wider">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        LIVE
      </span>
    );
  if (isUpcoming)
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary tracking-wide">
        <Clock className="h-3 w-3" /> UPCOMING
      </span>
    );
  if (isClosed)
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-bold text-white/40 tracking-wide">
        <Lock className="h-3 w-3" /> CLOSED
      </span>
    );
  return null;
};

// ─── MatchCard ────────────────────────────────────────────────────────────────

const MatchCard = ({ match, onBet }: MatchCardProps) => {
  const isClosed = match.status === "closed";
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const [imgError, setImgError] = useState(false);

  const closingMs = useCountdown(isLive ? match.closingTime : null);
  const closingSoon = closingMs !== null && closingMs < 5 * 60 * 1000 && closingMs > 0;

  const winnerSide = match.winner; // "A" | "B" | null
  const winnerName = winnerSide === "A" ? match.teamA.name : winnerSide === "B" ? match.teamB.name : null;

  const hasImage = !!match.imageUrl && !imgError;

  return (
    <motion.div
      whileHover={!isClosed ? { y: -5, scale: 1.008 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`group relative overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow ${
        isLive
          ? "border-red-500/35 shadow-[0_0_36px_rgba(239,68,68,0.12)]"
          : isUpcoming
          ? "border-primary/22 hover:border-primary/45 hover:shadow-[0_0_28px_hsl(var(--primary)/0.12)]"
          : "border-border/30 opacity-80"
      }`}
    >
      {/* top accent bar */}
      <div
        className={`h-[3px] w-full ${
          isLive
            ? "bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"
            : isUpcoming
            ? "bg-gradient-to-r from-transparent via-primary to-transparent"
            : "bg-gradient-to-r from-transparent via-border/60 to-transparent"
        }`}
      />

      {/* ── Match image ──────────────────────────────────── */}
      {hasImage ? (
        <div className="relative overflow-hidden" style={{ height: 160 }}>
          <img
            src={match.imageUrl!}
            alt="Match schedule"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setImgError(true)}
          />
          {/* subtle vignette — only edges, NOT full overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/70 via-transparent to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/60" />

          {/* status badge */}
          <div className="absolute top-3 left-3">
            <StatusBadge isLive={isLive} isUpcoming={isUpcoming} isClosed={isClosed} />
          </div>

          {/* date/time pill */}
          {(match.date || match.time) && (
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                <Clock className="h-3 w-3" />
                {match.date} · {match.time}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* no image header */
        <div
          className={`flex items-center justify-between px-4 py-3 ${
            isLive ? "bg-red-500/8" : isUpcoming ? "bg-primary/5" : "bg-secondary/20"
          }`}
        >
          <StatusBadge isLive={isLive} isUpcoming={isUpcoming} isClosed={isClosed} />
          {(match.date || match.time) && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {match.date} · {match.time}
            </span>
          )}
        </div>
      )}

      {/* ── Teams ─────────────────────────────────────────── */}
      <div className="relative flex items-center justify-between gap-2 px-5 py-5">
        {/* ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isLive
              ? "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.05) 0%, transparent 70%)"
              : "radial-gradient(ellipse at 50% 50%, hsl(var(--primary)/0.04) 0%, transparent 70%)",
          }}
        />

        {/* Team A */}
        <div className={`flex flex-1 flex-col items-center gap-2 transition-opacity ${winnerSide === "B" ? "opacity-35" : ""}`}>
          <TeamAvatar
            src={match.teamA.logo}
            name={match.teamA.name}
            isLive={isLive}
            isWinner={winnerSide === "A"}
            isLoser={winnerSide === "B"}
          />
          <p className="text-center text-xs font-bold text-foreground leading-tight max-w-[90px]">
            {match.teamA.name}
          </p>
          <OddsBadge value={match.oddsA} isLive={isLive} isWinner={winnerSide === "A"} />
        </div>

        {/* VS / Result divider */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          {winnerSide ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-yellow-500/25 bg-yellow-500/10">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <span className="text-[9px] font-black tracking-widest text-yellow-400/60">WON</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                  isLive ? "border-red-500/20 bg-red-500/8" : "border-primary/15 bg-primary/5"
                }`}
              >
                <Swords className={`h-5 w-5 ${isLive ? "text-red-400/60" : "text-primary/45"}`} />
              </div>
              <span className="text-[9px] font-black tracking-widest text-muted-foreground/40">VS</span>
            </div>
          )}
        </div>

        {/* Team B */}
        <div className={`flex flex-1 flex-col items-center gap-2 transition-opacity ${winnerSide === "A" ? "opacity-35" : ""}`}>
          <TeamAvatar
            src={match.teamB.logo}
            name={match.teamB.name}
            isLive={isLive}
            isWinner={winnerSide === "B"}
            isLoser={winnerSide === "A"}
          />
          <p className="text-center text-xs font-bold text-foreground leading-tight max-w-[90px]">
            {match.teamB.name}
          </p>
          <OddsBadge value={match.oddsB} isLive={isLive} isWinner={winnerSide === "B"} />
        </div>
      </div>

      {/* ── Winner result banner ──────────────────────────── */}
      <AnimatePresence>
        {winnerName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-3 overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-amber-500/8 to-yellow-500/10 px-4 py-2.5">
              <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
              <p className="text-xs font-extrabold text-yellow-300 tracking-wide">
                <span className="text-yellow-500/70 font-medium mr-1">Won the toss:</span>
                {winnerName}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Info strip ────────────────────────────────────── */}
      <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-border/25 bg-secondary/25 px-3 py-2 text-xs gap-2">
        <span className="text-muted-foreground shrink-0">
          Max: <span className="font-bold text-primary">₹{match.maxBet.toLocaleString()}</span>
        </span>

        {/* countdown timer for live matches */}
        {isLive && match.closingTime && closingMs !== null && (
          <motion.span
            key={closingMs !== null && closingMs < 60000 ? "urgent" : "normal"}
            className={`flex items-center gap-1 font-bold tabular-nums ${
              closingSoon ? "text-red-400 animate-pulse" : "text-amber-400"
            }`}
          >
            <Timer className="h-3 w-3 shrink-0" />
            {closingMs === 0 ? "Closing…" : formatCountdown(closingMs)}
          </motion.span>
        )}

        {isLive && !match.closingTime && (
          <span className="flex items-center gap-1 font-bold text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            Live
          </span>
        )}

        {isClosed && !winnerName && (
          <span className="text-muted-foreground/60 font-medium">Settled</span>
        )}
      </div>

      {/* ── CTA ───────────────────────────────────────────── */}
      <div className="px-4 pb-4">
        <Button
          className={`w-full font-bold h-11 text-sm gap-2 transition-all ${
            isClosed
              ? "bg-secondary/40 text-muted-foreground cursor-not-allowed border border-border/30"
              : isLive
              ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_4px_20px_rgba(239,68,68,0.35)] hover:shadow-[0_4px_32px_rgba(239,68,68,0.55)] hover:scale-[1.01]"
              : "gradient-neon-primary text-primary-foreground shadow-neon hover:opacity-95 hover:shadow-[0_4px_32px_hsl(var(--primary)/0.5)] hover:scale-[1.01]"
          }`}
          disabled={isClosed}
          onClick={() => onBet(match)}
        >
          {isClosed ? (
            <><Lock className="h-4 w-4" /> Betting Closed</>
          ) : isLive ? (
            <><Zap className="h-4 w-4" /> Bet Live Now</>
          ) : (
            <>Place Bet <ChevronRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default MatchCard;
