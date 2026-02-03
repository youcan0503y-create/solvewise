// 🟢 [설정] 사용자님의 전용 지식 서버 주소
const SEARCH_API_URL = "https://solvewise-server.onrender.com/api/search";

// 🟢 [프롬프트] 강사 빙의 모드 (자료 검증 로직 추가)
export const INITIAL_PROMPT = `
당신은 대한민국 최고의 KICPA(공인회계사) 수험생을 위한 AI 튜터 'SolveWise'입니다.
사용자의 질문에 대해 아래 제공될 **[참고 자료(Context)]**를 바탕으로 답변하세요.

**[⚠️ 중요: 자료 검증 및 행동 지침]**
가장 먼저 **[참고 자료]**가 현재 질문을 풀기에 적합한지 스스로 판단하세요.
1. **적합함 (DB 활용)**: 자료 안에 질문과 직결된 **'와꾸(풀이 틀)', '단계(Step)', '핵심 이론'**이 명확히 포함되어 있다면, 강사의 말투와 풀이 방식을 완벽히 모방하여 답변하세요.
2. **부적합함 (검색 전환)**: 자료가 질문과 주제만 비슷할 뿐 구체적인 풀이 방법이 없거나 기초적인 내용뿐이라면, **과감하게 자료를 무시하고 [Google Search] 도구를 사용하여** 웹 검색 결과로 답변하세요.

**[답변 원칙]**
1. **와꾸(Frame) 우선**: 풀이 시 표나 LaTeX 수식으로 구조화된 '와꾸'를 가장 먼저 제시하세요.
2. **말투 모방**: (DB 활용 시) 강사의 뉘앙스("이건 낚시야")를 섞어 쓰세요.
3. **출처 명시**: DB 자료를 썼다면 "참고 자료"를, 웹 검색을 했다면 "웹 검색"을 출처로 밝히세요.
`;

// 🟢 [프롬프트] 웹 검색 모드 (DB 데이터 없음)
const WEB_SEARCH_PROMPT = `
당신은 KICPA 전문 AI 튜터입니다.
**첨부된 이미지(또는 질문)와 관련된 내용이 내부 데이터베이스에 없습니다.**
따라서 강사의 풀이 방식(와꾸)을 억지로 따르지 말고, **Google 검색(Web Search)**과 당신의 일반적인 회계/경제학 지식을 활용해 문제를 정확하게 풀어주세요.

**[답변 원칙: 웹 검색 모드]**
1. **이미지 분석 우선**: 첨부된 이미지의 문제 내용을 정확히 파악하고, 최신 회계 기준(K-IFRS)과 경제학 이론에 근거하여 풀이하세요.
2. **표준 풀이**: 강사의 와꾸가 없으므로, 수험생들이 일반적으로 사용하는 표준적인 풀이 틀을 사용하여 설명하세요.
`;

// 🟢 [공통] 출력 형식
const OUTPUT_FORMAT = `
---
**[필수 출력 형식]**

**1. 문제 유형**
(예: 재무회계 차입원가 자본화)

**2. 사용된 개념**
(설명하지 말고 핵심 단어만 쉼표로 나열하세요. 예: 현시선호이론, 약공리, 예산선)

**3. 문제 질문 텍스트 분석**
(이미지의 지문과 조건을 텍스트로 정리)

**4. 문제 풀이 과정**
- **[강사님 와꾸]**: (DB 자료가 유효할 때만 작성, 아니면 '표준 풀이'로 대체)
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

// 🟢 [핵심] 모델 필터링 및 정렬 로직
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
        /\d/.test(name) && 
        !name.includes("latest")
      );
    });

    const getScore = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes("3.0") || n.includes("ultra")) return 200;
      if (n.includes("pro")) return 100;
      if (n.includes("flash")) return 50;
      return 10;
    };

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

export async function checkCurrentModel(apiKey: string): Promise<string> {
  const models = await getSortedModels(apiKey);
  if (models.length > 0) {
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

// 🟢 [핵심] 이미지에서 최적의 검색 쿼리 생성 함수
async function generateSearchQueryFromImage(apiKey: string, base64Image: string): Promise<string> {
  try {
    console.log("🖼️ [Vision] 이미지 분석 중... (검색 쿼리 생성)");
    const modelList = await getSortedModels(apiKey);
    const modelName = modelList[0]; 

    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
    
    const prompt = `
      이 이미지는 KICPA(회계사) 시험 문제입니다.
      이 문제를 풀기 위해 데이터베이스에서 '강사의 풀이법(와꾸)'을 검색하려고 합니다.
      
      이미지의 내용을 분석하여 **데이터베이스 검색에 가장 최적화된 '검색어(Query)'**를 한 문장으로 만드세요.
      
      [작성 규칙]
      1. 핵심 주제(예: 차입원가, 현금흐름표)와 세부 유형(예: 자본화, 간접법)을 포함하세요.
      2. 문제에서 묻는 핵심 질문(예: X값 구하기, 리스크 프리미엄 계산)을 포함하세요.
      3. 잡담 없이 **검색어만** 출력하세요.
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
          ]
        }]
      }),
    });

    const json = await response.json();
    const query = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log(`   👉 생성된 검색 쿼리: "${query.trim()}"`);
    return query.trim();

  } catch (error) {
    console.error("❌ 이미지 분석 실패:", error);
    return "";
  }
}

// 🟢 [최종] AI 호출 함수 (이중 안전장치 적용)
export async function callGemini(apiKey: string, prompt: string, base64Image: string | null) {
  const modelList = await getSortedModels(apiKey);
  if (modelList.length === 0) throw new Error("사용 가능한 AI 모델이 없습니다.");

  const userQuery = prompt.split("[현재 질문]:")[1]?.trim() || prompt;

  let searchQuery = userQuery;
  if (base64Image) {
    const generatedQuery = await generateSearchQueryFromImage(apiKey, base64Image);
    if (generatedQuery) searchQuery = `${generatedQuery} ${userQuery}`;
  }

  let dbContext = "";
  let isDbFound = false;
  let sources: string[] = [];

  if (searchQuery.trim()) {
    const result = await fetchContextFromBackend(searchQuery);
    dbContext = result.context;
    isDbFound = result.found;
    sources = result.sources;
  }

  let finalPrompt = "";
  let tools: any = undefined;
  let headerBadge = "";

  if (isDbFound) {
    // [CASE A: DB 모드]
    const uniqueSources = [...new Set(sources)].join(", ");
    headerBadge = `### 📚 **[내부 지식 DB 기반 답변]**\n> **참고한 강의**: ${uniqueSources}\n\n`;

    finalPrompt = `
${INITIAL_PROMPT}

**[참고 자료 (강의 DB 검색 결과)]**
${dbContext}

**[지시사항]**
첨부된 **이미지의 문제**를 위 **[참고 자료]**에 있는 강사의 '와꾸(풀이 틀)'와 '논리'를 그대로 적용하여 푸세요.
단, 자료가 부적합하다고 판단되면 **Google Search**를 사용하세요.

${OUTPUT_FORMAT}

[사용자 질문]: ${userQuery}
`;
    // 🟢 [핵심] DB 모드에서도 검색 도구 활성화 (이중 안전장치)
    tools = [{ google_search: {} }];

  } else {
    // [CASE B: 웹 검색 모드]
    headerBadge = `### 🌐 **[구글 웹 검색 기반 답변]**\n> **알림**: 내부 DB에 관련 내용이 없어 웹 검색을 수행했습니다.\n\n`;

    finalPrompt = `
${WEB_SEARCH_PROMPT}

${OUTPUT_FORMAT}

[사용자 질문]: ${userQuery}
`;
    tools = [{ google_search: {} }];
  }

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
      
      const codeMatch = text.match(/```javascript([\s\S]*?)```/);
      let graphCode = "";
      let explanation = text;

      if (codeMatch) {
        graphCode = codeMatch[1].trim().replace(/Plotly\.newPlot\(['"](.*?)['"]/, "Plotly.newPlot('chart'");
        explanation = text.replace(codeMatch[0], "");
      }

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