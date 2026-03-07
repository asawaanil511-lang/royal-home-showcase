import { useState } from "react";
import { Match } from "@/data/matches";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type BetDialogProps = {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const BetDialog = ({ match, open, onOpenChange }: BetDialogProps) => {
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
  const [amount, setAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const { toast } = useToast();

  if (!match) return null;

  const selectedOdds = selectedTeam === "A" ? match.oddsA : selectedTeam === "B" ? match.oddsB : 0;
  const potentialWin = selectedOdds * Number(amount || 0);

  const handlePlaceBet = () => {
    const betAmount = Number(amount);
    if (!selectedTeam) {
      toast({ title: "Select a team", description: "Please pick which team you want to bet on.", variant: "destructive" });
      return;
    }
    if (!betAmount || betAmount < 100) {
      toast({ title: "Invalid amount", description: "Minimum bet is ₹100.", variant: "destructive" });
      return;
    }
    if (betAmount > match.maxBet) {
      toast({ title: "Exceeds max bet", description: `Maximum bet is ₹${match.maxBet.toLocaleString()}.`, variant: "destructive" });
      return;
    }

    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      const teamName = selectedTeam === "A" ? match.teamA.name : match.teamB.name;
      toast({
        title: "🎉 Bet Placed!",
        description: `₹${betAmount.toLocaleString()} on ${teamName}. Potential win: ₹${potentialWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      });
      setSelectedTeam(null);
      setAmount("");
      onOpenChange(false);
    }, 1200);
  };

  const quickAmounts = [500, 1000, 5000, 10000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Place Your Bet</DialogTitle>
          <DialogDescription className="text-center">
            {match.teamA.name} vs {match.teamB.name}
          </DialogDescription>
        </DialogHeader>

        {/* Team selection */}
        <div className="grid grid-cols-2 gap-3 py-4">
          <button
            onClick={() => setSelectedTeam("A")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              selectedTeam === "A"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/40"
            }`}
          >
            <img src={match.teamA.logo} alt={match.teamA.name} className="h-14 w-14 rounded-full object-contain" />
            <span className="text-sm font-semibold text-card-foreground">{match.teamA.name}</span>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
              {match.oddsA}x
            </span>
          </button>
          <button
            onClick={() => setSelectedTeam("B")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              selectedTeam === "B"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/40"
            }`}
          >
            <img src={match.teamB.logo} alt={match.teamB.name} className="h-14 w-14 rounded-full object-contain" />
            <span className="text-sm font-semibold text-card-foreground">{match.teamB.name}</span>
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
              {match.oddsB}x
            </span>
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Bet Amount (₹)</label>
          <Input
            type="number"
            placeholder="Enter amount (min ₹100)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={100}
            max={match.maxBet}
          />
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                className="rounded-lg border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                ₹{q.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {selectedTeam && Number(amount) > 0 && (
          <div className="rounded-xl bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground">Potential Winnings</p>
            <p className="text-2xl font-extrabold text-success">
              ₹{potentialWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">
              at {selectedOdds}x odds
            </p>
          </div>
        )}

        <Button
          className="w-full font-semibold"
          size="lg"
          onClick={handlePlaceBet}
          disabled={placing}
        >
          {placing ? "Placing Bet..." : "Confirm Bet"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BetDialog;
