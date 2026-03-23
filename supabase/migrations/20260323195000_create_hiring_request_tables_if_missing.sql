-- ─────────────────────────────────────────────────────────────────────────────
-- HR Staff Directory & Hiring Requests in public schema
-- Run this once in the Supabase SQL Editor for project cbwgqzrgcyxycajvmvwr
-- Safe to re-run (all statements are idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Timestamp helper (shared with other tables)
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Doctor/Nurse directory
CREATE TABLE IF NOT EXISTS public.hr_staff_directory (
  id               BIGSERIAL PRIMARY KEY,
  employee_no      TEXT        NOT NULL UNIQUE,
  full_name        TEXT        NOT NULL,
  role_type        TEXT        NOT NULL DEFAULT 'nurse',   -- 'doctor' | 'nurse'
  department_name  TEXT        NOT NULL DEFAULT 'General Medicine',
  employment_status TEXT       NOT NULL DEFAULT 'active',  -- 'active' | 'working' | 'inactive'
  contact_email    TEXT        NULL,
  contact_phone    TEXT        NULL,
  hired_at         TIMESTAMPTZ NULL,
  metadata         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Department hiring requests
CREATE TABLE IF NOT EXISTS public.hr_staff_requests (
  id                BIGSERIAL PRIMARY KEY,
  request_reference TEXT        NOT NULL UNIQUE,
  staff_id          BIGINT      NOT NULL REFERENCES public.hr_staff_directory (id) ON DELETE RESTRICT,
  request_status    TEXT        NOT NULL DEFAULT 'pending', -- pending|queue|waiting_applicant|hiring|approved|rejected|hired
  request_notes     TEXT        NULL,
  requested_by      TEXT        NULL,
  decided_by        TEXT        NULL,
  decided_at        TIMESTAMPTZ NULL,
  metadata          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_hr_staff_directory_role_status
  ON public.hr_staff_directory (role_type, employment_status, full_name);

CREATE INDEX IF NOT EXISTS idx_hr_staff_requests_status_created
  ON public.hr_staff_requests (request_status, created_at DESC);

-- 5. updated_at triggers (idempotent)
DO $$
BEGIN
  CREATE TRIGGER trg_hr_staff_directory_updated_at
  BEFORE UPDATE ON public.hr_staff_directory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_hr_staff_requests_updated_at
  BEFORE UPDATE ON public.hr_staff_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. RLS — enable and add permissive policies so the Supabase anon/auth key can query
ALTER TABLE public.hr_staff_directory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_staff_requests   ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hr_staff_directory' AND policyname = 'allow_all_hr_staff_directory'
  ) THEN
    CREATE POLICY allow_all_hr_staff_directory
      ON public.hr_staff_directory
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hr_staff_requests' AND policyname = 'allow_all_hr_staff_requests'
  ) THEN
    CREATE POLICY allow_all_hr_staff_requests
      ON public.hr_staff_requests
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 7. Seed starter records (safe upsert)
INSERT INTO public.hr_staff_directory
  (employee_no, full_name, role_type, department_name, employment_status, contact_email, contact_phone, hired_at)
VALUES
  ('HR-DOC-1001', 'Dr. Alyssa Rivera',   'doctor', 'General Medicine', 'active',  'alyssa.rivera@bcp.edu.ph',  '09171230001', NOW()),
  ('HR-DOC-1002', 'Dr. Marco Santos',    'doctor', 'Emergency',        'working', 'marco.santos@bcp.edu.ph',   '09171230002', NOW()),
  ('HR-NUR-2001', 'Nurse Clarisse Lim',  'nurse',  'General Ward',     'active',  'clarisse.lim@bcp.edu.ph',   '09171230003', NOW()),
  ('HR-NUR-2002', 'Nurse Paolo Reyes',   'nurse',  'Outpatient',       'working', 'paolo.reyes@bcp.edu.ph',    '09171230004', NOW()),
  ('HR-REQ-POOL-DOCTOR', 'Open Doctor Hiring Request', 'doctor', 'General Medicine', 'inactive', NULL, NULL, NULL),
  ('HR-REQ-POOL-NURSE',  'Open Nurse Hiring Request',  'nurse',  'General Medicine', 'inactive', NULL, NULL, NULL)
ON CONFLICT (employee_no) DO NOTHING;
