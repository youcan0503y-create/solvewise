import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Key, ArrowRight, Layers, Mail, Github, ChevronLeft, Lock } from "lucide-react";
import { useLanguage } from "@/app/components/language-context";
import { LanguageToggle } from "@/app/components/language-toggle";
import { Storage } from "@/lib/storage";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Toaster, toast } from "sonner";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";

interface LoginScreenProps {
  onLogin: () => void;
}

type LoginStep = "menu" | "email_input" | "api_key_input";

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t } = useLanguage(); // 🟢 번역 함수 호출
  const [step, setStep] = useState<LoginStep>("menu");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (provider: any, providerName: string) => {
    try {
      await signInWithPopup(auth, provider);
      toast.success(`${providerName} ${t("login.success") || 'Login Success'}`);
      checkApiKeyAndProceed();
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(`Login error: ${error.message}`);
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error(t("login.email_error") || "Please enter email and password.");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      checkApiKeyAndProceed();
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          checkApiKeyAndProceed();
        } catch (signUpError: any) {
          toast.error("Auth error: " + signUpError.message);
        }
      } else {
        toast.error("Error: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkApiKeyAndProceed = () => {
    const savedKey = Storage.getApiKey();
    if (savedKey) {
      setTimeout(() => onLogin(), 500);
    } else {
      setStep("api_key_input");
    }
  };

  const handleApiKeySave = () => {
    if (!apiKey.trim()) {
      toast.error("API Key is required.");
      return;
    }
    Storage.setApiKey(apiKey);
    setTimeout(() => onLogin(), 500);
  };

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
          
          {step === "menu" && (
            <motion.div key="menu" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center">
              <motion.div variants={itemVariants} className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-400 to-blue-600 shadow-xl shadow-blue-500/20 mb-6">
                  <Layers className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl mb-3 tracking-tight font-bold">{t("login.title")}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-base">{t("login.subtitle")}</p>
              </motion.div>

              <motion.div variants={itemVariants} className="w-full space-y-4">
                <button onClick={() => handleSocialLogin(googleProvider, "Google")} className="w-full h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm group">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5" alt="google" />
                  <span className="font-medium text-gray-700 dark:text-gray-200">{t("login.google")}</span>
                </button>

                <button onClick={() => handleSocialLogin(githubProvider, "GitHub")} className="w-full h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                  <Github className="w-5 h-5 text-gray-900 dark:text-white" />
                  <span className="font-medium text-gray-700 dark:text-gray-200">{t("login.github")}</span>
                </button>

                <div className="relative py-2 text-center text-xs text-gray-400 font-medium">{t("login.or")}</div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep("email_input")} className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg shadow-blue-500/30 transition-all">
                  <Mail className="w-5 h-5" />
                  <span className="font-bold">{t("login.email")}</span>
                </motion.button>
              </motion.div>
              
              <motion.p variants={itemVariants} className="mt-8 text-[11px] text-center text-gray-400 leading-relaxed max-w-xs px-4">
                {t("login.terms")}<span className="text-blue-500 cursor-pointer hover:underline">{t("login.terms.link1")}</span>{t("login.terms.and")}<span className="text-blue-500 cursor-pointer hover:underline">{t("login.terms.link2")}</span>{t("login.terms.agree")}
              </motion.p>
            </motion.div>
          )}

          {/* ... 이메일 및 API 키 입력 섹션도 t() 함수를 사용하도록 수정됨 ... */}
          {step === "email_input" && (
            <motion.div key="email" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="w-full">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/50 dark:border-gray-800 shadow-xl">
                <button onClick={() => setStep("menu")} className="mb-6 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ChevronLeft className="w-6 h-6 text-gray-500" />
                </button>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">{t("login.email")}</h2>
                  <p className="text-sm text-gray-500">Enter your credentials</p>
                </div>
                <div className="space-y-4">
                  <Input type="email" placeholder="Email" className="h-14 rounded-2xl" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Input type="password" placeholder="Password" className="h-14 rounded-2xl" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Button onClick={handleEmailAuth} disabled={isLoading} className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold">
                    {isLoading ? "..." : t("login.email")}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "api_key_input" && (
            <motion.div key="api" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="w-full">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/50 dark:border-gray-800 shadow-xl">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Gemini API Key</h2>
                  <p className="text-sm text-gray-500">Please enter your API Key to start</p>
                </div>
                <div className="space-y-6">
                  <Input type="password" placeholder="AIzaSy..." className="h-14 rounded-2xl" value={apiKey} onChange={(e) => setApiKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleApiKeySave()} />
                  <Button onClick={handleApiKeySave} className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold">
                    Start SolveWise
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