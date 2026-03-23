-- Add School Administration positions used for cross-department staffing / job postings
-- (Business Administration Professor, College Programming Instructor)

DO $$
DECLARE
  target_schema text;
  dept_school_admin uuid := '550e8400-e29b-41d4-a716-446655440004'::uuid;
BEGIN
  IF to_regclass('hr.positions') IS NOT NULL THEN
    target_schema := 'hr';
  ELSIF to_regclass('public.positions') IS NOT NULL THEN
    target_schema := 'public';
  ELSE
    RETURN;
  END IF;

  PERFORM set_config('search_path', quote_ident(target_schema) || ', public', true);

  INSERT INTO positions (id, department_id, title, description, min_salary, max_salary, is_active)
  VALUES
    (
      '650e8400-e29b-41d4-a716-446655440010'::uuid,
      dept_school_admin,
      'Business Administration Professor',
      'Teaches business administration subjects and supports academic programs under school administration.',
      28000.00,
      42000.00,
      true
    ),
    (
      '650e8400-e29b-41d4-a716-446655440011'::uuid,
      dept_school_admin,
      'College Programming Instructor',
      'Delivers programming and computer science instruction aligned with the college curriculum.',
      27000.00,
      40000.00,
      true
    )
  ON CONFLICT (id) DO UPDATE
  SET
    department_id = EXCLUDED.department_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    min_salary = EXCLUDED.min_salary,
    max_salary = EXCLUDED.max_salary,
    is_active = EXCLUDED.is_active,
    updated_at = now();
END
$$;
