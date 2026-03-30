import team1 from "@/assets/team1.png";
import team2 from "@/assets/team2.png";
import team3 from "@/assets/team3.png";
import team4 from "@/assets/team4.png";
import team5 from "@/assets/team5.png";
import team6 from "@/assets/team6.png";

export type Match = {
  id: string;
  teamA: { name: string; logo: string };
  teamB: { name: string; logo: string };
  maxBet: number;
  date: string;
  time: string;
  status: "live" | "upcoming" | "closed";
  oddsA: number;
  oddsB: number;
  imageUrl?: string | null;
  liveTime?: string | null;
  closingTime?: string | null;
  winner?: string | null;
};

export const matches: Match[] = [
  {
    id: "1",
    teamA: { name: "East Zone", logo: team1 },
    teamB: { name: "North East Zone", logo: team2 },
    maxBet: 100000,
    date: "07 Mar",
    time: "10:00 PM",
    status: "live",
    oddsA: 1.85,
    oddsB: 1.95,
  },
  {
    id: "2",
    teamA: { name: "Central Zone", logo: team3 },
    teamB: { name: "South Zone", logo: team4 },
    maxBet: 100000,
    date: "07 Mar",
    time: "10:00 PM",
    status: "live",
    oddsA: 1.75,
    oddsB: 2.05,
  },
  {
    id: "3",
    teamA: { name: "Royal Kings", logo: team5 },
    teamB: { name: "Eagle Warriors", logo: team6 },
    maxBet: 100000,
    date: "07 Mar",
    time: "10:00 PM",
    status: "live",
    oddsA: 1.90,
    oddsB: 1.90,
  },
  {
    id: "4",
    teamA: { name: "Eagle Warriors", logo: team6 },
    teamB: { name: "East Zone", logo: team1 },
    maxBet: 100000,
    date: "08 Mar",
    time: "07:30 PM",
    status: "upcoming",
    oddsA: 2.10,
    oddsB: 1.70,
  },
];
