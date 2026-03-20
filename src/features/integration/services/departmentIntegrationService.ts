import { supabase } from '@/integrations/supabase/client';

export interface DepartmentRouteSummary {
  route_key: string;
  flow_name: string;
  event_code: string;
  endpoint_path: string;
  priority: number;
  is_required: boolean;
}

export interface DepartmentIntegrationRegistryItem {
  department_key: string;
  department_name: string;
  system_code: string;
  module_directory: string;
  purpose: string;
  default_action_label: string;
  dispatch_rpc_name: string;
  status_rpc_name: string;
  ack_rpc_name: string;
  dispatch_endpoint: string;
  pending_count: number;
  in_progress_count: number;
  failed_count: number;
  completed_count: number;
  route_count: number;
  latest_status: string | null;
  latest_event_code: string | null;
  latest_correlation_id: string | null;
  latest_created_at: string | null;
  routes: DepartmentRouteSummary[];
}

export interface DepartmentFlowDispatchResult {
  ok: boolean;
  event_id?: string;
  correlation_id?: string;
  route_key?: string;
  source_department_key?: string;
  target_department_key?: string;
  event_code?: string;
  status?: string;
  dispatch_endpoint?: string;
  message?: string;
}

export interface DepartmentFlowStatusResult {
  ok: boolean;
  event_id?: string;
  correlation_id?: string;
  route_key?: string;
  flow_name?: string;
  source_department_key?: string;
  target_department_key?: string;
  event_code?: string;
  status?: string;
  dispatch_endpoint?: string;
  source_record_id?: string | null;
  request_payload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  initiated_by?: string | null;
  dispatched_at?: string | null;
  acknowledged_at?: string | null;
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
  message?: string;
}

export interface DispatchDepartmentFlowInput {
  targetDepartmentKey: string;
  eventCode?: string;
  sourceRecordId?: string;
  payload?: Record<string, unknown>;
  requestedBy?: string;
}

function normalizeRegistryPayload(payload: unknown): DepartmentIntegrationRegistryItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => ({
    department_key: String(item?.department_key ?? ''),
    department_name: String(item?.department_name ?? ''),
    system_code: String(item?.system_code ?? ''),
    module_directory: String(item?.module_directory ?? ''),
    purpose: String(item?.purpose ?? ''),
    default_action_label: String(item?.default_action_label ?? 'Dispatch'),
    dispatch_rpc_name: String(item?.dispatch_rpc_name ?? 'dispatch_department_flow'),
    status_rpc_name: String(item?.status_rpc_name ?? 'get_department_flow_status'),
    ack_rpc_name: String(item?.ack_rpc_name ?? 'acknowledge_department_flow'),
    dispatch_endpoint: String(item?.dispatch_endpoint ?? ''),
    pending_count: Number(item?.pending_count ?? 0),
    in_progress_count: Number(item?.in_progress_count ?? 0),
    failed_count: Number(item?.failed_count ?? 0),
    completed_count: Number(item?.completed_count ?? 0),
    route_count: Number(item?.route_count ?? 0),
    latest_status: item?.latest_status ? String(item.latest_status) : null,
    latest_event_code: item?.latest_event_code ? String(item.latest_event_code) : null,
    latest_correlation_id: item?.latest_correlation_id ? String(item.latest_correlation_id) : null,
    latest_created_at: item?.latest_created_at ? String(item.latest_created_at) : null,
    routes: Array.isArray(item?.routes)
      ? item.routes
          .map((route) => ({
            route_key: String(route?.route_key ?? ''),
            flow_name: String(route?.flow_name ?? ''),
            event_code: String(route?.event_code ?? ''),
            endpoint_path: String(route?.endpoint_path ?? ''),
            priority: Number(route?.priority ?? 0),
            is_required: Boolean(route?.is_required),
          }))
          .sort((left, right) => left.priority - right.priority)
      : [],
  }));
}

function normalizeDispatchResult(payload: unknown): DepartmentFlowDispatchResult {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      message: 'Unexpected empty response from integration endpoint.',
    };
  }

  return {
    ok: Boolean((payload as DepartmentFlowDispatchResult).ok),
    event_id: (payload as DepartmentFlowDispatchResult).event_id,
    correlation_id: (payload as DepartmentFlowDispatchResult).correlation_id,
    route_key: (payload as DepartmentFlowDispatchResult).route_key,
    source_department_key: (payload as DepartmentFlowDispatchResult).source_department_key,
    target_department_key: (payload as DepartmentFlowDispatchResult).target_department_key,
    event_code: (payload as DepartmentFlowDispatchResult).event_code,
    status: (payload as DepartmentFlowDispatchResult).status,
    dispatch_endpoint: (payload as DepartmentFlowDispatchResult).dispatch_endpoint,
    message: (payload as DepartmentFlowDispatchResult).message,
  };
}

function normalizeStatusResult(payload: unknown): DepartmentFlowStatusResult {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      message: 'Unexpected empty response from integration status endpoint.',
    };
  }

  return payload as DepartmentFlowStatusResult;
}

export async function fetchDepartmentIntegrationRegistry(sourceDepartmentKey = 'hr') {
  try {
    const { data, error } = await supabase.rpc('get_department_integration_registry', {
      _source_department_key: sourceDepartmentKey,
    });

    if (error) {
      throw error;
    }

    return { data: normalizeRegistryPayload(data), error: null };
  } catch (error) {
    console.error('Error fetching department integration registry:', error);
    return {
      data: [] as DepartmentIntegrationRegistryItem[],
      error: error instanceof Error ? error.message : 'Failed to fetch department integration registry',
    };
  }
}

export async function dispatchDepartmentFlow(input: DispatchDepartmentFlowInput) {
  const payload = input.payload ?? {};

  try {
    const { data, error } = await supabase.rpc('dispatch_department_flow', {
      _source_department_key: 'hr',
      _target_department_key: input.targetDepartmentKey,
      _event_code: input.eventCode ?? null,
      _source_record_id: input.sourceRecordId ?? null,
      _payload: payload as any,
      _requested_by: input.requestedBy ?? null,
    });

    if (error) {
      throw error;
    }

    return { data: normalizeDispatchResult(data), error: null };
  } catch (error) {
    console.error('Error dispatching department flow:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to dispatch department flow',
    };
  }
}

export async function fetchDepartmentFlowStatus({
  eventId,
  correlationId,
}: {
  eventId?: string;
  correlationId?: string;
}) {
  try {
    const { data, error } = await supabase.rpc('get_department_flow_status', {
      _event_id: eventId ?? null,
      _correlation_id: correlationId ?? null,
    });

    if (error) {
      throw error;
    }

    return { data: normalizeStatusResult(data), error: null };
  } catch (error) {
    console.error('Error fetching department flow status:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch department flow status',
    };
  }
}
