-- =====================================================
-- Department Integration Monitoring + Batch Employee Sync
-- =====================================================
-- Adds monitoring RPCs for inbox/outbox visibility and batch directory sync
-- helpers so HR can send employee data to connected departments end-to-end.

CREATE OR REPLACE FUNCTION public.get_department_flow_events(
    _department_key TEXT DEFAULT 'hr',
    _direction TEXT DEFAULT 'all',
    _status TEXT DEFAULT NULL,
    _counterparty_department_key TEXT DEFAULT NULL,
    _event_code TEXT DEFAULT NULL,
    _limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payload JSONB;
    resolved_direction TEXT;
BEGIN
    resolved_direction := lower(COALESCE(NULLIF(_direction, ''), 'all'));

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
            event.source_department_key,
            source.department_name AS source_department_name,
            event.target_department_key,
            target.department_name AS target_department_name,
            CASE
                WHEN _department_key IS NULL THEN NULL
                WHEN event.source_department_key = _department_key THEN event.target_department_key
                WHEN event.target_department_key = _department_key THEN event.source_department_key
                ELSE NULL
            END AS counterparty_department_key,
            CASE
                WHEN _department_key IS NULL THEN NULL
                WHEN event.source_department_key = _department_key THEN target.department_name
                WHEN event.target_department_key = _department_key THEN source.department_name
                ELSE NULL
            END AS counterparty_department_name,
            event.source_record_id,
            event.event_code,
            event.status,
            event.dispatch_endpoint,
            event.request_payload,
            event.response_payload,
            event.initiated_by,
            event.dispatched_at,
            event.acknowledged_at,
            event.last_error,
            event.created_at,
            event.updated_at
        FROM public.integration_flow_events event
        JOIN public.integration_flow_routes route
          ON route.route_key = event.route_key
        JOIN public.integration_departments source
          ON source.department_key = event.source_department_key
        JOIN public.integration_departments target
          ON target.department_key = event.target_department_key
        WHERE (
            _department_key IS NULL
            OR (
                resolved_direction = 'incoming'
                AND event.target_department_key = _department_key
            )
            OR (
                resolved_direction = 'outgoing'
                AND event.source_department_key = _department_key
            )
            OR (
                resolved_direction = 'all'
                AND (
                    event.source_department_key = _department_key
                    OR event.target_department_key = _department_key
                )
            )
        )
          AND (_status IS NULL OR event.status = _status)
          AND (_event_code IS NULL OR event.event_code = _event_code)
          AND (
            _counterparty_department_key IS NULL
            OR _department_key IS NULL
            OR (
                event.source_department_key = _department_key
                AND event.target_department_key = _counterparty_department_key
            )
            OR (
                event.target_department_key = _department_key
                AND event.source_department_key = _counterparty_department_key
            )
          )
        ORDER BY event.created_at DESC
        LIMIT GREATEST(COALESCE(_limit, 100), 1)
    ) event_row;

    RETURN payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_employee_profile_to_connected_departments(
    _employee_id UUID,
    _requested_by UUID DEFAULT NULL,
    _only_primary BOOLEAN DEFAULT false,
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
    dispatch_result JSONB;
    dispatch_results JSONB := '[]'::jsonb;
    attempted_target_count INTEGER := 0;
    dispatched_target_count INTEGER := 0;
    failed_target_count INTEGER := 0;
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

    FOR target_config IN
        SELECT target
        FROM jsonb_array_elements(COALESCE(employee_record.connected_systems, '[]'::jsonb)) AS target(target)
        WHERE (
            _only_primary = false
            OR COALESCE((target->>'is_primary')::boolean, false) = true
        )
        ORDER BY
            COALESCE((target->>'is_primary')::boolean, false) DESC,
            COALESCE(target->>'department_name', '')
    LOOP
        attempted_target_count := attempted_target_count + 1;

        dispatch_result := public.dispatch_employee_profile_to_department(
            _employee_id,
            target_config->>'department_key',
            COALESCE(NULLIF(target_config->>'default_event_code', ''), 'employee_profile_sync'),
            _requested_by,
            COALESCE(_metadata, '{}'::jsonb) || jsonb_build_object(
                'dispatch_scope', CASE WHEN _only_primary THEN 'primary_target_only' ELSE 'all_connected_targets' END,
                'target_department_name', target_config->>'department_name'
            )
        );

        IF COALESCE(dispatch_result->>'ok', 'false') = 'true' THEN
            dispatched_target_count := dispatched_target_count + 1;
        ELSE
            failed_target_count := failed_target_count + 1;
        END IF;

        dispatch_results := dispatch_results || jsonb_build_array(
            jsonb_build_object(
                'target_department_key', target_config->>'department_key',
                'target_department_name', target_config->>'department_name',
                'event_code', COALESCE(NULLIF(target_config->>'default_event_code', ''), 'employee_profile_sync'),
                'result', dispatch_result
            )
        );
    END LOOP;

    IF attempted_target_count = 0 THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'target_not_configured',
            'employee_id', employee_record.employee_id,
            'employee_name', employee_record.employee_name,
            'attempted_target_count', 0,
            'dispatched_target_count', 0,
            'failed_target_count', 0,
            'results', dispatch_results,
            'message', 'No connected departments are configured for this employee.'
        );
    END IF;

    RETURN jsonb_build_object(
        'ok', failed_target_count = 0,
        'partial_success', dispatched_target_count > 0 AND failed_target_count > 0,
        'status',
            CASE
                WHEN failed_target_count = 0 THEN 'queued'
                WHEN dispatched_target_count > 0 THEN 'partial'
                ELSE 'failed'
            END,
        'employee_id', employee_record.employee_id,
        'employee_name', employee_record.employee_name,
        'attempted_target_count', attempted_target_count,
        'dispatched_target_count', dispatched_target_count,
        'failed_target_count', failed_target_count,
        'results', dispatch_results,
        'message',
            CASE
                WHEN failed_target_count = 0 THEN 'Employee profile dispatch queued for all configured departments.'
                WHEN dispatched_target_count > 0 THEN 'Employee profile dispatch queued for some departments, but some targets failed.'
                ELSE 'Employee profile dispatch failed for all configured departments.'
            END
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_department_employee_directory(
    _department_id UUID,
    _target_department_key TEXT DEFAULT NULL,
    _requested_by UUID DEFAULT NULL,
    _only_primary BOOLEAN DEFAULT false,
    _include_inactive BOOLEAN DEFAULT false,
    _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    department_record RECORD;
    employee_record RECORD;
    dispatch_result JSONB;
    dispatch_results JSONB := '[]'::jsonb;
    attempted_employee_count INTEGER := 0;
    dispatched_employee_count INTEGER := 0;
    failed_employee_count INTEGER := 0;
    employee_success BOOLEAN;
BEGIN
    SELECT id, name, code
    INTO department_record
    FROM public.departments
    WHERE id = _department_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'not_found',
            'message', 'Department was not found.'
        );
    END IF;

    FOR employee_record IN
        SELECT employee_id, employee_number, employee_name, employment_status, first_name, last_name
        FROM public.employee_directory
        WHERE department_id = _department_id
          AND integration_ready = true
          AND (
              _include_inactive = true
              OR employment_status IN ('active', 'probation', 'on_leave')
          )
        ORDER BY last_name, first_name, employee_number
    LOOP
        attempted_employee_count := attempted_employee_count + 1;

        IF _target_department_key IS NULL THEN
            dispatch_result := public.dispatch_employee_profile_to_connected_departments(
                employee_record.employee_id,
                _requested_by,
                _only_primary,
                COALESCE(_metadata, '{}'::jsonb) || jsonb_build_object(
                    'sync_mode', 'department_directory',
                    'department_id', department_record.id,
                    'department_code', department_record.code,
                    'department_name', department_record.name
                )
            );

            employee_success := COALESCE(dispatch_result->>'ok', 'false') = 'true'
                OR COALESCE(dispatch_result->>'partial_success', 'false') = 'true';
        ELSE
            dispatch_result := public.dispatch_employee_profile_to_department(
                employee_record.employee_id,
                _target_department_key,
                'employee_profile_sync',
                _requested_by,
                COALESCE(_metadata, '{}'::jsonb) || jsonb_build_object(
                    'sync_mode', 'department_directory',
                    'department_id', department_record.id,
                    'department_code', department_record.code,
                    'department_name', department_record.name
                )
            );

            employee_success := COALESCE(dispatch_result->>'ok', 'false') = 'true';
        END IF;

        IF employee_success THEN
            dispatched_employee_count := dispatched_employee_count + 1;
        ELSE
            failed_employee_count := failed_employee_count + 1;
        END IF;

        dispatch_results := dispatch_results || jsonb_build_array(
            jsonb_build_object(
                'employee_id', employee_record.employee_id,
                'employee_number', employee_record.employee_number,
                'employee_name', employee_record.employee_name,
                'result', dispatch_result
            )
        );
    END LOOP;

    RETURN jsonb_build_object(
        'ok', attempted_employee_count > 0 AND failed_employee_count = 0,
        'partial_success', dispatched_employee_count > 0 AND failed_employee_count > 0,
        'status',
            CASE
                WHEN attempted_employee_count = 0 THEN 'no_employees'
                WHEN failed_employee_count = 0 THEN 'queued'
                WHEN dispatched_employee_count > 0 THEN 'partial'
                ELSE 'failed'
            END,
        'department_id', department_record.id,
        'department_name', department_record.name,
        'department_code', department_record.code,
        'attempted_employee_count', attempted_employee_count,
        'dispatched_employee_count', dispatched_employee_count,
        'failed_employee_count', failed_employee_count,
        'results', dispatch_results,
        'message',
            CASE
                WHEN attempted_employee_count = 0 THEN 'No integration-ready employees were found for this department.'
                WHEN failed_employee_count = 0 THEN 'Department employee directory sync queued successfully.'
                WHEN dispatched_employee_count > 0 THEN 'Department employee directory sync partially queued.'
                ELSE 'Department employee directory sync failed.'
            END
    );
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
    employee_id_text TEXT;
    employee_uuid UUID;
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

    employee_id_text := NULLIF(updated_event.request_payload->>'employee_id', '');

    IF updated_event.event_code = 'employee_profile_sync'
       AND employee_id_text IS NOT NULL
       AND employee_id_text ~* '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    THEN
        employee_uuid := employee_id_text::uuid;

        INSERT INTO public.employee_integration_profiles (
            employee_id,
            primary_integration_department_key,
            integration_status,
            sync_enabled,
            allow_admin_sync,
            allow_department_sync,
            last_target_department_key,
            last_event_id,
            last_synced_at,
            metadata
        )
        SELECT
            directory.employee_id,
            public.resolve_integration_department_key(directory.primary_integration_department_key),
            CASE
                WHEN updated_event.status IN ('acknowledged', 'completed') THEN 'synced'
                WHEN updated_event.status IN ('failed', 'blocked') THEN 'error'
                ELSE 'pending_sync'
            END,
            true,
            true,
            true,
            updated_event.target_department_key,
            updated_event.id,
            CASE
                WHEN updated_event.status IN ('acknowledged', 'completed')
                    THEN COALESCE(updated_event.acknowledged_at, now())
                ELSE NULL
            END,
            jsonb_build_object(
                'last_acknowledged_status', updated_event.status,
                'last_response_payload', COALESCE(updated_event.response_payload, '{}'::jsonb),
                'last_error', updated_event.last_error
            )
        FROM public.employee_directory directory
        WHERE directory.employee_id = employee_uuid
        ON CONFLICT (employee_id) DO UPDATE
        SET
            integration_status = CASE
                WHEN updated_event.status IN ('acknowledged', 'completed') THEN 'synced'
                WHEN updated_event.status IN ('failed', 'blocked') THEN 'error'
                ELSE 'pending_sync'
            END,
            last_target_department_key = updated_event.target_department_key,
            last_event_id = updated_event.id,
            last_synced_at = CASE
                WHEN updated_event.status IN ('acknowledged', 'completed')
                    THEN COALESCE(updated_event.acknowledged_at, now())
                ELSE public.employee_integration_profiles.last_synced_at
            END,
            metadata = COALESCE(public.employee_integration_profiles.metadata, '{}'::jsonb) || jsonb_build_object(
                'last_acknowledged_status', updated_event.status,
                'last_response_payload', COALESCE(updated_event.response_payload, '{}'::jsonb),
                'last_error', updated_event.last_error
            ),
            updated_at = now();
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

GRANT EXECUTE ON FUNCTION public.get_department_flow_events(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_employee_profile_to_connected_departments(UUID, UUID, BOOLEAN, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_department_employee_directory(UUID, TEXT, UUID, BOOLEAN, BOOLEAN, JSONB) TO authenticated, service_role;
