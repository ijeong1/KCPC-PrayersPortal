// types/global.d.ts

// DOM API에 있는 SpeechRecognition의 타입 정의를 확장합니다.
// 이 코드는 TypeScript가 window.SpeechRecognition을 정확히 인식하게 합니다.
interface Window {
  SpeechRecognition: typeof SpeechRecognition; // SpeechRecognition 생성자의 타입을 참조
  webkitSpeechRecognition: typeof SpeechRecognition; // 웹킷 접두사 버전도 함께
}

// 다음은 SpeechRecognition API 관련 이벤트 및 코드 타입 정의입니다.
// "dom" 라이브러리에 대부분 포함되어 있지만, 명시적으로 선언하여 잠재적 문제를 방지합니다.

// SpeechRecognition 인스턴스 자체에 대한 인터페이스 (메소드와 속성 정의)
declare interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    abort(): void;
    start(): void;
    stop(): void;
}

// SpeechRecognition 생성자에 대한 선언 (JavaScript 런타임 값을 TypeScript 타입으로 인식하게 함)
declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

// SpeechRecognitionResultList 타입 정의 (results 속성에 사용됨)
declare interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

// SpeechRecognitionResult 타입 정의 (단일 인식 결과)
declare interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

// SpeechRecognitionAlternative 타입 정의 (인식된 단어와 신뢰도)
declare interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

// SpeechGrammarList 타입 정의
declare interface SpeechGrammarList {
    readonly length: number;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
}

// SpeechGrammar 타입 정의
declare interface SpeechGrammar {
    readonly src: string;
    readonly weight: number;
}

// SpeechRecognitionEvent 타입 정의 (음성 인식 결과 이벤트)
declare interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
    readonly resultIndex: number;
    // Webkit specific properties (optional, might need to be explicitly added if used)
    readonly emma?: Document;
    readonly interpretation?: any;
    readonly mark?: number;
}

// SpeechRecognitionErrorEvent 타입 정의 (음성 인식 오류 이벤트)
declare interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
}

// 오류 코드들을 나타내는 Union Type
type SpeechRecognitionErrorCode =
    "aborted" | "audio-capture" | "bad-grammar" | "language-not-supported" |
    "network" | "no-speech" | "not-allowed" | "service-not-allowed" |
    "too-many-requests";