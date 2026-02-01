import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Clock, Image as ImageIcon, Type, ChevronRight, Trash2, Sparkles, LogOut, Cpu, UserX, Settings } from "lucide-react";
import { useLanguage } from "@/app/components/language-context";
import { LanguageToggle } from "@/app/components/language-toggle";
import { Storage, HistoryItem } from "@/lib/storage";
import { checkCurrentModel } from "@/lib/gemini";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Toaster, toast } from "sonner";

// Firebase 관련 임포트
import { auth } from "@/lib/firebase";
import { deleteUser } from "firebase/auth";

interface DashboardScreenProps {
  onNewQuestion: () => void;
}

export function DashboardScreen({ onNewQuestion }: DashboardScreenProps) {
  const { language, t } = useLanguage();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentModel, setCurrentModel] = useState<string>("Checking...");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 🟢 설정 메뉴 토글 상태

  // 메뉴 외부 클릭 감지를 위한 Ref
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(Storage.getHistory());

    const apiKey = Storage.getApiKey();
    if (apiKey) {
      checkCurrentModel(apiKey).then(modelName => {
        setCurrentModel(modelName);
      });
    }

    // 외부 클릭 시 메뉴 닫기 이벤트
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      auth.signOut();
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) {
      toast.error("로그인 정보가 없습니다.");
      return;
    }
    if (!confirm("정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 사라집니다.")) {
      return;
    }
    try {
      await deleteUser(auth.currentUser);
      localStorage.clear();
      toast.success("계정이 성공적으로 삭제되었습니다.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error(error);
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
        <div className="max-w-2xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-primary to-accent shadow-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="tracking-tight font-bold text-gray-900 dark:text-white">{t("dashboard.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("dashboard.subtitle")}</p>
            </div>
          </div>
          
          {/* 우측 상단 컨트롤 영역 */}
          <div className="flex items-center gap-3" ref={menuRef}>
            {/* 모델명 배지 (화면 넓을 때만 표시) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-all">
              <Cpu className="w-3.5 h-3.5" />
              <span>{currentModel}</span>
            </div>

            {/* 🟢 설정 버튼 (애니메이션 적용) */}
            <div className="relative">
              <motion.button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm z-50 relative"
                animate={{ rotate: isSettingsOpen ? 180 : 0 }} // 🟢 180도 회전 애니메이션
                transition={{ duration: 0.3, ease: "easeInOut" }} // 🟢 가속도 설정
              >
                <Settings className="w-5 h-5" />
              </motion.button>

              {/* 🟢 드롭다운 메뉴 (슬라이드 애니메이션) */}
              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }} // 🟢 부드러운 슬라이드
                    className="absolute right-0 top-14 w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-40 p-2 flex flex-col gap-1"
                  >
                    {/* 메뉴 1: 모델 정보 (모바일용) */}
                    <div className="sm:hidden flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mb-1">
                      <Cpu className="w-3.5 h-3.5" />
                      <span className="font-semibold truncate">{currentModel}</span>
                    </div>

                    {/* 메뉴 2: 언어 설정 */}
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">언어 설정</p>
                      <LanguageToggle />
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

                    {/* 메뉴 3: 계정 관리 */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>

                    <button
                      onClick={handleDeleteAccount}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      회원 탈퇴
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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