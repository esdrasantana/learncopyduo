import { createContext, useContext, useCallback, useEffect, useState, ReactNode, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useStudyData } from "./useStudyData";
import { Question, ReviewSchedule, AnswerRecord, ReviewSettings, Rating, Letter } from "@/types/questions";
import { toast } from "sonner";

const DEFAULT_SETTINGS: ReviewSettings = {
  intervalForgot: 1, intervalHard: 3, intervalMedium: 7, intervalEasy: 15, intervalVeryEasy: 30, dailyNewLimit: 20,
};

interface Ctx {
  loading: boolean;
  questions: Question[];
  schedules: Record<string, ReviewSchedule>;
  history: AnswerRecord[];
  settings: ReviewSettings;
  refresh: () => Promise<void>;
  updateSettings: (s: ReviewSettings) => Promise<void>;
  answerQuestion: (questionId: string, selected: Letter, isCorrect: boolean, rating: Rating, timeMs: number) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  dueToday: Question[];
  newQuestions: Question[];
  accuracy: number;
  totalAnswered: number;
  weakTopics: { topic: string; errors: number }[];
}

const QuestionsContext = createContext<Ctx | null>(null);

function mapQ(r: any): Question {
  return {
    id: r.id, projectId: r.project_id, sourceId: r.source_id, subjectId: r.subject_id, topicId: r.topic_id,
    subjectName: r.subject_name, topicName: r.topic_name, statement: r.statement,
    altA: r.alt_a, altB: r.alt_b, altC: r.alt_c, altD: r.alt_d, altE: r.alt_e,
    correct: r.correct, explanation: r.explanation, difficulty: r.difficulty, createdAt: r.created_at,
  };
}

export function QuestionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activeProject } = useStudyData();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [schedules, setSchedules] = useState<Record<string, ReviewSchedule>>({});
  const [history, setHistory] = useState<AnswerRecord[]>([]);
  const [settings, setSettings] = useState<ReviewSettings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    if (!user || !activeProject) {
      setQuestions([]); setSchedules({}); setHistory([]); setLoading(false); return;
    }
    setLoading(true);
    const [{ data: qs }, { data: scs }, { data: hs }, { data: st }] = await Promise.all([
      supabase.from("questions").select("*").eq("user_id", user.id).eq("project_id", activeProject.id).order("created_at", { ascending: false }),
      supabase.from("review_schedule").select("*").eq("user_id", user.id).eq("project_id", activeProject.id),
      supabase.from("answer_history").select("*").eq("user_id", user.id).eq("project_id", activeProject.id).order("answered_at", { ascending: false }).limit(500),
      supabase.from("review_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setQuestions((qs ?? []).map(mapQ));
    const map: Record<string, ReviewSchedule> = {};
    (scs ?? []).forEach((s: any) => {
      map[s.question_id] = {
        questionId: s.question_id, dueDate: s.due_date, intervalDays: s.interval_days,
        repetitions: s.repetitions, lastRating: s.last_rating, lastReviewedAt: s.last_reviewed_at,
      };
    });
    setSchedules(map);
    setHistory((hs ?? []).map((r: any) => ({
      id: r.id, questionId: r.question_id, selected: r.selected, isCorrect: r.is_correct,
      rating: r.rating, timeMs: r.time_ms, answeredAt: r.answered_at,
    })));
    if (st) {
      setSettings({
        intervalForgot: st.interval_forgot, intervalHard: st.interval_hard, intervalMedium: st.interval_medium,
        intervalEasy: st.interval_easy, intervalVeryEasy: st.interval_very_easy, dailyNewLimit: st.daily_new_limit,
      });
    }
    setLoading(false);
  }, [user, activeProject]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateSettings = async (s: ReviewSettings) => {
    if (!user) return;
    const { error } = await supabase.from("review_settings").upsert({
      user_id: user.id,
      interval_forgot: s.intervalForgot, interval_hard: s.intervalHard, interval_medium: s.intervalMedium,
      interval_easy: s.intervalEasy, interval_very_easy: s.intervalVeryEasy, daily_new_limit: s.dailyNewLimit,
    });
    if (error) { toast.error(error.message); return; }
    setSettings(s);
    toast.success("Configurações salvas");
  };

  const answerQuestion = async (questionId: string, selected: Letter, isCorrect: boolean, rating: Rating, timeMs: number) => {
    if (!user || !activeProject) return;
    const intervalMap: Record<Rating, number> = {
      1: settings.intervalForgot, 2: settings.intervalHard, 3: settings.intervalMedium,
      4: settings.intervalEasy, 5: settings.intervalVeryEasy,
    };
    const intervalDays = intervalMap[rating];
    const due = new Date(); due.setDate(due.getDate() + intervalDays);
    const dueStr = due.toISOString().slice(0, 10);
    const prev = schedules[questionId];

    await supabase.from("answer_history").insert({
      user_id: user.id, project_id: activeProject.id, question_id: questionId,
      selected, is_correct: isCorrect, rating, time_ms: timeMs,
    });
    await supabase.from("review_schedule").upsert({
      question_id: questionId, user_id: user.id, project_id: activeProject.id,
      due_date: dueStr, interval_days: intervalDays,
      repetitions: (prev?.repetitions ?? 0) + 1, last_rating: rating, last_reviewed_at: new Date().toISOString(),
    });
    await refresh();
  };

  const deleteQuestion = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await refresh();
  };

  const today = new Date().toISOString().slice(0, 10);
  const dueToday = useMemo(
    () => questions.filter((q) => {
      const s = schedules[q.id];
      return s && s.dueDate <= today && s.repetitions > 0;
    }),
    [questions, schedules, today]
  );
  const newQuestions = useMemo(
    () => questions.filter((q) => {
      const s = schedules[q.id];
      return !s || s.repetitions === 0;
    }),
    [questions, schedules]
  );
  const accuracy = useMemo(() => {
    if (history.length === 0) return 0;
    const correct = history.filter((h) => h.isCorrect).length;
    return Math.round((correct / history.length) * 100);
  }, [history]);
  const totalAnswered = history.length;

  const weakTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((h) => {
      if (!h.isCorrect) {
        const q = questions.find((qq) => qq.id === h.questionId);
        const t = q?.topicName || q?.subjectName || "Outros";
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([topic, errors]) => ({ topic, errors })).sort((a, b) => b.errors - a.errors).slice(0, 5);
  }, [history, questions]);

  return (
    <QuestionsContext.Provider value={{ loading, questions, schedules, history, settings, refresh, updateSettings, answerQuestion, deleteQuestion, dueToday, newQuestions, accuracy, totalAnswered, weakTopics }}>
      {children}
    </QuestionsContext.Provider>
  );
}

export function useQuestions() {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error("useQuestions must be used within QuestionsProvider");
  return ctx;
}
