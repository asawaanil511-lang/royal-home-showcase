import { useEffect } from "react";

const Register = () => {
  useEffect(() => {
    window.location.href = "https://t.me/shrey14a";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <p className="text-muted-foreground">Redirecting to Telegram...</p>
    </div>
  );
};

export default Register;
