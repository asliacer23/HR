/**
 * setup-hiring-tables.js
 *
 * Creates public.hr_staff_directory and public.hr_staff_requests
 * directly in your Supabase project using the DATABASE_URL from .env
 *
 * Run once:  node scripts/setup-hiring-tables.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found in .env');
  process.exit(1);
}

const SQL = `
-- ── Timestamp helper ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- ── Doctor/Nurse directory ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_staff_directory (
  id                BIGSERIAL PRIMARY KEY,
  employee_no       TEXT        NOT NULL UNIQUE,
  full_name         TEXT        NOT NULL,
  role_type         TEXT        NOT NULL DEFAULT 'nurse',
  department_name   TEXT        NOT NULL DEFAULT 'General Medicine',
  employment_status TEXT        NOT NULL DEFAULT 'active',
  contact_email     TEXT        NULL,
  contact_phone     TEXT        NULL,
  hired_at          TIMESTAMPTZ NULL,
  metadata          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Department hiring requests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_staff_requests (
  id                BIGSERIAL PRIMARY KEY,
  request_reference TEXT        NOT NULL UNIQUE,
  staff_id          BIGINT      NOT NULL REFERENCES public.hr_staff_directory (id) ON DELETE RESTRICT,
  request_status    TEXT        NOT NULL DEFAULT 'pending',
  request_notes     TEXT        NULL,
  requested_by      TEXT        NULL,
  decided_by        TEXT        NULL,
  decided_at        TIMESTAMPTZ NULL,
  metadata          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hr_staff_directory_role_status
  ON public.hr_staff_directory (role_type, employment_status, full_name);

CREATE INDEX IF NOT EXISTS idx_hr_staff_requests_status_created
  ON public.hr_staff_requests (request_status, created_at DESC);

-- ── updated_at triggers ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TRIGGER trg_hr_staff_directory_updated_at
  BEFORE UPDATE ON public.hr_staff_directory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_hr_staff_requests_updated_at
  BEFORE UPDATE ON public.hr_staff_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.hr_staff_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_staff_requests  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hr_staff_directory'
      AND policyname = 'allow_all_hr_staff_directory'
  ) THEN
    CREATE POLICY allow_all_hr_staff_directory
      ON public.hr_staff_directory FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'hr_staff_requests'
      AND policyname = 'allow_all_hr_staff_requests'
  ) THEN
    CREATE POLICY allow_all_hr_staff_requests
      ON public.hr_staff_requests FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── Seed starter records ────────────────────────────────────────────────────
INSERT INTO public.hr_staff_directory
  (employee_no, full_name, role_type, department_name, employment_status, contact_email, contact_phone, hired_at)
VALUES
  ('HR-DOC-1001', 'Dr. Alyssa Rivera',            'doctor', 'General Medicine', 'active',   'alyssa.rivera@bcp.edu.ph', '09171230001', NOW()),
  ('HR-DOC-1002', 'Dr. Marco Santos',             'doctor', 'Emergency',        'working',  'marco.santos@bcp.edu.ph',  '09171230002', NOW()),
  ('HR-NUR-2001', 'Nurse Clarisse Lim',           'nurse',  'General Ward',     'active',   'clarisse.lim@bcp.edu.ph',  '09171230003', NOW()),
  ('HR-NUR-2002', 'Nurse Paolo Reyes',            'nurse',  'Outpatient',       'working',  'paolo.reyes@bcp.edu.ph',   '09171230004', NOW()),
  ('HR-REQ-POOL-DOCTOR', 'Open Doctor Hiring Request', 'doctor', 'General Medicine', 'inactive', NULL, NULL, NULL),
  ('HR-REQ-POOL-NURSE',  'Open Nurse Hiring Request',  'nurse',  'General Medicine', 'inactive', NULL, NULL, NULL)
ON CONFLICT (employee_no) DO NOTHING;
`;

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to Supabase database...');
  await client.connect();
  console.log('Connected.\n');

  try {
    console.log('Creating tables, indexes, triggers, RLS policies and seed rows...');
    await client.query(SQL);
    console.log('\n✓ Done! Tables created in public schema:\n');

    const { rows } = await client.query(`
      SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('hr_staff_directory', 'hr_staff_requests')
      ORDER BY table_name;
    `);

    if (rows.length === 0) {
      console.log('  (no rows returned — check Supabase Table Editor manually)');
    } else {
      rows.forEach((row) => console.log(`  ✓ public.${row.table_name}  (${row.size})`));
    }

    const { rows: dirRows } = await client.query('SELECT COUNT(*) AS total FROM public.hr_staff_directory;');
    const { rows: reqRows } = await client.query('SELECT COUNT(*) AS total FROM public.hr_staff_requests;');
    console.log(`\n  hr_staff_directory rows : ${dirRows[0].total}`);
    console.log(`  hr_staff_requests rows  : ${reqRows[0].total}`);
    console.log('\nHR hiring request tables are ready. Refresh your HR app.\n');
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
