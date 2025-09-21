export enum AppScreen {
    HOME = 'HOME',
    ALARM = 'ALARM',
    QUESTION = 'QUESTION',
    RESULT = 'RESULT',
    SETTINGS = 'SETTINGS',
    QUESTION_EDITOR = 'QUESTION_EDITOR',
    ALARM_EDITOR = 'ALARM_EDITOR',
    STATS = 'STATS',
}

export type QuestionType = 'mcq' | 'tf' | 'fill';

export interface QuestionPayload {
    question: string;
    answer: string;
    options?: string[];
    placeholder?: string;
}

export interface Question {
    id: number;
    section: string;
    chapter: string;
    qtype: QuestionType;
    payload: QuestionPayload;
    imageData?: string; // For attached images as base64
}

export interface QuestionStats {
    last_seen: string;
    correct_count: number;
    total_count: number;
    ease: number;
}

export interface Progress {
    date: string;
    points: number;
    correct: number;
    total: number;
}

export interface Alarm {
    id: number;
    time: string;
    label: string;
    enabled: boolean;
}

export interface QuizSession {
    questions: Question[];
    currentQuestionIndex: number;
    correctAnswers: number;
    points: number;
    initialQuestionCount: number;
    strictMode: boolean;
}

export interface AppContextType {
    currentScreen: AppScreen;
    navigate: (screen: AppScreen) => void;
    quizSession: QuizSession | null;
    startQuiz: () => void;
    answerQuestion: (isCorrect: boolean, question: Question) => void;
    finishQuiz: () => void;
    alarms: Alarm[];
    refreshAlarms: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    triggerAlarm: () => void;
    startCustomQuiz: (questions: Question[]) => void; // New function for targeted quizzes
}