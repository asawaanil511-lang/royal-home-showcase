const Footer = () => {
  return (
    <footer className="border-t bg-secondary/30 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              R
            </div>
            <span className="text-lg font-bold text-foreground">ROYAL11</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">Terms</a>
            <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
            <a href="#" className="transition-colors hover:text-foreground">Support</a>
            <a href="#" className="transition-colors hover:text-foreground">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Royal11. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
