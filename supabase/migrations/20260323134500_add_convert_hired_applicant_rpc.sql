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

  IF EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.user_id = _applicant_user_id
  ) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', 'Applicant is already an employee.'
    );
  END IF;

  INSERT INTO public.employees (
    user_id,
    employee_number,
    employee_type,
    department_id,
    position_id,
    hire_date,
    employment_status
  )
  VALUES (
    _applicant_user_id,
    'EMP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad((trunc(random() * 10000))::text, 4, '0'),
    _employee_type,
    _department_id,
    _position_id,
    _hire_date,
    'probation'
  )
  RETURNING id INTO _employee_id;

  IF _salary IS NOT NULL AND _salary > 0 THEN
    INSERT INTO public.employment_contracts (
      employee_id,
      contract_type,
      start_date,
      salary,
      is_current
    )
    VALUES (
      _employee_id,
      _contract_type,
      _hire_date,
      _salary,
      true
    );
  END IF;

  INSERT INTO public.employee_documents (
    employee_id,
    document_name,
    document_url,
    document_type,
    uploaded_by
  )
  SELECT
    _employee_id,
    ad.document_name,
    ad.document_url,
    ad.document_type,
    _applicant_user_id
  FROM public.applicant_documents ad
  WHERE ad.applicant_id = _applicant_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_applicant_user_id, 'employee')
  ON CONFLICT (user_id)
  DO UPDATE SET role = 'employee'
  WHERE public.user_roles.role <> 'system_admin';

  RETURN jsonb_build_object(
    'ok', true,
    'employee_id', _employee_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_hired_applicant_to_employee(
  UUID,
  UUID,
  public.employee_type,
  UUID,
  UUID,
  DATE,
  public.contract_type,
  NUMERIC
) TO authenticated, service_role;
