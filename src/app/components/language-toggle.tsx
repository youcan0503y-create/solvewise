import { motion } from "motion/react";
import { useLanguage } from "@/app/components/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <button
        onClick={() => setLanguage("ko")}
        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
          language === "ko"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        한국어
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
          language === "en"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        English
      </button>
    </motion.div>
  );
}