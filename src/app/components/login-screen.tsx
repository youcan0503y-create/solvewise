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
  const { t } = useLanguage();
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
                {/* 🟢 수정됨: 구글 로고 SVG 직접 삽입 */}
                <button onClick={() => handleSocialLogin(googleProvider, "Google")} className="w-full h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm group">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
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