-- Migration to fix HR department integrity
-- Prevents HR admins from managing or dispatching employees from other departments.
-- Robustly handles both public and hr schema layouts.

-- 1. Helper function to get user's department_id safely
CREATE OR REPLACE FUNCTION public.get_user_department_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = hr, public
AS $$
    -- Works for both view and table as long as they are in search_path
    SELECT department_id FROM employees WHERE user_id = _user_id LIMIT 1;
$$;

-- 2. Helper function to check if user belongs to an integration department key
CREATE OR REPLACE FUNCTION public.is_user_in_integration_department(_user_id UUID, _dept_key TEXT)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public, hr
AS $$
BEGIN
    IF public.has_role(_user_id, 'system_admin') THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.department_integration_mappings dim
        JOIN employees e ON e.department_id = dim.department_id
        WHERE e.user_id = _user_id
        AND dim.integration_department_key = _dept_key
    );
END;
$$;

-- 3. Apply RLS policies to the employees table (wherever it resides)
DO $$
DECLARE
    target_schema TEXT;
    policy_record RECORD;
BEGIN
    -- Determine where the actual table is
    SELECT n.nspname INTO target_schema
    FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'employees' AND c.relkind = 'r' 
    AND n.nspname IN ('hr', 'public')
    ORDER BY (CASE WHEN n.nspname = 'hr' THEN 1 ELSE 2 END)
    LIMIT 1;

    IF target_schema IS NOT NULL THEN
        -- Drop existing policies dynamically
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = target_schema AND tablename = 'employees'
            AND (policyname ILIKE '%HR%' OR policyname ILIKE '%Admins%')
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.employees', policy_record.policyname, target_schema);
        END LOOP;

        -- Create restricted policies
        EXECUTE format('
            CREATE POLICY "HR admins can manage department employees"
            ON %I.employees FOR ALL
            TO authenticated
            USING (
                public.has_role(auth.uid(), ''hr_admin'') 
                AND (
                    department_id = public.get_user_department_id(auth.uid())
                    OR 
                    (public.get_user_department_id(auth.uid()) IS NULL AND user_id = auth.uid())
                )
            )
            WITH CHECK (
                public.has_role(auth.uid(), ''hr_admin'') 
                AND department_id = public.get_user_department_id(auth.uid())
            )', target_schema);

        EXECUTE format('
            CREATE POLICY "System admins can manage all employees"
            ON %I.employees FOR ALL
            TO authenticated
            USING (public.has_role(auth.uid(), ''system_admin''))', target_schema);
            
        EXECUTE format('
            CREATE POLICY "HR admins can view department employees"
            ON %I.employees FOR SELECT
            TO authenticated
            USING (
                public.has_role(auth.uid(), ''hr_admin'') 
                AND (
                    department_id = public.get_user_department_id(auth.uid())
                    OR 
                    public.get_user_department_id(auth.uid()) IS NULL
                )
            )', target_schema);
    END IF;
END $$;

-- 4. Apply RLS policies to the employment_contracts table
DO $$
DECLARE
    target_schema TEXT;
    policy_record RECORD;
BEGIN
    SELECT n.nspname INTO target_schema
    FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'employment_contracts' AND c.relkind = 'r' 
    AND n.nspname IN ('hr', 'public')
    ORDER BY (CASE WHEN n.nspname = 'hr' THEN 1 ELSE 2 END)
    LIMIT 1;

    IF target_schema IS NOT NULL THEN
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = target_schema AND tablename = 'employment_contracts'
            AND (policyname ILIKE '%HR%' OR policyname ILIKE '%Admins%')
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.employment_contracts', policy_record.policyname, target_schema);
        END LOOP;

        EXECUTE format('
            CREATE POLICY "System admins can manage all contracts"
            ON %I.employment_contracts FOR ALL
            TO authenticated
            USING (public.has_role(auth.uid(), ''system_admin''))', target_schema);

        EXECUTE format('
            CREATE POLICY "HR admins can manage department contracts"
            ON %I.employment_contracts FOR ALL
            TO authenticated
            USING (
                public.has_role(auth.uid(), ''hr_admin'')
                AND EXISTS (
                    SELECT 1 FROM %I.employees e
                    WHERE e.id = %I.employment_contracts.employee_id
                    AND e.department_id = public.get_user_department_id(auth.uid())
                )
            )
            WITH CHECK (
                public.has_role(auth.uid(), ''hr_admin'')
                AND EXISTS (
                    SELECT 1 FROM %I.employees e
                    WHERE e.id = %I.employment_contracts.employee_id
                    AND e.department_id = public.get_user_department_id(auth.uid())
                )
            )', target_schema, target_schema, target_schema, target_schema, target_schema);
    END IF;
END $$;

-- 5. Update dispatch functions
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
SET search_path = public, hr
AS $$
DECLARE
    selected_route RECORD;
    new_event public.integration_flow_events%ROWTYPE;
    resolved_event_code TEXT;
    correlation TEXT;
    effective_user_id UUID;
BEGIN
    effective_user_id := COALESCE(_requested_by, auth.uid());

    -- AUTHORIZATION CHECK
    IF NOT public.is_user_in_integration_department(effective_user_id, _source_department_key) THEN
        RETURN jsonb_build_object(
            'ok', false,
            'message', format('Unauthorized: User does not belong to the source department %s', _source_department_key),
            'status', 'unauthorized'
        );
    END IF;

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
        _payload,
        '{}'::jsonb,
        '/rest/v1/rpc/' || selected_route.route_key,
        effective_user_id,
        jsonb_build_object('dispatched_via', 'dispatch_department_flow')
    )
    RETURNING * INTO new_event;

    RETURN jsonb_build_object(
        'ok', true,
        'event_id', new_event.id,
        'correlation_id', new_event.correlation_id,
        'route_key', new_event.route_key,
        'status', new_event.status,
        'message', 'Event queued for dispatch.'
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
SET search_path = public, hr
AS $$
DECLARE
    employee_record RECORD;
    effective_user_id UUID;
    source_dept_id UUID;
    source_dept_key TEXT;
BEGIN
    effective_user_id := COALESCE(_requested_by, auth.uid());

    SELECT * INTO employee_record FROM employees WHERE id = _employee_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Employee not found');
    END IF;

    -- AUTHORIZATION CHECK
    source_dept_id := public.get_user_department_id(effective_user_id);
    
    IF NOT public.has_role(effective_user_id, 'system_admin') THEN
        IF employee_record.department_id IS DISTINCT FROM source_dept_id THEN
            RETURN jsonb_build_object(
                'ok', false, 
                'message', 'Unauthorized: You can only dispatch employees from your own department',
                'status', 'unauthorized'
            );
        END IF;
    END IF;

    SELECT dim.integration_department_key INTO source_dept_key
    FROM public.department_integration_mappings dim
    WHERE dim.department_id = employee_record.department_id
    LIMIT 1;

    source_dept_key := COALESCE(source_dept_key, 'hr');

    RETURN public.dispatch_department_flow(
        source_dept_key,
        _target_department_key,
        _event_code,
        _employee_id::text,
        jsonb_build_object(
            'employee_id', employee_record.id,
            'employee_name', COALESCE(employee_record.first_name, '') || ' ' || COALESCE(employee_record.last_name, ''),
            'department_id', employee_record.department_id,
            'metadata', _metadata
        ),
        effective_user_id
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
SET search_path = public, hr
AS $$
DECLARE
    department_record RECORD;
    employee_record RECORD;
    dispatch_result JSONB;
    dispatch_results JSONB := '[]'::jsonb;
    attempted_employee_count INTEGER := 0;
    dispatched_employee_count INTEGER := 0;
    failed_employee_count INTEGER := 0;
    effective_user_id UUID;
    source_dept_id UUID;
BEGIN
    effective_user_id := COALESCE(_requested_by, auth.uid());
    source_dept_id := public.get_user_department_id(effective_user_id);

    -- AUTHORIZATION CHECK
    IF NOT public.has_role(effective_user_id, 'system_admin') THEN
        IF _department_id IS DISTINCT FROM source_dept_id THEN
            RETURN jsonb_build_object(
                'ok', false,
                'message', 'Unauthorized: You can only dispatch the directory of your own department',
                'status', 'unauthorized'
            );
        END IF;
    END IF;

    SELECT * INTO department_record FROM departments WHERE id = _department_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Department not found');
    END IF;

    FOR employee_record IN 
        SELECT id FROM employees 
        WHERE department_id = _department_id 
        AND (_include_inactive OR employment_status = 'active')
    LOOP
        attempted_employee_count := attempted_employee_count + 1;
        
        dispatch_result := public.dispatch_employee_profile_to_department(
            employee_record.id,
            _target_department_key,
            'employee_directory_sync',
            effective_user_id,
            _metadata || jsonb_build_object('batch_directory_sync', true)
        );

        IF (dispatch_result->>'ok')::boolean THEN
            dispatched_employee_count := dispatched_employee_count + 1;
        ELSE
            failed_employee_count := failed_employee_count + 1;
        END IF;

        dispatch_results := dispatch_results || jsonb_build_object(
            'employee_id', employee_record.id,
            'result', dispatch_result
        );
    END LOOP;

    RETURN jsonb_build_object(
        'ok', true,
        'department_id', _department_id,
        'department_name', department_record.name,
        'attempted_employee_count', attempted_employee_count,
        'dispatched_employee_count', dispatched_employee_count,
        'failed_employee_count', failed_employee_count,
        'results', dispatch_results,
        'message', format('Directory sync processed for %s: %s dispatched, %s failed.', 
            department_record.name, dispatched_employee_count, failed_employee_count)
    );
END;
$$;
