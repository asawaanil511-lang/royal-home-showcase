import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Clock, CreditCard, Camera, AlertTriangle, Lock, Heart, CheckCircle,
  Star, Info, ChevronDown, BadgeAlert, ShieldCheck, Banknote, Gavel,
  MessageCircle, Trophy, Zap, ArrowRight
} from "lucide-react";
import betwicLogo from "@/assets/betwic-logo.jpg";

type Variant = "success" | "danger" | "warning" | "info" | "love";

type Rule = {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  hindi?: string;
  variant: Variant;
  badge: string;
};

type Section = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  rules: Rule[];
};

const sections: Section[] = [
  {
    id: "payment",
    title: "Payment Rules",
    subtitle: "Follow these strictly for all deposits",
    icon: Banknote,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    rules: [
      {
        icon: Clock,
        text: "Payment details are valid for only 10 minutes. Request fresh details for every deposit.",
        variant: "success",
        badge: "✅",
      },
      {
        icon: CreditCard,
        text: "Every time you deposit, ask for new payment details. Old details expire after each transaction.",
        variant: "success",
        badge: "✅",
      },
      {
        icon: Camera,
        text: "Always send a detailed screenshot with your UTR number as proof of payment.",
        variant: "success",
        badge: "✅",
      },
      {
        icon: AlertTriangle,
        text: "If you pay on old/expired payment details, the money will NOT be added to your account.",
        variant: "danger",
        badge: "❌",
      },
      {
        icon: CreditCard,
        text: "Same bank deposit = same bank withdrawal only. Withdraw only to the account you deposited from. Make transactions yourself, not through others.",
        variant: "info",
        badge: "👍",
        hindi: "आप जिस खाते से पेमेंट करेंगे आपको उसी खाते पर विड्राल दिया जायेगा, किसी दूसरे पर नही मिलेगा, इसलिए खुद से पेमेंट करें दूसरों से ना करवायें",
      },
    ],
  },
  {
    id: "fraud",
    title: "Fraud & Security",
    subtitle: "Protect yourself and others",
    icon: ShieldCheck,
    iconColor: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    rules: [
      {
        icon: AlertTriangle,
        text: "If your deposit causes any hold, lien, or account freeze on our end, your deposit will be invalidated and no withdrawal will be processed.",
        variant: "warning",
        badge: "⚠️",
      },
      {
        icon: AlertTriangle,
        text: "यदि आपके द्वारा भेजे गये पैसे से हमारे खाते पर किसी भी प्रकार का लीन/होल्ड लगता है या हमारा खाता ब्लाक होता है तो हम आपके भेजे हुए पैसे को अमान्य कर देंगे। फ्राड का पैसा ना भेजे, धन्यवाद।",
        variant: "warning",
        badge: "⚠️",
      },
      {
        icon: BadgeAlert,
        text: "Only genuine money is accepted. Fraud money will not be accepted and deposits will be invalidated.",
        variant: "danger",
        badge: "❌",
      },
    ],
  },
  {
    id: "betting",
    title: "Betting Rules",
    subtitle: "Rules for placing toss bets",
    icon: Gavel,
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    rules: [
      {
        icon: Lock,
        text: "Once a bet is closed on site, do not contact on WhatsApp. Place your bets on time.",
        variant: "info",
        badge: "👍",
      },
      {
        icon: Lock,
        text: "If the toss is open and then the toss is completed, all toss bets placed will be invalid.",
        variant: "love",
        badge: "❤️",
      },
      {
        icon: Heart,
        text: "Minimum bet amount is ₹100.",
        variant: "love",
        badge: "❤️",
      },
      {
        icon: Zap,
        text: "Current toss rate is 95 paisa on the rupee.",
        variant: "love",
        badge: "❤️",
      },
    ],
  },
  {
    id: "settlement",
    title: "Settlement & Withdrawal",
    subtitle: "Payout timelines and withdrawal policy",
    icon: Trophy,
    iconColor: "text-yellow-400",
    bgColor: "bg-yellow-400/10 border-yellow-400/20",
    rules: [
      {
        icon: CheckCircle,
        text: "International and quality leagues: settlement within 10 minutes. Domestic and ECS tosses: settlement within 1 hour.",
        variant: "success",
        badge: "✅",
      },
      {
        icon: CheckCircle,
        text: "Withdrawal is processed once per day, anytime after bet settlement.",
        variant: "success",
        badge: "✅",
      },
      {
        icon: MessageCircle,
        text: "We also provide Match IDs for session match and casino bets. Contact @Bittubhaji.",
        variant: "love",
        badge: "❤️",
      },
    ],
  },
];

const variantStyles: Record<Variant, { border: string; bg: string; text: string }> = {
  success: { border: "border-l-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-400" },
  danger:  { border: "border-l-red-500",     bg: "bg-red-500/5",     text: "text-red-400"     },
  warning: { border: "border-l-yellow-500",  bg: "bg-yellow-500/5",  text: "text-yellow-400"  },
  info:    { border: "border-l-blue-400",    bg: "bg-blue-500/5",    text: "text-blue-400"    },
  love:    { border: "border-l-primary",     bg: "bg-primary/5",     text: "text-primary"     },
};

const RuleItem = ({ rule, index }: { rule: Rule; index: number }) => {
  const IconComp = rule.icon;
  const s = variantStyles[rule.variant];
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`flex gap-3 rounded-xl border-l-2 border border-border/30 p-4 ${s.border} ${s.bg}`}
    >
      <span className="text-base shrink-0 mt-0.5">{rule.badge}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed font-medium">{rule.text}</p>
        {rule.hindi && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-t border-border/30 pt-2">
            {rule.hindi}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const SectionCard = ({ section, isOpen, onToggle, delay }: {
  section: Section; isOpen: boolean; onToggle: () => void; delay: number;
}) => {
  const IconComp = section.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Section header — clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/60 transition-colors text-left"
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${section.bgColor}`}>
          <IconComp className={`h-5 w-5 ${section.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-foreground">{section.title}</p>
          <p className="text-xs text-muted-foreground">{section.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {section.rules.length} rules
          </span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Rules list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-2.5 border-t border-border/40">
              {section.rules.map((rule, i) => (
                <RuleItem key={i} rule={rule} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Rules = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.id, true]))
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allOpen = Object.values(openSections).every(Boolean);
  const toggleAll = () => {
    const newState = !allOpen;
    setOpenSections(Object.fromEntries(sections.map((s) => [s.id, newState])));
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full blur-[80px] opacity-20"
            style={{ background: "hsl(var(--primary))" }} />
          <div className="absolute bottom-0 right-0 h-[200px] w-[300px] rounded-full blur-[80px] opacity-10"
            style={{ background: "hsl(var(--accent))" }} />
        </div>

        <div className="relative container mx-auto px-4 pt-10 pb-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            {/* Logo ring */}
            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-spin" style={{ animationDuration: "12s" }} />
              <img src={betwicLogo} alt="Betwic Toss Book"
                className="h-16 w-16 rounded-full object-cover border-2 border-primary/50 relative z-10" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Info className="h-4 w-4" />
              Please read before playing
            </div>
            <h1 className="text-4xl font-extrabold text-foreground md:text-5xl mb-3">
              Rules &amp; <span className="text-neon">Guidelines</span>
            </h1>
            <p className="mx-auto max-w-xl text-muted-foreground text-sm leading-relaxed">
              These rules ensure fair play for all members. Violations may result in suspension of deposits and withdrawals.
            </p>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mt-6"
          >
            {[
              { label: "Min Bet", value: "₹100", color: "text-primary" },
              { label: "Toss Rate", value: "95p", color: "text-yellow-400" },
              { label: "Settlement", value: "10 min", color: "text-emerald-400" },
              { label: "Withdrawal", value: "Daily", color: "text-blue-400" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5 rounded-full bg-card border border-border/50 px-4 py-1.5">
                <span className={`text-sm font-extrabold ${stat.color}`}>{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 max-w-2xl">

        {/* Controls row */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
            {sections.length} categories · {sections.reduce((acc, s) => acc + s.rules.length, 0)} rules
          </p>
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {allOpen ? "Collapse all" : "Expand all"}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Section accordions */}
        <div className="space-y-3 mb-6">
          {sections.map((section, i) => (
            <SectionCard
              key={section.id}
              section={section}
              isOpen={openSections[section.id]}
              onToggle={() => toggleSection(section.id)}
              delay={i * 0.06}
            />
          ))}
        </div>

        {/* Special Info box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-yellow-500/40 p-6 relative overflow-hidden mb-4"
          style={{ background: "linear-gradient(135deg, hsl(40 100% 6%), hsl(35 80% 8%))" }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-15" style={{ background: "#fbbf24" }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-10" style={{ background: "#f59e0b" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <h3 className="text-base font-extrabold text-yellow-400 tracking-wide uppercase">Special Info</h3>
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="space-y-2 text-sm text-white/80 leading-relaxed">
              <p>
                If a toss is cancelled in the Telegram book, that <span className="text-yellow-300 font-semibold">does not</span> mean the toss is invalid in the online ID.
              </p>
              <p>
                It remains valid in the online ID. Only if the toss is officially abandoned will it be cancelled on the site.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer notice */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 justify-center rounded-xl border border-border/30 bg-card/50 p-4"
        >
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground text-center">
            Rules are subject to change. Check regularly for updates.
          </p>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Rules;
