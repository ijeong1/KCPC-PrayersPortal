// app/api/ai/voice/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// .env.local에서 API 키 불러오기 (서버 환경에서만 접근 가능)
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error('SERVER ERROR: GEMINI_API_KEY is NOT loaded. Check .env.local');
    // 실제 운영 환경에서는 앱 시작 시 오류를 발생시키거나 경고를 더 명확하게 표시하는 것이 좋습니다.
} else {
    console.log('SERVER INFO: GEMINI_API_KEY is successfully loaded.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey || '');

export async function POST(request: Request) {
    try {
        const { text } = await request.json(); // Request 객체에서 JSON 본문 파싱

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: '유효한 텍스트가 제공되지 않았습니다.' }, { status: 400 });
        }

        // --- 여기를 'gemini-1.5-flash'로 변경합니다! ---
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
        // ---------------------------------------------

        // Gemini에게 보낼 프롬프트 (여전히 한글 키로 요청합니다. 변환은 API 라우트에서 수행)
        const prompt = `
            다음 기도 요청 텍스트에서 '제목', '내용', '마감일', '익명 여부'를 추출하여 JSON 형식으로 반환해줘.
            
            - '제목': 기도 요청의 간략한 제목.
            - '내용': 기도 요청의 구체적인 내용.
            - '마감일': YYYY-MM-DD 형식의 마감일 (예: 2024-12-31). 마감일 언급이 없으면 빈 문자열.
            - '익명_여부': 텍스트에 "익명으로", "익명 처리", "개인 정보 없이" 등의 내용이 포함되면 true, 그렇지 않으면 false.
            
            만약 해당 정보가 없으면 빈 문자열이나 false로 반환해.
            예시: {"제목": "가족 건강", "내용": "우리 가족 모두 건강하게 해주세요.", "마감일": "2024-12-31", "익명_여부": true}
            예시2: {"제목": "취업 기도", "내용": "좋은 직장에 합격하게 해주세요.", "마감일": "", "익명_여부": false}

            텍스트: "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const geminiText = response.text();
        
        console.log('SERVER INFO: Gemini raw response text:', geminiText); // Gemini 원본 응답 확인용

        let rawParsedData: { [key: string]: any }; // Gemini에서 받은 원본 데이터 타입
        try {
            // Gemini가 ```json ... ``` 형식으로 응답할 수 있으므로 파싱 로직 추가
            const jsonMatch = geminiText.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                rawParsedData = JSON.parse(jsonMatch[1]);
            } else {
                rawParsedData = JSON.parse(geminiText);
            }
            
            // 여기서 한글 키를 영어 키로 매핑합니다.
            const mappedData = {
                title: rawParsedData['제목'] || '',
                content: rawParsedData['내용'] || '',
                deadline: rawParsedData['마감일'] || '',
                isAnonymous: rawParsedData['익명_여부'] || false, // boolean 타입 확인
            };

            return NextResponse.json(mappedData, { status: 200 });

        } catch (parseError) {
            console.error("JSON 파싱 또는 매핑 오류 (API 라우트):", parseError);
            return NextResponse.json(
                { error: 'Gemini 응답을 파싱하거나 매핑하는 데 실패했습니다.', detail: (parseError as Error).message },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Gemini API 호출 오류 (API 라우트):", error);
        return NextResponse.json(
            { error: 'Gemini API 처리 중 오류가 발생했습니다.', detail: (error as Error).message },
            { status: 500 }
        );
    }
}