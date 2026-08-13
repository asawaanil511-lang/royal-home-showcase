import { useEffect } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const Register = () => {
  const whatsappLink = buildWhatsAppLink("I need toss id");

  useEffect(() => {
    window.open(whatsappLink, "_blank");
  }, [whatsappLink]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Redirecting to WhatsApp...</p>
        <a
          href={whatsappLink}
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
