import { Match } from "@/data/matches";
import { Button } from "@/components/ui/button";
import { Clock, Lock, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

type MatchCardProps = {
  match: Match;
  onBet: (match: Match) => void;
};

const MatchCard = ({ match, onBet }: MatchCardProps) => {
  const isClosed = match.status === "closed";
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`overflow-hidden rounded-2xl border bg-card shadow-card transition-all ${
        isLive
          ? "border-red-500/40 shadow-[0_0_24px_hsl(0deg_80%_55%/0.1)]"
          : isUpcoming
          ? "border-primary/30"
          : "border-border/40 opacity-80"
      }`}
    >
      {/* Status bar top */}
      <div className={`h-1.5 w-full ${
        isLive ? "bg-gradient-to-r from-red-600 via-red-400 to-red-600 animate-pulse" :
        isUpcoming ? "bg-gradient-to-r from-primary to-cyan-400" :
        "bg-muted"
      }`} />

      {/* Schedule image */}
      {match.imageUrl && !imgError ? (
        <div className="relative">
          <img
            src={match.imageUrl}
            alt="Match Schedule"
            className="w-full h-36 object-cover"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />
          {/* Status overlay */}
          <div className="absolute top-2 left-2">
            {isLive && (
              <span className="flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            {isUpcoming && (
              <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                <Clock className="h-3 w-3" />
                UPCOMING
              </span>
            )}
            {isClosed && (
              <span className="flex items-center gap-1 rounded-full bg-black/60 border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/60">
                <Lock className="h-3 w-3" />
                CLOSED
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Default header */
        <div className={`flex items-center justify-between px-4 py-2.5 ${
          isLive ? "bg-red-600/20" : isUpcoming ? "bg-primary/10" : "bg-muted/30"
        }`}>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
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
          <span className="text-xs text-muted-foreground">{match.date} {match.time}</span>
        </div>
      )}

      {/* Teams */}
      <div className="flex items-center justify-center gap-4 px-5 py-5">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-lg opacity-30 ${isLive ? "bg-red-400" : "bg-primary"}`} />
            <img
              src={match.teamA.logo}
              alt={match.teamA.name}
              className="relative h-16 w-16 rounded-full border-2 border-white/10 bg-secondary object-contain p-1"
            />
          </div>
          <span className="text-center text-xs font-bold text-card-foreground leading-tight">{match.teamA.name}</span>
          <span className="text-xs font-extrabold text-primary bg-primary/10 rounded-full px-2 py-0.5">{match.oddsA}x</span>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-extrabold text-white/50">
            VS
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-lg opacity-30 ${isLive ? "bg-red-400" : "bg-primary"}`} />
            <img
              src={match.teamB.logo}
              alt={match.teamB.name}
              className="relative h-16 w-16 rounded-full border-2 border-white/10 bg-secondary object-contain p-1"
            />
          </div>
          <span className="text-center text-xs font-bold text-card-foreground leading-tight">{match.teamB.name}</span>
          <span className="text-xs font-extrabold text-primary bg-primary/10 rounded-full px-2 py-0.5">{match.oddsB}x</span>
        </div>
      </div>

      {/* Info row */}
      <div className="px-4 pb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Max: <span className="text-primary font-semibold">₹{match.maxBet.toLocaleString()}</span></span>
        {!match.imageUrl && <span>{match.date} {match.time}</span>}
        {match.closingTime && !isClosed && (
          <span className="flex items-center gap-1 text-amber-400">
            <Clock className="h-3 w-3" />
            Closes: {new Date(match.closingTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        <Button
          className={`w-full font-bold transition-all ${
            isClosed
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : isLive
              ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_16px_hsl(0deg_80%_55%/0.3)] hover:opacity-90"
              : "gradient-neon-primary text-primary-foreground shadow-neon hover:opacity-90"
          }`}
          disabled={isClosed}
          onClick={() => onBet(match)}
        >
          {isClosed ? (
            <><Lock className="h-4 w-4 mr-2" /> Betting Closed</>
          ) : isLive ? (
            "⚡ Bet Live Now"
          ) : (
            "Bet Now"
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default MatchCard;
