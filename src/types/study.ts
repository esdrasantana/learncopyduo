export interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  pauseMinutes: number;
  durationMinutes: number;
  discipline: string;
  activity: string;
  note: string;
  createdAt: string;
}

export interface Discipline {
  id: string;
  name: string;
  color: string;
}

export interface Goals {
  dailyMinutes: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  totalDays: number;
  totalHours: number;
  studyDays: number[];
}

export interface Medal {
  id: string;
  name: string;
  category: MedalCategory;
  description: string;
  criterion: string;
  targetValue: number;
  currentValue: number;
  unlocked: boolean;
  unlockedAt: string | null;
  icon: string;
}

export type MedalCategory = 'performance' | 'accumulated_time' | 'consistency' | 'discipline';

export interface DayRecord {
  date: string;
  goalMinutes: number;
  studiedMinutes: number;
  difference: number;
  sessions: Session[];
}

export interface StockPrice {
  accumulated: number;
  compensationNeeded: number;
}
