import { Match } from "@/data/matches";
import { Button } from "@/components/ui/button";
import { Clock, Lock, Zap, ChevronRight, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

type MatchCardProps = {
  match: Match;
  onBet: (match: Match) => void;
};

// Generate a consistent 2-3 letter abbreviation from a team name
const getAbbr = (name: string): string => {
  const skip = new Set(["the", "of", "and", "women", "men", "a"]);
  const words = name.split(/\s+/).filter((w) => w.length > 1 && !skip.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (words.length >= 3) return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
};

// Hash team name to pick a gradient pair from a pool
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

const TeamAvatar = ({
  src, name, isLive, size = "lg",
}: { src: string; name: string; isLive: boolean; size?: "sm" | "lg" }) => {
  const [error, setError] = useState(false);
  const abbr = getAbbr(name);
  const [c1, c2] = GRADIENT_PAIRS[hashName(name)];
  const dim = size === "lg" ? "h-20 w-20" : "h-14 w-14";
  const textSize = size === "lg" ? "text-xl" : "text-sm";
  const ringColor = isLive ? "rgba(239,68,68,0.4)" : "rgba(0,212,180,0.25)";

  if (error || !src || src === "/placeholder.svg" || src === "") {
    return (
      <div className="relative flex shrink-0 items-center justify-center" style={{ width: size === "lg" ? 80 : 56, height: size === "lg" ? 80 : 56 }}>
        {/* Glow */}
        <div className="absolute inset-0 rounded-full blur-xl opacity-40" style={{ background: `radial-gradient(circle, ${c1}, transparent)` }} />
        {/* Ring */}
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${ringColor}, 0 0 20px ${ringColor}` }} />
        {/* Gradient circle */}
        <div className={`relative ${dim} rounded-full flex items-center justify-center`}
          style={{ background: `linear-gradient(135deg, ${c1}22, ${c2}33)`, border: `1.5px solid ${c1}44` }}>
          <span className={`font-black ${textSize} tracking-tight`}
            style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {abbr}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size === "lg" ? 80 : 56, height: size === "lg" ? 80 : 56 }}>
      <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: `radial-gradient(circle, ${c1}, transparent)` }} />
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${ringColor}` }} />
      <img src={src} alt={name} onError={() => setError(true)}
        className={`relative ${dim} rounded-full object-contain bg-secondary/60 p-1.5`} />
    </div>
  );
};

const MatchCard = ({ match, onBet }: MatchCardProps) => {
  const isClosed = match.status === "closed";
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const [imgError, setImgError] = useState(false);

  const accentColor = isLive ? "#ef4444" : isUpcoming ? "hsl(var(--primary))" : "#6b7280";

  return (
    <motion.div
      whileHover={!isClosed ? { y: -4, scale: 1.005 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`group relative overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow ${
        isLive
          ? "border-red-500/30 shadow-[0_0_32px_rgba(239,68,68,0.1)]"
          : isUpcoming
          ? "border-primary/20 hover:border-primary/40 hover:shadow-[0_0_28px_hsl(var(--primary)/0.1)]"
          : "border-border/30 opacity-70"
      }`}
    >
      {/* Animated top accent bar */}
      <div className={`h-[3px] w-full ${
        isLive ? "bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"
        : isUpcoming ? "bg-gradient-to-r from-transparent via-primary to-transparent"
        : "bg-gradient-to-r from-transparent via-border to-transparent"
      }`} />

      {/* Match schedule image */}
      {match.imageUrl && !imgError ? (
        <div className="relative overflow-hidden">
          <img src={match.imageUrl} alt="Match" className="w-full h-36 object-cover"
            onError={() => setImgError(true)} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-card" />

          {/* Status badge over image */}
          <div className="absolute top-3 left-3">
            <StatusBadge isLive={isLive} isUpcoming={isUpcoming} isClosed={isClosed} />
          </div>

          {/* Match time over image */}
          {(match.date || match.time) && (
            <div className="absolute bottom-3 right-3">
              <span className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white/80 border border-white/10">
                <Clock className="h-3 w-3" />
                {match.date && match.time ? `${match.date} · ${match.time}` : match.date || match.time}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Header row (no image) */
        <div className={`flex items-center justify-between px-4 py-3 ${
          isLive ? "bg-red-500/8" : isUpcoming ? "bg-primary/5" : "bg-secondary/20"
        }`}>
          <StatusBadge isLive={isLive} isUpcoming={isUpcoming} isClosed={isClosed} />
          {(match.date || match.time) && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {match.date && match.time ? `${match.date} · ${match.time}` : match.date || match.time}
            </span>
          )}
        </div>
      )}

      {/* Teams battle area */}
      <div className="relative flex items-center justify-between gap-2 px-5 py-6">
        {/* Subtle center glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: isLive
            ? "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.04) 0%, transparent 70%)"
            : "radial-gradient(ellipse at 50% 50%, hsl(var(--primary)/0.04) 0%, transparent 70%)",
        }} />

        {/* Team A */}
        <div className="flex flex-1 flex-col items-center gap-2.5">
          <TeamAvatar src={match.teamA.logo} name={match.teamA.name} isLive={isLive} size="lg" />
          <div className="text-center space-y-1.5">
            <p className="text-xs font-bold text-foreground leading-tight max-w-[90px] mx-auto">
              {match.teamA.name}
            </p>
            <OddsBadge value={match.oddsA} isLive={isLive} />
          </div>
        </div>

        {/* VS divider */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${
            isLive
              ? "border-red-500/20 bg-red-500/8"
              : "border-primary/15 bg-primary/5"
          }`}>
            <Swords className={`h-5 w-5 ${isLive ? "text-red-400/60" : "text-primary/50"}`} />
          </div>
          <span className="text-[9px] font-black tracking-widest text-muted-foreground/50">VS</span>
        </div>

        {/* Team B */}
        <div className="flex flex-1 flex-col items-center gap-2.5">
          <TeamAvatar src={match.teamB.logo} name={match.teamB.name} isLive={isLive} size="lg" />
          <div className="text-center space-y-1.5">
            <p className="text-xs font-bold text-foreground leading-tight max-w-[90px] mx-auto">
              {match.teamB.name}
            </p>
            <OddsBadge value={match.oddsB} isLive={isLive} />
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-border/30 bg-secondary/30 px-3 py-2 text-xs">
        <span className="text-muted-foreground">
          Max bet: <span className="font-bold text-primary">₹{match.maxBet.toLocaleString()}</span>
        </span>
        {match.closingTime && !isClosed && (
          <span className="flex items-center gap-1 font-medium text-amber-400">
            <Clock className="h-3 w-3" />
            Closes {new Date(match.closingTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 font-bold text-red-400 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Betting Open
          </span>
        )}
      </div>

      {/* CTA button */}
      <div className="px-4 pb-4">
        <Button
          className={`w-full font-bold h-11 text-sm transition-all gap-2 ${
            isClosed
              ? "bg-secondary/50 text-muted-foreground cursor-not-allowed border border-border/40"
              : isLive
              ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_4px_24px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_32px_rgba(239,68,68,0.5)] hover:scale-[1.01]"
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

// ---- Sub-components ----

const StatusBadge = ({ isLive, isUpcoming, isClosed }: { isLive: boolean; isUpcoming: boolean; isClosed: boolean }) => {
  if (isLive) return (
    <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] tracking-wide">
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
      LIVE
    </span>
  );
  if (isUpcoming) return (
    <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary tracking-wide">
      <Clock className="h-3 w-3" />
      UPCOMING
    </span>
  );
  if (isClosed) return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold text-white/40 tracking-wide">
      <Lock className="h-3 w-3" />
      CLOSED
    </span>
  );
  return null;
};

const OddsBadge = ({ value, isLive }: { value: number; isLive: boolean }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-extrabold tracking-wide border ${
    isLive
      ? "bg-red-500/10 text-red-400 border-red-500/25"
      : "bg-primary/10 text-primary border-primary/25"
  }`}>
    {value}x
  </span>
);

export default MatchCard;
