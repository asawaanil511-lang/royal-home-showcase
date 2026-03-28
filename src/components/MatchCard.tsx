import { Match } from "@/data/matches";
import { Button } from "@/components/ui/button";
import { Clock, Lock, Zap, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

type MatchCardProps = {
  match: Match;
  onBet: (match: Match) => void;
};

const TeamLogo = ({ src, alt, isLive }: { src: string; alt: string; isLive: boolean }) => {
  const [error, setError] = useState(false);

  if (error || !src || src === "/placeholder.svg") {
    return (
      <div className={`relative h-16 w-16 rounded-full border-2 flex items-center justify-center bg-secondary text-xl font-black text-primary ${isLive ? "border-red-500/30" : "border-primary/20"}`}>
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`absolute inset-0 rounded-full blur-lg opacity-25 ${isLive ? "bg-red-400" : "bg-primary"}`} />
      <img
        src={src}
        alt={alt}
        className={`relative h-16 w-16 rounded-full border-2 bg-secondary object-contain p-1 ${isLive ? "border-red-500/30" : "border-primary/20"}`}
        onError={() => setError(true)}
      />
    </div>
  );
};

const MatchCard = ({ match, onBet }: MatchCardProps) => {
  const isClosed = match.status === "closed";
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      whileHover={!isClosed ? { y: -5, scale: 1.01 } : {}}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className={`overflow-hidden rounded-2xl border bg-card shadow-card transition-all ${
        isLive
          ? "border-red-500/40 shadow-[0_0_28px_hsl(0deg_80%_55%/0.12)]"
          : isUpcoming
          ? "border-primary/25 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(var(--primary)/0.12)]"
          : "border-border/40 opacity-75"
      }`}
    >
      {/* Status bar top */}
      <div className={`h-1 w-full ${
        isLive
          ? "bg-gradient-to-r from-red-600 via-red-400 to-red-600 animate-pulse"
          : isUpcoming
          ? "bg-gradient-to-r from-primary via-cyan-400 to-primary"
          : "bg-muted/50"
      }`} />

      {/* Match image or header */}
      {match.imageUrl && !imgError ? (
        <div className="relative">
          <img
            src={match.imageUrl}
            alt="Match Schedule"
            className="w-full h-40 object-cover"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-card/90" />

          {/* Status badge overlay */}
          <div className="absolute top-2 left-2">
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            {isUpcoming && (
              <span className="flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-bold text-primary-foreground">
                <Clock className="h-3 w-3" />
                UPCOMING
              </span>
            )}
            {isClosed && (
              <span className="flex items-center gap-1 rounded-full bg-black/70 border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/50">
                <Lock className="h-3 w-3" />
                CLOSED
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className={`flex items-center justify-between px-4 py-3 ${
          isLive ? "bg-red-600/15" : isUpcoming ? "bg-primary/8" : "bg-muted/20"
        }`}>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            {isUpcoming && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                <Clock className="h-3 w-3" />
                UPCOMING
              </span>
            )}
            {isClosed && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <Lock className="h-3 w-3" />
                CLOSED
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{match.date} · {match.time}</span>
        </div>
      )}

      {/* Teams section */}
      <div
        className="flex items-center justify-center gap-4 px-5 py-5"
        style={{ background: "linear-gradient(180deg, transparent 0%, hsl(230 22% 10% / 0.3) 100%)" }}
      >
        {/* Team A */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamLogo src={match.teamA.logo} alt={match.teamA.name} isLive={isLive} />
          <span className="text-center text-xs font-bold text-card-foreground leading-tight max-w-[80px]">
            {match.teamA.name}
          </span>
          <span className={`text-xs font-extrabold rounded-full px-2.5 py-0.5 ${
            isLive ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-primary/10 text-primary border border-primary/20"
          }`}>
            {match.oddsA}x
          </span>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-extrabold text-white/40">
            VS
          </div>
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <TeamLogo src={match.teamB.logo} alt={match.teamB.name} isLive={isLive} />
          <span className="text-center text-xs font-bold text-card-foreground leading-tight max-w-[80px]">
            {match.teamB.name}
          </span>
          <span className={`text-xs font-extrabold rounded-full px-2.5 py-0.5 ${
            isLive ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-primary/10 text-primary border border-primary/20"
          }`}>
            {match.oddsB}x
          </span>
        </div>
      </div>

      {/* Info row */}
      <div className="px-4 pb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Max: <span className="text-primary font-bold">₹{match.maxBet.toLocaleString()}</span></span>
        {match.closingTime && !isClosed && (
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <Clock className="h-3 w-3" />
            Closes {new Date(match.closingTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Button
          className={`w-full font-bold transition-all h-11 text-sm ${
            isClosed
              ? "bg-muted/50 text-muted-foreground cursor-not-allowed border border-border/40"
              : isLive
              ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_0_20px_hsl(0deg_80%_55%/0.3)] hover:shadow-[0_0_28px_hsl(0deg_80%_55%/0.5)] hover:opacity-95"
              : "gradient-neon-primary text-primary-foreground shadow-neon hover:opacity-95 hover:shadow-[0_0_28px_hsl(var(--primary)/0.5)]"
          }`}
          disabled={isClosed}
          onClick={() => onBet(match)}
        >
          {isClosed ? (
            <><Lock className="h-4 w-4 mr-2" /> Betting Closed</>
          ) : isLive ? (
            <><Zap className="h-4 w-4 mr-2" /> Bet Live Now</>
          ) : (
            <>Bet Now <ChevronRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default MatchCard;
