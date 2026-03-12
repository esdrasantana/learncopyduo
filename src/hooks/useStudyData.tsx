// @refresh reset
import { createContext, useContext, useCallback, useMemo, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { defaultMedals } from '@/data/medals';
import { Session, Goals, Discipline, Medal } from '@/types/study';

const DEFAULT_GOALS: Goals = {
  dailyMinutes: 360,
  weeklyMinutes: 2100,
  monthlyMinutes: 9000,
  totalDays: 120,
  totalHours: 720,
  studyDays: [1, 2, 3, 4, 5],
};

interface StudyDataContextType {
  sessions: Session[];
  addSession: (session: Omit<Session, 'id' | 'createdAt'>) => Promise<Session | null>;
  updateSession: (id: string, session: Omit<Session, 'id' | 'createdAt'>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  goals: Goals;
  setGoals: (goals: Goals) => Promise<void>;
  disciplines: Discipline[];
  setDisciplines: (disciplines: Discipline[]) => Promise<void>;
  addDiscipline: (name: string, color: string) => Promise<void>;
  updateDiscipline: (id: string, name: string, color: string) => Promise<void>;
  deleteDiscipline: (id: string) => Promise<void>;
  medals: Medal[];
  checkMedals: () => Promise<void>;
  totalMinutes: number;
  studyDays: number;
  streak: number;
  stockPrice: { accumulated: number; compensationNeeded: number; history: { date: string; value: number }[] };
  getSessionsByDate: (date: string) => Session[];
  getMinutesByDate: (date: string) => number;
  loading: boolean;
}

const StudyDataContext = createContext<StudyDataContextType | null>(null);

export function StudyDataProvider({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoalsState] = useState<Goals>(DEFAULT_GOALS);
  const [disciplines, setDisciplinesState] = useState<Discipline[]>([]);
  const [medals, setMedalsState] = useState<Medal[]>(defaultMedals);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!user) { setLoading(false); return; }

    const fetchAll = async () => {
      setLoading(true);
      const [sessRes, goalRes, discRes, medalRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id).single(),
        supabase.from('disciplines').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('medals').select('*').eq('user_id', user.id),
      ]);

      if (sessRes.data) {
        setSessions(sessRes.data.map(s => ({
          id: s.id, date: s.date, startTime: s.start_time, endTime: s.end_time,
          pauseMinutes: s.pause_minutes, durationMinutes: s.duration_minutes,
          discipline: s.discipline, activity: s.activity, note: s.note, createdAt: s.created_at,
        })));
      }

      if (goalRes.data) {
        const rawStudyDays = (goalRes.data as any).study_days;
        setGoalsState({
          dailyMinutes: goalRes.data.daily_minutes, weeklyMinutes: goalRes.data.weekly_minutes,
          monthlyMinutes: goalRes.data.monthly_minutes, totalDays: goalRes.data.total_days,
          totalHours: goalRes.data.total_hours,
          studyDays: Array.isArray(rawStudyDays) ? rawStudyDays : [1, 2, 3, 4, 5],
        });
      }

      if (discRes.data) {
        setDisciplinesState(discRes.data.map(d => ({ id: d.id, name: d.name, color: d.color })));
      }

      if (medalRes.data) {
        setMedalsState(defaultMedals.map(dm => {
          const dbMedal = medalRes.data.find(m => m.medal_id === dm.id);
          if (dbMedal) return { ...dm, currentValue: Number(dbMedal.current_value), unlocked: dbMedal.unlocked, unlockedAt: dbMedal.unlocked_at };
          return dm;
        }));
      }

      setLoading(false);
    };

    fetchAll();
  }, [user, isReady]);

  const addSession = useCallback(async (session: Omit<Session, 'id' | 'createdAt'>) => {
    if (!user) return null;
    const { data, error } = await supabase.from('sessions').insert({
      user_id: user.id, date: session.date, start_time: session.startTime,
      end_time: session.endTime, pause_minutes: session.pauseMinutes,
      duration_minutes: session.durationMinutes, discipline: session.discipline,
      activity: session.activity, note: session.note,
    }).select().single();
    if (error) { toast.error('Erro ao salvar sessão'); return null; }
    const newSession: Session = {
      id: data.id, date: data.date, startTime: data.start_time, endTime: data.end_time,
      pauseMinutes: data.pause_minutes, durationMinutes: data.duration_minutes,
      discipline: data.discipline, activity: data.activity, note: data.note, createdAt: data.created_at,
    };
    setSessions(prev => [newSession, ...prev]);
    return newSession;
  }, [user]);

  const updateSession = useCallback(async (id: string, session: Omit<Session, 'id' | 'createdAt'>) => {
    if (!user) return;
    const { error } = await supabase.from('sessions').update({
      date: session.date, start_time: session.startTime, end_time: session.endTime,
      pause_minutes: session.pauseMinutes, duration_minutes: session.durationMinutes,
      discipline: session.discipline, activity: session.activity, note: session.note,
    }).eq('id', id).eq('user_id', user.id);
    if (error) { toast.error('Erro ao atualizar sessão'); return; }
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...session } : s));
    toast.success('Sessão atualizada!');
  }, [user]);

  const deleteSession = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('sessions').delete().eq('id', id).eq('user_id', user.id);
    if (error) { toast.error('Erro ao deletar sessão'); return; }
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [user]);

  const setGoals = useCallback(async (newGoals: Goals) => {
    if (!user) return;
    const { error } = await supabase.from('goals').update({
      daily_minutes: newGoals.dailyMinutes, weekly_minutes: newGoals.weeklyMinutes,
      monthly_minutes: newGoals.monthlyMinutes, total_days: newGoals.totalDays,
      total_hours: newGoals.totalHours, study_days: newGoals.studyDays as any,
    } as any).eq('user_id', user.id);
    if (error) { toast.error('Erro ao salvar metas'); return; }
    setGoalsState(newGoals);
  }, [user]);

  const addDiscipline = useCallback(async (name: string, color: string) => {
    if (!user) return;
    const { data, error } = await supabase.from('disciplines').insert({ user_id: user.id, name, color }).select().single();
    if (error) { toast.error('Erro ao criar disciplina'); return; }
    setDisciplinesState(prev => [...prev, { id: data.id, name: data.name, color: data.color }]);
    toast.success('Disciplina criada!');
  }, [user]);

  const updateDiscipline = useCallback(async (id: string, name: string, color: string) => {
    if (!user) return;
    const { error } = await supabase.from('disciplines').update({ name, color }).eq('id', id).eq('user_id', user.id);
    if (error) { toast.error('Erro ao atualizar disciplina'); return; }
    setDisciplinesState(prev => prev.map(d => d.id === id ? { ...d, name, color } : d));
    toast.success('Disciplina atualizada!');
  }, [user]);

  const deleteDiscipline = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('disciplines').delete().eq('id', id).eq('user_id', user.id);
    if (error) { toast.error('Erro ao excluir disciplina'); return; }
    setDisciplinesState(prev => prev.filter(d => d.id !== id));
    toast.success('Disciplina excluída!');
  }, [user]);

  const setDisciplines = useCallback(async (newDisciplines: Discipline[]) => {
    if (!user) return;
    await supabase.from('disciplines').delete().eq('user_id', user.id);
    const { error } = await supabase.from('disciplines').insert(
      newDisciplines.map(d => ({ user_id: user.id, name: d.name, color: d.color }))
    );
    if (error) { toast.error('Erro ao salvar disciplinas'); return; }
    setDisciplinesState(newDisciplines);
  }, [user]);

  const totalMinutes = useMemo(() => sessions.reduce((sum, s) => sum + s.durationMinutes, 0), [sessions]);
  const studyDaysCount = useMemo(() => new Set(sessions.map(s => s.date)).size, [sessions]);
  const getSessionsByDate = useCallback((date: string) => sessions.filter(s => s.date === date), [sessions]);
  const getMinutesByDate = useCallback((date: string) => sessions.filter(s => s.date === date).reduce((sum, s) => sum + s.durationMinutes, 0), [sessions]);

  const streak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let count = 0;
    const today = new Date();
    const activeStudyDays = goals.studyDays;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dayOfWeek = checkDate.getDay();
      const dateStr = checkDate.toISOString().split('T')[0];
      
      // Skip non-study days (weekends etc.) — they don't break streak
      if (!activeStudyDays.includes(dayOfWeek)) continue;
      
      // Any study counts for streak (no need to meet daily goal)
      if (dates.includes(dateStr)) {
        count++;
      } else if (count > 0) {
        break;
      } else {
        break;
      }
    }
    return count;
  }, [sessions, goals.studyDays]);

  const stockPrice = useMemo(() => {
    const dates = [...new Set(sessions.map(s => s.date))].sort();
    let accumulated = 0;
    const history: { date: string; value: number }[] = [];
    for (const date of dates) {
      const mins = getMinutesByDate(date);
      const diff = mins - goals.dailyMinutes;
      accumulated += diff;
      history.push({ date, value: accumulated });
    }
    return { accumulated, compensationNeeded: Math.abs(Math.min(0, accumulated)), history };
  }, [sessions, goals.dailyMinutes, getMinutesByDate]);

  const checkMedals = useCallback(async () => {
    if (!user) return;

    // Precompute helpers
    const allDates = [...new Set(sessions.map(s => s.date))];
    const maxDailyHours = Math.max(0, ...allDates.map(d => getMinutesByDate(d))) / 60;
    const totalHours = totalMinutes / 60;

    // Early bird / night owl counts
    const earlyBirdCount = sessions.filter(s => s.startTime >= '03:00' && s.startTime <= '06:30').length;
    const nightOwlCount = sessions.filter(s => s.startTime >= '20:00' && s.startTime <= '23:00').length;

    // Max consecutive days for a single discipline
    let maxDisciplineStreak = 0;
    const disciplineNames = [...new Set(sessions.map(s => s.discipline))];
    for (const disc of disciplineNames) {
      const discDates = [...new Set(sessions.filter(s => s.discipline === disc).map(s => s.date))].sort();
      let cs = 1;
      for (let i = 1; i < discDates.length; i++) {
        const prev = new Date(discDates[i - 1]);
        const curr = new Date(discDates[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) { cs++; } else { cs = 1; }
        maxDisciplineStreak = Math.max(maxDisciplineStreak, cs);
      }
      maxDisciplineStreak = Math.max(maxDisciplineStreak, cs);
    }

    const updated = medals.map(medal => {
      if (medal.unlocked) return medal;
      let currentValue = 0;
      switch (medal.id) {
        case 'time-10': case 'time-50': case 'time-100':
        case 'time-250': case 'time-500': case 'time-1000':
          currentValue = totalHours; break;
        case 'single-5h':
          currentValue = maxDailyHours; break;
        case 'streak-7': case 'streak-14': case 'streak-30':
        case 'streak-42': case 'streak-100':
          currentValue = streak; break;
        case 'discipline-30':
          currentValue = maxDisciplineStreak; break;
        case 'early-bird':
          currentValue = earlyBirdCount; break;
        case 'night-owl':
          currentValue = nightOwlCount; break;
        default: currentValue = medal.currentValue;
      }
      const unlocked = currentValue >= medal.targetValue;
      if (unlocked && !medal.unlocked) toast.success(`🏅 Medalha desbloqueada: ${medal.name}!`);
      return { ...medal, currentValue, unlocked, unlockedAt: unlocked ? new Date().toISOString() : null };
    });
    for (const medal of updated) {
      await supabase.from('medals').update({
        current_value: medal.currentValue, unlocked: medal.unlocked, unlocked_at: medal.unlockedAt,
      }).eq('user_id', user.id).eq('medal_id', medal.id);
    }
    setMedalsState(updated);
  }, [user, medals, totalMinutes, streak, sessions, getMinutesByDate]);

  const value: StudyDataContextType = {
    sessions, addSession, updateSession, deleteSession,
    goals, setGoals,
    disciplines, setDisciplines, addDiscipline, updateDiscipline, deleteDiscipline,
    medals, checkMedals,
    totalMinutes, studyDays: studyDaysCount, streak, stockPrice,
    getSessionsByDate, getMinutesByDate,
    loading,
  };

  return <StudyDataContext.Provider value={value}>{children}</StudyDataContext.Provider>;
}

export function useStudyData(): StudyDataContextType {
  const context = useContext(StudyDataContext);
  if (!context) throw new Error('useStudyData must be used within StudyDataProvider');
  return context;
}
