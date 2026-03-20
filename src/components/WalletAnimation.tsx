import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, TrendingDown } from "lucide-react";

const WalletAnimation = () => {
  const { walletChange } = useAuth();
  const [visible, setVisible] = useState(false);
  const [change, setChange] = useState<{ amount: number; type: "credit" | "debit"; timestamp: number } | null>(null);

  useEffect(() => {
    if (walletChange && walletChange.timestamp !== change?.timestamp) {
      setChange(walletChange);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [walletChange]);

  const isCredit = change?.type === "credit";

  return (
    <AnimatePresence>
      {visible && change && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="fixed bottom-6 right-6 z-[100] pointer-events-none"
        >
          <div
            className={`flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl border backdrop-blur-md ${
              isCredit
                ? "bg-emerald-950/80 border-emerald-500/40 shadow-emerald-500/20"
                : "bg-red-950/80 border-red-500/40 shadow-red-500/20"
            }`}
          >
            {/* Animated icon */}
            <motion.div
              initial={{ rotate: -20, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
            >
              {isCredit ? (
                <TrendingUp className="h-7 w-7 text-emerald-400" />
              ) : (
                <TrendingDown className="h-7 w-7 text-red-400" />
              )}
            </motion.div>

            <div className="flex flex-col">
              <span className={`text-xs font-medium ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                {isCredit ? "Coins Added" : "Coins Deducted"}
              </span>
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className={`text-xl font-extrabold tabular-nums ${isCredit ? "text-emerald-300" : "text-red-300"}`}
              >
                {isCredit ? "+" : "−"}₹{change.amount.toLocaleString()}
              </motion.span>
            </div>

            {/* Floating particles */}
            {isCredit && (
              <>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400/60"
                    initial={{ opacity: 1, x: 0, y: 0 }}
                    animate={{
                      opacity: 0,
                      x: (i % 2 === 0 ? 1 : -1) * (20 + i * 10),
                      y: -(30 + i * 15),
                    }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                  />
                ))}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WalletAnimation;
