CREATE TABLE public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  client_id TEXT,
  food_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slot TEXT NOT NULL,
  cal NUMERIC NOT NULL DEFAULT 0,
  prot NUMERIC NOT NULL DEFAULT 0,
  carb NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fiber NUMERIC NOT NULL DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT ALL ON public.food_logs TO service_role;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_logs" ON public.food_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_logs" ON public.food_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_logs" ON public.food_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_logs" ON public.food_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX food_logs_user_date_idx ON public.food_logs(user_id, log_date DESC);