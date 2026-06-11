
-- SUBJECTS
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subjects" ON public.subjects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TOPICS
CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO authenticated;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own topics" ON public.topics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_topics_updated BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SOURCES
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text','pdf','image','url','file')),
  title text NOT NULL,
  url text,
  content_preview text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sources" ON public.sources FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- QUESTIONS
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  subject_name text,
  topic_name text,
  statement text NOT NULL,
  alt_a text NOT NULL,
  alt_b text NOT NULL,
  alt_c text NOT NULL,
  alt_d text NOT NULL,
  alt_e text NOT NULL,
  correct char(1) NOT NULL CHECK (correct IN ('A','B','C','D','E')),
  explanation text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own questions" ON public.questions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_questions_project ON public.questions(user_id, project_id);
CREATE INDEX idx_questions_subject ON public.questions(subject_id);

-- ANSWER HISTORY
CREATE TABLE public.answer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected char(1) NOT NULL CHECK (selected IN ('A','B','C','D','E')),
  is_correct boolean NOT NULL,
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  time_ms integer NOT NULL DEFAULT 0,
  answered_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answer_history TO authenticated;
GRANT ALL ON public.answer_history TO service_role;
ALTER TABLE public.answer_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answer_history" ON public.answer_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_history_question ON public.answer_history(question_id);
CREATE INDEX idx_history_user_proj ON public.answer_history(user_id, project_id, answered_at DESC);

-- REVIEW SCHEDULE (one row per question)
CREATE TABLE public.review_schedule (
  question_id uuid PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  last_rating smallint,
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_schedule TO authenticated;
GRANT ALL ON public.review_schedule TO service_role;
ALTER TABLE public.review_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own schedule" ON public.review_schedule FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_schedule_updated BEFORE UPDATE ON public.review_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_schedule_due ON public.review_schedule(user_id, project_id, due_date);

-- REVIEW SETTINGS (one per user)
CREATE TABLE public.review_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  interval_forgot integer NOT NULL DEFAULT 1,
  interval_hard integer NOT NULL DEFAULT 3,
  interval_medium integer NOT NULL DEFAULT 7,
  interval_easy integer NOT NULL DEFAULT 15,
  interval_very_easy integer NOT NULL DEFAULT 30,
  daily_new_limit integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_settings TO authenticated;
GRANT ALL ON public.review_settings TO service_role;
ALTER TABLE public.review_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own review_settings" ON public.review_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_review_settings_updated BEFORE UPDATE ON public.review_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create review_settings on new user (update existing handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.goals (user_id) VALUES (NEW.id);
  INSERT INTO public.review_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.projects (user_id, name, is_active) VALUES (NEW.id, 'Padrão', true);
  INSERT INTO public.disciplines (user_id, name, color) VALUES
    (NEW.id, 'Matemática', '#3b82f6'),
    (NEW.id, 'Português', '#10b981'),
    (NEW.id, 'Física', '#f59e0b'),
    (NEW.id, 'Química', '#ef4444'),
    (NEW.id, 'História', '#8b5cf6'),
    (NEW.id, 'Geografia', '#06b6d4');
  INSERT INTO public.medals (user_id, medal_id) VALUES
    (NEW.id, 'time-10'),(NEW.id, 'time-50'),(NEW.id, 'time-100'),(NEW.id, 'time-250'),
    (NEW.id, 'time-500'),(NEW.id, 'time-1000'),(NEW.id, 'single-5h'),
    (NEW.id, 'streak-7'),(NEW.id, 'streak-14'),(NEW.id, 'streak-30'),
    (NEW.id, 'streak-42'),(NEW.id, 'streak-100'),(NEW.id, 'discipline-30'),
    (NEW.id, 'early-bird'),(NEW.id, 'night-owl');
  RETURN NEW;
END;
$function$;

-- Backfill review_settings for existing users
INSERT INTO public.review_settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.review_settings);
