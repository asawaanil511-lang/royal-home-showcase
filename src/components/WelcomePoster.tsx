import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import poster from "@assets/IMG-20260815-WA0002_1786960061863.jpg";
import { takeWelcomePosterPending } from "@/lib/welcomePoster";

const WelcomePoster = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setVisible(false);
      return;
    }

    if (takeWelcomePosterPending()) setVisible(true);
  }, [user]);

  useEffect(() => {
    if (!visible) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="RS Toss Book welcome and safety notice"
      onClick={() => setVisible(false)}
    >
      <div
        className="relative max-h-[92vh] max-w-[min(92vw,34rem)] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={poster}
          alt="Welcome to RS Toss Book. Never share your password and use only rstossbook.com."
          className="block max-h-[92vh] w-auto max-w-full object-contain"
          decoding="async"
          fetchPriority="high"
        />
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close welcome poster"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/50 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default WelcomePoster;