import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Clock, Image as ImageIcon, Type, ChevronRight, Trash2, Sparkles, LogOut, Cpu, UserX } from "lucide-react"; // 🟢 UserX 아이콘 추가
import { useLanguage } from "@/app/components/language-context";
import { LanguageToggle } from "@/app/components/language-toggle";
import { Storage, HistoryItem } from "@/lib/storage";
import { checkCurrentModel } from "@/lib/gemini";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Toaster, toast } from "sonner";

// 🟢 Firebase 관련 임포트 추가
import { auth } from "@/lib/firebase";
import { deleteUser } from "firebase/auth";

interface DashboardScreenProps {
  onNewQuestion: () => void;
}

export function DashboardScreen({ onNewQuestion }: DashboardScreenProps) {
  const { language, t } = useLanguage();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentModel, setCurrentModel] = useState<string>("Checking...");

  useEffect(() => {
    setHistory(Storage.getHistory());

    const apiKey = Storage.getApiKey();
    if (apiKey) {
      checkCurrentModel(apiKey).then(modelName => {
        setCurrentModel(modelName);
      });
    }
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("정말 삭제하시겠습니까?")) {
      const newHistory = history.filter(item => item.id !== id);
      setHistory(newHistory);
      localStorage.setItem("solvewise_history", JSON.stringify(newHistory));
      toast.success("삭제되었습니다.");
    }
  };

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("solvewise_api_key");
      auth.signOut(); // Firebase 로그아웃
      window.location.reload();
    }
  };

  // 🟢 계정 삭제 핸들러
  const handleDeleteAccount = async () => {
    if (!auth.currentUser) {
      toast.error("로그인 정보가 없습니다.");
      return;
    }

    // 1. 사용자 확인 (파괴적인 작업이므로 재확인 필수)
    if (!confirm("정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 사라집니다.")) {
      return;
    }

    try {
      // 2. Firebase 계정 삭제
      await deleteUser(auth.currentUser);
      
      // 3. 로컬 데이터 초기화
      localStorage.clear();
      
      toast.success("계정이 성공적으로 삭제되었습니다.");
      
      // 4. 화면 새로고침 (로그인 화면으로 이동)
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      console.error(error);
      // 보안상 오래된 세션에서는 삭제가 불가능할 수 있음 -> 재로그인 유도
      if (error.code === 'auth/requires-recent-login') {
        toast.error("보안을 위해 로그아웃 후 다시 로그인해서 시도해주세요.");
      } else {
        toast.error("계정 삭제 실패: " + error.message);
      }
    }
  };
  
  return (
    <div className="min-h-screen pb-24 bg-[#fafbfc] dark:bg-[#030213]">
      <Toaster position="top-center" />
      
      {/* 헤더 영역 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-gray-200/50 dark:border-gray-800/50 px-6 py-4"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-primary to-accent shadow-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="tracking-tight font-bold text-gray-900 dark:text-white">{t("dashboard.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("dashboard.subtitle")}</p>
            </div>
          </div>
          
          {/* 우측 상단 버튼 그룹 */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all">
              <Cpu className="w-3.5 h-3.5" />
              <span>{currentModel}</span>
            </div>

            <LanguageToggle />
            
            {/* 🟢 계정 삭제 버튼 */}
            <button
              onClick={handleDeleteAccount}
              className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors border border-gray-200 dark:border-gray-700"
              title="회원 탈퇴"
            >
              <UserX className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-gray-700"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 질문 리스트 영역 */}
      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-4">
        {history.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">아직 기록이 없습니다.</p>
            <p className="text-sm mt-1">우측 하단 버튼을 눌러 질문을 시작해보세요!</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="group cursor-pointer relative"
                onClick={() => {}} 
              >
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-[24px] p-5 border border-white/50 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 ${
                      item.type === "image" 
                        ? "bg-gradient-to-br from-purple-400 to-pink-400" 
                        : "bg-gradient-to-br from-blue-400 to-cyan-400"
                    } shadow-md text-white`}>
                      {item.type === "image" ? <ImageIcon className="w-5 h-5" /> : <Type className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-gray-100 font-medium mb-1 line-clamp-2 text-sm sm:text-base">
                        {item.question || (item.type === "image" ? "이미지 분석 질문" : "텍스트 질문")}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(item.timestamp, { 
                              addSuffix: true, 
                              locale: language === 'ko' ? ko : enUS 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                      <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNewQuestion}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40 flex items-center justify-center text-white z-50 hover:shadow-xl hover:shadow-primary/50 transition-shadow"
      >
        <Plus className="w-7 h-7" />
      </motion.button>
    </div>
  );
}