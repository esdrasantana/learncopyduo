
-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Disciplines table
CREATE TABLE public.disciplines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own disciplines" ON public.disciplines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own disciplines" ON public.disciplines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own disciplines" ON public.disciplines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own disciplines" ON public.disciplines FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_disciplines_updated_at BEFORE UPDATE ON public.disciplines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  pause_minutes INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL,
  discipline TEXT NOT NULL,
  activity TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- Goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_minutes INTEGER NOT NULL DEFAULT 360,
  weekly_minutes INTEGER NOT NULL DEFAULT 2100,
  monthly_minutes INTEGER NOT NULL DEFAULT 9000,
  total_days INTEGER NOT NULL DEFAULT 120,
  total_hours INTEGER NOT NULL DEFAULT 720,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Medals table
CREATE TABLE public.medals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medal_id TEXT NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, medal_id)
);
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own medals" ON public.medals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medals" ON public.medals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medals" ON public.medals FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_medals_updated_at BEFORE UPDATE ON public.medals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize user data on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.goals (user_id) VALUES (NEW.id);
  
  INSERT INTO public.disciplines (user_id, name, color) VALUES
    (NEW.id, 'Matemática', '#3b82f6'),
    (NEW.id, 'Português', '#10b981'),
    (NEW.id, 'Física', '#f59e0b'),
    (NEW.id, 'Química', '#ef4444'),
    (NEW.id, 'História', '#8b5cf6'),
    (NEW.id, 'Geografia', '#06b6d4');
  
  INSERT INTO public.medals (user_id, medal_id) VALUES
    (NEW.id, 'time-10'),
    (NEW.id, 'time-50'),
    (NEW.id, 'time-100'),
    (NEW.id, 'time-300'),
    (NEW.id, 'time-500'),
    (NEW.id, 'time-1000'),
    (NEW.id, 'streak-7'),
    (NEW.id, 'single-6h'),
    (NEW.id, 'single-10h');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
