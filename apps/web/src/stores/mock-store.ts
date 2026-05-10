'use client';

import { create } from 'zustand';

interface MockAnswer {
  questionId: string;
  answer: string | string[];
  time: number;
  status: 'not_visited' | 'not_answered' | 'answered' | 'marked_review' | 'marked_answered';
  isCorrect?: boolean;
}

interface MockState {
  attemptId: string | null;
  mockTestId: string | null;
  currentSection: number;
  currentQuestion: number;
  questions: any[];
  answers: Record<string, MockAnswer>;
  sectionTimers: Record<string, number>;
  sectionLocked: Record<string, boolean>;
  isSubmitted: boolean;
  timeRemaining: number;

  startMock: (attemptId: string, mockTestId: string, questions: any[], sectionDuration: number) => void;
  setCurrentQuestion: (index: number) => void;
  setCurrentSection: (index: number) => void;
  saveAnswer: (questionId: string, answer: string | string[], status: string) => void;
  toggleMarkForReview: (questionId: string) => void;
  updateTimer: (sectionIndex: number, time: number) => void;
  lockSection: (sectionIndex: number) => void;
  setQuestions: (questions: any[]) => void;
  submitMock: () => void;
  resetMock: () => void;
}

export const useMockStore = create<MockState>((set, get) => ({
  attemptId: null,
  mockTestId: null,
  currentSection: 0,
  currentQuestion: 0,
  questions: [],
  answers: {},
  sectionTimers: {},
  sectionLocked: {},
  isSubmitted: false,
  timeRemaining: 0,

  startMock: (attemptId, mockTestId, questions, sectionDuration) =>
    set({
      attemptId,
      mockTestId,
      questions,
      currentSection: 0,
      currentQuestion: 0,
      answers: {},
      sectionTimers: { 0: sectionDuration },
      sectionLocked: {},
      isSubmitted: false,
    }),

  setCurrentQuestion: (index) => set({ currentQuestion: index }),
  setCurrentSection: (index) => set({ currentSection: index, currentQuestion: 0 }),

  saveAnswer: (questionId, answer, status) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          questionId,
          answer,
          time: (state.answers[questionId]?.time || 0) + 1,
          status: status as MockAnswer['status'],
        },
      },
    })),

  toggleMarkForReview: (questionId) =>
    set((state) => {
      const current = state.answers[questionId];
      const newStatus = current?.status === 'marked_review' ? 'not_answered' : 'marked_review';
      return {
        answers: {
          ...state.answers,
          [questionId]: {
            questionId,
            answer: current?.answer || '',
            time: current?.time || 0,
            status: newStatus as MockAnswer['status'],
          },
        },
      };
    }),

  updateTimer: (sectionIndex, time) =>
    set((state) => ({
      sectionTimers: { ...state.sectionTimers, [sectionIndex]: time },
    })),

  lockSection: (sectionIndex) =>
    set((state) => ({
      sectionLocked: { ...state.sectionLocked, [sectionIndex]: true },
    })),

  setQuestions: (questions) => set({ questions }),

  submitMock: () => set({ isSubmitted: true }),

  resetMock: () =>
    set({
      attemptId: null,
      mockTestId: null,
      currentSection: 0,
      currentQuestion: 0,
      questions: [],
      answers: {},
      sectionTimers: {},
      sectionLocked: {},
      isSubmitted: false,
      timeRemaining: 0,
    }),
}));