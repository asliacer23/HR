-- Allow HR-manually-created applicants to be converted to employees.
-- Manual applicants share a synthetic user_id (the admin's) so the old
-- UNIQUE constraint on user_id blocks their conversion.
--
-- Changes:
--  1. Drop the UNIQUE constraint on employees.user_id (keep NOT NULL + FK).
--  2. Add employee_notes TEXT column to store the source job_application_id tag.
--  3. Add source_applicant_id UUID column for accurate duplicate detection.
--  4. Update convert_hired_applicant_to_employee RPC to populate source_applicant_id
--     and remove the per-user duplicate guard (use per-applicant check instead).

-- 1. Drop unique constraint on user_id in the real table (hr.employees).
-- public.employees is a compatibility VIEW.
ALTER TABLE hr.employees
  DROP CONSTRAINT IF EXISTS employees_user_id_key;

-- 2. Add employee_notes column (stores "job_application_id:<uuid>" tag)
ALTER TABLE hr.employees
  ADD COLUMN IF NOT EXISTS employee_notes TEXT;

-- 3. Add source_applicant_id column
ALTER TABLE hr.employees
  ADD COLUMN IF NOT EXISTS source_applicant_id UUID REFERENCES hr.applicants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_source_applicant_id
  ON hr.employees (source_applicant_id)
  WHERE source_applicant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employees_employee_notes
  ON hr.employees (employee_notes)
  WHERE employee_notes IS NOT NULL;

-- Refresh compatibility view so new columns are exposed on public.employees.
CREATE OR REPLACE VIEW public.employees AS
SELECT * FROM hr.employees;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO anon, authenticated, service_role;

-- 4. Update the convert RPC to use source_applicant_id for duplicate detection
CREATE OR REPLACE FUNCTION public.convert_hired_applicant_to_employee(
  _applicant_id UUID,
  _applicant_user_id UUID,
  _employee_type public.employee_type,
  _department_id UUID,
  _position_id UUID,
  _hire_date DATE,
  _contract_type public.contract_type DEFAULT 'full_time',
  _salary NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _employee_id UUID;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'system_admin')
    OR public.has_role(auth.uid(), 'hr_admin')
  ) THEN
    RAISE EXCEPTION 'Only HR/Admin can convert applicants to employees';
  END IF;

  -- Check by source_applicant_id — accurate for all applicant types
  IF EXISTS (
    SELECT 1 FROM hr.employees e
    WHERE e.source_applicant_id = _applicant_id
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'This applicant has already been converted to an employee.'
    );
  END IF;

  INSERT INTO hr.employees (
    user_id,
    employee_number,
    employee_type,
    department_id,
    position_id,
    hire_date,
    employment_status,
    source_applicant_id
  )
  VALUES (
    _applicant_user_id,
    'EMP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad((trunc(random() * 10000))::text, 4, '0'),
    _employee_type,
    _department_id,
    _position_id,
    _hire_date,
    'probation',
    _applicant_id
  )
  RETURNING id INTO _employee_id;

  IF _salary IS NOT NULL AND _salary > 0 THEN
    INSERT INTO hr.employment_contracts (
      employee_id, contract_type, start_date, salary, is_current
    )
    VALUES (_employee_id, _contract_type, _hire_date, _salary, true);
  END IF;

  INSERT INTO hr.employee_documents (
    employee_id, document_name, document_url, document_type, uploaded_by
  )
  SELECT _employee_id, ad.document_name, ad.document_url, ad.document_type, _applicant_user_id
  FROM hr.applicant_documents ad
  WHERE ad.applicant_id = _applicant_id;

  INSERT INTO hr.user_roles (user_id, role)
  VALUES (_applicant_user_id, 'employee')
  ON CONFLICT (user_id)
  DO UPDATE SET role = 'employee'
  WHERE hr.user_roles.role <> 'system_admin';

  RETURN jsonb_build_object('ok', true, 'employee_id', _employee_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_hired_applicant_to_employee(
  UUID, UUID, public.employee_type, UUID, UUID, DATE, public.contract_type, NUMERIC
) TO authenticated, service_role;
