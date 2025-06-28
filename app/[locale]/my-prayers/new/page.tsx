'use client'; // 클라이언트 컴포넌트임을 명시

import Link from 'next/link';
import { useTranslations } from 'next-intl'; // 다국어 처리를 위한 훅
import { useRouter } from 'next/navigation'; // Next.js 라우터 훅
import { useState, useEffect, useRef } from 'react'; // React 훅 임포트

// 폼 데이터 타입을 정의합니다. API 응답과 매칭되는 영어 키를 사용합니다.
interface PrayerFormData {
  title: string;
  content: string;
  deadline: string;
  isAnonymous: boolean;
}

export default function NewPrayerRequestPage() {
  const t = useTranslations('MyPrayersNew'); // 다국어 번역 함수 초기화
  const router = useRouter(); // 라우터 인스턴스 초기화

  // 폼 필드의 상태 관리
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 음성 인식 및 UI 관련 상태 관리
  const [isRecording, setIsRecording] = useState(false); // 녹음 중인지 여부
  const [statusMessage, setStatusMessage] = useState('음성 인식 API 초기화 중...'); // 초기 상태 메시지
  const [recognizedText, setRecognizedText] = useState(''); // 인식된 원본 텍스트

  // Web Speech API의 SpeechRecognition 인스턴스를 저장하기 위한 useRef
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 컴포넌트 마운트 시 Web Speech API 초기화
  useEffect(() => {
    // `window` 객체는 클라이언트(브라우저) 환경에서만 존재하므로 이를 확인합니다.
    if (typeof window !== 'undefined') {
      // 브라우저의 SpeechRecognition API를 가져옵니다.
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        // SpeechRecognition 인스턴스 생성
        const sr = new SpeechRecognition();
        sr.continuous = true; // 핵심: 연속적인 음성 입력을 받도록 설정
        sr.lang = 'ko-KR'; // 한국어 음성 인식을 설정합니다.
        sr.interimResults = true; // 중간 결과도 받아서 실시간 피드백 제공

        // 음성 인식이 완료되었을 때 실행되는 콜백
        sr.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          // 모든 결과(중간 및 최종)를 순회
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          // 화면에는 최종 결과와 중간 결과를 모두 표시하여 사용자에게 실시간 피드백 제공
          setRecognizedText(finalTranscript + interimTranscript); 
          
          // 최종 결과가 있을 때만 Gemini API로 전송
          if (finalTranscript) {
            setStatusMessage("음성 인식 완료. Gemini AI 처리 중...");
            sendTextToGemini(finalTranscript); // 최종 결과만 AI로 전송
          } else {
            setStatusMessage("음성 인식 중... (말씀해주세요)"); // 중간 결과가 있을 때
          }
        };

        // 음성 인식 중 오류가 발생했을 때 실행되는 콜백
        sr.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech Recognition Error:", event.error);
          setStatusMessage(`음성 인식 오류: ${event.error}. 다시 시도해주세요.`);
          setIsRecording(false); // 녹음 상태 해제
        };

        // 음성 인식이 끝났을 때 실행되는 콜백 (중요!)
        sr.onend = () => {
          // 'continuous'가 true일 때도 브라우저의 내부 시간 제한(예: 1분)으로 인해
          // 인식이 자동으로 종료될 수 있습니다.
          // 이 경우, 사용자가 '중지' 버튼을 누르지 않았다면 인식을 재시작합니다.
          if (isRecording) { // isRecording이 true라는 것은 사용자가 아직 중지하지 않았다는 의미
              console.log("Speech Recognition session ended unexpectedly. Attempting to restart...");
              setStatusMessage("인식 세션이 종료되어 재시작합니다. 계속 말씀해주세요.");
              // 짧은 딜레이 후 재시작하여 무한 루프 방지 및 안정성 확보
              setTimeout(() => {
                  if (recognitionRef.current && isRecording) { // 재시작 전 다시 상태 확인
                     recognitionRef.current.start();
                  }
              }, 500); // 0.5초 후 재시작
          } else {
              // 사용자가 '중지' 버튼을 눌러서 인식이 종료된 경우
              setStatusMessage("녹음 중지됨.");
          }
        };

        // 생성된 SpeechRecognition 인스턴스를 useRef에 저장
        recognitionRef.current = sr;
        setStatusMessage("음성 인식 준비 완료. '녹음 시작' 버튼을 눌러주세요."); // 성공적으로 초기화됨
      } else {
        // 브라우저가 Web Speech API를 지원하지 않을 경우
        setStatusMessage("죄송합니다, 이 브라우저는 Web Speech API를 지원하지 않습니다.");
      }
    } else {
      setStatusMessage("클라이언트 환경에서만 음성 인식이 가능합니다."); // SSR 환경에서의 메시지
    }
  }, [isRecording, statusMessage]); // isRecording과 statusMessage가 변경될 때 onend 로직을 위해 다시 실행될 수 있도록 의존성 추가

  // '녹음' 버튼 클릭 시 실행되는 함수
  const toggleRecording = () => {
    if (recognitionRef.current) { 
      if (isRecording) {
        recognitionRef.current.stop(); // 녹음 중이면 중지
        setIsRecording(false); // 녹음 상태 해제
        setStatusMessage("녹음 중지됨."); // 상태 메시지 업데이트
      } else {
        setRecognizedText(''); // 이전 인식 텍스트 초기화
        setStatusMessage("음성 인식 시작... 말씀해주세요."); // 상태 메시지 업데이트
        setIsRecording(true); // 녹음 중 상태로 설정
        recognitionRef.current.start(); // 음성 인식 시작
      }
    } else {
      setStatusMessage("Web Speech API를 사용할 수 없거나 초기화되지 않았습니다.");
      console.warn("SpeechRecognition instance is not available. Check browser support or initialization.");
    }
  };

  // 인식된 텍스트를 Next.js API 라우트로 전송하고 응답을 받아 폼을 채우는 함수
  const sendTextToGemini = async (text: string) => {
    try {
      setStatusMessage("Gemini AI 처리 중..."); // 상태 메시지 업데이트
      const response = await fetch('/api/ai/voice', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }), // 인식된 텍스트를 JSON 형태로 전송
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`서버 오류: ${response.status} - ${errorData.error}`);
      }

      const data: PrayerFormData = await response.json();
      console.log("Gemini로부터 받은 데이터:", data);

      setTitle(data.title || '');
      setContent(data.content || '');
      setDeadline(data.deadline || '');
      setIsAnonymous(data.isAnonymous || false);

      setStatusMessage("Gemini AI가 폼을 채웠습니다!");
    } catch (error) {
      setStatusMessage(`데이터 처리 중 오류 발생: ${(error as Error).message}. 다시 시도해주세요.`);
      console.error("API Call Error:", error);
    } finally {
      // Gemini 처리 완료 후에도 isRecording이 true이면 계속 녹음 상태 유지
      // 사용자가 직접 중지 버튼을 누를 때까지는 isRecording을 false로 만들지 않습니다.
      // 다만, 에러 발생 시에는 녹음 상태를 해제하여 버튼을 다시 활성화합니다.
      if (statusMessage.includes("오류")) { // 오류 발생 시에만 녹음 상태 해제
          setIsRecording(false);
      }
    }
  };

  // 폼 제출 시 실행되는 함수 (현재는 경고 메시지 표시 후 페이지 이동)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('폼 제출 기능 아직 안 만듦!');
    console.log({ title, content, deadline, isAnonymous });
    router.push('/my-prayers');
  };

  return (
    <div className="min-h-screen bg-white p-10 max-w-3xl mx-auto">
      {/* 뒤로 가기 링크 */}
      <Link
        href="/my-prayers"
        className="mb-8 inline-block text-indigo-600 hover:text-indigo-800 font-semibold"
      >
        ← {t('back')}
      </Link>

      <h1 className="text-4xl font-bold mb-8 text-gray-900">{t('title')}</h1>

      {/* 기도 요청 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-medium text-gray-800">{t('form.title')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-400 bg-gray-50 text-gray-900 rounded px-4 py-3 text-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-800">{t('form.content')}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-400 bg-gray-50 text-gray-900 rounded px-4 py-3 text-lg focus:ring-indigo-500 focus:border-indigo-500"
            rows={5}
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-800">{t('form.deadline')}</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border border-gray-400 bg-gray-50 text-gray-900 rounded px-4 py-3 text-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="anonymous" className="font-medium text-gray-800 text-lg">
            {t('form.isAnonymous')}
          </label>
        </div>

        {/* 버튼 섹션 */}
        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-lg hover:bg-indigo-700"
          >
            {t('form.submit')}
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            className={`px-6 py-3 text-white rounded-lg text-lg ${
              isRecording
                ? 'bg-gray-600 hover:bg-gray-700' // 녹음 중일 때 회색 버튼 스타일
                : 'bg-red-600 hover:bg-red-700' // 녹음 시작 버튼 (빨간색) 스타일
            }`}
            disabled={!recognitionRef.current} 
          >
            {isRecording ? t('form.stopRecording') : t('form.startRecording')}
          </button>
        </div>
        
        {/* 상태 메시지 및 인식된 텍스트 표시 */}
        {statusMessage && (
            <p className="mt-4 text-gray-700 italic">
                상태: {statusMessage}
            </p>
        )}
        {recognizedText && (
            <p className="mt-2 text-gray-700">
                인식된 텍스트: <span className="font-semibold">{recognizedText}</span>
            </p>
        )}
      </form>
    </div>
  );
}