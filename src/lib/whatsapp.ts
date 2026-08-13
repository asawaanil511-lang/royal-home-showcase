const WA_NUMBER = "918369602674";

const getFallbackUsername = () => {
  if (typeof window === "undefined") return "Guest";
  return localStorage.getItem("stb_remember_user")?.trim() || "Guest";
};

export const buildWhatsAppLink = (message: string, username?: string | null) => {
  const resolvedUsername = username?.trim() || getFallbackUsername();
  const messageWithUsername = `${message}\n\n👤 Username: ${resolvedUsername}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(messageWithUsername)}`;
};