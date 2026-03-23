-- Normalize HR -> Registrar instructor identifiers.
-- Canonical external ID: hr.employees.employee_number
-- Internal ID: UUID employee_id / employee_uuid

DO $$
BEGIN
  -- Backfill legacy hr.instructors table rows (if table exists).
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'hr'
      AND c.relname = 'instructors'
      AND c.relkind = 'r'
  ) THEN
    UPDATE hr.instructors AS instructor
    SET
      employee_no = employee.employee_number,
      updated_at = NOW()
    FROM hr.employees AS employee
    WHERE instructor.employee_id = employee.id
      AND COALESCE(employee.employee_number, '') <> ''
      AND COALESCE(instructor.employee_no, '') <> employee.employee_number;
  END IF;
END
$$;

DO $$
BEGIN
  -- Re-key Registrar assignment rows from legacy employee_no values (for example HR-FAC-xxx)
  -- into canonical employee_number values where a mapping exists.
  IF to_regclass('registrar.instructor_class_assignments') IS NOT NULL
     AND to_regclass('hr.instructors') IS NOT NULL
     AND to_regclass('hr.employees') IS NOT NULL THEN
    UPDATE registrar.instructor_class_assignments AS assignment
    SET instructor_employee_no = mapped.employee_number
    FROM (
      SELECT DISTINCT
        instructor.employee_no AS legacy_employee_no,
        employee.employee_number
      FROM hr.instructors AS instructor
      JOIN hr.employees AS employee
        ON employee.id = instructor.employee_id
      WHERE COALESCE(instructor.employee_no, '') <> ''
        AND COALESCE(employee.employee_number, '') <> ''
        AND instructor.employee_no <> employee.employee_number
    ) AS mapped
    WHERE assignment.instructor_employee_no = mapped.legacy_employee_no
      AND NOT EXISTS (
        SELECT 1
        FROM registrar.instructor_class_assignments AS existing
        WHERE existing.class_id = assignment.class_id
          AND existing.instructor_employee_no = mapped.employee_number
      );

    -- Remove old duplicate rows when the canonical assignment row already exists.
    DELETE FROM registrar.instructor_class_assignments AS assignment
    USING (
      SELECT DISTINCT
        instructor.employee_no AS legacy_employee_no,
        employee.employee_number
      FROM hr.instructors AS instructor
      JOIN hr.employees AS employee
        ON employee.id = instructor.employee_id
      WHERE COALESCE(instructor.employee_no, '') <> ''
        AND COALESCE(employee.employee_number, '') <> ''
        AND instructor.employee_no <> employee.employee_number
    ) AS mapped
    WHERE assignment.instructor_employee_no = mapped.legacy_employee_no
      AND EXISTS (
        SELECT 1
        FROM registrar.instructor_class_assignments AS existing
        WHERE existing.class_id = assignment.class_id
          AND existing.instructor_employee_no = mapped.employee_number
      );
  END IF;
END
$$;

DO $$
BEGIN
  -- Rewrite dispatched payloads so Registrar-facing employee_id is employee_number.
  IF to_regclass('public.integration_flow_events') IS NOT NULL THEN
    UPDATE public.integration_flow_events AS event
    SET request_payload =
      COALESCE(event.request_payload, '{}'::jsonb)
      || jsonb_strip_nulls(
        jsonb_build_object(
          'employee_uuid',
          COALESCE(
            NULLIF(event.request_payload->>'employee_uuid', ''),
            NULLIF(event.request_payload->>'employee_id', '')
          ),
          'employee_id',
          COALESCE(
            NULLIF(event.request_payload->>'employee_number', ''),
            NULLIF(event.request_payload->>'employee_id', '')
          )
        )
      )
    WHERE event.source_department_key = 'hr'
      AND event.target_department_key = 'registrar'
      AND event.event_code = 'faculty_assignment_validation'
      AND event.request_payload IS NOT NULL
      AND (
        COALESCE(NULLIF(event.request_payload->>'employee_number', ''), '') <> ''
        OR COALESCE(NULLIF(event.request_payload->>'employee_uuid', ''), '') = ''
      );
  END IF;
END
$$;
