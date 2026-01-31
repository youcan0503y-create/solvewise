import { createContext, useContext, useState, ReactNode } from "react";

type Language = "ko" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ko: {
    // 로그인 화면
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
    
    // 대시보드 화면
    "dashboard.title": "기록",
    "dashboard.subtitle": "이전 질문들",
    "dashboard.solved": "완료",
    
    // 솔버 화면
    "solver.title": "새 질문",
    "solver.subtitle": "수학이나 경제학에 대해 무엇이든 물어보세요",
    "solver.placeholder": "질문을 입력하세요...",
    "solver.upload": "사진 업로드",
    "solver.solve": "풀이 시작",
    "solver.solving": "분석 중...",
    "solver.solution": "AI 풀이",
  },
  en: {
    // Login Screen
    "login.title": "SolveWise",
    "login.subtitle": "Your AI Math & Economics Solver",
    "login.google": "Continue with Google",
    "login.github": "Continue with GitHub",
    "login.or": "or",
    "login.email": "Continue with Email",
    "login.terms": "By continuing, you agree to our ",
    "login.terms.link1": "Terms of Service",
    "login.terms.and": " and ",
    "login.terms.link2": "Privacy Policy",
    "login.terms.agree": ".",
    
    // Dashboard Screen
    "dashboard.title": "History",
    "dashboard.subtitle": "Your previous questions",
    "dashboard.solved": "Solved",
    
    // Solver Screen
    "solver.title": "New Question",
    "solver.subtitle": "Ask anything about math or economics",
    "solver.placeholder": "Type your question here...",
    "solver.upload": "Upload Photo",
    "solver.solve": "Solve",
    "solver.solving": "Solving...",
    "solver.solution": "Solution",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ko");

  const t = (key: string): string => {
    // 해당 언어에 번역이 없으면 키값을 그대로 반환
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