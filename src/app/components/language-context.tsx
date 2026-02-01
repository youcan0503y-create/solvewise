import { createContext, useContext, useState, ReactNode } from "react";

type Language = "ko" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ko: {
    // --- 로그인 화면 ---
    "login.title": "SolveWise",
    "login.subtitle": "AI 수학 & 경제학 풀이",
    "login.google": "Google로 계속하기",
    "login.github": "GitHub로 계속하기",
    "login.or": "또는",
    "login.email": "이메일로 계속하기",
    "login.terms": "계속 진행하시면 ",
    "login.terms.link1": "이용약관",
    "login.terms.and": " 및 ",
    "login.terms.link2": "개인정보처리방침",
    "login.terms.agree": "에 동의하는 것으로 간주됩니다",
    "login.success": "로그인 성공!",
    "login.email_error": "이메일과 비밀번호를 입력해주세요.",
    "login.api_key_header": "API Key 입력",
    "login.api_key_desc": "서비스 이용을 위해 키를 입력해주세요.",
    "login.start": "시작하기",

    // --- 대시보드 화면 ---
    "dashboard.title": "기록",
    "dashboard.subtitle": "이전 질문들",
    "dashboard.no_history": "아직 기록이 없습니다.",
    "dashboard.start_prompt": "우측 하단 버튼을 눌러 질문을 시작해보세요!",
    "dashboard.image_question": "이미지 분석 질문",
    "dashboard.text_question": "텍스트 질문",
    "dashboard.settings_language": "언어 설정",
    "dashboard.logout": "로그아웃",
    "dashboard.delete_account": "회원 탈퇴",
    "dashboard.delete_confirm": "정말 삭제하시겠습니까?",
    "dashboard.deleted": "삭제되었습니다.",
    "dashboard.logout_confirm": "로그아웃 하시겠습니까?",
    "dashboard.account_delete_confirm": "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 사라집니다.",
    "dashboard.account_deleted": "계정이 성공적으로 삭제되었습니다.",

    // --- 솔버 화면 ---
    "solver.title": "새 질문",
    "solver.subtitle": "수학이나 경제학에 대해 무엇이든 물어보세요",
    "solver.placeholder": "질문을 입력하세요...",
    "solver.upload": "사진 업로드",
    "solver.solve": "풀이 시작",
    "solver.solving": "분석중",
    "solver.solution": "AI 풀이",
    "solver.graph_view": "그래프 보기",
    "solver.graph_hide": "그래프 숨기기",
    "solver.graph_create": "시각화 코드 생성",
    "solver.graph_creating": "생성 중...",
    "solver.graph_success": "그래프가 생성되었습니다!",
    "solver.graph_error": "그래프 코드를 생성하지 못했습니다.",
    "solver.add_question": "추가 질문하기",
    "solver.error_no_key": "API Key가 없습니다. 다시 로그인해주세요.",
    "solver.error_empty": "질문이나 이미지를 입력해주세요.",
    "solver.analyzing": "AI가 분석 중입니다...",
  },
  en: {
    // --- Login Screen ---
    "login.title": "SolveWise",
    "login.subtitle": "AI Math & Economics Solver",
    "login.google": "Continue with Google",
    "login.github": "Continue with GitHub",
    "login.or": "or",
    "login.email": "Continue with Email",
    "login.terms": "By continuing, you agree to our ",
    "login.terms.link1": "Terms",
    "login.terms.and": " and ",
    "login.terms.link2": "Privacy Policy",
    "login.terms.agree": ".",
    "login.success": "Login Success!",
    "login.email_error": "Please enter email and password.",
    "login.api_key_header": "Enter API Key",
    "login.api_key_desc": "Please enter your API Key to start.",
    "login.start": "Start",

    // --- Dashboard Screen ---
    "dashboard.title": "History",
    "dashboard.subtitle": "Your previous questions",
    "dashboard.no_history": "No history yet.",
    "dashboard.start_prompt": "Tap the button below to start!",
    "dashboard.image_question": "Image Question",
    "dashboard.text_question": "Text Question",
    "dashboard.settings_language": "Language",
    "dashboard.logout": "Log out",
    "dashboard.delete_account": "Delete Account",
    "dashboard.delete_confirm": "Are you sure you want to delete this?",
    "dashboard.deleted": "Deleted successfully.",
    "dashboard.logout_confirm": "Are you sure you want to log out?",
    "dashboard.account_delete_confirm": "Are you sure you want to delete your account?\nThis action cannot be undone.",
    "dashboard.account_deleted": "Account deleted successfully.",

    // --- Solver Screen ---
    "solver.title": "New Question",
    "solver.subtitle": "Ask anything about math or economics",
    "solver.placeholder": "Type your question here...",
    "solver.upload": "Upload",
    "solver.solve": "Solve",
    "solver.solving": "Analyzing",
    "solver.solution": "Solution",
    "solver.graph_view": "View Graph",
    "solver.graph_hide": "Hide Graph",
    "solver.graph_create": "Generate Graph",
    "solver.graph_creating": "Generating...",
    "solver.graph_success": "Graph generated!",
    "solver.graph_error": "Failed to generate graph code.",
    "solver.add_question": "Ask follow-up",
    "solver.error_no_key": "No API Key found. Please log in again.",
    "solver.error_empty": "Please enter a question or image.",
    "solver.analyzing": "AI is analyzing...",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ko");

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.ko] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}