import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-neon-primary text-sm font-bold text-primary-foreground shadow-neon">
              R
            </div>
            <span className="text-lg font-bold text-foreground">ROYAL11</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/matches" className="transition-colors hover:text-primary">Matches</Link>
            <Link to="/coinflip" className="transition-colors hover:text-primary">Coin Flip</Link>
            <Link to="/leaderboard" className="transition-colors hover:text-primary">Leaderboard</Link>
            <Link to="/results" className="transition-colors hover:text-primary">Results</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Royal11. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
