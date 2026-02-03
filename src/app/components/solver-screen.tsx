import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Camera, Send, Sparkles, X, BarChart2, Wand2, Cpu, Info } from "lucide-react";
import { useLanguage } from "@/app/components/language-context";
import { callGemini, resizeImage, checkCurrentModel, INITIAL_PROMPT, GRAPH_PROMPT } from "@/lib/gemini";
import { Storage, HistoryItem } from "@/lib/storage";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Toaster, toast } from "sonner";

declare global {
  interface Window {
    Plotly: any;
  }
}

interface SolverScreenProps {
  onBack: () => void;
  initialHistory: HistoryItem | null;
}

interface ParsedSection {
  title: string;
  content: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  image?: string;
  result?: { explanation: string; graphCode: string };
}

export function SolverScreen({ onBack, initialHistory }: SolverScreenProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [graphLoadingId, setGraphLoadingId] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentModel, setCurrentModel] = useState<string>("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialHistory) {
      setMessages([
        {
          id: 'restored-user',
          role: 'user',
          text: initialHistory.question,
          image: initialHistory.previewImage,
        },
        {
          id: 'restored-ai',
          role: 'ai',
          result: {
            explanation: initialHistory.answer,
            graphCode: initialHistory.graphCode || "",
          },
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [initialHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing, graphLoadingId, showGraph]);

  useEffect(() => {
    const apiKey = Storage.getApiKey();
    if (apiKey) {
      checkCurrentModel(apiKey).then(modelName => {
        setCurrentModel(modelName);
      });
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          const target = 99;
          const remaining = target - prev;
          const increment = Math.max(0.05, remaining * 0.05); 
          const randomFactor = Math.random() * 0.5; 
          return Math.min(target, prev + increment + randomFactor);
        });
      }, 200);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // 🟢 [수정됨] 답변 파싱 로직 (출처 배지 인식 기능 추가)
  const parseResponse = (text: string): ParsedSection[] => {
    // 정규식: **숫자. 제목** 패턴을 찾음
    const regex = /\*\*(\d+)\.\s(.*?)\*\*/g;
    const sections: ParsedSection[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // 1. 현재 매칭된 제목 앞부분의 텍스트를 가져옴
      const content = text.substring(lastIndex, match.index).trim();
      
      if (sections.length > 0) {
        // 이미 섹션이 열려있다면, 그 섹션의 내용으로 저장
        sections[sections.length - 1].content = content;
      } else if (content.length > 0) {
        // 🟢 [핵심] 열린 섹션이 없는데 내용이 있다? -> 이게 바로 '출처 배지'입니다!
        sections.push({ title: "📌 출처 및 알림", content: content });
      }

      // 2. 새로운 섹션(문제 유형, 풀이 등)을 시작
      sections.push({ title: match[2], content: "" });
      lastIndex = regex.lastIndex;
    }

    // 3. 마지막 섹션의 나머지 내용을 저장
    if (sections.length > 0) {
      sections[sections.length - 1].content = text.substring(lastIndex).trim();
    }
    
    return sections;
  };

  const handleSend = async (inputText: string, imageFile: File | null, imageBase64: string | null) => {
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      toast.error(t("solver.error_no_key"));
      return;
    }

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      image: imageBase64 || undefined
    };
    setMessages(prev => [...prev, newUserMsg]);
    setIsProcessing(true);
    setShowGraph(false);

    try {
      let base64ForApi = null;
      if (imageFile) {
        base64ForApi = await resizeImage(imageFile);
      }

      let context = "";
      if (messages.length > 0) {
        context = "\n\n[이전 대화 기록 (참고용)]:\n" + messages.map(m => 
          `${m.role === 'user' ? 'Q' : 'A'}: ${m.text || (m.result ? '풀이 완료' : '이미지')}`
        ).join("\n");
      }

      const promptText = `${INITIAL_PROMPT}${context}\n\n[현재 질문]: ${inputText || "이미지를 분석해주세요."}`;
      
      const data = await callGemini(apiKey, promptText, base64ForApi);

      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        result: data
      };
      setMessages(prev => [...prev, newAiMsg]);

      if (messages.length === 0) {
        Storage.addHistory({
          id: Date.now().toString(),
          type: imageFile ? "image" : "text",
          question: inputText || t("dashboard.image_question"),
          answer: data.explanation,
          graphCode: data.graphCode,
          timestamp: Date.now(),
          previewImage: base64ForApi ? `data:image/jpeg;base64,${base64ForApi}` : undefined
        });
      }

    } catch (error: any) {
      console.error(error);
      toast.error("오류: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateGraph = async (messageId: string, explanation: string) => {
    const apiKey = Storage.getApiKey();
    if (!apiKey) return;

    setGraphLoadingId(messageId);
    
    try {
      const prompt = `${GRAPH_PROMPT}\n\n[문제 풀이 내용]:\n${explanation}`;
      const data = await callGemini(apiKey, prompt, null);

      if (data.graphCode) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.result) {
            return {
              ...msg,
              result: {
                ...msg.result,
                graphCode: data.graphCode
              }
            };
          }
          return msg;
        }));
        setShowGraph(true);
        toast.success(t("solver.graph_success"));
      } else {
        toast.error(t("solver.graph_error"));
      }
    } catch (error: any) {
      toast.error("오류: " + error.message);
    } finally {
      setGraphLoadingId(null);
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (showGraph && lastMsg?.role === 'ai' && lastMsg.result?.graphCode && window.Plotly) {
      try {
        const runGraph = new Function(lastMsg.result.graphCode);
        runGraph();
        window.addEventListener('resize', () => window.Plotly.Plots.resize('chart'));
        return () => window.removeEventListener('resize', () => window.Plotly.Plots.resize('chart'));
      } catch (e) {
        console.error("Graph Error:", e);
      }
    }
  }, [showGraph, messages]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] dark:bg-[#030213]">
      <Toaster position="top-center" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-gray-200/50 dark:border-gray-800/50 px-6 py-4"
      >
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-[14px] bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </motion.button>
          
          <div className="flex-1 min-w-0">
            <h2 className="tracking-tight font-bold text-gray-900 dark:text-white truncate">
              {t("solver.title")}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {t("solver.subtitle")}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-sm whitespace-nowrap">
            <Cpu className="w-3.5 h-3.5" />
            <span>{currentModel || "Loading..."}</span>
          </div>
          
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          
          <AnimatePresence mode="wait">
            {messages.length === 0 && (
              <motion.div
                key="initial-input"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="mt-10"
              >
                <InputCard onSend={handleSend} isProcessing={isProcessing} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.role === 'user' && (
                  <div className="max-w-[90%]">
                    {msg.image && (
                      <img src={msg.image} alt="User upload" className="w-48 rounded-2xl mb-2 border border-gray-200 dark:border-gray-700 ml-auto" />
                    )}
                    {msg.text && (
                      <div className="bg-primary text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md text-sm sm:text-base">
                        {msg.text}
                      </div>
                    )}
                  </div>
                )}

                {msg.role === 'ai' && msg.result && (
                  <div className="w-full space-y-6">
                    {parseResponse(msg.result.explanation).map((section, idx) => (
                      <ResultCard key={idx} section={section} index={idx} />
                    ))}

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-end">
                        {msg.result.graphCode ? (
                          <button
                            onClick={() => setShowGraph(!showGraph)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                              showGraph 
                                ? "bg-primary text-white shadow-primary/30" 
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <BarChart2 className="w-4 h-4" />
                            {showGraph ? t("solver.graph_hide") : t("solver.graph_view")}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateGraph(msg.id, msg.result!.explanation)}
                            disabled={graphLoadingId === msg.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {graphLoadingId === msg.id ? (
                              <>
                                <Sparkles className="w-4 h-4 animate-spin" />
                                <span>{t("solver.graph_creating")}</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4" />
                                <span>{t("solver.graph_create")}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {showGraph && msg.result.graphCode && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-[32px] p-4 border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden"
                          >
                            <div id="chart" className="w-full h-[400px]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                )}
              </motion.div>
            ))}

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 max-w-[240px]"
              >
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
                    <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                  </div>
                  <span className="text-sm font-bold">{t("solver.solving")}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{Math.round(progress)}%</span>
                </div>
                
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}
            
            <div ref={scrollRef} />
          </div>

          <AnimatePresence>
            {messages.length > 0 && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="pt-4"
              >
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{t("solver.add_question")}</span>
                </div>
                <InputCard onSend={handleSend} isProcessing={isProcessing} isCompact={true} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

function InputCard({ onSend, isProcessing, isCompact = false }: { 
  onSend: (text: string, file: File | null, base64: string | null) => void, 
  isProcessing: boolean,
  isCompact?: boolean 
}) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && !file) return;
    onSend(text, file, image);
    setText("");
    setImage(null);
    setFile(null);
  };

  return (
    <div className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[32px] border border-white/50 dark:border-gray-800 shadow-sm transition-all ${isCompact ? 'p-4' : 'p-6'}`}>
      <AnimatePresence>
        {image && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 relative"
          >
            <div className="relative rounded-[20px] overflow-hidden border border-gray-200 dark:border-gray-700 inline-block">
              <img src={image} alt="Preview" className="max-h-40 object-contain bg-gray-50 dark:bg-black" />
              <button
                onClick={() => { setImage(null); setFile(null); }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isCompact ? t("solver.placeholder") : t("solver.placeholder")}
        className={`w-full bg-transparent resize-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 text-base ${isCompact ? 'min-h-[60px]' : 'min-h-[100px]'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <label className="cursor-pointer group">
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 rounded-[16px] transition-colors">
            <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            {!isCompact && <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t("solver.upload")}</span>}
          </div>
        </label>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={isProcessing || (!text.trim() && !image)}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-primary to-accent rounded-[16px] text-white shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          {isProcessing ? (
            <Sparkles className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              {!isCompact && <span className="text-sm font-bold">{t("solver.solve")}</span>}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

function ResultCard({ section, index }: { section: ParsedSection, index: number }) {
  // 🟢 [추가됨] 출처 및 알림 섹션 전용 스타일
  if (section.title.includes("출처") || section.title.includes("알림")) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-gray-50 dark:bg-gray-800/50 rounded-[24px] p-5 border border-gray-200 dark:border-gray-700 mb-4"
      >
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
          <Info className="w-4 h-4" />
          {section.title}
        </h3>
        <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300">
          <ReactMarkdown>{section.content}</ReactMarkdown>
        </div>
      </motion.div>
    );
  }

  if (section.title.includes("사용된 개념")) {
    const concepts = section.content.split(/,|、/).map(c => c.trim()).filter(c => c);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
      >
        <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"/>
          {section.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {concepts.map((concept, i) => (
            <span key={i} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800">
              {concept}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  if (section.title.includes("최종 정답") || section.title.includes("정답")) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-[24px] p-6 border border-primary/20 dark:border-primary/30 shadow-sm"
      >
        <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {section.title}
        </h3>
        <div className="text-xl font-bold text-gray-900 dark:text-white pl-1">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {section.content}
          </ReactMarkdown>
        </div>
      </motion.div>
    );
  }

  if (section.title.includes("풀이") || section.title.includes("과정")) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
      >
        <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"/>
          {section.title}
        </h3>
        
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
            components={{
              h3: ({node, ...props}) => (
                <div className="mt-8 mb-4 flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">STEP</span>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 m-0" {...props} />
                </div>
              ),
              p: ({node, ...props}) => (
                <p className="mb-4 leading-loose text-gray-600 dark:text-gray-300 text-[15px]" {...props} />
              ),
              strong: ({node, ...props}) => (
                <strong className="text-primary font-bold bg-primary/5 px-1 rounded" {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-600 dark:text-gray-300" {...props} />
              ),
              li: ({node, ...props}) => (
                <li className="leading-relaxed" {...props} />
              )
            }}
          >
            {section.content}
          </ReactMarkdown>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
    >
      <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
        <span className="w-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"/>
        {section.title}
      </h3>
      <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {section.content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}