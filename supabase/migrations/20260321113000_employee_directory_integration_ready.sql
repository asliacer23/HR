-- =====================================================
-- Employee Directory + Integration Readiness Layer
-- =====================================================
-- This migration turns the existing employee records into a canonical
-- integration directory for admins, staff, and faculty.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS hr;

-- Some projects expose public.departments and public.employees as compatibility
-- views backed by hr.* tables. Keep these columns flexible instead of using
-- table-only foreign keys so the migration works in both layouts.
CREATE OR REPLACE FUNCTION public.resolve_integration_department_key(_department_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    IF _department_key = 'comlab' THEN
        IF EXISTS (
            SELECT 1
            FROM public.integration_departments
            WHERE department_key = 'comlab'
        ) THEN
            RETURN 'comlab';
        ELSIF EXISTS (
            SELECT 1
            FROM public.integration_departments
            WHERE department_key = 'comlab_it'
        ) THEN
            RETURN 'comlab_it';
        END IF;
    END IF;

    RETURN _department_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.present_integration_department_key(_department_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    IF _department_key = 'comlab_it' THEN
        RETURN 'comlab';
    END IF;

    RETURN _department_key;
END;
$$;

CREATE TABLE IF NOT EXISTS public.department_integration_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL,
    integration_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE CASCADE,
    relationship_kind TEXT NOT NULL DEFAULT 'connected',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    supports_employee_sync BOOLEAN NOT NULL DEFAULT true,
    supports_admin_sync BOOLEAN NOT NULL DEFAULT true,
    default_event_code TEXT NOT NULL DEFAULT 'employee_profile_sync',
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT department_integration_mappings_unique UNIQUE (department_id, integration_department_key),
    CONSTRAINT department_integration_mappings_kind_check CHECK (
        relationship_kind IN ('owner', 'connected', 'clearance', 'oversight', 'shared')
    )
);

CREATE INDEX IF NOT EXISTS idx_department_integration_mappings_department_id
    ON public.department_integration_mappings (department_id);

CREATE INDEX IF NOT EXISTS idx_department_integration_mappings_integration_key
    ON public.department_integration_mappings (integration_department_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_department_integration_mappings_primary
    ON public.department_integration_mappings (department_id)
    WHERE is_primary = true;

DROP TRIGGER IF EXISTS update_department_integration_mappings_updated_at ON public.department_integration_mappings;
CREATE TRIGGER update_department_integration_mappings_updated_at
BEFORE UPDATE ON public.department_integration_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.employee_integration_profiles (
    employee_id UUID PRIMARY KEY,
    primary_integration_department_key TEXT REFERENCES public.integration_departments(department_key) ON DELETE SET NULL,
    integration_status TEXT NOT NULL DEFAULT 'ready',
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    allow_admin_sync BOOLEAN NOT NULL DEFAULT true,
    allow_department_sync BOOLEAN NOT NULL DEFAULT true,
    external_directory_id TEXT,
    last_dispatched_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    last_target_department_key TEXT REFERENCES public.integration_departments(department_key) ON DELETE SET NULL,
    last_event_id UUID REFERENCES public.integration_flow_events(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT employee_integration_profiles_status_check CHECK (
        integration_status IN ('ready', 'pending_sync', 'synced', 'paused', 'error')
    )
);

CREATE INDEX IF NOT EXISTS idx_employee_integration_profiles_primary_department
    ON public.employee_integration_profiles (primary_integration_department_key);

CREATE INDEX IF NOT EXISTS idx_employee_integration_profiles_status
    ON public.employee_integration_profiles (integration_status, sync_enabled);

DROP TRIGGER IF EXISTS update_employee_integration_profiles_updated_at ON public.employee_integration_profiles;
CREATE TRIGGER update_employee_integration_profiles_updated_at
BEFORE UPDATE ON public.employee_integration_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.department_integration_mappings (
    department_id,
    integration_department_key,
    relationship_kind,
    is_primary,
    supports_employee_sync,
    supports_admin_sync,
    default_event_code,
    notes,
    metadata
)
SELECT
    d.id,
    public.resolve_integration_department_key(mapping.integration_department_key),
    mapping.relationship_kind,
    mapping.is_primary,
    mapping.supports_employee_sync,
    mapping.supports_admin_sync,
    mapping.default_event_code,
    mapping.notes,
    mapping.metadata
FROM public.departments d
JOIN (
    VALUES
        ('HR', 'hr', 'owner', true, true, true, 'employee_profile_sync', 'Primary HR ownership for employee master records.', '{"source":"integration_ready_migration"}'::jsonb),
        ('FIN', 'cashier', 'connected', true, true, true, 'employee_profile_sync', 'Finance and payroll records can be synchronized with cashier operations.', '{"source":"integration_ready_migration"}'::jsonb),
        ('IT', 'comlab', 'connected', true, true, true, 'employee_profile_sync', 'IT and COMLAB account provisioning depends on employee records.', '{"source":"integration_ready_migration"}'::jsonb),
        ('REG', 'registrar', 'connected', true, true, true, 'employee_profile_sync', 'Registrar validation can consume employee and faculty directory data.', '{"source":"integration_ready_migration"}'::jsonb),
        ('PMED', 'pmed', 'connected', true, true, true, 'employee_profile_sync', 'PMED receives employee master records for medical workflows.', '{"source":"integration_ready_migration"}'::jsonb),
        ('CLINIC', 'clinic', 'connected', true, true, true, 'employee_profile_sync', 'Clinic receives employee roster and health-related profile handoffs.', '{"source":"integration_ready_migration"}'::jsonb),
        ('GUIDE', 'guidance', 'connected', true, true, true, 'employee_profile_sync', 'Guidance receives employee support and roster context.', '{"source":"integration_ready_migration"}'::jsonb),
        ('GUIDE', 'prefect', 'shared', false, true, true, 'employee_profile_sync', 'Prefect-related conduct workflows can resolve employees from the shared directory.', '{"source":"integration_ready_migration"}'::jsonb)
) AS mapping (
    department_code,
    integration_department_key,
    relationship_kind,
    is_primary,
    supports_employee_sync,
    supports_admin_sync,
    default_event_code,
    notes,
    metadata
)
    ON d.code = mapping.department_code
ON CONFLICT (department_id, integration_department_key) DO UPDATE
SET
    relationship_kind = EXCLUDED.relationship_kind,
    is_primary = EXCLUDED.is_primary,
    supports_employee_sync = EXCLUDED.supports_employee_sync,
    supports_admin_sync = EXCLUDED.supports_admin_sync,
    default_event_code = EXCLUDED.default_event_code,
    notes = EXCLUDED.notes,
    metadata = EXCLUDED.metadata,
    updated_at = now();

INSERT INTO public.integration_flow_routes (
    route_key,
    flow_name,
    source_department_key,
    target_department_key,
    event_code,
    request_method,
    endpoint_path,
    request_contract,
    response_contract,
    priority,
    is_required,
    is_active,
    notes,
    metadata
)
VALUES
    (
        'hr_to_cashier_employee_profile_sync',
        'HR Employee Profile Sync to Cashier',
        'hr',
        'cashier',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_cashier',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Synchronizes employee or admin master data to Cashier for payroll and accountability alignment.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_clinic_employee_profile_sync',
        'HR Employee Profile Sync to Clinic',
        'hr',
        'clinic',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_clinic',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Keeps the clinic-side directory aligned with the HR employee roster.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_clinic_pre_employment_clearance_request',
        'HR Pre-Employment Clearance Request to Clinic',
        'hr',
        'clinic',
        'pre_employment_clearance_request',
        'POST',
        '/rest/v1/rpc/dispatch_to_clinic',
        '{"required":["employee_id","employee_name","position","department"],"optional":["start_date","previous_medical_history","request_date","requested_by","notes"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        25,
        true,
        true,
        'Routes pre-employment or clinic-side health clearance requests for new hires.',
        '{"module":"onboarding","category":"clinic_clearance"}'::jsonb
    ),
    (
        'hr_to_comlab_employee_profile_sync',
        'HR Employee Profile Sync to Computer Laboratory / IT',
        'hr',
        public.resolve_integration_department_key('comlab'),
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_comlab',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Synchronizes employee and admin profile data for account provisioning and device access.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_crad_employee_profile_sync',
        'HR Employee Profile Sync to CRAD',
        'hr',
        'crad',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_crad',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        40,
        false,
        true,
        'Makes employee master data available to CRAD-related records workflows.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_guidance_employee_profile_sync',
        'HR Employee Profile Sync to Guidance',
        'hr',
        'guidance',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_guidance',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        30,
        false,
        true,
        'Provides employee roster context for guidance and employee support workflows.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_pmed_employee_profile_sync',
        'HR Employee Profile Sync to PMED',
        'hr',
        'pmed',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_pmed',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Synchronizes employee records to PMED for pre-employment and monitoring workflows.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_prefect_employee_profile_sync',
        'HR Employee Profile Sync to Prefect',
        'hr',
        'prefect',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_prefect',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        35,
        false,
        true,
        'Provides employee profile data to prefect workflows when conduct cases are opened.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_registrar_employee_profile_sync',
        'HR Employee Profile Sync to Registrar',
        'hr',
        'registrar',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_registrar',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        20,
        false,
        true,
        'Keeps faculty and employee profile details aligned with registrar-facing systems.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    )
ON CONFLICT (route_key) DO UPDATE
SET
    flow_name = EXCLUDED.flow_name,
    source_department_key = EXCLUDED.source_department_key,
    target_department_key = EXCLUDED.target_department_key,
    event_code = EXCLUDED.event_code,
    request_method = EXCLUDED.request_method,
    endpoint_path = EXCLUDED.endpoint_path,
    request_contract = EXCLUDED.request_contract,
    response_contract = EXCLUDED.response_contract,
    priority = EXCLUDED.priority,
    is_required = EXCLUDED.is_required,
    is_active = EXCLUDED.is_active,
    notes = EXCLUDED.notes,
    metadata = EXCLUDED.metadata,
    updated_at = now();

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["payroll_submission","clearance_hold","accountability_settlement","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'cashier';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["health_clearance","return_to_work_advice","employee_profile_sync","pre_employment_clearance_request"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'clinic';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["account_provision","asset_clearance","access_revoke","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = public.resolve_integration_department_key('comlab');

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["case_record_sync","compliance_case_endorsement","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'crad';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["counseling_referral","employee_case_referral","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'guidance';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["medical_endorsement","fit_to_work","annual_medical_review","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'pmed';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["conduct_clearance","incident_verification","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'prefect';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["faculty_assignment_validation","exit_clearance_validation","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'registrar';

WITH primary_targets AS (
    SELECT DISTINCT ON (dim.department_id)
        dim.department_id,
        dim.integration_department_key
    FROM public.department_integration_mappings dim
    WHERE dim.is_primary = true
    ORDER BY dim.department_id, dim.created_at
)
INSERT INTO public.employee_integration_profiles (
    employee_id,
    primary_integration_department_key,
    integration_status,
    sync_enabled,
    allow_admin_sync,
    allow_department_sync,
    metadata
)
SELECT
    e.id,
    COALESCE(
        pt.integration_department_key,
        CASE
            WHEN e.employee_type = 'admin' THEN 'hr'
            ELSE NULL
        END
    ),
    'ready',
    true,
    true,
    true,
    jsonb_build_object(
        'seeded_from', 'employees',
        'department_id', e.department_id
    )
FROM public.employees e
LEFT JOIN primary_targets pt
    ON pt.department_id = e.department_id
ON CONFLICT (employee_id) DO NOTHING;

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
    COALESCE(eip.integration_status, 'ready') AS integration_status,
    COALESCE(eip.sync_enabled, true) AS sync_enabled,
    COALESCE(eip.allow_admin_sync, true) AS allow_admin_sync,
    COALESCE(eip.allow_department_sync, true) AS allow_department_sync,
    eip.external_directory_id,
    public.present_integration_department_key(
        COALESCE(
            eip.primary_integration_department_key,
            (
                SELECT dim.integration_department_key
                FROM public.department_integration_mappings dim
                WHERE dim.department_id = e.department_id
                  AND dim.is_primary = true
                ORDER BY dim.created_at
                LIMIT 1
            ),
            CASE
                WHEN COALESCE(role_agg.is_admin_account, false) OR e.employee_type = 'admin' THEN 'hr'
                ELSE NULL
            END
        )
    ) AS primary_integration_department_key,
    public.present_integration_department_key(eip.last_target_department_key) AS last_target_department_key,
    eip.last_event_id,
    eip.last_dispatched_at,
    eip.last_synced_at,
    COALESCE(targets.connected_systems, '[]'::jsonb) AS connected_systems,
    jsonb_array_length(COALESCE(targets.connected_systems, '[]'::jsonb)) AS connected_system_count,
    (
        COALESCE(eip.sync_enabled, true)
        AND e.employment_status <> 'terminated'
        AND jsonb_array_length(COALESCE(targets.connected_systems, '[]'::jsonb)) > 0
    ) AS integration_ready,
    COALESCE(eip.metadata, '{}'::jsonb) AS integration_metadata,
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
LEFT JOIN public.employee_integration_profiles eip
    ON eip.employee_id = e.id
LEFT JOIN LATERAL (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_strip_nulls(
                jsonb_build_object(
                    'department_key', public.present_integration_department_key(target.department_key),
                    'department_name', target.department_name,
                    'system_code', target.system_code,
                    'module_directory', target.module_directory,
                    'dispatch_rpc_name', target.dispatch_rpc_name,
                    'default_action_label', target.default_action_label,
                    'is_department_default', (dim.department_id IS NOT NULL),
                    'is_primary', COALESCE(dim.is_primary, false),
                    'relationship_kind', dim.relationship_kind,
                    'supports_employee_sync', COALESCE(dim.supports_employee_sync, true),
                    'supports_admin_sync', COALESCE(dim.supports_admin_sync, true),
                    'default_event_code', COALESCE(dim.default_event_code, route_catalog.default_event_code),
                    'available_routes', route_catalog.available_routes
                )
            )
            ORDER BY COALESCE(dim.is_primary, false) DESC, route_catalog.min_priority ASC, target.department_name ASC
        ),
        '[]'::jsonb
    ) AS connected_systems
    FROM route_catalog
    JOIN public.integration_departments target
        ON target.department_key = route_catalog.target_department_key
       AND target.is_active = true
    LEFT JOIN public.department_integration_mappings dim
        ON dim.department_id = e.department_id
       AND dim.integration_department_key = target.department_key
) targets ON true;

CREATE OR REPLACE FUNCTION public.get_integration_ready_employees(
    _target_department_key TEXT DEFAULT NULL,
    _include_inactive BOOLEAN DEFAULT false,
    _only_admins BOOLEAN DEFAULT false
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
        jsonb_agg(to_jsonb(directory) ORDER BY directory.is_admin DESC, directory.last_name, directory.first_name, directory.employee_number),
        '[]'::jsonb
    )
    INTO payload
    FROM public.employee_directory directory
    WHERE directory.integration_ready = true
      AND (
        _include_inactive = true
        OR directory.employment_status IN ('active', 'probation', 'on_leave')
      )
      AND (
        _only_admins = false
        OR directory.is_admin = true
      )
      AND (
        _target_department_key IS NULL
        OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(directory.connected_systems) AS target
            WHERE target->>'department_key' = _target_department_key
              AND (
                CASE
                    WHEN directory.is_admin
                        THEN COALESCE((target->>'supports_admin_sync')::boolean, true)
                    ELSE COALESCE((target->>'supports_employee_sync')::boolean, true)
                END
              )
        )
      );

    RETURN payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.build_employee_integration_payload(
    _employee_id UUID,
    _target_department_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    employee_record RECORD;
    target_config JSONB;
    resolved_target_department_key TEXT;
BEGIN
    SELECT *
    INTO employee_record
    FROM public.employee_directory
    WHERE employee_id = _employee_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    resolved_target_department_key := public.resolve_integration_department_key(_target_department_key);

    IF _target_department_key IS NOT NULL THEN
        SELECT target
        INTO target_config
        FROM jsonb_array_elements(COALESCE(employee_record.connected_systems, '[]'::jsonb)) AS target
        WHERE target->>'department_key' = _target_department_key
        LIMIT 1;
    END IF;

    RETURN jsonb_strip_nulls(
        jsonb_build_object(
            'employee_id', employee_record.employee_id,
            'user_id', employee_record.user_id,
            'employee_number', employee_record.employee_number,
            'first_name', employee_record.first_name,
            'last_name', employee_record.last_name,
            'employee_name', employee_record.employee_name,
            'full_name', employee_record.full_name,
            'email', employee_record.email,
            'phone', employee_record.phone,
            'city', employee_record.city,
            'employee_type', employee_record.employee_type,
            'employment_status', employee_record.employment_status,
            'hire_date', employee_record.hire_date,
            'department_id', employee_record.department_id,
            'department_name', employee_record.department_name,
            'department_code', employee_record.department_code,
            'position_id', employee_record.position_id,
            'position_title', employee_record.position_title,
            'primary_app_role', employee_record.primary_app_role,
            'role_names', to_jsonb(employee_record.role_names),
            'is_admin', employee_record.is_admin,
            'supervisor_id', employee_record.supervisor_id,
            'supervisor_name', employee_record.supervisor_name,
            'primary_integration_department_key', employee_record.primary_integration_department_key,
            'integration_status', employee_record.integration_status,
            'external_directory_id', employee_record.external_directory_id,
            'integration_ready', employee_record.integration_ready,
            'target_department_key', public.present_integration_department_key(resolved_target_department_key),
            'target_department', COALESCE(target_config, '{}'::jsonb),
            'connected_systems', employee_record.connected_systems,
            'integration_metadata', employee_record.integration_metadata
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_employee_profile_to_department(
    _employee_id UUID,
    _target_department_key TEXT,
    _event_code TEXT DEFAULT 'employee_profile_sync',
    _requested_by UUID DEFAULT NULL,
    _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    employee_record RECORD;
    target_config JSONB;
    payload JSONB;
    result JSONB;
    resolved_event_code TEXT;
    resolved_target_department_key TEXT;
BEGIN
    SELECT *
    INTO employee_record
    FROM public.employee_directory
    WHERE employee_id = _employee_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'not_found',
            'message', 'Employee was not found in the integration directory.'
        );
    END IF;

    IF COALESCE(employee_record.integration_ready, false) = false THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'not_ready',
            'message', 'Employee is not currently marked as integration ready.'
        );
    END IF;

    resolved_target_department_key := public.resolve_integration_department_key(_target_department_key);

    SELECT target
    INTO target_config
    FROM jsonb_array_elements(COALESCE(employee_record.connected_systems, '[]'::jsonb)) AS target
    WHERE target->>'department_key' = _target_department_key
    LIMIT 1;

    IF target_config IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'target_not_configured',
            'message', format(
                'Target department %s is not configured for HR employee integration.',
                COALESCE(_target_department_key, 'unknown')
            )
        );
    END IF;

    IF COALESCE(employee_record.is_admin, false)
       AND COALESCE((target_config->>'supports_admin_sync')::boolean, true) = false THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'admin_sync_not_allowed',
            'message', 'This connected department is not enabled for admin sync.'
        );
    END IF;

    IF COALESCE(employee_record.is_admin, false) = false
       AND COALESCE((target_config->>'supports_employee_sync')::boolean, true) = false THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'employee_sync_not_allowed',
            'message', 'This connected department is not enabled for employee sync.'
        );
    END IF;

    resolved_event_code := COALESCE(NULLIF(_event_code, ''), 'employee_profile_sync');
    payload := public.build_employee_integration_payload(_employee_id, _target_department_key);

    IF payload IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'payload_not_available',
            'message', 'Employee integration payload could not be built.'
        );
    END IF;

    payload := payload || jsonb_build_object(
        'dispatch_metadata', COALESCE(_metadata, '{}'::jsonb)
    );

    result := public.dispatch_department_flow(
        'hr',
        resolved_target_department_key,
        resolved_event_code,
        _employee_id::text,
        payload,
        _requested_by
    );

    IF COALESCE(result->>'ok', 'false') = 'true' THEN
        INSERT INTO public.employee_integration_profiles (
            employee_id,
            primary_integration_department_key,
            integration_status,
            sync_enabled,
            allow_admin_sync,
            allow_department_sync,
            last_target_department_key,
            last_event_id,
            last_dispatched_at,
            metadata
        )
        VALUES (
            _employee_id,
            COALESCE(employee_record.primary_integration_department_key, 'hr'),
            'pending_sync',
            true,
            true,
            true,
            resolved_target_department_key,
            NULLIF(result->>'event_id', '')::uuid,
            now(),
            jsonb_build_object(
                'last_dispatched_event_code', resolved_event_code,
                'last_dispatch_metadata', COALESCE(_metadata, '{}'::jsonb)
            )
        )
        ON CONFLICT (employee_id) DO UPDATE
        SET
            primary_integration_department_key = COALESCE(
                public.employee_integration_profiles.primary_integration_department_key,
                EXCLUDED.primary_integration_department_key
            ),
            integration_status = 'pending_sync',
            last_target_department_key = EXCLUDED.last_target_department_key,
            last_event_id = EXCLUDED.last_event_id,
            last_dispatched_at = EXCLUDED.last_dispatched_at,
            metadata = COALESCE(public.employee_integration_profiles.metadata, '{}'::jsonb) || jsonb_build_object(
                'last_dispatched_event_code', resolved_event_code,
                'last_dispatch_metadata', COALESCE(_metadata, '{}'::jsonb)
            ),
            updated_at = now();
    END IF;

    RETURN result;
END;
$$;

CREATE OR REPLACE VIEW hr.department_integration_mappings AS
SELECT *
FROM public.department_integration_mappings;

CREATE OR REPLACE VIEW hr.employee_integration_profiles AS
SELECT *
FROM public.employee_integration_profiles;

CREATE OR REPLACE VIEW hr.employee_directory AS
SELECT *
FROM public.employee_directory;

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
   OR COALESCE(position_title, '') ILIKE '%professor%';

GRANT USAGE ON SCHEMA hr TO authenticated, service_role;

GRANT SELECT ON public.department_integration_mappings TO authenticated, service_role;
GRANT SELECT ON public.employee_integration_profiles TO authenticated, service_role;
GRANT SELECT ON public.employee_directory TO authenticated, service_role;

GRANT SELECT ON hr.department_integration_mappings TO authenticated, service_role;
GRANT SELECT ON hr.employee_integration_profiles TO authenticated, service_role;
GRANT SELECT ON hr.employee_directory TO authenticated, service_role;
GRANT SELECT ON hr.instructors TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_integration_ready_employees(TEXT, BOOLEAN, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.build_employee_integration_payload(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_employee_profile_to_department(UUID, TEXT, TEXT, UUID, JSONB) TO authenticated, service_role;
