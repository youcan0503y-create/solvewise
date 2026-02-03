// 🟢 [설정] 사용자님의 전용 지식 서버 주소
const SEARCH_API_URL = "https://solvewise-server.onrender.com/api/search";

// 🟢 [프롬프트] 강사 빙의 모드 (DB 기반)
export const INITIAL_PROMPT = `
당신은 대한민국 최고의 KICPA(공인회계사) 수험생을 위한 AI 튜터 'SolveWise'입니다.
사용자의 질문에 대해 아래 제공될 **[참고 자료(Context)]**를 바탕으로 답변하세요.

**[답변 원칙: 강사 빙의 모드]**
1. **와꾸(Frame) 우선**: [참고 자료]에 해당 문제 유형에 대한 강사의 '와꾸(문제 풀이 틀)'나 '판서 구조'가 **명확히 포함된 경우**, 이를 풀이 과정의 핵심으로 다루세요. (없다면 억지로 만들지 마세요.)
2. **말투 모방**: 강사의 뉘앙스, 비유("이건 낚시야", "돈주머니 같아")를 설명에 자연스럽게 섞어 쓰세요.
3. **정직함**: 자료에 없는 내용은 "강의 자료에서 찾을 수 없어, 일반적인 지식으로 답변합니다"라고 명시하세요.
`;

// 🟢 [프롬프트] 웹 검색 모드 (Google Search)
const WEB_SEARCH_PROMPT = `
당신은 KICPA 전문 AI 튜터입니다.
내부 데이터베이스에 관련 강의 내용이 없어, **Google 검색(Web Search)**을 통해 실시간 정보를 찾아 답변해야 합니다.

**[답변 원칙: 웹 검색 모드]**
1. **정확성**: 최신 회계 기준(K-IFRS)과 정확한 경제학 이론에 근거하여 답변하세요.
2. **와꾸 설명**: 일반적인 수험서에서 사용하는 표준적인 풀이 틀(와꾸)을 사용하여 설명하세요.
`;

// 🟢 [공통] 출력 형식
const OUTPUT_FORMAT = `
---
**[필수 출력 형식]**

**1. 문제 유형**
(예: 재무회계 차입원가 자본화)

**2. 사용된 개념**
(핵심 개념들을 쉼표(,)로 구분하여 나열하세요.)

**3. 문제 질문 텍스트 분석**
(이미지의 지문과 조건을 텍스트로 정리)

**4. 문제 풀이 과정**
- **[강사님 와꾸]**: (DB에 와꾸가 있을 경우에만 작성, 없으면 생략)
- **반드시 각 단계를 '### 단계 N: [핵심 내용]' 형식의 제목으로 시작하세요.**
- 계산 식이나 중요한 수식은 문장 중간에 넣지 말고, **반드시 별도의 줄에 $$ ... $$ (Display Math) 형식을 사용**하여 작성하세요.

**5. 최종 정답**
(간결하게 작성)
`;

// 🟢 그래프 생성 프롬프트
export const GRAPH_PROMPT = `
위 문제의 상황을 시각화하기 위한 **Plotly.js 자바스크립트 코드**를 작성하세요.
**[중요] 그래프 설정**: 
1. 반드시 \`Plotly.newPlot('chart', ...)\`를 사용하세요. (ID는 'chart'여야 함)
2. layout 변수의 xaxis와 yaxis에 \`fixedrange: true\`를 추가하세요.
3. \`{displayModeBar: false}\` 옵션을 추가하세요.
4. 데이터 배열 변수명은 \`data\`, 레이아웃 변수명은 \`layout\`으로 하세요.
5. 코드는 반드시 \`\`\`javascript ... \`\`\` 블록으로 감싸주세요.
6. 설명 없이 **코드만** 작성하세요.
7. **모든 텍스트는 한국어**로 작성하세요.
`;

// 🟢 이미지 리사이징 함수
export async function resizeImage(file: File, maxSide: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.floor(height * (maxSide / width));
            width = maxSide;
          } else {
            width = Math.floor(width * (maxSide / height));
            height = maxSide;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl.split(",")[1]);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 🟢 [핵심 수정] 모델 필터링 및 정렬 로직
async function getSortedModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();
    if (!data.models) return ["gemini-1.5-pro"];

    const capableModels = data.models.filter((m: any) => {
      const name = m.name.toLowerCase();
      return (
        m.supportedGenerationMethods.includes("generateContent") &&
        name.includes("gemini") &&
        /\d/.test(name) && // 🟢 [수정] 이름에 반드시 숫자(버전)가 포함되어야 함
        !name.includes("latest") // 🟢 [수정] 'latest' 같은 모호한 별칭은 제외
      );
    });

    // [점수 계산] Pro 등급에 높은 가산점 부여
    const getScore = (name: string) => {
      const n = name.toLowerCase();
      // 1. 최신 고성능 (3.0, Ultra)
      if (n.includes("3.0") || n.includes("ultra")) return 200;
      // 2. Pro 모델 (버전 상관없이 Flash보다 우선)
      if (n.includes("pro")) return 100;
      // 3. Flash 모델
      if (n.includes("flash")) return 50;
      // 4. 기타
      return 10;
    };

    // 정렬: 점수 높은 순 -> (점수 같으면) 이름 내림차순(보통 최신 버전이 위로 옴)
    capableModels.sort((a: any, b: any) => {
      const scoreA = getScore(a.name);
      const scoreB = getScore(b.name);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.name.localeCompare(a.name); 
    });

    return capableModels.map((m: any) => m.name);
  } catch (e) {
    console.error("Model fetch error:", e);
    return ["gemini-1.5-pro"]; 
  }
}

// 🟢 [수정됨] 모델명 그대로(Raw ID) 출력
export async function checkCurrentModel(apiKey: string): Promise<string> {
  const models = await getSortedModels(apiKey);
  if (models.length > 0) {
    // "models/gemini-1.5-pro-002" -> "gemini-1.5-pro-002"
    return models[0].replace("models/", "");
  }
  return "No Model Found";
}

// 🟢 백엔드 지식 검색 함수
async function fetchContextFromBackend(query: string): Promise<{ context: string, found: boolean, sources: string[] }> {
  try {
    console.log(`📡 [Backend] 검색 요청: "${query}"`);
    const response = await fetch(SEARCH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error("Backend error");

    const data = await response.json();
    
    if (!data.found || !data.results || data.results.length === 0) {
      console.log("   ⚠️ DB 지식 없음 -> 웹 검색 전환");
      return { context: "", found: false, sources: [] };
    }

    const sources = data.results.map((item: any) => item.source);
    const contextText = data.results.map((item: any, idx: number) => `
--- [참고 자료 ${idx + 1}] (출처: ${item.source} / ${item.title}) ---
${item.content}
`).join("\n\n");

    console.log(`   ✅ DB 지식 확보: ${sources.join(", ")}`);
    return { context: contextText, found: true, sources };

  } catch (error) {
    console.warn("⚠️ 백엔드 연결 실패:", error);
    return { context: "", found: false, sources: [] };
  }
}

// 🟢 AI 호출 메인 함수 (하이브리드 검색 + 배지 부착)
export async function callGemini(apiKey: string, prompt: string, base64Image: string | null) {
  const modelList = await getSortedModels(apiKey);
  if (modelList.length === 0) throw new Error("사용 가능한 AI 모델이 없습니다.");

  // 1. 사용자 질문 추출
  const userQuery = prompt.split("[현재 질문]:")[1]?.trim() || prompt;

  // 2. 지식 검색 (이미지가 없을 때만 수행)
  let dbContext = "";
  let isDbFound = false;
  let sources: string[] = [];

  if (!base64Image) {
    const result = await fetchContextFromBackend(userQuery);
    dbContext = result.context;
    isDbFound = result.found;
    sources = result.sources;
  }

  // 3. 모드별 프롬프트 및 도구 설정
  let finalPrompt = "";
  let tools: any = undefined;
  let headerBadge = "";

  if (isDbFound) {
    // [DB 모드]
    const uniqueSources = [...new Set(sources)].join(", ");
    headerBadge = `### 📚 **[내부 지식 DB 기반 답변]**\n> **참고한 강의**: ${uniqueSources}\n\n`;

    finalPrompt = `
${INITIAL_PROMPT}

**[참고 자료 (강의 DB 검색 결과)]**
${dbContext}

${OUTPUT_FORMAT}

${prompt}
`;
  } else {
    // [웹 검색 모드]
    headerBadge = `### 🌐 **[구글 웹 검색 기반 답변]**\n> **알림**: 내부 DB에 관련 내용이 없어 웹 검색을 수행했습니다.\n\n`;

    finalPrompt = `
${WEB_SEARCH_PROMPT}

${OUTPUT_FORMAT}

${prompt}
`;
    // Google Search 도구 활성화
    tools = [{ google_search: {} }];
  }

  // 4. AI 호출 및 재시도 로직
  let lastError = null;

  for (const modelName of modelList) {
    try {
      console.log(`Attempting with model: ${modelName}`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
      const parts: any[] = [{ text: finalPrompt }];
      if (base64Image) {
        parts.push({
          inline_data: { mime_type: "image/jpeg", data: base64Image }
        });
      }
      
      const body: any = { contents: [{ parts }] };
      if (tools) body.tools = tools;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await response.json();
      if (json.error) throw new Error(json.error.message);
      if (!json.candidates || json.candidates.length === 0) throw new Error("AI 응답 없음");

      const text = json.candidates[0].content.parts[0].text;
      
      // 그래프 코드 추출
      const codeMatch = text.match(/```javascript([\s\S]*?)```/);
      let graphCode = "";
      let explanation = text;

      if (codeMatch) {
        graphCode = codeMatch[1].trim().replace(/Plotly\.newPlot\(['"](.*?)['"]/, "Plotly.newPlot('chart'");
        explanation = text.replace(codeMatch[0], "");
      }

      // [최종] 답변 맨 앞에 출처 배지 부착
      const finalExplanation = headerBadge + explanation;

      return { explanation: finalExplanation, graphCode };

    } catch (error: any) {
      console.warn(`Failed with ${modelName}:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`AI 호출 실패: ${lastError?.message}`);
}