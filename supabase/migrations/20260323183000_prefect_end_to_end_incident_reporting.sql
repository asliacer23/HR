-- End-to-end Prefect incident integration for Guidance/PMED/Clinic using Supabase only.
-- This migration adds:
-- 1) structured prefect incident reports table
-- 2) route contracts for outbound and inbound incident reporting
-- 3) RPCs for sending, receiving, and timeline retrieval

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.prefect_incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_reference TEXT NOT NULL UNIQUE,
    student_number TEXT NOT NULL,
    student_name TEXT NOT NULL,
    report_title TEXT NOT NULL,
    behavior_summary TEXT,
    complaint_summary TEXT,
    incident_status TEXT NOT NULL DEFAULT 'pending',
    incident_date DATE,
    incident_time TIME,
    incident_datetime TIMESTAMPTZ,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    occurred_at TIMESTAMPTZ,
    source_department_key TEXT NOT NULL DEFAULT 'prefect'
      REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prefect_incident_report_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.prefect_incident_reports(id) ON DELETE CASCADE,
    integration_event_id UUID REFERENCES public.integration_flow_events(id) ON DELETE SET NULL,
    correlation_id TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
    source_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    target_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    event_code TEXT NOT NULL,
    event_status TEXT NOT NULL DEFAULT 'queued',
    acknowledged_at TIMESTAMPTZ,
    event_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT prefect_incident_report_events_unique_flow UNIQUE (report_id, direction, target_department_key, event_code)
);

CREATE INDEX IF NOT EXISTS idx_prefect_incident_reports_student
    ON public.prefect_incident_reports (student_number, incident_status, reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_prefect_incident_reports_reported_at
    ON public.prefect_incident_reports (reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_prefect_incident_report_events_report
    ON public.prefect_incident_report_events (report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prefect_incident_report_events_target_status
    ON public.prefect_incident_report_events (target_department_key, event_status, created_at DESC);

DROP TRIGGER IF EXISTS update_prefect_incident_reports_updated_at ON public.prefect_incident_reports;
CREATE TRIGGER update_prefect_incident_reports_updated_at
BEFORE UPDATE ON public.prefect_incident_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prefect_incident_report_events_updated_at ON public.prefect_incident_report_events;
CREATE TRIGGER update_prefect_incident_report_events_updated_at
BEFORE UPDATE ON public.prefect_incident_report_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

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
        'prefect_to_guidance_incident_report',
        'Prefect Incident Report to Guidance',
        'prefect',
        'guidance',
        'incident_report',
        'POST',
        '/rest/v1/rpc/dispatch_department_flow',
        '{"required":["report_reference","student_number","student_name","report_title","incident_status","reported_at"],"optional":["behavior_summary","complaint_summary","incident_date","incident_time","incident_datetime","occurred_at","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Prefect sends discipline/behavior reports to Guidance.',
        '{"module":"prefect_reports","category":"incident_reporting"}'::jsonb
    ),
    (
        'prefect_to_pmed_incident_report',
        'Prefect Incident Report to PMED',
        'prefect',
        'pmed',
        'incident_report',
        'POST',
        '/rest/v1/rpc/dispatch_department_flow',
        '{"required":["report_reference","student_number","student_name","report_title","incident_status","reported_at"],"optional":["behavior_summary","complaint_summary","incident_date","incident_time","incident_datetime","occurred_at","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Prefect sends discipline/behavior reports to PMED when medical coordination is required.',
        '{"module":"prefect_reports","category":"incident_reporting"}'::jsonb
    ),
    (
        'guidance_to_prefect_incident_report',
        'Guidance Incident Report to Prefect',
        'guidance',
        'prefect',
        'incident_report',
        'POST',
        '/rest/v1/rpc/dispatch_department_flow',
        '{"required":["report_reference","student_number","student_name","report_title","incident_status","reported_at"],"optional":["incident_summary","incident_datetime","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        12,
        true,
        true,
        'Guidance returns incident updates/details to Prefect.',
        '{"module":"prefect_reports","category":"department_inbox"}'::jsonb
    ),
    (
        'pmed_to_prefect_incident_report',
        'PMED Incident Report to Prefect',
        'pmed',
        'prefect',
        'incident_report',
        'POST',
        '/rest/v1/rpc/dispatch_department_flow',
        '{"required":["report_reference","student_number","student_name","report_title","incident_status","reported_at"],"optional":["incident_summary","incident_datetime","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        13,
        true,
        true,
        'PMED sends incident-related findings or disposition to Prefect.',
        '{"module":"prefect_reports","category":"department_inbox"}'::jsonb
    ),
    (
        'clinic_to_prefect_incident_report',
        'Clinic Incident Report to Prefect',
        'clinic',
        'prefect',
        'incident_report',
        'POST',
        '/rest/v1/rpc/dispatch_department_flow',
        '{"required":["report_reference","student_number","student_name","report_title","incident_status","reported_at"],"optional":["incident_summary","incident_datetime","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        14,
        true,
        true,
        'Clinic sends incident/medical incident context back to Prefect.',
        '{"module":"prefect_reports","category":"department_inbox"}'::jsonb
    )
ON CONFLICT ON CONSTRAINT integration_flow_routes_source_target_event_key DO UPDATE
SET
    route_key = EXCLUDED.route_key,
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

CREATE OR REPLACE FUNCTION public.dispatch_prefect_incident_report(
    _student_number TEXT,
    _student_name TEXT,
    _report_title TEXT,
    _behavior_summary TEXT DEFAULT NULL,
    _complaint_summary TEXT DEFAULT NULL,
    _incident_status TEXT DEFAULT 'pending',
    _incident_date DATE DEFAULT NULL,
    _incident_time TIME DEFAULT NULL,
    _incident_datetime TIMESTAMPTZ DEFAULT NULL,
    _occurred_at TIMESTAMPTZ DEFAULT NULL,
    _targets TEXT[] DEFAULT ARRAY['guidance', 'pmed'],
    _metadata JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    report_row public.prefect_incident_reports%ROWTYPE;
    target_department TEXT;
    dispatch_result JSONB;
    payload JSONB;
    ok_results JSONB := '[]'::jsonb;
    failed_results JSONB := '[]'::jsonb;
    sanitized_targets TEXT[];
BEGIN
    IF COALESCE(NULLIF(trim(_student_number), ''), '') = ''
       OR COALESCE(NULLIF(trim(_student_name), ''), '') = ''
       OR COALESCE(NULLIF(trim(_report_title), ''), '') = '' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'validation_error',
            'message', 'student_number, student_name, and report_title are required.'
        );
    END IF;

    sanitized_targets := (
        SELECT ARRAY(
            SELECT DISTINCT lower(trim(target_item))
            FROM unnest(COALESCE(_targets, ARRAY['guidance', 'pmed'])) AS target_item
            WHERE lower(trim(target_item)) IN ('guidance', 'pmed')
        )
    );

    IF COALESCE(array_length(sanitized_targets, 1), 0) = 0 THEN
        sanitized_targets := ARRAY['guidance', 'pmed'];
    END IF;

    INSERT INTO public.prefect_incident_reports (
        report_reference,
        student_number,
        student_name,
        report_title,
        behavior_summary,
        complaint_summary,
        incident_status,
        incident_date,
        incident_time,
        incident_datetime,
        reported_at,
        occurred_at,
        source_department_key,
        metadata,
        created_by
    )
    VALUES (
        concat(
            'PREF-',
            to_char(now(), 'YYYYMMDDHH24MISS'),
            '-',
            substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 6)
        ),
        trim(_student_number),
        trim(_student_name),
        trim(_report_title),
        NULLIF(_behavior_summary, ''),
        NULLIF(_complaint_summary, ''),
        COALESCE(NULLIF(trim(_incident_status), ''), 'pending'),
        _incident_date,
        _incident_time,
        _incident_datetime,
        now(),
        _occurred_at,
        'prefect',
        COALESCE(_metadata, '{}'::jsonb),
        COALESCE(_requested_by, auth.uid())
    )
    RETURNING * INTO report_row;

    payload := jsonb_build_object(
        'report_id', report_row.id,
        'report_reference', report_row.report_reference,
        'student_number', report_row.student_number,
        'student_name', report_row.student_name,
        'report_title', report_row.report_title,
        'behavior_summary', report_row.behavior_summary,
        'complaint_summary', report_row.complaint_summary,
        'incident_status', report_row.incident_status,
        'incident_date', report_row.incident_date,
        'incident_time', report_row.incident_time,
        'incident_datetime', report_row.incident_datetime,
        'reported_at', report_row.reported_at,
        'occurred_at', report_row.occurred_at,
        'source_department_key', 'prefect',
        'metadata', COALESCE(report_row.metadata, '{}'::jsonb)
    );

    FOREACH target_department IN ARRAY sanitized_targets LOOP
        dispatch_result := public.dispatch_department_flow(
            'prefect',
            target_department,
            'incident_report',
            report_row.id::TEXT,
            payload,
            COALESCE(_requested_by, auth.uid())
        );

        IF COALESCE((dispatch_result->>'ok')::BOOLEAN, false) THEN
            INSERT INTO public.prefect_incident_report_events (
                report_id,
                integration_event_id,
                correlation_id,
                direction,
                source_department_key,
                target_department_key,
                event_code,
                event_status,
                payload,
                response
            )
            VALUES (
                report_row.id,
                NULLIF(dispatch_result->>'event_id', '')::UUID,
                dispatch_result->>'correlation_id',
                'outbound',
                'prefect',
                target_department,
                'incident_report',
                COALESCE(dispatch_result->>'status', 'queued'),
                payload,
                dispatch_result
            )
            ON CONFLICT (report_id, direction, target_department_key, event_code)
            DO UPDATE SET
                integration_event_id = EXCLUDED.integration_event_id,
                correlation_id = EXCLUDED.correlation_id,
                event_status = EXCLUDED.event_status,
                payload = EXCLUDED.payload,
                response = EXCLUDED.response,
                event_updated_at = now(),
                updated_at = now();

            ok_results := ok_results || jsonb_build_object(
                'target_department_key', target_department,
                'event_id', dispatch_result->>'event_id',
                'correlation_id', dispatch_result->>'correlation_id',
                'status', dispatch_result->>'status'
            );
        ELSE
            failed_results := failed_results || jsonb_build_object(
                'target_department_key', target_department,
                'status', COALESCE(dispatch_result->>'status', 'route_not_configured'),
                'message', COALESCE(dispatch_result->>'message', 'Dispatch failed')
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'ok', true,
        'report_id', report_row.id,
        'report_reference', report_row.report_reference,
        'student_number', report_row.student_number,
        'student_name', report_row.student_name,
        'incident_status', report_row.incident_status,
        'reported_at', report_row.reported_at,
        'sent_results', ok_results,
        'failed_results', failed_results
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.receive_prefect_incident_report(
    _source_department_key TEXT,
    _report_reference TEXT,
    _student_number TEXT,
    _student_name TEXT,
    _report_title TEXT,
    _incident_status TEXT DEFAULT 'received',
    _incident_datetime TIMESTAMPTZ DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    report_row public.prefect_incident_reports%ROWTYPE;
    dispatch_result JSONB;
    payload JSONB;
    normalized_source TEXT;
BEGIN
    normalized_source := lower(trim(COALESCE(_source_department_key, '')));

    IF normalized_source NOT IN ('guidance', 'pmed', 'clinic') THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'validation_error',
            'message', 'source department must be guidance, pmed, or clinic.'
        );
    END IF;

    INSERT INTO public.prefect_incident_reports (
        report_reference,
        student_number,
        student_name,
        report_title,
        behavior_summary,
        complaint_summary,
        incident_status,
        incident_datetime,
        reported_at,
        occurred_at,
        source_department_key,
        metadata
    )
    VALUES (
        COALESCE(NULLIF(trim(_report_reference), ''), concat('IN-', upper(normalized_source), '-', to_char(now(), 'YYYYMMDDHH24MISS'))),
        trim(_student_number),
        trim(_student_name),
        trim(_report_title),
        NULLIF(_payload->>'behavior_summary', ''),
        NULLIF(_payload->>'complaint_summary', ''),
        COALESCE(NULLIF(trim(_incident_status), ''), 'received'),
        _incident_datetime,
        now(),
        _incident_datetime,
        normalized_source,
        COALESCE(_payload, '{}'::jsonb)
    )
    ON CONFLICT (report_reference) DO UPDATE
    SET
        student_number = EXCLUDED.student_number,
        student_name = EXCLUDED.student_name,
        report_title = EXCLUDED.report_title,
        incident_status = EXCLUDED.incident_status,
        incident_datetime = COALESCE(EXCLUDED.incident_datetime, public.prefect_incident_reports.incident_datetime),
        metadata = COALESCE(public.prefect_incident_reports.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
        updated_at = now()
    RETURNING * INTO report_row;

    payload := COALESCE(_payload, '{}'::jsonb) || jsonb_build_object(
        'report_id', report_row.id,
        'report_reference', report_row.report_reference,
        'student_number', report_row.student_number,
        'student_name', report_row.student_name,
        'report_title', report_row.report_title,
        'incident_status', report_row.incident_status
    );

    dispatch_result := public.dispatch_department_flow(
        normalized_source,
        'prefect',
        'incident_report',
        report_row.id::TEXT,
        payload,
        auth.uid()
    );

    INSERT INTO public.prefect_incident_report_events (
        report_id,
        integration_event_id,
        correlation_id,
        direction,
        source_department_key,
        target_department_key,
        event_code,
        event_status,
        payload,
        response
    )
    VALUES (
        report_row.id,
        NULLIF(dispatch_result->>'event_id', '')::UUID,
        dispatch_result->>'correlation_id',
        'inbound',
        normalized_source,
        'prefect',
        'incident_report',
        COALESCE(dispatch_result->>'status', 'queued'),
        payload,
        dispatch_result
    )
    ON CONFLICT (report_id, direction, target_department_key, event_code)
    DO UPDATE SET
        integration_event_id = EXCLUDED.integration_event_id,
        correlation_id = EXCLUDED.correlation_id,
        source_department_key = EXCLUDED.source_department_key,
        event_status = EXCLUDED.event_status,
        payload = EXCLUDED.payload,
        response = EXCLUDED.response,
        event_updated_at = now(),
        updated_at = now();

    RETURN jsonb_build_object(
        'ok', COALESCE((dispatch_result->>'ok')::BOOLEAN, false),
        'report_id', report_row.id,
        'report_reference', report_row.report_reference,
        'event', dispatch_result
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_prefect_incident_report_timeline(
    _report_id UUID DEFAULT NULL,
    _report_reference TEXT DEFAULT NULL,
    _student_number TEXT DEFAULT NULL,
    _limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    timeline JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'report_id', report.id,
                'report_reference', report.report_reference,
                'student_number', report.student_number,
                'student_name', report.student_name,
                'report_title', report.report_title,
                'incident_status', report.incident_status,
                'incident_datetime', report.incident_datetime,
                'reported_at', report.reported_at,
                'source_department_key', report.source_department_key,
                'behavior_summary', report.behavior_summary,
                'complaint_summary', report.complaint_summary,
                'timeline', COALESCE(event_rows.timeline, '[]'::jsonb)
            )
            ORDER BY report.reported_at DESC
        ),
        '[]'::jsonb
    )
    INTO timeline
    FROM (
        SELECT *
        FROM public.prefect_incident_reports base_report
        WHERE (_report_id IS NULL OR base_report.id = _report_id)
          AND (_report_reference IS NULL OR base_report.report_reference = _report_reference)
          AND (_student_number IS NULL OR base_report.student_number = _student_number)
        ORDER BY base_report.reported_at DESC
        LIMIT GREATEST(COALESCE(_limit, 50), 1)
    ) report
    LEFT JOIN LATERAL (
        SELECT jsonb_agg(
            jsonb_build_object(
                'event_row_id', event_row.id,
                'direction', event_row.direction,
                'source_department_key', event_row.source_department_key,
                'target_department_key', event_row.target_department_key,
                'event_code', event_row.event_code,
                'event_status', COALESCE(event.status, event_row.event_status),
                'correlation_id', COALESCE(event.correlation_id, event_row.correlation_id),
                'dispatch_endpoint', event.dispatch_endpoint,
                'payload', event_row.payload,
                'response', COALESCE(event.response_payload, event_row.response),
                'dispatched_at', event.dispatched_at,
                'acknowledged_at', COALESCE(event.acknowledged_at, event_row.acknowledged_at),
                'created_at', event_row.created_at,
                'updated_at', COALESCE(event.updated_at, event_row.updated_at)
            )
            ORDER BY event_row.created_at ASC
        ) AS timeline
        FROM public.prefect_incident_report_events event_row
        LEFT JOIN public.integration_flow_events event
          ON event.id = event_row.integration_event_id
        WHERE event_row.report_id = report.id
    ) AS event_rows ON true;

    RETURN jsonb_build_object(
        'ok', true,
        'data', timeline
    );
END;
$$;

GRANT SELECT, INSERT, UPDATE ON public.prefect_incident_reports TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.prefect_incident_report_events TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.dispatch_prefect_incident_report(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIMESTAMPTZ, TIMESTAMPTZ, TEXT[], JSONB, UUID
) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.receive_prefect_incident_report(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB
) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_prefect_incident_report_timeline(
    UUID, TEXT, TEXT, INTEGER
) TO authenticated, service_role;
