export type Difficulty = "easy" | "medium" | "hard";
export type Rating = 1 | 2 | 3 | 4 | 5; // 1=forgot,2=hard,3=medium,4=easy,5=very_easy
export type Letter = "A" | "B" | "C" | "D" | "E";

export interface Question {
  id: string;
  projectId: string;
  sourceId: string | null;
  subjectId: string | null;
  topicId: string | null;
  subjectName: string | null;
  topicName: string | null;
  statement: string;
  altA: string;
  altB: string;
  altC: string;
  altD: string;
  altE: string;
  correct: Letter;
  explanation: string;
  difficulty: Difficulty;
  createdAt: string;
}

export interface ReviewSchedule {
  questionId: string;
  dueDate: string;
  intervalDays: number;
  repetitions: number;
  lastRating: Rating | null;
  lastReviewedAt: string | null;
}

export interface AnswerRecord {
  id: string;
  questionId: string;
  selected: Letter;
  isCorrect: boolean;
  rating: Rating | null;
  timeMs: number;
  answeredAt: string;
}

export interface ReviewSettings {
  intervalForgot: number;
  intervalHard: number;
  intervalMedium: number;
  intervalEasy: number;
  intervalVeryEasy: number;
  dailyNewLimit: number;
}

export const RATING_LABEL: Record<Rating, string> = {
  1: "Esqueci totalmente",
  2: "Difícil",
  3: "Médio",
  4: "Fácil",
  5: "Muito fácil",
};
