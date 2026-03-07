import { Match } from "@/data/matches";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

type MatchCardProps = {
  match: Match;
  onBet: (match: Match) => void;
};

const statusLabel: Record<string, string> = {
  live: "● LIVE",
  upcoming: "Upcoming",
  closed: "Betting Closed",
};

const MatchCard = ({ match, onBet }: MatchCardProps) => {
  const isClosed = match.status === "closed";

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-card-hover">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-2.5">
        <span className="text-sm font-semibold text-primary-foreground">Cricket Match</span>
        <Info className="h-4 w-4 text-primary-foreground/70" />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-4 px-6 py-6">
        <div className="flex flex-col items-center gap-2 flex-1">
          <img
            src={match.teamA.logo}
            alt={match.teamA.name}
            className="h-20 w-20 rounded-full border-2 border-border bg-secondary object-contain p-1"
          />
          <span className="text-center text-sm font-semibold text-card-foreground leading-tight">
            {match.teamA.name}
          </span>
        </div>
        <span className="shrink-0 text-lg font-bold text-muted-foreground">v/s</span>
        <div className="flex flex-col items-center gap-2 flex-1">
          <img
            src={match.teamB.logo}
            alt={match.teamB.name}
            className="h-20 w-20 rounded-full border-2 border-border bg-secondary object-contain p-1"
          />
          <span className="text-center text-sm font-semibold text-card-foreground leading-tight">
            {match.teamB.name}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-2 text-center text-xs text-muted-foreground">
        Max Bet: <span className="font-semibold text-primary">₹{match.maxBet.toLocaleString()}</span>
        <span className="mx-1">•</span>
        {match.date} {match.time}
      </div>

      {/* Status */}
      <div className="px-4 py-2 text-center">
        <span
          className={`text-sm font-medium ${
            match.status === "live"
              ? "text-success"
              : match.status === "closed"
              ? "text-destructive"
              : "text-accent"
          }`}
        >
          {statusLabel[match.status]}
        </span>
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        <Button
          className="w-full font-semibold"
          disabled={isClosed}
          onClick={() => onBet(match)}
        >
          {isClosed ? "Match Ended" : "Bet Now"}
        </Button>
      </div>
    </div>
  );
};

export default MatchCard;
