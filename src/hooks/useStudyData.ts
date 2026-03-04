import { useCallback, useMemo, useEffect, useState } from 'react';
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
};

export function useStudyData() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoalsState] = useState<Goals>(DEFAULT_GOALS);
  const [disciplines, setDisciplinesState] = useState<Discipline[]>([]);
  const [medals, setMedalsState] = useState<Medal[]>(defaultMedals);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  useEffect(() => {
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
          id: s.id,
          date: s.date,
          startTime: s.start_time,
          endTime: s.end_time,
          pauseMinutes: s.pause_minutes,
          durationMinutes: s.duration_minutes,
          discipline: s.discipline,
          activity: s.activity,
          note: s.note,
          createdAt: s.created_at,
        })));
      }

      if (goalRes.data) {
        setGoalsState({
          dailyMinutes: goalRes.data.daily_minutes,
          weeklyMinutes: goalRes.data.weekly_minutes,
          monthlyMinutes: goalRes.data.monthly_minutes,
          totalDays: goalRes.data.total_days,
          totalHours: goalRes.data.total_hours,
        });
      }

      if (discRes.data) {
        setDisciplinesState(discRes.data.map(d => ({
          id: d.id,
          name: d.name,
          color: d.color,
        })));
      }

      if (medalRes.data) {
        setMedalsState(defaultMedals.map(dm => {
          const dbMedal = medalRes.data.find(m => m.medal_id === dm.id);
          if (dbMedal) {
            return {
              ...dm,
              currentValue: Number(dbMedal.current_value),
              unlocked: dbMedal.unlocked,
              unlockedAt: dbMedal.unlocked_at,
            };
          }
          return dm;
        }));
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const addSession = useCallback(async (session: Omit<Session, 'id' | 'createdAt'>) => {
    if (!user) return null;
    const { data, error } = await supabase.from('sessions').insert({
      user_id: user.id,
      date: session.date,
      start_time: session.startTime,
      end_time: session.endTime,
      pause_minutes: session.pauseMinutes,
      duration_minutes: session.durationMinutes,
      discipline: session.discipline,
      activity: session.activity,
      note: session.note,
    }).select().single();

    if (error) { toast.error('Erro ao salvar sessão'); return null; }

    const newSession: Session = {
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      pauseMinutes: data.pause_minutes,
      durationMinutes: data.duration_minutes,
      discipline: data.discipline,
      activity: data.activity,
      note: data.note,
      createdAt: data.created_at,
    };
    setSessions(prev => [newSession, ...prev]);
    return newSession;
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
      daily_minutes: newGoals.dailyMinutes,
      weekly_minutes: newGoals.weeklyMinutes,
      monthly_minutes: newGoals.monthlyMinutes,
      total_days: newGoals.totalDays,
      total_hours: newGoals.totalHours,
    }).eq('user_id', user.id);
    if (error) { toast.error('Erro ao salvar metas'); return; }
    setGoalsState(newGoals);
  }, [user]);

  const setDisciplines = useCallback(async (newDisciplines: Discipline[]) => {
    if (!user) return;
    // Simple approach: delete all and re-insert
    await supabase.from('disciplines').delete().eq('user_id', user.id);
    const { error } = await supabase.from('disciplines').insert(
      newDisciplines.map(d => ({ user_id: user.id, name: d.name, color: d.color }))
    );
    if (error) { toast.error('Erro ao salvar disciplinas'); return; }
    setDisciplinesState(newDisciplines);
  }, [user]);

  const totalMinutes = useMemo(() => sessions.reduce((sum, s) => sum + s.durationMinutes, 0), [sessions]);

  const studyDays = useMemo(() => {
    const days = new Set(sessions.map(s => s.date));
    return days.size;
  }, [sessions]);

  const getSessionsByDate = useCallback((date: string) => sessions.filter(s => s.date === date), [sessions]);

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

  const checkMedals = useCallback(async () => {
    if (!user) return;
    const updated = medals.map(medal => {
      if (medal.unlocked) return medal;
      let currentValue = 0;
      switch (medal.id) {
        case 'time-10': case 'time-50': case 'time-100':
        case 'time-300': case 'time-500': case 'time-1000':
          currentValue = totalMinutes / 60; break;
        case 'streak-7': currentValue = streak; break;
        case 'single-6h': case 'single-10h': {
          const dates = [...new Set(sessions.map(s => s.date))];
          currentValue = Math.max(0, ...dates.map(d => getMinutesByDate(d))) / 60;
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

    // Persist to DB
    for (const medal of updated) {
      await supabase.from('medals').update({
        current_value: medal.currentValue,
        unlocked: medal.unlocked,
        unlocked_at: medal.unlockedAt,
      }).eq('user_id', user.id).eq('medal_id', medal.id);
    }

    setMedalsState(updated);
  }, [user, medals, totalMinutes, streak, sessions, getMinutesByDate]);

  return {
    sessions, addSession, deleteSession,
    goals, setGoals,
    disciplines, setDisciplines,
    medals, checkMedals,
    totalMinutes, studyDays, streak, stockPrice,
    getSessionsByDate, getMinutesByDate,
    loading,
  };
}
