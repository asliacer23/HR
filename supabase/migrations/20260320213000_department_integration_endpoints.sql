-- =====================================================
-- Department Integration Registry + Dataflow RPC Endpoints
-- =====================================================
-- This migration prepares the HR system for cross-application department
-- routing using Supabase/PostgREST RPC endpoints.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.integration_departments (
    department_key TEXT PRIMARY KEY,
    department_name TEXT NOT NULL,
    system_code TEXT NOT NULL UNIQUE,
    module_directory TEXT NOT NULL,
    owning_schema TEXT NOT NULL DEFAULT 'public',
    dispatch_rpc_name TEXT NOT NULL,
    status_rpc_name TEXT NOT NULL DEFAULT 'get_department_flow_status',
    ack_rpc_name TEXT NOT NULL DEFAULT 'acknowledge_department_flow',
    purpose TEXT NOT NULL,
    default_action_label TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_flow_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_key TEXT NOT NULL UNIQUE,
    flow_name TEXT NOT NULL,
    source_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    target_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    event_code TEXT NOT NULL,
    request_method TEXT NOT NULL DEFAULT 'POST',
    endpoint_path TEXT NOT NULL,
    request_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority INTEGER NOT NULL DEFAULT 100,
    is_required BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT integration_flow_routes_source_target_event_key UNIQUE (
        source_department_key,
        target_department_key,
        event_code
    )
);

CREATE TABLE IF NOT EXISTS public.integration_flow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id TEXT NOT NULL UNIQUE,
    route_key TEXT NOT NULL REFERENCES public.integration_flow_routes(route_key) ON DELETE RESTRICT,
    source_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    target_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    source_record_id TEXT,
    event_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    dispatch_endpoint TEXT NOT NULL,
    initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    last_error TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_flow_routes_source_target
    ON public.integration_flow_routes (source_department_key, target_department_key, priority, is_active);

CREATE INDEX IF NOT EXISTS idx_integration_flow_events_target_status
    ON public.integration_flow_events (target_department_key, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_flow_events_source_status
    ON public.integration_flow_events (source_department_key, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_flow_events_route_key
    ON public.integration_flow_events (route_key, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_integration_departments_updated_at ON public.integration_departments;
CREATE TRIGGER update_integration_departments_updated_at
BEFORE UPDATE ON public.integration_departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_flow_routes_updated_at ON public.integration_flow_routes;
CREATE TRIGGER update_integration_flow_routes_updated_at
BEFORE UPDATE ON public.integration_flow_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_flow_events_updated_at ON public.integration_flow_events;
CREATE TRIGGER update_integration_flow_events_updated_at
BEFORE UPDATE ON public.integration_flow_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.integration_departments (
    department_key,
    department_name,
    system_code,
    module_directory,
    owning_schema,
    dispatch_rpc_name,
    status_rpc_name,
    ack_rpc_name,
    purpose,
    default_action_label,
    is_active,
    metadata
)
VALUES
    (
        'hr',
        'HR Department',
        'HR',
        'HR',
        'public',
        'dispatch_department_flow',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Employee records, onboarding, payroll coordination, performance, renewal and clearance orchestration.',
        'Dispatch from HR',
        true,
        '{"type":"source_system","module":"HR","supports":["records","onboarding","payroll","clearance","evaluation"]}'::jsonb
    ),
    (
        'cashier',
        'Cashier',
        'CASHIER',
        'cashier-system',
        'public',
        'dispatch_to_cashier',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Payroll endorsement, collection blocking, accountability hold and final financial clearance.',
        'Send to Cashier',
        true,
        '{"type":"connected_department","module":"cashier-system","supports":["payroll_submission","clearance_hold","accountability_settlement"]}'::jsonb
    ),
    (
        'clinic',
        'Clinic',
        'CLINIC',
        'clinicsystem',
        'clinic',
        'dispatch_to_clinic',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Return-to-work advice, health advisory routing and school clinic coordination.',
        'Send to Clinic',
        true,
        '{"type":"connected_department","module":"clinicsystem","supports":["health_clearance","return_to_work_advice"]}'::jsonb
    ),
    (
        'comlab_it',
        'Computer Laboratory / IT',
        'COMLAB',
        'Computer-Laboratory',
        'public',
        'dispatch_to_comlab',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Account provisioning, ID/device release and laboratory clearance.',
        'Send to Computer Lab / IT',
        true,
        '{"type":"connected_department","module":"Computer-Laboratory","supports":["account_provision","asset_clearance","access_revoke"]}'::jsonb
    ),
    (
        'crad',
        'CRAD Management',
        'CRAD',
        'CRADManagement',
        'public',
        'dispatch_to_crad',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Case routing, research/records coordination and compliance documentation support.',
        'Send to CRAD',
        true,
        '{"type":"connected_department","module":"CRADManagement","supports":["case_record_sync","compliance_case_endorsement"]}'::jsonb
    ),
    (
        'guidance',
        'Guidance System',
        'GUIDANCE',
        'guidance-system',
        'public',
        'dispatch_to_guidance',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Counseling referral, employee support and behavioral case coordination.',
        'Send to Guidance',
        true,
        '{"type":"connected_department","module":"guidance-system","supports":["counseling_referral","employee_case_referral"]}'::jsonb
    ),
    (
        'pmed',
        'PMED',
        'PMED',
        'PMED',
        'public',
        'dispatch_to_pmed',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Pre-employment medical, fit-to-work and annual medical endorsement.',
        'Send to PMED',
        true,
        '{"type":"connected_department","module":"PMED","supports":["medical_endorsement","fit_to_work","annual_medical_review"]}'::jsonb
    ),
    (
        'prefect',
        'Prefect Management',
        'PREFECT',
        'PrefectManagementsSystem',
        'public',
        'dispatch_to_prefect',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Conduct verification, incident endorsement and exit clearance assistance.',
        'Send to Prefect',
        true,
        '{"type":"connected_department","module":"PrefectManagementsSystem","supports":["conduct_clearance","incident_verification"]}'::jsonb
    ),
    (
        'registrar',
        'Registrar',
        'REGISTRAR',
        'Registrar',
        'public',
        'dispatch_to_registrar',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Faculty assignment validation, teaching load confirmation and exit clearance.',
        'Send to Registrar',
        true,
        '{"type":"connected_department","module":"Registrar","supports":["faculty_assignment_validation","exit_clearance_validation"]}'::jsonb
    )
ON CONFLICT (department_key) DO UPDATE
SET
    department_name = EXCLUDED.department_name,
    system_code = EXCLUDED.system_code,
    module_directory = EXCLUDED.module_directory,
    owning_schema = EXCLUDED.owning_schema,
    dispatch_rpc_name = EXCLUDED.dispatch_rpc_name,
    status_rpc_name = EXCLUDED.status_rpc_name,
    ack_rpc_name = EXCLUDED.ack_rpc_name,
    purpose = EXCLUDED.purpose,
    default_action_label = EXCLUDED.default_action_label,
    is_active = EXCLUDED.is_active,
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
        'hr_to_cashier_payroll_submission',
        'HR Payroll Submission to Cashier',
        'hr',
        'cashier',
        'payroll_submission',
        'POST',
        '/rest/v1/rpc/dispatch_to_cashier',
        '{"required":["batch_label","pay_period","employee_count","net_amount"],"optional":["variance_notes","attachments","requested_by_name"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Used when HR submits a payroll coordination batch to Cashier.',
        '{"module":"payroll","category":"financial_endorsement"}'::jsonb
    ),
    (
        'hr_to_cashier_clearance_hold',
        'HR Clearance Hold to Cashier',
        'hr',
        'cashier',
        'clearance_hold',
        'POST',
        '/rest/v1/rpc/dispatch_to_cashier',
        '{"required":["employee_id","employee_name","clearance_reason"],"optional":["accountability_items","effective_date"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        20,
        true,
        true,
        'Used when HR starts a clearance case that requires financial clearance.',
        '{"module":"clearance","category":"financial_hold"}'::jsonb
    ),
    (
        'hr_to_registrar_faculty_assignment',
        'HR Faculty Assignment Validation',
        'hr',
        'registrar',
        'faculty_assignment_validation',
        'POST',
        '/rest/v1/rpc/dispatch_to_registrar',
        '{"required":["employee_id","employee_name","college_unit","semester"],"optional":["teaching_load","schedule_matrix","remarks"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Validates faculty assignment and registrar alignment.',
        '{"module":"faculty_assignment","category":"academic_load"}'::jsonb
    ),
    (
        'hr_to_registrar_exit_clearance',
        'HR Exit Clearance Validation',
        'hr',
        'registrar',
        'exit_clearance_validation',
        'POST',
        '/rest/v1/rpc/dispatch_to_registrar',
        '{"required":["employee_id","employee_name","effective_date"],"optional":["accountabilities","clearance_batch"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        30,
        true,
        true,
        'Used during resignation or transfer clearance.',
        '{"module":"clearance","category":"academic_records"}'::jsonb
    ),
    (
        'hr_to_comlab_account_provision',
        'HR Account Provisioning to Computer Laboratory / IT',
        'hr',
        'comlab_it',
        'account_provision',
        'POST',
        '/rest/v1/rpc/dispatch_to_comlab',
        '{"required":["employee_id","employee_name","position_title"],"optional":["requested_access","department_code","start_date"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Starts account and equipment provisioning for new hires.',
        '{"module":"onboarding","category":"access_provisioning"}'::jsonb
    ),
    (
        'hr_to_comlab_asset_clearance',
        'HR Asset Clearance to Computer Laboratory / IT',
        'hr',
        'comlab_it',
        'asset_clearance',
        'POST',
        '/rest/v1/rpc/dispatch_to_comlab',
        '{"required":["employee_id","employee_name","clearance_reason"],"optional":["device_list","account_list"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        20,
        true,
        true,
        'Collects IT accountability during exit clearance.',
        '{"module":"clearance","category":"asset_return"}'::jsonb
    ),
    (
        'hr_to_pmed_medical_endorsement',
        'HR Medical Endorsement to PMED',
        'hr',
        'pmed',
        'medical_endorsement',
        'POST',
        '/rest/v1/rpc/dispatch_to_pmed',
        '{"required":["employee_id","employee_name","employment_stage"],"optional":["medical_notes","requested_schedule"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Routes pre-employment medical requirements to PMED.',
        '{"module":"onboarding","category":"medical"}'::jsonb
    ),
    (
        'hr_to_clinic_health_clearance',
        'HR Health Clearance to Clinic',
        'hr',
        'clinic',
        'health_clearance',
        'POST',
        '/rest/v1/rpc/dispatch_to_clinic',
        '{"required":["employee_id","employee_name","clearance_reason"],"optional":["clinic_notes","return_to_work_date"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Routes employee health-related endorsements to the school clinic.',
        '{"module":"clearance","category":"health"}'::jsonb
    ),
    (
        'hr_to_guidance_counseling_referral',
        'HR Counseling Referral to Guidance',
        'hr',
        'guidance',
        'counseling_referral',
        'POST',
        '/rest/v1/rpc/dispatch_to_guidance',
        '{"required":["employee_id","employee_name","referral_reason"],"optional":["case_notes","priority_level"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Routes employee support or counseling requests.',
        '{"module":"employee_relations","category":"guidance"}'::jsonb
    ),
    (
        'hr_to_prefect_conduct_clearance',
        'HR Conduct Clearance to Prefect',
        'hr',
        'prefect',
        'conduct_clearance',
        'POST',
        '/rest/v1/rpc/dispatch_to_prefect',
        '{"required":["employee_id","employee_name","clearance_reason"],"optional":["incident_notes","report_reference"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Requests conduct validation during employee case review or clearance.',
        '{"module":"employee_relations","category":"conduct"}'::jsonb
    ),
    (
        'hr_to_crad_case_record_sync',
        'HR Case Record Sync to CRAD',
        'hr',
        'crad',
        'case_record_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_crad',
        '{"required":["employee_id","employee_name","record_type"],"optional":["case_notes","reference_no","attachments"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        25,
        false,
        true,
        'Keeps CRAD case or compliance records in sync with HR decisions.',
        '{"module":"records","category":"case_sync"}'::jsonb
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

CREATE OR REPLACE FUNCTION public.get_department_integration_registry(
    _source_department_key TEXT DEFAULT 'hr'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'department_key', registry.department_key,
                'department_name', registry.department_name,
                'system_code', registry.system_code,
                'module_directory', registry.module_directory,
                'purpose', registry.purpose,
                'default_action_label', registry.default_action_label,
                'dispatch_rpc_name', registry.dispatch_rpc_name,
                'status_rpc_name', registry.status_rpc_name,
                'ack_rpc_name', registry.ack_rpc_name,
                'dispatch_endpoint', '/rest/v1/rpc/' || registry.dispatch_rpc_name,
                'pending_count', registry.pending_count,
                'in_progress_count', registry.in_progress_count,
                'failed_count', registry.failed_count,
                'completed_count', registry.completed_count,
                'route_count', registry.route_count,
                'latest_status', registry.latest_status,
                'latest_event_code', registry.latest_event_code,
                'latest_correlation_id', registry.latest_correlation_id,
                'latest_created_at', registry.latest_created_at,
                'routes', registry.routes
            )
            ORDER BY registry.department_name
        ),
        '[]'::jsonb
    )
    INTO result
    FROM (
        SELECT
            target.department_key,
            target.department_name,
            target.system_code,
            target.module_directory,
            target.purpose,
            target.default_action_label,
            target.dispatch_rpc_name,
            target.status_rpc_name,
            target.ack_rpc_name,
            COUNT(DISTINCT route.id)::INT AS route_count,
            COUNT(event.id) FILTER (WHERE event.status IN ('queued', 'pending'))::INT AS pending_count,
            COUNT(event.id) FILTER (WHERE event.status IN ('dispatched', 'in_progress', 'awaiting_acknowledgement'))::INT AS in_progress_count,
            COUNT(event.id) FILTER (WHERE event.status IN ('failed', 'blocked'))::INT AS failed_count,
            COUNT(event.id) FILTER (WHERE event.status IN ('acknowledged', 'completed'))::INT AS completed_count,
            latest_event.status AS latest_status,
            latest_event.event_code AS latest_event_code,
            latest_event.correlation_id AS latest_correlation_id,
            latest_event.created_at AS latest_created_at,
            COALESCE(
                jsonb_agg(
                DISTINCT jsonb_build_object(
                    'route_key', route.route_key,
                    'flow_name', route.flow_name,
                    'event_code', route.event_code,
                    'endpoint_path', route.endpoint_path,
                    'priority', route.priority,
                    'is_required', route.is_required
                )
            ) FILTER (WHERE route.route_key IS NOT NULL),
            '[]'::jsonb
            ) AS routes
        FROM public.integration_departments target
        JOIN public.integration_flow_routes route
          ON target.department_key = route.target_department_key
         AND route.is_active = true
        LEFT JOIN public.integration_flow_events event
          ON event.route_key = route.route_key
        LEFT JOIN LATERAL (
            SELECT e.status, e.event_code, e.correlation_id, e.created_at
            FROM public.integration_flow_events e
            WHERE e.target_department_key = target.department_key
              AND (_source_department_key IS NULL OR e.source_department_key = _source_department_key)
            ORDER BY e.created_at DESC
            LIMIT 1
        ) latest_event ON true
        WHERE target.is_active = true
          AND (_source_department_key IS NULL OR route.source_department_key = _source_department_key)
        GROUP BY
            target.department_key,
            target.department_name,
            target.system_code,
            target.module_directory,
            target.purpose,
            target.default_action_label,
            target.dispatch_rpc_name,
            target.status_rpc_name,
            target.ack_rpc_name,
            latest_event.status,
            latest_event.event_code,
            latest_event.correlation_id,
            latest_event.created_at
    ) registry;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_department_flow(
    _source_department_key TEXT,
    _target_department_key TEXT,
    _event_code TEXT DEFAULT NULL,
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    selected_route RECORD;
    new_event public.integration_flow_events%ROWTYPE;
    resolved_event_code TEXT;
    correlation TEXT;
BEGIN
    SELECT
        route.route_key,
        route.event_code,
        route.endpoint_path
    INTO selected_route
    FROM public.integration_flow_routes route
    WHERE route.source_department_key = _source_department_key
      AND route.target_department_key = _target_department_key
      AND route.is_active = true
      AND (_event_code IS NULL OR route.event_code = _event_code)
    ORDER BY route.priority ASC
    LIMIT 1;

    IF selected_route.route_key IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'message', format(
                'No active integration route from %s to %s for event %s.',
                COALESCE(_source_department_key, 'unknown'),
                COALESCE(_target_department_key, 'unknown'),
                COALESCE(_event_code, 'default')
            ),
            'status', 'route_not_configured'
        );
    END IF;

    resolved_event_code := COALESCE(_event_code, selected_route.event_code);
    correlation := lower(
        concat(
            _source_department_key,
            '-',
            _target_department_key,
            '-',
            to_char(now(), 'YYYYMMDDHH24MISSMS'),
            '-',
            substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)
        )
    );

    INSERT INTO public.integration_flow_events (
        correlation_id,
        route_key,
        source_department_key,
        target_department_key,
        source_record_id,
        event_code,
        status,
        request_payload,
        response_payload,
        dispatch_endpoint,
        initiated_by,
        dispatched_at,
        metadata
    )
    VALUES (
        correlation,
        selected_route.route_key,
        _source_department_key,
        _target_department_key,
        _source_record_id,
        resolved_event_code,
        'queued',
        COALESCE(_payload, '{}'::jsonb),
        '{}'::jsonb,
        selected_route.endpoint_path,
        COALESCE(_requested_by, auth.uid()),
        now(),
        jsonb_build_object(
            'source_department_key', _source_department_key,
            'target_department_key', _target_department_key,
            'queued_from', 'hr_system'
        )
    )
    RETURNING * INTO new_event;

    RETURN jsonb_build_object(
        'ok', true,
        'event_id', new_event.id,
        'correlation_id', new_event.correlation_id,
        'route_key', new_event.route_key,
        'source_department_key', new_event.source_department_key,
        'target_department_key', new_event.target_department_key,
        'event_code', new_event.event_code,
        'status', new_event.status,
        'dispatch_endpoint', new_event.dispatch_endpoint,
        'message', 'Department flow queued successfully.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_department_flow_status(
    _event_id UUID DEFAULT NULL,
    _correlation_id TEXT DEFAULT NULL
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
    SELECT jsonb_build_object(
        'ok', true,
        'event_id', event.id,
        'correlation_id', event.correlation_id,
        'route_key', event.route_key,
        'flow_name', route.flow_name,
        'source_department_key', event.source_department_key,
        'target_department_key', event.target_department_key,
        'event_code', event.event_code,
        'status', event.status,
        'dispatch_endpoint', event.dispatch_endpoint,
        'source_record_id', event.source_record_id,
        'request_payload', event.request_payload,
        'response_payload', event.response_payload,
        'initiated_by', event.initiated_by,
        'dispatched_at', event.dispatched_at,
        'acknowledged_at', event.acknowledged_at,
        'last_error', event.last_error,
        'created_at', event.created_at,
        'updated_at', event.updated_at
    )
    INTO payload
    FROM public.integration_flow_events event
    JOIN public.integration_flow_routes route
      ON route.route_key = event.route_key
    WHERE (_event_id IS NOT NULL AND event.id = _event_id)
       OR (_correlation_id IS NOT NULL AND event.correlation_id = _correlation_id)
    ORDER BY event.created_at DESC
    LIMIT 1;

    IF payload IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'message', 'Integration event was not found.',
            'status', 'not_found'
        );
    END IF;

    RETURN payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_department_flow(
    _event_id UUID,
    _status TEXT DEFAULT 'acknowledged',
    _response JSONB DEFAULT '{}'::jsonb,
    _error TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_event public.integration_flow_events%ROWTYPE;
BEGIN
    UPDATE public.integration_flow_events
    SET
        status = COALESCE(NULLIF(_status, ''), 'acknowledged'),
        response_payload = COALESCE(_response, '{}'::jsonb),
        last_error = _error,
        acknowledged_at = now(),
        updated_at = now()
    WHERE id = _event_id
    RETURNING * INTO updated_event;

    IF updated_event.id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'message', 'Integration event was not found.',
            'status', 'not_found'
        );
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'event_id', updated_event.id,
        'correlation_id', updated_event.correlation_id,
        'status', updated_event.status,
        'acknowledged_at', updated_event.acknowledged_at,
        'last_error', updated_event.last_error,
        'message', 'Department flow updated successfully.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_cashier(
    _event_code TEXT DEFAULT 'payroll_submission',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'cashier', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_clinic(
    _event_code TEXT DEFAULT 'health_clearance',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'clinic', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_comlab(
    _event_code TEXT DEFAULT 'account_provision',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'comlab_it', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_crad(
    _event_code TEXT DEFAULT 'case_record_sync',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'crad', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_guidance(
    _event_code TEXT DEFAULT 'counseling_referral',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'guidance', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_pmed(
    _event_code TEXT DEFAULT 'medical_endorsement',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'pmed', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_prefect(
    _event_code TEXT DEFAULT 'conduct_clearance',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'prefect', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_registrar(
    _event_code TEXT DEFAULT 'faculty_assignment_validation',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'registrar', _event_code, _source_record_id, _payload, _requested_by);
$$;

GRANT SELECT ON public.integration_departments TO authenticated, service_role;
GRANT SELECT ON public.integration_flow_routes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.integration_flow_events TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_department_integration_registry(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_department_flow(TEXT, TEXT, TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_department_flow_status(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.acknowledge_department_flow(UUID, TEXT, JSONB, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_cashier(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_clinic(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_comlab(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_crad(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_guidance(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_pmed(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_prefect(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_registrar(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
