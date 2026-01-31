import { useState, useEffect } from "react";
import { LanguageProvider } from "@/app/components/language-context";
import { LoginScreen } from "@/app/components/login-screen";
import { DashboardScreen } from "@/app/components/dashboard-screen";
import { SolverScreen } from "@/app/components/solver-screen";
import { Storage } from "@/lib/storage";
import { AnimatePresence, motion } from "motion/react"; // 🟢 애니메이션 모듈 추가

type Screen = "login" | "dashboard" | "solver";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");

  // 앱 시작 시 로그인 여부 확인
  useEffect(() => {
    const apiKey = Storage.getApiKey();
    if (apiKey) {
      setCurrentScreen("dashboard");
    }
  }, []);

  // 🟢 화면 전환 애니메이션 설정 (iOS 스타일의 부드러운 감속)
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20, // 아래에서
      scale: 0.98, // 살짝 작게 시작
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
      },
    },
    out: {
      opacity: 0,
      y: -20, // 위로 사라짐
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-hidden">
        {/* 
          mode="wait": 이전 화면이 완전히 사라진 후 다음 화면이 나옵니다. 
          화면이 겹치는 것을 방지하여 깔끔하게 전환됩니다.
        */}
        <AnimatePresence mode="wait">
          {currentScreen === "login" && (
            <motion.div
              key="login" // 🟢 key가 달라야 애니메이션이 작동함
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
              <DashboardScreen onNewQuestion={() => setCurrentScreen("solver")} />
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
              <SolverScreen onBack={() => setCurrentScreen("dashboard")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LanguageProvider>
  );
}