export interface HistoryItem {
  id: string;
  type: "text" | "image";
  question: string;
  answer: string;
  graphCode?: string;
  timestamp: number;
  previewImage?: string; // 썸네일용 Base64 이미지
}

export const Storage = {
  // API 키 저장/불러오기
  getApiKey: () => localStorage.getItem("solvewise_api_key"),
  setApiKey: (key: string) => localStorage.setItem("solvewise_api_key", key),
  
  // 히스토리 불러오기
  getHistory: (): HistoryItem[] => {
    const data = localStorage.getItem("solvewise_history");
    return data ? JSON.parse(data) : [];
  },
  
  // 히스토리 추가하기 (최대 20개까지만 저장)
  addHistory: (item: HistoryItem) => {
    const history = Storage.getHistory();
    const newHistory = [item, ...history].slice(0, 20); 
    localStorage.setItem("solvewise_history", JSON.stringify(newHistory));
  }
};