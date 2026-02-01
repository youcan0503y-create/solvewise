import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Key, ArrowRight, Layers, Mail, Github, ChevronLeft, Lock } from "lucide-react";
import { useLanguage } from "@/app/components/language-context";
import { LanguageToggle } from "@/app/components/language-toggle";
import { Storage } from "@/lib/storage";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Toaster, toast } from "sonner";

// Firebase 관련 임포트
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";

interface LoginScreenProps {
  onLogin: () => void;
}

// 화면 단계 정의 (메뉴 -> 이메일 입력 -> API 키 입력)
type LoginStep = "menu" | "email_input" | "api_key_input";

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<LoginStep>("menu");
  
  // 입력값 상태 관리
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. 소셜 로그인 핸들러 (Google, GitHub)
  const handleSocialLogin = async (provider: any, providerName: string) => {
    try {
      const result = await signInWithPopup(auth, provider);
      toast.success(`${providerName} 로그인 성공!`);
      checkApiKeyAndProceed();
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(`로그인 실패: ${error.message}`);
      }
    }
  };

  // 2. 이메일 로그인/회원가입 스마트 핸들러
  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 우선 로그인을 시도합니다.
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("로그인 성공!");
      checkApiKeyAndProceed();
    } catch (error: any) {
      // 로그인 실패 시, 계정이 없거나 비밀번호가 틀린 경우입니다.
      // 여기서는 편의상 'user-not-found' 또는 'invalid-credential' 에러일 때 회원가입을 시도합니다.
      // (보안을 위해 실제 서비스에서는 명확히 구분하는 것이 좋을 수 있습니다)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          // 회원가입 시도
          await createUserWithEmailAndPassword(auth, email, password);
          toast.success("새 계정 생성 및 로그인 성공!");
          checkApiKeyAndProceed();
        } catch (signUpError: any) {
          // 가입 실패 (이미 존재하는 이메일인데 비밀번호가 틀린 경우 등)
          if (signUpError.code === 'auth/email-already-in-use') {
             toast.error("이미 존재하는 이메일입니다. 비밀번호를 확인해주세요.");
          } else {
             toast.error("인증 오류: " + signUpError.message);
          }
        }
      } else {
        toast.error("오류 발생: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 공통 로직: 로그인 성공 후 API Key 확인
  const checkApiKeyAndProceed = () => {
    const savedKey = Storage.getApiKey();
    if (savedKey) {
      setTimeout(() => onLogin(), 500); // 키가 있으면 바로 대시보드로
    } else {
      setStep("api_key_input"); // 키가 없으면 키 입력 단계로
    }
  };

  // API Key 저장 핸들러
  const handleApiKeySave = () => {
    if (!apiKey.trim()) {
      toast.error("API Key를 입력해주세요.");
      return;
    }
    Storage.setApiKey(apiKey);
    toast.success("설정 완료! 시작합니다.");
    setTimeout(() => onLogin(), 500);
  };

  // 애니메이션 설정
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafbfc] dark:bg-[#030213] relative overflow-hidden text-gray-900 dark:text-white">
      <Toaster position="top-center" />
      <div className="fixed top-6 right-6 z-50">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: 메인 메뉴 (소셜 로그인 + 이메일 버튼) */}
          {step === "menu" && (
            <motion.div key="menu" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center">
              <motion.div variants={itemVariants} className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-400 to-blue-600 shadow-xl shadow-blue-500/20 mb-6">
                  <Layers className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl mb-3 tracking-tight font-bold">SolveWise</h1>
                <p className="text-gray-500 dark:text-gray-400 text-base">AI 수학 & 경제학 풀이</p>
              </motion.div>

              <motion.div variants={itemVariants} className="w-full space-y-4">
                {/* 구글 로그인 */}
                <button onClick={() => handleSocialLogin(googleProvider, "Google")} className="w-full h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm group">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="font-medium">Google로 계속하기</span>
                </button>

                {/* 깃허브 로그인 */}
                <button onClick={() => handleSocialLogin(githubProvider, "GitHub")} className="w-full h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                  <Github className="w-5 h-5" />
                  <span className="font-medium">GitHub로 계속하기</span>
                </button>

                <div className="relative py-2 text-center text-xs text-gray-400 font-medium">또는</div>

                {/* 이메일 로그인 버튼 */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep("email_input")} className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all">
                  <Mail className="w-5 h-5" />
                  <span className="font-bold">이메일로 계속하기</span>
                </motion.button>
              </motion.div>
              
              <motion.p variants={itemVariants} className="mt-8 text-xs text-center text-gray-400 leading-relaxed max-w-xs">
                계속 진행하시면 <span className="text-blue-500 cursor-pointer hover:underline">이용약관</span> 및 <span className="text-blue-500 cursor-pointer hover:underline">개인정보처리방침</span>에 동의하는 것으로 간주됩니다.
              </motion.p>
            </motion.div>
          )}

          {/* STEP 2: 이메일 & 비밀번호 입력 */}
          {step === "email_input" && (
            <motion.div key="email" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/50 dark:border-gray-800 shadow-xl">
                <button onClick={() => setStep("menu")} className="mb-6 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ChevronLeft className="w-6 h-6 text-gray-500" />
                </button>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">이메일로 계속하기</h2>
                  <p className="text-sm text-gray-500">이메일과 비밀번호를 입력해 주세요.</p>
                </div>
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input type="email" placeholder="이메일 주소" className="pl-11 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input type="password" placeholder="비밀번호 (6자 이상)" className="pl-11 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all text-base" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()} />
                  </div>
                  <Button onClick={handleEmailAuth} disabled={isLoading} className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-blue-500/40 text-white font-bold text-lg transition-all shadow-lg mt-2">
                    {isLoading ? "처리 중..." : "로그인 / 가입"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: API Key 입력 (로그인 성공 후 키가 없을 때만) */}
          {step === "api_key_input" && (
            <motion.div key="api" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/50 dark:border-gray-800 shadow-xl">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">마지막 단계</h2>
                  <p className="text-sm text-gray-500">Gemini API Key를 입력하면 풀이를 시작할 수 있습니다.</p>
                </div>
                <div className="space-y-6">
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500" />
                    <Input type="password" placeholder="AIzaSy..." className="pl-11 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all text-base" value={apiKey} onChange={(e) => setApiKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleApiKeySave()} />
                  </div>
                  <Button onClick={handleApiKeySave} className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/40">
                    시작하기 <ArrowRight className="w-5 h-5 ml-2" />
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