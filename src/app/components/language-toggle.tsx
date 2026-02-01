import { motion } from "motion/react";
import { useLanguage } from "@/app/components/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // 🟢 수정됨: w-full 및 grid-cols-2 적용
      className="grid grid-cols-2 gap-1 w-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-inner"
    >
      <button
        onClick={() => setLanguage("ko")}
        className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
          language === "ko"
            ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
        }`}
      >
        한국어
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
          language === "en"
            ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
        }`}
      >
        English
      </button>
    </motion.div>
  );
}