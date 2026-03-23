-- Standalone HR employee directory + instructor compatibility layer
-- Run this after the main HR schema and integration migrations.

CREATE SCHEMA IF NOT EXISTS hr;

DO $$
BEGIN
  IF to_regclass('public.department_integration_mappings') IS NOT NULL THEN
    EXECUTE 'CREATE OR REPLACE VIEW hr.department_integration_mappings AS SELECT * FROM public.department_integration_mappings';
  ELSE
    EXECUTE $view$
      CREATE OR REPLACE VIEW hr.department_integration_mappings AS
      SELECT
        NULL::uuid AS id,
        NULL::uuid AS department_id,
        NULL::text AS integration_department_key,
        NULL::text AS relationship_kind,
        false AS is_primary,
        false AS supports_employee_sync,
        false AS supports_admin_sync,
        NULL::text AS default_event_code,
        NULL::text AS notes,
        '{}'::jsonb AS metadata,
        NULL::timestamptz AS created_at,
        NULL::timestamptz AS updated_at
      WHERE false
    $view$;
  END IF;

  IF to_regclass('public.employee_integration_profiles') IS NOT NULL THEN
    EXECUTE 'CREATE OR REPLACE VIEW hr.employee_integration_profiles AS SELECT * FROM public.employee_integration_profiles';
  ELSE
    EXECUTE $view$
      CREATE OR REPLACE VIEW hr.employee_integration_profiles AS
      SELECT
        NULL::uuid AS employee_id,
        NULL::text AS primary_integration_department_key,
        NULL::text AS integration_status,
        false AS sync_enabled,
        false AS allow_admin_sync,
        false AS allow_department_sync,
        NULL::text AS external_directory_id,
        NULL::timestamptz AS last_dispatched_at,
        NULL::timestamptz AS last_synced_at,
        NULL::text AS last_target_department_key,
        NULL::uuid AS last_event_id,
        '{}'::jsonb AS metadata,
        NULL::timestamptz AS created_at,
        NULL::timestamptz AS updated_at
      WHERE false
    $view$;
  END IF;

  IF to_regclass('public.employee_directory') IS NULL THEN
    IF to_regclass('hr.employee_directory') IS NOT NULL THEN
      EXECUTE 'CREATE OR REPLACE VIEW public.employee_directory AS SELECT * FROM hr.employee_directory';
    ELSIF to_regclass('public.employees') IS NOT NULL
      AND to_regclass('public.profiles') IS NOT NULL
      AND to_regclass('public.departments') IS NOT NULL
      AND to_regclass('public.positions') IS NOT NULL
      AND to_regclass('public.user_roles') IS NOT NULL
      AND to_regclass('public.integration_departments') IS NOT NULL
      AND to_regclass('public.integration_flow_routes') IS NOT NULL THEN
      EXECUTE $view$
        CREATE OR REPLACE VIEW public.employee_directory AS
        WITH role_rank AS (
          SELECT
            ur.user_id,
            ur.role::text AS role_name,
            CASE ur.role
              WHEN 'system_admin' THEN 1
              WHEN 'hr_admin' THEN 2
              WHEN 'employee' THEN 3
              WHEN 'applicant' THEN 4
              ELSE 99
            END AS role_priority
          FROM public.user_roles ur
        ),
        role_agg AS (
          SELECT
            rr.user_id,
            array_agg(rr.role_name ORDER BY rr.role_priority, rr.role_name) AS role_names,
            (array_agg(rr.role_name ORDER BY rr.role_priority, rr.role_name))[1] AS primary_app_role,
            bool_or(rr.role_name IN ('system_admin', 'hr_admin')) AS is_admin_account
          FROM role_rank rr
          GROUP BY rr.user_id
        ),
        route_catalog AS (
          SELECT
            route.target_department_key,
            MIN(route.priority) AS min_priority,
            (array_agg(route.event_code ORDER BY route.priority, route.route_key))[1] AS default_event_code,
            jsonb_agg(
              jsonb_build_object(
                'route_key', route.route_key,
                'flow_name', route.flow_name,
                'event_code', route.event_code,
                'endpoint_path', route.endpoint_path,
                'priority', route.priority,
                'is_required', route.is_required
              )
              ORDER BY route.priority, route.route_key
            ) AS available_routes
          FROM public.integration_flow_routes route
          WHERE route.source_department_key = 'hr'
            AND route.is_active = true
          GROUP BY route.target_department_key
        )
        SELECT
          e.id AS employee_id,
          e.user_id,
          e.employee_number,
          e.employee_type::text AS employee_type,
          e.employment_status::text AS employment_status,
          e.hire_date,
          e.department_id,
          d.name AS department_name,
          d.code AS department_code,
          e.position_id,
          p.title AS position_title,
          e.supervisor_id,
          trim(concat_ws(' ', sup_profile.first_name, sup_profile.last_name)) AS supervisor_name,
          profile.first_name,
          profile.last_name,
          trim(concat_ws(' ', profile.first_name, profile.last_name)) AS full_name,
          trim(concat_ws(' ', profile.first_name, profile.last_name)) AS employee_name,
          profile.email,
          profile.phone,
          profile.city,
          COALESCE(role_agg.primary_app_role, 'employee') AS primary_app_role,
          COALESCE(role_agg.role_names, ARRAY[]::text[]) AS role_names,
          (COALESCE(role_agg.is_admin_account, false) OR e.employee_type = 'admin') AS is_admin,
          'ready'::text AS integration_status,
          true AS sync_enabled,
          true AS allow_admin_sync,
          true AS allow_department_sync,
          NULL::text AS external_directory_id,
          CASE
            WHEN COALESCE(role_agg.is_admin_account, false) OR e.employee_type = 'admin' THEN 'hr'
            ELSE NULL::text
          END AS primary_integration_department_key,
          NULL::text AS last_target_department_key,
          NULL::uuid AS last_event_id,
          NULL::timestamptz AS last_dispatched_at,
          NULL::timestamptz AS last_synced_at,
          COALESCE(targets.connected_systems, '[]'::jsonb) AS connected_systems,
          jsonb_array_length(COALESCE(targets.connected_systems, '[]'::jsonb)) AS connected_system_count,
          (
            e.employment_status <> 'terminated'
            AND jsonb_array_length(COALESCE(targets.connected_systems, '[]'::jsonb)) > 0
          ) AS integration_ready,
          '{}'::jsonb AS integration_metadata,
          e.created_at,
          e.updated_at
        FROM public.employees e
        LEFT JOIN public.profiles profile
          ON profile.user_id = e.user_id
        LEFT JOIN public.departments d
          ON d.id = e.department_id
        LEFT JOIN public.positions p
          ON p.id = e.position_id
        LEFT JOIN public.employees supervisor
          ON supervisor.id = e.supervisor_id
        LEFT JOIN public.profiles sup_profile
          ON sup_profile.user_id = supervisor.user_id
        LEFT JOIN role_agg
          ON role_agg.user_id = e.user_id
        LEFT JOIN LATERAL (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'department_key', target.department_key,
                'department_name', target.department_name,
                'system_code', target.system_code,
                'module_directory', target.module_directory,
                'dispatch_rpc_name', target.dispatch_rpc_name,
                'default_action_label', target.default_action_label,
                'is_department_default', false,
                'is_primary', false,
                'relationship_kind', 'connected',
                'supports_employee_sync', true,
                'supports_admin_sync', true,
                'default_event_code', route_catalog.default_event_code,
                'available_routes', route_catalog.available_routes
              )
              ORDER BY route_catalog.min_priority ASC, target.department_name ASC
            ),
            '[]'::jsonb
          ) AS connected_systems
          FROM route_catalog
          JOIN public.integration_departments target
            ON target.department_key = route_catalog.target_department_key
           AND target.is_active = true
        ) targets ON true
      $view$;
    ELSIF to_regclass('public.employees') IS NOT NULL
      AND to_regclass('public.profiles') IS NOT NULL
      AND to_regclass('public.departments') IS NOT NULL
      AND to_regclass('public.positions') IS NOT NULL
      AND to_regclass('public.user_roles') IS NOT NULL THEN
      EXECUTE $view$
        CREATE OR REPLACE VIEW public.employee_directory AS
        WITH role_rank AS (
          SELECT
            ur.user_id,
            ur.role::text AS role_name,
            CASE ur.role
              WHEN 'system_admin' THEN 1
              WHEN 'hr_admin' THEN 2
              WHEN 'employee' THEN 3
              WHEN 'applicant' THEN 4
              ELSE 99
            END AS role_priority
          FROM public.user_roles ur
        ),
        role_agg AS (
          SELECT
            rr.user_id,
            array_agg(rr.role_name ORDER BY rr.role_priority, rr.role_name) AS role_names,
            (array_agg(rr.role_name ORDER BY rr.role_priority, rr.role_name))[1] AS primary_app_role,
            bool_or(rr.role_name IN ('system_admin', 'hr_admin')) AS is_admin_account
          FROM role_rank rr
          GROUP BY rr.user_id
        )
        SELECT
          e.id AS employee_id,
          e.user_id,
          e.employee_number,
          e.employee_type::text AS employee_type,
          e.employment_status::text AS employment_status,
          e.hire_date,
          e.department_id,
          d.name AS department_name,
          d.code AS department_code,
          e.position_id,
          p.title AS position_title,
          e.supervisor_id,
          trim(concat_ws(' ', sup_profile.first_name, sup_profile.last_name)) AS supervisor_name,
          profile.first_name,
          profile.last_name,
          trim(concat_ws(' ', profile.first_name, profile.last_name)) AS full_name,
          trim(concat_ws(' ', profile.first_name, profile.last_name)) AS employee_name,
          profile.email,
          profile.phone,
          profile.city,
          COALESCE(role_agg.primary_app_role, 'employee') AS primary_app_role,
          COALESCE(role_agg.role_names, ARRAY[]::text[]) AS role_names,
          (COALESCE(role_agg.is_admin_account, false) OR e.employee_type = 'admin') AS is_admin,
          'ready'::text AS integration_status,
          true AS sync_enabled,
          true AS allow_admin_sync,
          true AS allow_department_sync,
          NULL::text AS external_directory_id,
          CASE
            WHEN COALESCE(role_agg.is_admin_account, false) OR e.employee_type = 'admin' THEN 'hr'
            ELSE NULL::text
          END AS primary_integration_department_key,
          NULL::text AS last_target_department_key,
          NULL::uuid AS last_event_id,
          NULL::timestamptz AS last_dispatched_at,
          NULL::timestamptz AS last_synced_at,
          '[]'::jsonb AS connected_systems,
          0 AS connected_system_count,
          false AS integration_ready,
          '{}'::jsonb AS integration_metadata,
          e.created_at,
          e.updated_at
        FROM public.employees e
        LEFT JOIN public.profiles profile
          ON profile.user_id = e.user_id
        LEFT JOIN public.departments d
          ON d.id = e.department_id
        LEFT JOIN public.positions p
          ON p.id = e.position_id
        LEFT JOIN public.employees supervisor
          ON supervisor.id = e.supervisor_id
        LEFT JOIN public.profiles sup_profile
          ON sup_profile.user_id = supervisor.user_id
        LEFT JOIN role_agg
          ON role_agg.user_id = e.user_id
      $view$;
    ELSE
      RAISE EXCEPTION 'public.employee_directory is missing, and the base HR tables required to rebuild it are also missing.';
    END IF;

    EXECUTE 'GRANT SELECT ON public.employee_directory TO authenticated, service_role';
  END IF;

  EXECUTE 'CREATE OR REPLACE VIEW hr.employee_directory AS SELECT * FROM public.employee_directory';

  IF to_regclass('public.integration_departments') IS NOT NULL
     AND to_regclass('public.integration_flow_routes') IS NOT NULL THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW hr.connected_departments AS
      SELECT
        dept.department_key,
        dept.department_name,
        dept.system_code,
        dept.module_directory,
        dept.dispatch_rpc_name,
        dept.default_action_label,
        dept.purpose,
        dept.is_active,
        COALESCE(route_summary.route_count, 0) AS route_count,
        COALESCE(route_summary.event_codes, ARRAY[]::text[]) AS event_codes
      FROM public.integration_departments dept
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS route_count,
          array_agg(route.event_code ORDER BY route.priority, route.route_key) AS event_codes
        FROM public.integration_flow_routes route
        WHERE route.source_department_key = 'hr'
          AND route.target_department_key = dept.department_key
          AND route.is_active = true
      ) route_summary ON true
      WHERE dept.is_active = true
    $view$;
  ELSE
    EXECUTE $view$
      CREATE OR REPLACE VIEW hr.connected_departments AS
      SELECT
        NULL::text AS department_key,
        NULL::text AS department_name,
        NULL::text AS system_code,
        NULL::text AS module_directory,
        NULL::text AS dispatch_rpc_name,
        NULL::text AS default_action_label,
        NULL::text AS purpose,
        false AS is_active,
        0::int AS route_count,
        ARRAY[]::text[] AS event_codes
      WHERE false
    $view$;
  END IF;
END
$$;

DO $$
BEGIN
  -- If hr.instructors is a physical table in this environment, keep it and avoid replacing it with a view.
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'hr'
      AND c.relname = 'instructors'
      AND c.relkind = 'r'
  ) THEN
    NULL;
  ELSE
    EXECUTE $view$
      CREATE OR REPLACE VIEW hr.instructors AS
      SELECT
        employee_id AS id,
        employee_id,
        employee_number AS employee_no,
        first_name,
        last_name,
        COALESCE(department_name, 'School Administration') AS department,
        COALESCE(position_title, '') AS specialization,
        CASE
          WHEN COALESCE(position_title, '') ILIKE '%assistant professor%' THEN 'Assistant Professor'
          WHEN COALESCE(position_title, '') ILIKE '%associate professor%' THEN 'Associate Professor'
          WHEN COALESCE(position_title, '') ILIKE '%professor%' THEN 'Professor'
          ELSE 'Instructor'
        END AS academic_rank,
        employment_status,
        primary_app_role,
        is_admin,
        connected_systems,
        integration_ready,
        created_at,
        updated_at
      FROM public.employee_directory
      WHERE employee_type IN ('teacher', 'principal', 'registrar')
         OR COALESCE(position_title, '') ILIKE '%instructor%'
         OR COALESCE(position_title, '') ILIKE '%professor%'
    $view$;
  END IF;
END
$$;

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

GRANT USAGE ON SCHEMA hr TO authenticated, service_role;

GRANT SELECT ON hr.department_integration_mappings TO authenticated, service_role;
GRANT SELECT ON hr.employee_integration_profiles TO authenticated, service_role;
GRANT SELECT ON hr.employee_directory TO authenticated, service_role;
GRANT SELECT ON hr.connected_departments TO authenticated, service_role;
GRANT SELECT ON hr.instructors TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_hr_instructors(TEXT, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_hr_instructor_to_registrar(UUID, TEXT, TEXT, JSONB, JSONB, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_hr_instructor_registrar_history(UUID, INTEGER) TO authenticated, service_role;
