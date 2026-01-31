// 🟢 [수정됨] 텍스트 풀이 전용 프롬프트
export const INITIAL_PROMPT = `
당신은 경제학 튜터이자 프로그래머입니다.
제공된 이미지를 분석하여 다음 **[출력 형식]**에 맞춰 한국어로 답변을 작성해주세요.

**[출력 형식]**

**1. 문제 유형**
(예: 미시경제학 소비자이론)

**2. 사용된 개념**
(핵심 개념들을 쉼표(,)로 구분하여 나열하세요. 예: 독점기업, 이윤극대화, 한계비용)

**3. 문제 질문 텍스트 분석**
(이미지의 지문과 조건을 텍스트로 정리)

**4. 문제 풀이 과정**
- **반드시 각 단계를 '### 단계 N: [핵심 내용]' 형식의 제목으로 시작하세요.** (예: ### 단계 1: 이윤함수 설정)
- 설명 텍스트와 수식은 **반드시 줄바꿈**으로 분리하세요.
- 계산 식이나 중요한 수식은 문장 중간에 넣지 말고, **반드시 별도의 줄에 $$ ... $$ (Display Math) 형식을 사용**하여 작성하세요.
- **가독성을 위해 줄글을 길게 쓰지 말고, 문장을 끊어서 작성하세요.**

**5. 최종 정답**
(최종 도출된 정답만 간결하게 작성)

**주의사항**: 이 단계에서는 시각화(그래프) 코드를 작성하지 마세요. 텍스트 풀이에만 집중하세요.
`;

// 🟢 [수정됨] 그래프 생성 전용 프롬프트 (한국어 강제 및 겹침 방지 추가)
export const GRAPH_PROMPT = `
위 문제의 상황을 시각화하기 위한 **Plotly.js 자바스크립트 코드**를 작성하세요.
이전 대화 내용을 바탕으로 정확한 수치와 곡선을 그리세요.

**[중요] 그래프 설정**: 
1. 반드시 \`Plotly.newPlot('chart', ...)\`를 사용하세요. (ID는 'chart'여야 함)
2. layout 변수의 xaxis와 yaxis에 \`fixedrange: true\`를 추가하여 줌/이동을 막으세요.
3. \`{displayModeBar: false}\` 옵션을 추가하세요.
4. 데이터 배열 변수명은 \`data\`, 레이아웃 변수명은 \`layout\`으로 하세요.
5. 코드는 반드시 \`\`\`javascript ... \`\`\` 블록으로 감싸주세요.
6. 설명 없이 **코드만** 작성하세요.

**[디자인 및 언어 설정 - 필수]**:
7. **그래프의 제목, 축 레이블, 범례, 주석(Annotation) 등 모든 텍스트는 반드시 '한국어'로 작성하세요.**
8. **텍스트 겹침 방지**: 주석(Annotation)이 선이나 다른 텍스트와 겹치지 않도록 위치(x, y, ax, ay)를 신중하게 조정하세요. 
9. 배경색은 흰색, 글자색은 진한 회색을 사용하여 가독성을 높이세요.
`;

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

// 🟢 [완전 동적 로직] 하드코딩 없이 API에서 받아온 정보만으로 순위를 매깁니다.
async function getSortedModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();
    
    if (!data.models) return [];

    const capableModels = data.models.filter((m: any) => 
      m.supportedGenerationMethods.includes("generateContent") &&
      m.name.toLowerCase().includes("gemini")
    );

    capableModels.sort((a: any, b: any) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      const getVersion = (name: string) => {
        const match = name.match(/gemini-(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0; 
      };

      const verA = getVersion(nameA);
      const verB = getVersion(nameB);

      if (verA !== verB) return verB - verA;

      const getTierScore = (name: string) => {
        if (name.includes("ultra")) return 4;
        if (name.includes("pro")) return 3;
        if (name.includes("flash")) return 2;
        if (name.includes("nano")) return 1;
        return 0;
      };

      return getTierScore(nameB) - getTierScore(nameA);
    });

    return capableModels.map((m: any) => m.name);

  } catch (e) {
    console.error("Model fetch error:", e);
    return ["models/gemini-pro"]; 
  }
}

// 현재 사용될 최적의 모델 이름을 반환하는 함수
export async function checkCurrentModel(apiKey: string): Promise<string> {
  const models = await getSortedModels(apiKey);
  if (models.length > 0) {
    const rawName = models[0].replace("models/", "");
    return rawName
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return "Unknown Model";
}

export async function callGemini(apiKey: string, prompt: string, base64Image: string | null) {
  const modelList = await getSortedModels(apiKey);
  
  if (modelList.length === 0) {
    throw new Error("사용 가능한 AI 모델을 찾을 수 없습니다.");
  }

  let lastError = null;

  for (const modelName of modelList) {
    try {
      console.log(`Attempting with model: ${modelName}`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

      const parts: any[] = [{ text: prompt }];
      if (base64Image) {
        parts.push({
          inline_data: { mime_type: "image/jpeg", data: base64Image }
        });
      }

      const body = { contents: [{ parts }] };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message);
      }
      
      if (!json.candidates || json.candidates.length === 0) {
        throw new Error("AI 응답이 비어있습니다.");
      }

      const text = json.candidates[0].content.parts[0].text;
      const codeMatch = text.match(/```javascript([\s\S]*?)```/);
      let graphCode = "";
      let explanation = text;

      if (codeMatch) {
        graphCode = codeMatch[1].trim();
        graphCode = graphCode.replace(/Plotly\.newPlot\(['"](.*?)['"]/, "Plotly.newPlot('chart'");
        explanation = text.replace(codeMatch[0], "");
      }

      return { explanation, graphCode };

    } catch (error: any) {
      console.warn(`Failed with ${modelName}:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`모든 모델 시도 실패. 마지막 오류: ${lastError?.message}`);
}