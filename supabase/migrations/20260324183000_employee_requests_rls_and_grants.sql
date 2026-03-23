-- Align employee_requests with hr_staff_requests: PostgREST (anon/authenticated) must see rows
-- written by server-side Postgres users (e.g. COMLAB PHP). Without policies, RLS can hide rows.

ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employee_requests'
      AND policyname = 'allow_all_employee_requests'
  ) THEN
    CREATE POLICY allow_all_employee_requests
      ON public.employee_requests
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_requests TO anon, authenticated, service_role;
