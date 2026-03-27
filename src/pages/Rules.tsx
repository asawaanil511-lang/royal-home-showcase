import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Clock, CreditCard, Camera, AlertTriangle, Lock, Heart, CheckCircle, Star, Info } from "lucide-react";
import supermanLogo from "@/assets/superman-logo.jpg";

type RuleVariant = "success" | "danger" | "warning" | "info" | "love";

type Rule = {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  badge: string;
  variant: RuleVariant;
  hindi?: string;
};

const rules: Rule[] = [
  {
    id: 1,
    icon: Clock,
    text: "PAYMENT DETAILS ARE VALID ONLY FOR 10 MINS",
    badge: "✅",
    variant: "success",
  },
  {
    id: 2,
    icon: CreditCard,
    text: "EVERYTIME YOU DEPOSIT, YOU HAVE TO ASK PAY DETAILS EVERYTIME",
    badge: "✅",
    variant: "success",
  },
  {
    id: 3,
    icon: Camera,
    text: "ALWAYS SEND DETAILED SCREENSHOT WITH UTR NUMBER",
    badge: "✅",
    variant: "success",
  },
  {
    id: 4,
    icon: AlertTriangle,
    text: "IF YOU PAY ON OLD DETAILS MONEY WILL NOT BE ADDED",
    badge: "❌",
    variant: "danger",
  },
  {
    id: 5,
    icon: AlertTriangle,
    text: "IF ANY AMOUNT GOES ON HOLD/LEIN OR OUR ACCOUNT GETS FROZEN BY YOUR DEPOSIT WE WILL INVALID YOUR DEPOSIT MONEY AND WILL NOT GIVE ANY WITHDRAWAL SO PLEASE SEND ONLY GENUINE MONEY. FRAUD MONEY NOT ACCEPTED.",
    badge: "⚠️",
    variant: "warning",
  },
  {
    id: 6,
    icon: CreditCard,
    text: "SAME BANK DEPOSIT SAME BANK WITHDRAWAL IS COMPULSORY. FROM WHICH ACCOUNT YOU WILL PAY, ONLY IN THAT ACCOUNT YOU WILL GET WITHDRAWAL. PLEASE MAKE TRANSACTIONS YOURSELF, NOT FROM OTHERS.",
    badge: "👍",
    variant: "info",
    hindi: "आप जिस खाते से पेमेंट करेंगे आपको उसी खाते पर विड्राल दिया जायेगा, किसी दूसरे पर नही मिलेगा, इसलिए खुद से पेमेंट करें दूसरों से ना करवायें",
  },
  {
    id: 7,
    icon: AlertTriangle,
    text: "यदि आपके द्वारा भेजे गये पैसे से हमारे खाते पर किसी भी प्रकार का लीन/होल्ड लगता है या हमारा खाता ब्लाक होता है तो हम आपके भेजे हुए पैसे को अमान्य कर देंगे, आपका कोई भी डिपाजिट या विड्राल नही होगा, इसलिए आपसे अनुरोध है फ्राड का पैसा ना भेजे, धन्यवाद",
    badge: "⚠️",
    variant: "warning",
  },
  {
    id: 8,
    icon: Lock,
    text: "ONCE BET IS CLOSED ON SITE, DON'T DISTURB ON WHATSAPP. SO DO BET ON TIME.",
    badge: "👍",
    variant: "info",
  },
  {
    id: 9,
    icon: Lock,
    text: "IF THE TOSS IS OPEN AND TOSS IS DONE THEN ALL THE TOSS BETS WILL BE INVALID",
    badge: "❤️",
    variant: "love",
  },
  {
    id: 10,
    icon: Heart,
    text: "MINIMUM BET ₹100",
    badge: "❤️",
    variant: "love",
  },
  {
    id: 11,
    icon: Heart,
    text: "TOSS RATE IS 95P",
    badge: "❤️",
    variant: "love",
  },
  {
    id: 12,
    icon: CheckCircle,
    text: "SETTLEMENT WILL BE DONE IN 10 MINUTES FOR INTERNATIONAL AND QUALITY LEAGUES. FOR DOMESTIC AND ECS TOSSES SETTLEMENT WILL BE DONE IN 1 HOUR.",
    badge: "✅",
    variant: "success",
  },
  {
    id: 13,
    icon: CheckCircle,
    text: "ONCE IN A DAY WITHDRAWAL ANYTIME AFTER BET SETTLEMENT",
    badge: "✅",
    variant: "success",
  },
  {
    id: 14,
    icon: Heart,
    text: "WE ALSO PROVIDE MATCH ID FOR SESSION MATCH AND CASINO BET. @Ironmanids",
    badge: "❤️",
    variant: "love",
  },
];

const variantStyles: Record<RuleVariant, { border: string; iconBg: string; iconColor: string; glow: string }> = {
  success: {
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    glow: "hover:border-emerald-500/60 hover:shadow-[0_0_16px_hsl(142deg_76%_36%/0.15)]",
  },
  danger: {
    border: "border-red-500/30",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    glow: "hover:border-red-500/60 hover:shadow-[0_0_16px_hsl(0deg_84%_60%/0.15)]",
  },
  warning: {
    border: "border-yellow-500/30",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    glow: "hover:border-yellow-500/60 hover:shadow-[0_0_16px_hsl(45deg_100%_60%/0.15)]",
  },
  info: {
    border: "border-blue-500/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glow: "hover:border-blue-500/60 hover:shadow-[0_0_16px_hsl(217deg_91%_60%/0.15)]",
  },
  love: {
    border: "border-primary/30",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    glow: "hover:border-primary/60 hover:shadow-neon",
  },
};

const RuleCard = ({ rule, index }: { rule: Rule; index: number }) => {
  const styles = variantStyles[rule.variant];
  const IconComp = rule.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      whileHover={{ scale: 1.01 }}
      className={`flex items-start gap-4 rounded-2xl border bg-card/80 p-4 backdrop-blur-sm transition-all duration-300 cursor-default ${styles.border} ${styles.glow}`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}>
        <IconComp className={`h-5 w-5 ${styles.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-relaxed">{rule.text}</p>
        {rule.hindi && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{rule.hindi}</p>
        )}
      </div>
      <span className="text-lg shrink-0">{rule.badge}</span>
    </motion.div>
  );
};

const Rules = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero section */}
      <section className="relative overflow-hidden py-16 text-center">
        <div className="pointer-events-none absolute -left-40 top-0 h-[400px] w-[400px] rounded-full bg-primary/6 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[120px]" />

        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.img
              src={supermanLogo}
              alt="Superman Toss Book"
              className="mx-auto mb-5 h-16 w-16 rounded-full object-cover border-2 border-primary/50"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            />
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Info className="h-4 w-4" />
              Important Information
            </div>
            <h1 className="mb-3 text-4xl font-extrabold text-foreground md:text-5xl">
              Rules & <span className="text-neon">Guidelines</span>
            </h1>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Please read all rules carefully before depositing or placing bets. These rules ensure fair play for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Rules list */}
      <section className="container mx-auto px-4 pb-8 max-w-2xl">
        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-wrap gap-3 justify-center"
        >
          {[
            { emoji: "✅", label: "Allowed", color: "text-emerald-400" },
            { emoji: "❌", label: "Not Allowed", color: "text-red-400" },
            { emoji: "⚠️", label: "Warning", color: "text-yellow-400" },
            { emoji: "👍", label: "Note", color: "text-blue-400" },
            { emoji: "❤️", label: "Info", color: "text-primary" },
          ].map((l) => (
            <span key={l.label} className={`flex items-center gap-1.5 text-xs font-medium rounded-full bg-card border border-border/50 px-3 py-1.5 ${l.color}`}>
              <span>{l.emoji}</span> {l.label}
            </span>
          ))}
        </motion.div>

        <div className="space-y-3">
          {rules.map((rule, i) => (
            <RuleCard key={rule.id} rule={rule} index={i} />
          ))}
        </div>

        {/* Special Info box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-2xl border border-yellow-500/40 p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a1500 0%, #2a1f00 100%)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: "#fbbf24" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <h3 className="text-lg font-extrabold text-yellow-400 tracking-wide">SPECIAL INFO</h3>
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="space-y-3 text-sm text-white/80 leading-relaxed">
              <p>
                If the toss has been cancelled in the Telegram book, that <span className="text-yellow-400 font-semibold">doesn't mean</span> that toss is also invalid in online toss ID.
              </p>
              <p>
                It is valid in the online ID. Until the toss is not abandoned, it will <span className="text-yellow-400 font-semibold">not be cancelled</span> in the online site.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 flex items-center gap-2 justify-center rounded-xl border border-border/30 bg-card/50 p-4"
        >
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground text-center">
            These rules are subject to change. Please check regularly for updates.
          </p>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Rules;
