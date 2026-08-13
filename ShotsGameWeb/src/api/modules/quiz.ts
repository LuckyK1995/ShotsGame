// 答题 API
import { http } from '../client';

export interface Question {
  id: number;
  type: 'single' | 'multiple';
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
}

export interface QuizSessionOutput {
  sessionId: string;
  questions: Question[];
  totalTimeLimit: number;
}

export interface SubmitAnswerInput {
  sessionId: string;
  questionId: number;
  selected: number[];
}

export interface SubmitAnswerOutput {
  correct: boolean;
  explanation: string;
  correctAnswer: number[];
  currentScore: number;
}

export interface FinishQuizOutput {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  goldReward: number;
  message: string;
  history: Array<{ questionId: number; correct: boolean }>;
}

export interface QuizHistoryOutput {
  attempts: Array<{
    sessionId: string;
    correctCount: number;
    totalQuestions: number;
    goldReward: number;
    finishedAt: string;
  }>;
}

export const quizApi = {
  start: () => http.post<QuizSessionOutput>('/quiz/start'),
  submitAnswer: (input: SubmitAnswerInput) =>
    http.post<SubmitAnswerOutput>('/quiz/submit-answer', input),
  finish: (sessionId: string) => http.post<FinishQuizOutput>(`/quiz/finish/${sessionId}`),
  getHistory: () => http.get<QuizHistoryOutput>('/quiz/history'),
};
