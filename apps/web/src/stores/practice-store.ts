import { create } from 'zustand';
import type { IQuestion } from '@techscholars/types';

export type QuestionType = 'MCQ' | 'MSQ' | 'TITA';
export type PracticeMode = 'topic' | 'timed' | 'accuracy' | 'pyq';

interface QuestionFilter {
  subject?: string;
  topicIds?: string[];
  difficulties?: string[];
  types?: string[];
  isPyq?: boolean;
  timeLimit?: number;
  questionCount?: number;
}

interface PracticeState {
  mode: PracticeMode;
  filter: QuestionFilter;
  questions: IQuestion[];
  currentIndex: number;
  sessionId: string | null;
  answers: Map<string, string | string[]>;
  markedForReview: Set<string>;
  timeSpent: Map<string, number>;
  startTime: number;
  isPaused: boolean;
  isFinished: boolean;
  
  setMode: (mode: PracticeMode) => void;
  setFilter: (filter: QuestionFilter) => void;
  setQuestions: (questions: IQuestion[]) => void;
  setSessionId: (sessionId: string) => void;
  setCurrentIndex: (index: number) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  toggleMarkForReview: (questionId: string) => void;
  recordTime: (questionId: string, time: number) => void;
  pause: () => void;
  resume: () => void;
  finish: () => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>()((set, get) => ({
  mode: 'topic',
  filter: {},
  questions: [],
  currentIndex: 0,
  sessionId: null,
  answers: new Map(),
  markedForReview: new Set(),
  timeSpent: new Map(),
  startTime: Date.now(),
  isPaused: false,
  isFinished: false,

  setMode: (mode) => set({ mode }),
  setFilter: (filter) => set({ filter }),
  setQuestions: (questions) => set({ questions, currentIndex: 0, answers: new Map(), markedForReview: new Set(), timeSpent: new Map(), startTime: Date.now() }),
  setSessionId: (sessionId) => set({ sessionId }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  
  setAnswer: (questionId, answer) => {
    const answers = new Map(get().answers);
    answers.set(questionId, answer);
    set({ answers });
  },
  
  toggleMarkForReview: (questionId) => {
    const marked = new Set(get().markedForReview);
    if (marked.has(questionId)) {
      marked.delete(questionId);
    } else {
      marked.add(questionId);
    }
    set({ markedForReview: marked });
  },
  
  recordTime: (questionId, time) => {
    const timeSpent = new Map(get().timeSpent);
    const current = timeSpent.get(questionId) || 0;
    timeSpent.set(questionId, current + time);
    set({ timeSpent });
  },
  
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  finish: () => set({ isFinished: true }),
  reset: () => set({
    questions: [],
    currentIndex: 0,
    sessionId: null,
    answers: new Map(),
    markedForReview: new Set(),
    timeSpent: new Map(),
    isPaused: false,
    isFinished: false,
  }),
}));