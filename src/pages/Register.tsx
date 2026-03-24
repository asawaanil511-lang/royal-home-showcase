import { useEffect } from "react";

const TELEGRAM_LINK = "https://t.me/shrey14a";

const Register = () => {
  useEffect(() => {
    window.open(TELEGRAM_LINK, "_blank");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Redirecting to Telegram...</p>
        <a
          href={TELEGRAM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold hover:underline"
        >
          Click here if not redirected
        </a>
      </div>
    </div>
  );
};

export default Register;
