import { useState, useEffect } from "react";
import { LanguageProvider } from "@/app/components/language-context";
import { LoginScreen } from "@/app/components/login-screen";
import { DashboardScreen } from "@/app/components/dashboard-screen";
import { SolverScreen } from "@/app/components/solver-screen";
import { Storage, HistoryItem } from "@/lib/storage"; // HistoryItem 타입 임포트
import { AnimatePresence, motion } from "motion/react";

type Screen = "login" | "dashboard" | "solver";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null); // 🟢 선택된 기록 상태

  useEffect(() => {
    const apiKey = Storage.getApiKey();
    if (apiKey) {
      setCurrentScreen("dashboard");
    }
  }, []);

  // 🟢 대시보드 -> 솔버 이동 핸들러 (새 질문 or 기록 불러오기)
  const handleNavigateToSolver = (item?: HistoryItem) => {
    setSelectedHistory(item || null); // 아이템이 있으면 저장, 없으면 null (새 질문)
    setCurrentScreen("solver");
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30, mass: 1 } },
    out: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2, ease: "easeInOut" } },
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-hidden">
        <AnimatePresence mode="wait">
          {currentScreen === "login" && (
            <motion.div
              key="login"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="w-full h-full"
            >
              <LoginScreen onLogin={() => setCurrentScreen("dashboard")} />
            </motion.div>
          )}

          {currentScreen === "dashboard" && (
            <motion.div
              key="dashboard"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="w-full h-full"
            >
              {/* 🟢 수정됨: onNavigate 전달 */}
              <DashboardScreen onNavigate={handleNavigateToSolver} />
            </motion.div>
          )}

          {currentScreen === "solver" && (
            <motion.div
              key="solver"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="w-full h-full"
            >
              {/* 🟢 수정됨: initialHistory 전달 */}
              <SolverScreen 
                onBack={() => setCurrentScreen("dashboard")} 
                initialHistory={selectedHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LanguageProvider>
  );
}