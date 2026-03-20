-- Restore public compatibility views for frontend queries.
-- The live project exposes HR tables under the hr schema and already has
-- public.hr_* views. The app expects public.<table_name>, so we provide
-- thin public views that point at hr.<table_name>.

CREATE OR REPLACE FUNCTION public.ensure_hr_compat_view(alias_name text, source_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  existing_relkind "char";
BEGIN
  SELECT c.relkind
  INTO existing_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = alias_name;

  IF existing_relkind IS NULL OR existing_relkind = 'v' THEN
    EXECUTE format(
      'CREATE OR REPLACE VIEW public.%I AS SELECT * FROM hr.%I',
      alias_name,
      source_name
    );

    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated, service_role',
      alias_name
    );
  END IF;
END;
$$;

SELECT public.ensure_hr_compat_view('departments', 'departments');
SELECT public.ensure_hr_compat_view('positions', 'positions');
SELECT public.ensure_hr_compat_view('user_roles', 'user_roles');
SELECT public.ensure_hr_compat_view('profiles', 'profiles');
SELECT public.ensure_hr_compat_view('employees', 'employees');
SELECT public.ensure_hr_compat_view('employment_contracts', 'employment_contracts');
SELECT public.ensure_hr_compat_view('job_postings', 'job_postings');
SELECT public.ensure_hr_compat_view('applicants', 'applicants');
SELECT public.ensure_hr_compat_view('job_applications', 'job_applications');
SELECT public.ensure_hr_compat_view('interview_schedules', 'interview_schedules');
SELECT public.ensure_hr_compat_view('applicant_documents', 'applicant_documents');
SELECT public.ensure_hr_compat_view('onboarding_tasks', 'onboarding_tasks');
SELECT public.ensure_hr_compat_view('employee_onboarding', 'employee_onboarding');
SELECT public.ensure_hr_compat_view('training_programs', 'training_programs');
SELECT public.ensure_hr_compat_view('employee_trainings', 'employee_trainings');
SELECT public.ensure_hr_compat_view('performance_evaluations', 'performance_evaluations');
SELECT public.ensure_hr_compat_view('performance_criteria', 'performance_criteria');
SELECT public.ensure_hr_compat_view('evaluation_scores', 'evaluation_scores');
SELECT public.ensure_hr_compat_view('payroll_periods', 'payroll_periods');
SELECT public.ensure_hr_compat_view('payroll_records', 'payroll_records');
SELECT public.ensure_hr_compat_view('benefits', 'benefits');
SELECT public.ensure_hr_compat_view('employee_benefits', 'employee_benefits');
SELECT public.ensure_hr_compat_view('employee_documents', 'employee_documents');

DROP FUNCTION public.ensure_hr_compat_view(text, text);
