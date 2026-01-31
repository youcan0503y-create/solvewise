import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Key, ArrowRight, Layers, Mail, Github, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/app/components/language-context";
import { LanguageToggle } from "@/app/components/language-toggle";
import { Storage } from "@/lib/storage";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Toaster, toast } from "sonner";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"menu" | "input">("menu"); // 단계 관리 (메뉴 vs 입력)
  const [apiKey, setApiKey] = useState("");

  const handleLogin = () => {
    if (!apiKey.trim()) {
      toast.error("API Key를 입력해주세요.");
      return;
    }
    Storage.setApiKey(apiKey);
    toast.success("환영합니다!");
    setTimeout(() => {
      onLogin();
    }, 500);
  };

  // 애니메이션 설정 (순차적 등장)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // 자식 요소들이 0.1초 간격으로 등장
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafbfc] dark:bg-[#030213] relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* 언어 변경 버튼 */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md z-10">
        <AnimatePresence mode="wait">
          
          {/* 1단계: 로그인 메뉴 화면 */}
          {step === "menu" && (
            <motion.div
              key="menu"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center"
            >
              {/* 로고 영역 */}
              <motion.div variants={itemVariants} className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-400 to-blue-600 shadow-xl shadow-blue-500/20 mb-6 transform hover:scale-105 transition-transform duration-300">
                  <Layers className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl mb-3 tracking-tight font-bold text-gray-900 dark:text-white">
                  SolveWise
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
                  AI 수학 & 경제학 풀이
                </p>
              </motion.div>

              {/* 버튼 그룹 */}
              <motion.div variants={itemVariants} className="w-full space-y-4">
                {/* 구글 로그인 (디자인만 구현) */}
                <button className="w-full h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md group">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="font-medium text-gray-700 dark:text-gray-200">Google로 계속하기</span>
                </button>

                {/* 깃허브 로그인 (디자인만 구현) */}
                <button className="w-full h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md">
                  <Github className="w-5 h-5 text-gray-900 dark:text-white" />
                  <span className="font-medium text-gray-700 dark:text-gray-200">GitHub로 계속하기</span>
                </button>

                {/* 구분선 */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-[#fafbfc] dark:bg-[#030213] text-xs text-gray-400 font-medium">또는</span>
                  </div>
                </div>

                {/* 이메일로 계속하기 (실제 기능 진입점) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("input")}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-bold">이메일로 계속하기</span>
                </motion.button>
              </motion.div>

              {/* 하단 약관 */}
              <motion.p variants={itemVariants} className="mt-8 text-xs text-center text-gray-400 leading-relaxed max-w-xs">
                계속 진행하시면 <span className="text-blue-500 cursor-pointer hover:underline">이용약관</span> 및 <span className="text-blue-500 cursor-pointer hover:underline">개인정보처리방침</span>에 동의하는 것으로 간주됩니다.
              </motion.p>
            </motion.div>
          )}

          {/* 2단계: API Key 입력 화면 */}
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full"
            >
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-gray-800">
                <button 
                  onClick={() => setStep("menu")}
                  className="mb-6 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">API Key 입력</h2>
                    <p className="text-sm text-gray-500">서비스 이용을 위해 키를 입력해주세요.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="relative group">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input 
                        type="password" 
                        placeholder="AIzaSy..." 
                        className="pl-10 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all text-base"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleLogin}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-base font-bold"
                  >
                    <span>시작하기</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}