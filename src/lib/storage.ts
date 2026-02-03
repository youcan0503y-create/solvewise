// 🟢 [수정됨] ChatMessage 타입을 여기서 정의하여 공유합니다.
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  image?: string;
  result?: { explanation: string; graphCode: string };
}

export interface HistoryItem {
  id: string;
  type: "text" | "image";
  question: string; // 대표 질문 (목록 표시용)
  answer: string;   // 대표 답변 (첫 답변)
  graphCode?: string;
  timestamp: number;
  previewImage?: string;
  messages: ChatMessage[]; // 🟢 [추가] 대화 전체 기록
}

export const Storage = {
  // API 키 관리
  getApiKey: () => localStorage.getItem("solvewise_api_key"),
  setApiKey: (key: string) => localStorage.setItem("solvewise_api_key", key),
  
  // 히스토리 불러오기
  getHistory: (): HistoryItem[] => {
    const data = localStorage.getItem("solvewise_history");
    return data ? JSON.parse(data) : [];
  },
  
  // 🟢 [수정] 히스토리 추가 (새 대화 시작)
  addHistory: (item: HistoryItem) => {
    const history = Storage.getHistory();
    // 중복 방지 (혹시 ID가 같으면 덮어쓰기)
    const filtered = history.filter(h => h.id !== item.id);
    const newHistory = [item, ...filtered].slice(0, 30); // 최대 30개 저장
    localStorage.setItem("solvewise_history", JSON.stringify(newHistory));
  },

  // 🟢 [추가] 히스토리 업데이트 (대화 내용 갱신)
  updateHistory: (id: string, newMessages: ChatMessage[]) => {
    const history = Storage.getHistory();
    const targetIndex = history.findIndex(h => h.id === id);
    
    if (targetIndex !== -1) {
      // 대화 내용 업데이트
      history[targetIndex].messages = newMessages;
      // 수정된 항목을 맨 위로 올리기 (선택 사항)
      const updatedItem = history.splice(targetIndex, 1)[0];
      history.unshift(updatedItem);
      
      localStorage.setItem("solvewise_history", JSON.stringify(history));
    }
  }
};