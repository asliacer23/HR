-- =====================================================
-- HR Instructor -> Registrar Test Page RPCs
-- =====================================================
-- Exposes instructor records from hr.instructors and a Registrar dispatch
-- helper so the frontend can test the end-to-end instructor handoff flow.

CREATE OR REPLACE FUNCTION public.get_hr_instructors(
    _search TEXT DEFAULT NULL,
    _employment_status TEXT DEFAULT NULL,
    _limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, hr
AS $$
DECLARE
    payload JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(to_jsonb(instructor_row) ORDER BY instructor_row.last_name, instructor_row.first_name, instructor_row.employee_no),
        '[]'::jsonb
    )
    INTO payload
    FROM (
        SELECT
            instructor.id,
            instructor.employee_id,
            instructor.employee_no,
            instructor.first_name,
            instructor.last_name,
            instructor.department,
            instructor.specialization,
            instructor.academic_rank,
            instructor.employment_status,
            instructor.primary_app_role,
            instructor.is_admin,
            instructor.connected_systems,
            instructor.integration_ready,
            instructor.created_at,
            instructor.updated_at
        FROM hr.instructors instructor
        WHERE (
            _search IS NULL
            OR trim(_search) = ''
            OR concat_ws(
                ' ',
                instructor.employee_no,
                instructor.first_name,
                instructor.last_name,
                instructor.department,
                instructor.specialization,
                instructor.academic_rank
            ) ILIKE '%' || trim(_search) || '%'
        )
          AND (
            _employment_status IS NULL
            OR trim(_employment_status) = ''
            OR instructor.employment_status = _employment_status
          )
        ORDER BY instructor.last_name, instructor.first_name, instructor.employee_no
        LIMIT GREATEST(COALESCE(_limit, 100), 1)
    ) instructor_row;

    RETURN payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_hr_instructor_to_registrar(
    _instructor_id UUID,
    _college_unit TEXT,
    _semester TEXT,
    _teaching_load JSONB DEFAULT '[]'::jsonb,
    _schedule_matrix JSONB DEFAULT '{}'::jsonb,
    _remarks TEXT DEFAULT NULL,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, hr
AS $$
DECLARE
    instructor_record RECORD;
    payload JSONB;
    source_record_id TEXT;
    result JSONB;
BEGIN
    SELECT *
    INTO instructor_record
    FROM hr.instructors instructor
    WHERE instructor.id = _instructor_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'not_found',
            'message', 'Instructor was not found in hr.instructors.'
        );
    END IF;

    IF COALESCE(instructor_record.integration_ready, false) = false THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'not_ready',
            'message', 'Instructor is not currently integration ready.'
        );
    END IF;

    payload := jsonb_strip_nulls(
        jsonb_build_object(
            'employee_id', instructor_record.employee_no,
            'employee_uuid', instructor_record.employee_id,
            'employee_name', trim(concat_ws(' ', instructor_record.first_name, instructor_record.last_name)),
            'employee_number', instructor_record.employee_no,
            'department_name', instructor_record.department,
            'specialization', instructor_record.specialization,
            'academic_rank', instructor_record.academic_rank,
            'employment_status', instructor_record.employment_status,
            'college_unit', NULLIF(trim(COALESCE(_college_unit, '')), ''),
            'semester', NULLIF(trim(COALESCE(_semester, '')), ''),
            'teaching_load', COALESCE(_teaching_load, '[]'::jsonb),
            'schedule_matrix', COALESCE(_schedule_matrix, '{}'::jsonb),
            'remarks', NULLIF(trim(COALESCE(_remarks, '')), ''),
            'source_view', 'hr.instructors'
        )
    );

    source_record_id := format(
        'HR-INSTR-REG-%s-%s',
        COALESCE(NULLIF(instructor_record.employee_no, ''), substring(replace(instructor_record.employee_id::text, '-', '') FROM 1 FOR 8)),
        to_char(now(), 'YYYYMMDDHH24MISS')
    );

    result := public.dispatch_department_flow(
        'hr',
        'registrar',
        'faculty_assignment_validation',
        source_record_id,
        payload,
        _requested_by
    );

    RETURN result || jsonb_build_object(
        'instructor_id', instructor_record.employee_no,
        'instructor_uuid', instructor_record.employee_id,
        'employee_no', instructor_record.employee_no,
        'employee_name', trim(concat_ws(' ', instructor_record.first_name, instructor_record.last_name)),
        'college_unit', NULLIF(trim(COALESCE(_college_unit, '')), ''),
        'semester', NULLIF(trim(COALESCE(_semester, '')), '')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_hr_instructor_registrar_history(
    _instructor_id UUID,
    _limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payload JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(to_jsonb(event_row) ORDER BY event_row.created_at DESC),
        '[]'::jsonb
    )
    INTO payload
    FROM (
        SELECT
            event.id AS event_id,
            event.correlation_id,
            event.route_key,
            route.flow_name,
            event.source_record_id,
            event.event_code,
            event.status,
            event.dispatch_endpoint,
            event.request_payload,
            event.response_payload,
            event.last_error,
            event.dispatched_at,
            event.acknowledged_at,
            event.created_at,
            event.updated_at
        FROM public.integration_flow_events event
        JOIN public.integration_flow_routes route
          ON route.route_key = event.route_key
        WHERE event.target_department_key = 'registrar'
          AND event.event_code = 'faculty_assignment_validation'
          AND COALESCE(
                NULLIF(event.request_payload->>'employee_uuid', ''),
                NULLIF(event.request_payload->>'employee_id', '')
              ) = _instructor_id::text
        ORDER BY event.created_at DESC
        LIMIT GREATEST(COALESCE(_limit, 20), 1)
    ) event_row;

    RETURN payload;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_hr_instructors(TEXT, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_hr_instructor_to_registrar(UUID, TEXT, TEXT, JSONB, JSONB, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_hr_instructor_registrar_history(UUID, INTEGER) TO authenticated, service_role;
