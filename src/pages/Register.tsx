import { useEffect } from "react";

const WHATSAPP_LINK = "https://wa.me/917735091610?text=I%20need%20toss%20id";

const Register = () => {
  useEffect(() => {
    window.open(WHATSAPP_LINK, "_blank");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Redirecting to WhatsApp...</p>
        <a
          href={WHATSAPP_LINK}
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
