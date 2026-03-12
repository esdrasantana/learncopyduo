
-- Update handle_new_user to insert new medal IDs
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

-- Insert new medals for existing users
INSERT INTO public.medals (user_id, medal_id)
SELECT u.id, m.medal_id
FROM auth.users u
CROSS JOIN (VALUES 
  ('time-250'), ('single-5h'), ('streak-14'), ('streak-30'), 
  ('streak-42'), ('streak-100'), ('discipline-30'), ('early-bird'), ('night-owl')
) AS m(medal_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.medals pm WHERE pm.user_id = u.id AND pm.medal_id = m.medal_id
);

-- Remove old medal IDs that no longer exist
DELETE FROM public.medals WHERE medal_id IN ('time-300', 'single-6h', 'single-10h');
