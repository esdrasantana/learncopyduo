-- 1. Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Ensure only one active project per user
CREATE OR REPLACE FUNCTION public.ensure_single_active_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.projects
    SET is_active = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_active_project_trigger
  AFTER INSERT OR UPDATE OF is_active ON public.projects
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.ensure_single_active_project();

-- 3. Add project_id to sessions
ALTER TABLE public.sessions ADD COLUMN project_id UUID;
CREATE INDEX idx_sessions_project_id ON public.sessions(project_id);

-- 4. Add auto_start_timer to goals
ALTER TABLE public.goals ADD COLUMN auto_start_timer BOOLEAN NOT NULL DEFAULT false;

-- 5. Backfill: create "Padrão" project for existing users and link sessions
DO $$
DECLARE
  u RECORD;
  new_project_id UUID;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM public.sessions
           UNION
           SELECT DISTINCT user_id FROM public.goals
  LOOP
    INSERT INTO public.projects (user_id, name, is_active)
    VALUES (u.user_id, 'Padrão', true)
    RETURNING id INTO new_project_id;
    
    UPDATE public.sessions
    SET project_id = new_project_id
    WHERE user_id = u.user_id AND project_id IS NULL;
  END LOOP;
END $$;

-- 6. Update handle_new_user to create default project
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.goals (user_id) VALUES (NEW.id);
  
  INSERT INTO public.projects (user_id, name, is_active)
  VALUES (NEW.id, 'Padrão', true);
  
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
    (NEW.id, 'time-250'),
    (NEW.id, 'time-500'),
    (NEW.id, 'time-1000'),
    (NEW.id, 'single-5h'),
    (NEW.id, 'streak-7'),
    (NEW.id, 'streak-14'),
    (NEW.id, 'streak-30'),
    (NEW.id, 'streak-42'),
    (NEW.id, 'streak-100'),
    (NEW.id, 'discipline-30'),
    (NEW.id, 'early-bird'),
    (NEW.id, 'night-owl');
  
  RETURN NEW;
END;
$function$;