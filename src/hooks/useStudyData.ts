import { useLocalStorage } from './useLocalStorage';
import { Session, Goals, Discipline, Medal } from '@/types/study';
import { defaultMedals } from '@/data/medals';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

const DEFAULT_GOALS: Goals = {
  dailyMinutes: 360,
  weeklyMinutes: 2100,
  monthlyMinutes: 9000,
  totalDays: 120,
  totalHours: 720,
};

const DEFAULT_DISCIPLINES: Discipline[] = [
  { id: '1', name: 'Matemática', color: '#3b82f6' },
  { id: '2', name: 'Português', color: '#10b981' },
  { id: '3', name: 'Física', color: '#f59e0b' },
  { id: '4', name: 'Química', color: '#ef4444' },
  { id: '5', name: 'História', color: '#8b5cf6' },
  { id: '6', name: 'Geografia', color: '#06b6d4' },
];

export function useStudyData() {
  const [sessions, setSessions] = useLocalStorage<Session[]>('study-sessions', []);
  const [goals, setGoals] = useLocalStorage<Goals>('study-goals', DEFAULT_GOALS);
  const [disciplines, setDisciplines] = useLocalStorage<Discipline[]>('study-disciplines', DEFAULT_DISCIPLINES);
  const [medals, setMedals] = useLocalStorage<Medal[]>('study-medals', defaultMedals);

  const addSession = useCallback((session: Omit<Session, 'id' | 'createdAt'>) => {
    const newSession: Session = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
    return newSession;
  }, [setSessions]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [setSessions]);

  const totalMinutes = useMemo(() => sessions.reduce((sum, s) => sum + s.durationMinutes, 0), [sessions]);

  const studyDays = useMemo(() => {
    const days = new Set(sessions.map(s => s.date));
    return days.size;
  }, [sessions]);

  const getSessionsByDate = useCallback((date: string) => {
    return sessions.filter(s => s.date === date);
  }, [sessions]);

  const getMinutesByDate = useCallback((date: string) => {
    return sessions.filter(s => s.date === date).reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [sessions]);

  const streak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dates.includes(dateStr)) {
        const mins = getMinutesByDate(dateStr);
        if (mins >= goals.dailyMinutes) count++;
        else if (i > 0) break;
      } else if (i > 0) break;
    }
    return count;
  }, [sessions, goals.dailyMinutes, getMinutesByDate]);

  const stockPrice = useMemo(() => {
    const dates = [...new Set(sessions.map(s => s.date))].sort();
    let accumulated = 0;
    for (const date of dates) {
      const mins = getMinutesByDate(date);
      const diff = mins - goals.dailyMinutes;
      if (diff < 0) accumulated += diff;
    }
    return { accumulated, compensationNeeded: Math.abs(accumulated) };
  }, [sessions, goals.dailyMinutes, getMinutesByDate]);

  const checkMedals = useCallback(() => {
    setMedals(prev => {
      const updated = prev.map(medal => {
        if (medal.unlocked) return medal;
        let currentValue = 0;
        switch (medal.id) {
          case 'time-10': currentValue = totalMinutes / 60; break;
          case 'time-50': currentValue = totalMinutes / 60; break;
          case 'time-100': currentValue = totalMinutes / 60; break;
          case 'time-300': currentValue = totalMinutes / 60; break;
          case 'time-500': currentValue = totalMinutes / 60; break;
          case 'time-1000': currentValue = totalMinutes / 60; break;
          case 'streak-7': currentValue = streak; break;
          case 'single-6h': {
            const dates = [...new Set(sessions.map(s => s.date))];
            currentValue = Math.max(0, ...dates.map(d => getMinutesByDate(d))) / 60;
            break;
          }
          case 'single-10h': {
            const dates2 = [...new Set(sessions.map(s => s.date))];
            currentValue = Math.max(0, ...dates2.map(d => getMinutesByDate(d))) / 60;
            break;
          }
          default: currentValue = medal.currentValue;
        }
        const unlocked = currentValue >= medal.targetValue;
        if (unlocked && !medal.unlocked) {
          toast.success(`🏅 Medalha desbloqueada: ${medal.name}!`);
        }
        return {
          ...medal,
          currentValue,
          unlocked,
          unlockedAt: unlocked ? new Date().toISOString() : null,
        };
      });
      return updated;
    });
  }, [totalMinutes, streak, sessions, getMinutesByDate, setMedals]);

  return {
    sessions, addSession, deleteSession,
    goals, setGoals,
    disciplines, setDisciplines,
    medals, checkMedals,
    totalMinutes, studyDays, streak, stockPrice,
    getSessionsByDate, getMinutesByDate,
  };
}
