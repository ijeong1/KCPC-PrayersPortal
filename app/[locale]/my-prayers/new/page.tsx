'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createWorker, PSM } from 'tesseract.js';
import axiosClient from '@/lib/axiosClient';
import { useSession } from 'next-auth/react'; // useSession 임포트 추가
import axios from 'axios'; // axios 임포트 추가: isAxiosError 사용을 위함

// 기도 요청 폼 데이터 인터페이스 (categoryId, requestedBy 추가)
interface PrayerFormData {
  title: string;
  content: string;
  deadline: string;
  isAnonymous: boolean;
  categoryId: string; // 단일 선택이므로 필수 string
  requestedBy: string; // 요청자 ID (세션에서 가져옴)
}

// 카테고리 데이터 인터페이스
interface Category {
  id: string;
  name_en: string;
  name_ko: string;
}

// 입력 모드 타입 정의
type InputMode = 'manual' | 'voice' | 'image';

export default function NewPrayerRequestPage() {
  const t = useTranslations('MyPrayersNew');
  const locale = useLocale();
  const router = useRouter();
  const { data: session, status } = useSession(); // 세션 정보 가져오기

  // --- 공통 폼 상태 ---
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // --- 폼 제출 상태 ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // --- 현재 활성화된 입력 모드 상태 ---
  const [inputMode, setInputMode] = useState<InputMode>('manual'); // 기본값은 수동 입력

  // --- 음성 인식 상태 ---
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState('음성 인식 API 초기화 중...');
  const [recognizedText, setRecognizedText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);

  // --- OCR 상태 ---
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrResult, setOcrResult] = useState('');
  const [isOCRing, setIsOCRing] = useState(false);
  const tesseractWorkerRef = useRef<Tesseract.Worker | null>(null);

  // --- 카테고리 상태 (단일 선택) ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null); // 단일 선택: 문자열 ID 또는 null
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // --- 카테고리 불러오기 (컴포넌트 마운트 시 한 번만) ---
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await axiosClient.get<Category[]>('/my-prayers/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategoriesError('카테고리를 불러오는 데 실패했습니다.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // --- 카테고리 선택/해제 토글 핸들러 (단일 선택 로직) ---
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryId((prevSelectedId) => {
      // 이미 선택된 카테고리를 다시 클릭하면 선택 해제 (null)
      if (prevSelectedId === categoryId) {
        return null;
      }
      // 다른 카테고리를 클릭하면 해당 카테고리 선택
      return categoryId;
    });
  };

  // --- OCR 워커 초기화 ---
  useEffect(() => {
    if (tesseractWorkerRef.current) return;

    const initWorker = async () => {
      setOcrStatus('OCR 엔진 초기화 중...');
      try {
        const worker = await createWorker('kor', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`OCR 진행중: ${(m.progress * 100).toFixed(2)}%`);
            } else {
              setOcrStatus(`OCR 상태: ${m.status}`);
            }
          },
        });
        // 사용자 요청에 따라 주석 유지된 부분
        // await worker.load();
        // await worker.loadLanguage('kor');
        // await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO, });
        
        tesseractWorkerRef.current = worker;
        setOcrStatus('OCR 엔진 준비 완료. 이미지를 선택해주세요.');
      } catch (e) {
        console.error("OCR Worker Init Error:", e);
        setOcrStatus('OCR 초기화 실패. 콘솔 확인하세요.');
      }
    };

    initWorker();

    return () => {
      tesseractWorkerRef.current?.terminate();
    };
  }, []);

  // --- 음성 인식 초기화 ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatusMessage('죄송합니다, 이 브라우저는 Web Speech API를 지원하지 않습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interimTranscript += result[0].transcript;
      }

      setRecognizedText(finalTranscript + interimTranscript);

      if (finalTranscript) {
        setVoiceStatusMessage('음성 인식 완료. Gemini AI 처리 중...');
        sendTextToGemini(finalTranscript, 'voice');
      } else {
        setVoiceStatusMessage('음성 인식 중... (말씀해주세요)');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech Recognition Error:', event.error);
      setVoiceStatusMessage(`음성 인식 오류: ${event.error}. 다시 시도해주세요.`);
      setIsRecording(false);
      shouldRestartRef.current = false;
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        setVoiceStatusMessage('인식 세션 종료, 재시작합니다. 계속 말씀해주세요.');
        setTimeout(() => {
          if (recognitionRef.current && shouldRestartRef.current) recognitionRef.current.start();
        }, 500);
      } else {
        setVoiceStatusMessage('녹음 중지됨.');
      }
    };

    recognitionRef.current = recognition;
    setVoiceStatusMessage("음성 인식 준비 완료. '녹음 시작' 버튼을 눌러주세요.");
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setVoiceStatusMessage('SpeechRecognition 인스턴스가 준비되지 않았습니다.');
      return;
    }

    if (isRecording) {
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
      setVoiceStatusMessage('녹음 중지됨.');
    } else {
      setRecognizedText('');
      shouldRestartRef.current = true;
      recognitionRef.current.start();
      setIsRecording(true);
      setVoiceStatusMessage('음성 인식 시작... 말씀해주세요.');
    }
  };

  // --- 이미지 선택 핸들러 (OCR) ---
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setOcrResult('');
      setOcrStatus('');
    }
  };

  // --- OCR 이미지 텍스트 읽기 ---
  const readImageText = async () => {
    if (!selectedImage) {
      setOcrStatus('이미지를 먼저 선택해주세요.');
      return;
    }
    if (!tesseractWorkerRef.current) {
      setOcrStatus('OCR 엔진이 아직 준비되지 않았습니다.');
      return;
    }

    setIsOCRing(true);
    setOcrStatus('이미지 분석 중...');
    try {
      const {
        data: { text },
      } = await tesseractWorkerRef.current.recognize(selectedImage);

      setOcrResult(text);
      setOcrStatus('OCR 완료. Gemini AI 처리 중...');
      sendTextToGemini(text, 'ocr');
    } catch (e) {
      console.error("OCR Recognition Error:", e);
      setOcrStatus('OCR 실패. 콘솔 확인하세요.');
    } finally {
      setIsOCRing(false);
    }
  };

  // --- Gemini AI 처리 (음성 or OCR) ---
  const sendTextToGemini = async (text: string, source: 'voice' | 'ocr') => {
    try {
      const setStatus = source === 'voice' ? setVoiceStatusMessage : setOcrStatus;
      setStatus('Gemini AI 처리 중...');

      const res = await axiosClient.post<PrayerFormData>('/ai/voice', { text });

      const data = res.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Gemini AI 응답이 유효하지 않습니다.');
      }
      setTitle(data.title || '');
      setContent(data.content || '');
      setDeadline(data.deadline || '');
      setIsAnonymous(data.isAnonymous || false);

      setStatus('Gemini AI가 폼을 채웠습니다!');
    } catch (e) {
      const setStatus = source === 'voice' ? setVoiceStatusMessage : setOcrStatus;
      setStatus(`데이터 처리 중 오류 발생: ${(e as Error).message}. 다시 시도해주세요.`);
      if (source === 'voice' && isRecording) {
        setIsRecording(false);
        shouldRestartRef.current = false;
      }
      console.error("Gemini AI API Call Error:", e);
    }
  };

  // --- 폼 제출 핸들러 (여기 변경!) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    if (status !== 'authenticated' || !session?.user?.id) {
      setSubmitError(t('submitError.unauthorized'));
      setIsSubmitting(false);
      return;
    }

    if (!selectedCategoryId) {
      setSubmitError(t('submitError.noCategorySelected'));
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: PrayerFormData = {
        title,
        content,
        deadline,
        isAnonymous,
        categoryId: selectedCategoryId, // 선택된 카테고리 ID 포함
        requestedBy: session.user.id, // 세션에서 사용자 ID 포함
      };

      await axiosClient.post('/my-prayers', payload);

      setSubmitSuccess(true);
      // 폼 초기화 (선택 사항)
      setTitle('');
      setContent('');
      setDeadline('');
      setIsAnonymous(false);
      setSelectedCategoryId(null);
      setRecognizedText('');
      setOcrResult('');
      setVoiceStatusMessage('음성 인식 API 초기화 중...');
      setOcrStatus('OCR 엔진 준비 완료. 이미지를 선택해주세요.');
      setInputMode('manual'); // 기본 탭으로 돌아가기

      router.push('/my-prayers'); // 성공 시 내 기도 요청 목록 페이지로 이동
    } catch (error) {
      console.error('폼 제출 중 오류:', error);
      // axios.isAxiosError를 사용하여 오류 타입 확인
      if (axios.isAxiosError(error) && error.response) {
        setSubmitError(error.response.data.error || t('submitError.generic'));
      } else {
        setSubmitError(t('submitError.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-10 max-w-3xl mx-auto">
      <Link href="/my-prayers" className="mb-8 inline-block text-indigo-600 hover:text-indigo-800 font-semibold">
        ← {t('back')}
      </Link>

      <h1 className="text-4xl font-bold mb-8 text-gray-900">{t('title')}</h1>

      {/* --- 입력 모드 탭 네비게이션 --- */}
      <div className="flex justify-center mb-8 border-b border-gray-200">
        <button
          type="button" // 폼 제출 방지
          className={`px-6 py-3 text-lg font-medium ${
            inputMode === 'manual'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setInputMode('manual')}
        >
          {t('inputMode.manual')}
        </button>
        <button
          type="button" // 폼 제출 방지
          className={`px-6 py-3 text-lg font-medium ${
            inputMode === 'voice'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setInputMode('voice')}
        >
          {t('inputMode.voice')}
        </button>
        <button
          type="button" // 폼 제출 방지
          className={`px-6 py-3 text-lg font-medium ${
            inputMode === 'image'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setInputMode('image')}
        >
          {t('inputMode.image')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- 공통 폼 필드 (모든 탭에서 항상 보임) --- */}
        <div>
          <label htmlFor="title" className="block mb-2 font-medium text-gray-800">{t('form.title')}</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-400 bg-gray-50 text-gray-900 rounded px-4 py-3 text-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block mb-2 font-medium text-gray-800">{t('form.content')}</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-400 bg-gray-50 text-gray-900 rounded px-4 py-3 text-lg focus:ring-indigo-500 focus:border-indigo-500"
            rows={5}
            required
          />
        </div>

        <div>
          <label htmlFor="deadline" className="block mb-2 font-medium text-gray-800">{t('form.deadline')}</label>
          <input
            type="date"
            id="deadline"
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

        {/* --- 카테고리 선택 섹션 (단일 선택) --- */}
        <div className="mt-6">
          <label className="block mb-2 font-medium text-gray-800">{t('form.categories')}</label>
          {categoriesLoading ? (
            <p className="text-gray-500">{t('form.loadingCategories')}</p>
          ) : categoriesError ? (
            <p className="text-red-500">{t('form.errorLoadingCategories')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button" // 폼 제출 방지
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                    selectedCategoryId === category.id // 단일 선택 로직
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {locale === 'ko' ? category.name_ko : category.name_en}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- 폼 제출 관련 메시지 --- */}
        {isSubmitting && (
          <p className="text-center text-indigo-600 font-semibold mt-4">
            {t('submitStatus.submitting')}
          </p>
        )}
        {submitError && (
          <p className="text-center text-red-600 font-semibold mt-4">
            {t('submitStatus.error')}: {submitError}
          </p>
        )}
        {submitSuccess && (
          <p className="text-center text-green-600 font-semibold mt-4">
            {t('submitStatus.success')}
          </p>
        )}

        {/* --- 입력 모드별 UI 렌더링 --- */}
        {inputMode === 'manual' && (
          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg text-lg hover:bg-indigo-700"
              disabled={isSubmitting} // 제출 중일 때 버튼 비활성화
            >
              {isSubmitting ? t('submitStatus.submitting') : t('form.submit')}
            </button>
          </div>
        )}

        {inputMode === 'voice' && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={toggleRecording}
                className={`px-8 py-3 text-white rounded-lg text-lg ${
                  isRecording
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={!recognitionRef.current || isSubmitting} // 제출 중일 때 비활성화
              >
                {isRecording ? t('form.stopRecording') : t('form.startRecording')}
              </button>
            </div>
            {voiceStatusMessage && <p className="mt-4 text-gray-700 italic text-center">음성 상태: {voiceStatusMessage}</p>}
            {recognizedText && (
              <p className="mt-2 text-gray-700 text-center">
                인식된 텍스트: <span className="font-semibold">{recognizedText}</span>
              </p>
            )}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg text-lg hover:bg-indigo-700"
                disabled={isSubmitting} // 제출 중일 때 비활성화
              >
                {isSubmitting ? t('submitStatus.submitting') : t('form.submit')}
              </button>
            </div>
          </div>
        )}

        {inputMode === 'image' && (
          <div className="mt-6 space-y-4">
            {/* OCR Image Preview */}
            {selectedImage && (
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="선택한 이미지"
                className="w-full max-w-md mt-4 rounded-lg border border-gray-300 mx-auto"
              />
            )}
            <div className="flex flex-col items-center">
              <label
                htmlFor="ocr-file-input"
                className={`cursor-pointer px-8 py-3 rounded-lg text-lg text-white text-center ${
                  isOCRing || isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isOCRing ? '이미지 인식 중...' : t('form.ocrFromImage')}
              </label>
              <input
                id="ocr-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={isOCRing || isSubmitting} // 제출 중일 때 비활성화
              />
              {selectedImage && !isOCRing && (
                <button
                  type="button"
                  onClick={readImageText}
                  className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  disabled={isSubmitting} // 제출 중일 때 비활성화
                >
                  이미지 텍스트 읽기
                </button>
              )}
            </div>
            {ocrStatus && <p className="mt-4 text-gray-700 italic text-center">OCR 상태: {ocrStatus}</p>}
            {ocrResult && (
              <p className="mt-2 text-gray-700 whitespace-pre-wrap text-center">
                인식된 텍스트: <span className="font-semibold">{ocrResult}</span>
              </p>
            )}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg text-lg hover:bg-indigo-700"
                disabled={isSubmitting} // 제출 중일 때 비활성화
              >
                {isSubmitting ? t('submitStatus.submitting') : t('form.submit')}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}