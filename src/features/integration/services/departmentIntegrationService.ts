import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

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

export type DepartmentFlowDirection = 'all' | 'incoming' | 'outgoing';

export interface DepartmentFlowEvent {
  event_id: string;
  correlation_id: string;
  route_key: string;
  flow_name: string;
  source_department_key: string;
  source_department_name: string;
  target_department_key: string;
  target_department_name: string;
  counterparty_department_key: string | null;
  counterparty_department_name: string | null;
  source_record_id: string | null;
  event_code: string;
  status: string;
  dispatch_endpoint: string;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  initiated_by: string | null;
  dispatched_at: string | null;
  acknowledged_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface FetchDepartmentFlowEventsInput {
  departmentKey?: string | null;
  direction?: DepartmentFlowDirection;
  status?: string | null;
  counterpartyDepartmentKey?: string | null;
  eventCode?: string | null;
  limit?: number;
}

export interface AcknowledgeDepartmentFlowInput {
  eventId: string;
  status?: string;
  response?: Record<string, unknown>;
  error?: string | null;
}

export interface AcknowledgeDepartmentFlowResult {
  ok: boolean;
  event_id?: string;
  correlation_id?: string;
  status?: string;
  acknowledged_at?: string;
  last_error?: string | null;
  message?: string;
}

export interface IntegrationConnectedSystem {
  department_key: string;
  department_name: string;
  system_code: string;
  module_directory: string;
  dispatch_rpc_name: string;
  default_action_label: string;
  is_department_default: boolean;
  is_primary: boolean;
  relationship_kind: string | null;
  supports_employee_sync: boolean;
  supports_admin_sync: boolean;
  default_event_code: string;
  available_routes: DepartmentRouteSummary[];
}

export interface IntegrationReadyEmployee {
  employee_id: string;
  user_id: string | null;
  employee_number: string;
  employee_type: string;
  employment_status: string;
  hire_date: string | null;
  department_id: string | null;
  department_name: string | null;
  department_code: string | null;
  position_id: string | null;
  position_title: string | null;
  supervisor_id: string | null;
  supervisor_name: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  employee_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  primary_app_role: string;
  role_names: string[];
  is_admin: boolean;
  integration_status: string;
  sync_enabled: boolean;
  allow_admin_sync: boolean;
  allow_department_sync: boolean;
  external_directory_id: string | null;
  primary_integration_department_key: string | null;
  last_target_department_key: string | null;
  last_event_id: string | null;
  last_dispatched_at: string | null;
  last_synced_at: string | null;
  connected_systems: IntegrationConnectedSystem[];
  connected_system_count: number;
  integration_ready: boolean;
  integration_metadata: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

export interface DispatchEmployeeProfileToDepartmentInput {
  employeeId: string;
  targetDepartmentKey: string;
  eventCode?: string;
  requestedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchEmployeeProfileToConnectedDepartmentsInput {
  employeeId: string;
  requestedBy?: string;
  onlyPrimary?: boolean;
  metadata?: Record<string, unknown>;
}

export interface EmployeeProfileBatchDispatchResult {
  ok: boolean;
  partial_success?: boolean;
  status?: string;
  employee_id?: string;
  employee_name?: string;
  attempted_target_count?: number;
  dispatched_target_count?: number;
  failed_target_count?: number;
  results: Array<Record<string, unknown>>;
  message?: string;
}

export interface DispatchDepartmentEmployeeDirectoryInput {
  departmentId: string;
  targetDepartmentKey?: string;
  requestedBy?: string;
  onlyPrimary?: boolean;
  includeInactive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DepartmentEmployeeDirectoryDispatchResult {
  ok: boolean;
  partial_success?: boolean;
  status?: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  attempted_employee_count?: number;
  dispatched_employee_count?: number;
  failed_employee_count?: number;
  results: Array<Record<string, unknown>>;
  message?: string;
}

interface IntegrationMappingRecord {
  department_id: string;
  integration_department_key: string;
  relationship_kind: string | null;
  is_primary: boolean;
  supports_employee_sync: boolean;
  supports_admin_sync: boolean;
  default_event_code: string;
}

interface EmployeeIntegrationProfileRecord {
  employee_id: string;
  primary_integration_department_key: string | null;
  integration_status: string;
  sync_enabled: boolean;
  allow_admin_sync: boolean;
  allow_department_sync: boolean;
  external_directory_id: string | null;
  last_target_department_key: string | null;
  last_event_id: string | null;
  last_dispatched_at: string | null;
  last_synced_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}

function normalizeRouteSummary(route: unknown): DepartmentRouteSummary {
  const record = asObject(route);

  return {
    route_key: String(record?.route_key ?? ''),
    flow_name: String(record?.flow_name ?? ''),
    event_code: String(record?.event_code ?? ''),
    endpoint_path: String(record?.endpoint_path ?? ''),
    priority: Number(record?.priority ?? 0),
    is_required: Boolean(record?.is_required),
  };
}

function normalizeRegistryPayload(payload: unknown): DepartmentIntegrationRegistryItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => {
    const record = asObject(item);

    return {
      department_key: String(record?.department_key ?? ''),
      department_name: String(record?.department_name ?? ''),
      system_code: String(record?.system_code ?? ''),
      module_directory: String(record?.module_directory ?? ''),
      purpose: String(record?.purpose ?? ''),
      default_action_label: String(record?.default_action_label ?? 'Dispatch'),
      dispatch_rpc_name: String(record?.dispatch_rpc_name ?? 'dispatch_department_flow'),
      status_rpc_name: String(record?.status_rpc_name ?? 'get_department_flow_status'),
      ack_rpc_name: String(record?.ack_rpc_name ?? 'acknowledge_department_flow'),
      dispatch_endpoint: String(record?.dispatch_endpoint ?? ''),
      pending_count: Number(record?.pending_count ?? 0),
      in_progress_count: Number(record?.in_progress_count ?? 0),
      failed_count: Number(record?.failed_count ?? 0),
      completed_count: Number(record?.completed_count ?? 0),
      route_count: Number(record?.route_count ?? 0),
      latest_status: asString(record?.latest_status),
      latest_event_code: asString(record?.latest_event_code),
      latest_correlation_id: asString(record?.latest_correlation_id),
      latest_created_at: asString(record?.latest_created_at),
      routes: Array.isArray(record?.routes)
      ? record.routes
          .map(normalizeRouteSummary)
          .sort((left, right) => left.priority - right.priority)
      : [],
    };
  });
}

function normalizeDispatchResult(payload: unknown): DepartmentFlowDispatchResult {
  const record = asObject(payload);

  if (!record) {
    return {
      ok: false,
      message: 'Unexpected empty response from integration endpoint.',
    };
  }

  return {
    ok: Boolean(record.ok),
    event_id: asString(record.event_id) ?? undefined,
    correlation_id: asString(record.correlation_id) ?? undefined,
    route_key: asString(record.route_key) ?? undefined,
    source_department_key: asString(record.source_department_key) ?? undefined,
    target_department_key: asString(record.target_department_key) ?? undefined,
    event_code: asString(record.event_code) ?? undefined,
    status: asString(record.status) ?? undefined,
    dispatch_endpoint: asString(record.dispatch_endpoint) ?? undefined,
    message: asString(record.message) ?? undefined,
  };
}

function normalizeStatusResult(payload: unknown): DepartmentFlowStatusResult {
  const record = asObject(payload);

  if (!record) {
    return {
      ok: false,
      message: 'Unexpected empty response from integration status endpoint.',
    };
  }

  return {
    ok: Boolean(record.ok),
    event_id: asString(record.event_id) ?? undefined,
    correlation_id: asString(record.correlation_id) ?? undefined,
    route_key: asString(record.route_key) ?? undefined,
    flow_name: asString(record.flow_name) ?? undefined,
    source_department_key: asString(record.source_department_key) ?? undefined,
    target_department_key: asString(record.target_department_key) ?? undefined,
    event_code: asString(record.event_code) ?? undefined,
    status: asString(record.status) ?? undefined,
    dispatch_endpoint: asString(record.dispatch_endpoint) ?? undefined,
    source_record_id: asString(record.source_record_id),
    request_payload: asObject(record.request_payload) ?? undefined,
    response_payload: asObject(record.response_payload) ?? undefined,
    initiated_by: asString(record.initiated_by),
    dispatched_at: asString(record.dispatched_at),
    acknowledged_at: asString(record.acknowledged_at),
    last_error: asString(record.last_error),
    created_at: asString(record.created_at) ?? undefined,
    updated_at: asString(record.updated_at) ?? undefined,
    message: asString(record.message) ?? undefined,
  };
}

function normalizeFlowEventsPayload(payload: unknown): DepartmentFlowEvent[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => {
      const record = asObject(item);

      if (!record) {
        return null;
      }

      return {
        event_id: String(record.event_id ?? ''),
        correlation_id: String(record.correlation_id ?? ''),
        route_key: String(record.route_key ?? ''),
        flow_name: String(record.flow_name ?? ''),
        source_department_key: String(record.source_department_key ?? ''),
        source_department_name: String(record.source_department_name ?? ''),
        target_department_key: String(record.target_department_key ?? ''),
        target_department_name: String(record.target_department_name ?? ''),
        counterparty_department_key: asString(record.counterparty_department_key),
        counterparty_department_name: asString(record.counterparty_department_name),
        source_record_id: asString(record.source_record_id),
        event_code: String(record.event_code ?? ''),
        status: String(record.status ?? ''),
        dispatch_endpoint: String(record.dispatch_endpoint ?? ''),
        request_payload: asObject(record.request_payload) ?? {},
        response_payload: asObject(record.response_payload) ?? {},
        initiated_by: asString(record.initiated_by),
        dispatched_at: asString(record.dispatched_at),
        acknowledged_at: asString(record.acknowledged_at),
        last_error: asString(record.last_error),
        created_at: String(record.created_at ?? ''),
        updated_at: String(record.updated_at ?? ''),
      } satisfies DepartmentFlowEvent;
    })
    .filter((item): item is DepartmentFlowEvent => item !== null);
}

function normalizeConnectedSystems(payload: unknown): IntegrationConnectedSystem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => {
    const record = asObject(item);

    return {
      department_key: String(record?.department_key ?? ''),
      department_name: String(record?.department_name ?? ''),
      system_code: String(record?.system_code ?? ''),
      module_directory: String(record?.module_directory ?? ''),
      dispatch_rpc_name: String(record?.dispatch_rpc_name ?? ''),
      default_action_label: String(record?.default_action_label ?? 'Dispatch'),
      is_department_default: asBoolean(record?.is_department_default),
      is_primary: asBoolean(record?.is_primary),
      relationship_kind: asString(record?.relationship_kind),
      supports_employee_sync: asBoolean(record?.supports_employee_sync, true),
      supports_admin_sync: asBoolean(record?.supports_admin_sync, true),
      default_event_code: String(record?.default_event_code ?? 'employee_profile_sync'),
      available_routes: Array.isArray(record?.available_routes)
        ? record.available_routes.map(normalizeRouteSummary)
        : [],
    };
  });
}

function normalizeIntegrationReadyEmployeesPayload(payload: unknown): IntegrationReadyEmployee[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => {
    const record = asObject(item);

    return {
      employee_id: String(record?.employee_id ?? ''),
      user_id: asString(record?.user_id),
      employee_number: String(record?.employee_number ?? ''),
      employee_type: String(record?.employee_type ?? ''),
      employment_status: String(record?.employment_status ?? ''),
      hire_date: asString(record?.hire_date),
      department_id: asString(record?.department_id),
      department_name: asString(record?.department_name),
      department_code: asString(record?.department_code),
      position_id: asString(record?.position_id),
      position_title: asString(record?.position_title),
      supervisor_id: asString(record?.supervisor_id),
      supervisor_name: asString(record?.supervisor_name),
      first_name: asString(record?.first_name),
      last_name: asString(record?.last_name),
      full_name: String(record?.full_name ?? ''),
      employee_name: String(record?.employee_name ?? ''),
      email: asString(record?.email),
      phone: asString(record?.phone),
      city: asString(record?.city),
      primary_app_role: String(record?.primary_app_role ?? 'employee'),
      role_names: Array.isArray(record?.role_names)
        ? record.role_names.map((role) => String(role))
        : [],
      is_admin: asBoolean(record?.is_admin),
      integration_status: String(record?.integration_status ?? 'ready'),
      sync_enabled: asBoolean(record?.sync_enabled, true),
      allow_admin_sync: asBoolean(record?.allow_admin_sync, true),
      allow_department_sync: asBoolean(record?.allow_department_sync, true),
      external_directory_id: asString(record?.external_directory_id),
      primary_integration_department_key: asString(record?.primary_integration_department_key),
      last_target_department_key: asString(record?.last_target_department_key),
      last_event_id: asString(record?.last_event_id),
      last_dispatched_at: asString(record?.last_dispatched_at),
      last_synced_at: asString(record?.last_synced_at),
      connected_systems: normalizeConnectedSystems(record?.connected_systems),
      connected_system_count: asNumber(record?.connected_system_count),
      integration_ready: asBoolean(record?.integration_ready),
      integration_metadata: asObject(record?.integration_metadata) ?? {},
      created_at: asString(record?.created_at),
      updated_at: asString(record?.updated_at),
    };
  });
}

function groupMappingsByDepartment(mappings: IntegrationMappingRecord[]) {
  return mappings.reduce<Map<string, IntegrationMappingRecord[]>>((accumulator, mapping) => {
    const current = accumulator.get(mapping.department_id) ?? [];
    current.push(mapping);
    accumulator.set(mapping.department_id, current);
    return accumulator;
  }, new Map<string, IntegrationMappingRecord[]>());
}

function buildConnectedSystemsForEmployee({
  registry,
  mappings,
}: {
  registry: DepartmentIntegrationRegistryItem[];
  mappings: IntegrationMappingRecord[];
}) {
  const mappingByTarget = new Map(
    mappings.map((mapping) => [mapping.integration_department_key, mapping])
  );

  return registry
    .map((item) => {
      const mapping = mappingByTarget.get(item.department_key);
      const primaryRoute = [...item.routes].sort((left, right) => left.priority - right.priority)[0];

      return {
        department_key: item.department_key,
        department_name: item.department_name,
        system_code: item.system_code,
        module_directory: item.module_directory,
        dispatch_rpc_name: item.dispatch_rpc_name,
        default_action_label: item.default_action_label,
        is_department_default: Boolean(mapping),
        is_primary: Boolean(mapping?.is_primary),
        relationship_kind: mapping?.relationship_kind ?? null,
        supports_employee_sync: mapping?.supports_employee_sync ?? true,
        supports_admin_sync: mapping?.supports_admin_sync ?? true,
        default_event_code: mapping?.default_event_code ?? primaryRoute?.event_code ?? 'employee_profile_sync',
        available_routes: [...item.routes].sort((left, right) => left.priority - right.priority),
      } satisfies IntegrationConnectedSystem;
    })
    .sort((left, right) => {
      if (left.is_primary !== right.is_primary) {
        return left.is_primary ? -1 : 1;
      }

      return left.department_name.localeCompare(right.department_name);
    });
}

async function fetchIntegrationReadyEmployeesFromTables({
  targetDepartmentKey,
  includeInactive = false,
  onlyAdmins = false,
}: {
  targetDepartmentKey?: string | null;
  includeInactive?: boolean;
  onlyAdmins?: boolean;
}) {
  const registryResult = await fetchDepartmentIntegrationRegistry('hr');
  const integrationRegistry = registryResult.data;

  const [
    { data: employees, error: employeesError },
    { data: profiles, error: profilesError },
    { data: roles, error: rolesError },
    { data: allDepts },
    { data: allPos },
  ] = await Promise.all([
    supabase
      .from('employees')
      .select(
        `
          id,
          user_id,
          employee_number,
          employee_type,
          employment_status,
          hire_date,
          department_id,
          position_id,
          supervisor_id,
          created_at,
          updated_at
        `
      )
      .order('employee_number'),
    supabase.from('profiles').select('user_id, first_name, last_name, email, phone, city'),
    supabase.from('user_roles').select('user_id, role'),
    supabase.from('departments').select('id, name, code'),
    supabase.from('positions').select('id, title'),
  ]);

  if (employeesError) {
    throw employeesError;
  }

  if (profilesError) {
    throw profilesError;
  }

  if (rolesError) {
    throw rolesError;
  }

  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile])
  );

  const rolesByUserId = new Map<string, string[]>();
  for (const role of roles ?? []) {
    const current = rolesByUserId.get(role.user_id) ?? [];
    current.push(role.role);
    rolesByUserId.set(role.user_id, current);
  }

  const mappings: IntegrationMappingRecord[] = [];
  const integrationProfiles: EmployeeIntegrationProfileRecord[] = [];
  const mappingsByDepartment = groupMappingsByDepartment(mappings);
  const integrationProfileByEmployeeId = new Map(
    integrationProfiles.map((profile) => [profile.employee_id, profile])
  );

  return (employees ?? [])
    .map((employee) => {
      const employeeRecord = employee as Record<string, unknown>;
      const departmentRecord = allDepts?.find(d => d.id === employeeRecord.department_id);
      const positionRecord = allPos?.find(p => p.id === employeeRecord.position_id);
      const userId = asString(employeeRecord.user_id);
      const roleNames = userId ? rolesByUserId.get(userId) ?? [] : [];
      const isAdmin =
        roleNames.includes('system_admin') ||
        roleNames.includes('hr_admin') ||
        String(employeeRecord.employee_type ?? '') === 'admin';
      const employeeProfile = integrationProfileByEmployeeId.get(String(employeeRecord.id ?? ''));
      const departmentMappings = employeeRecord.department_id
        ? mappingsByDepartment.get(String(employeeRecord.department_id)) ?? []
        : [];
      const connectedSystems = buildConnectedSystemsForEmployee({
        registry: integrationRegistry,
        mappings: departmentMappings,
      });
      const syncEnabled = employeeProfile?.sync_enabled ?? true;
      const integrationReady =
        syncEnabled &&
        String(employeeRecord.employment_status ?? '') !== 'terminated' &&
        connectedSystems.length > 0;
      const primaryMapping = departmentMappings.find((mapping) => mapping.is_primary);
      const personProfile = userId ? profileByUserId.get(userId) : null;
      const fullName = `${personProfile?.first_name ?? ''} ${personProfile?.last_name ?? ''}`.trim();

      return {
        employee_id: String(employeeRecord.id ?? ''),
        user_id: userId,
        employee_number: String(employeeRecord.employee_number ?? ''),
        employee_type: String(employeeRecord.employee_type ?? ''),
        employment_status: String(employeeRecord.employment_status ?? ''),
        hire_date: asString(employeeRecord.hire_date),
        department_id: asString(employeeRecord.department_id),
        department_name: asString(departmentRecord?.name),
        department_code: asString(departmentRecord?.code),
        position_id: asString(employeeRecord.position_id),
        position_title: asString(positionRecord?.title),
        supervisor_id: asString(employeeRecord.supervisor_id),
        supervisor_name: null,
        first_name: personProfile?.first_name ?? null,
        last_name: personProfile?.last_name ?? null,
        full_name: fullName,
        employee_name: fullName,
        email: personProfile?.email ?? null,
        phone: personProfile?.phone ?? null,
        city: personProfile?.city ?? null,
        primary_app_role: roleNames.includes('system_admin')
          ? 'system_admin'
          : roleNames.includes('hr_admin')
            ? 'hr_admin'
            : 'employee',
        role_names: roleNames,
        is_admin: isAdmin,
        integration_status: employeeProfile?.integration_status ?? 'ready',
        sync_enabled: syncEnabled,
        allow_admin_sync: employeeProfile?.allow_admin_sync ?? true,
        allow_department_sync: employeeProfile?.allow_department_sync ?? true,
        external_directory_id: employeeProfile?.external_directory_id ?? null,
        primary_integration_department_key:
          employeeProfile?.primary_integration_department_key ??
          primaryMapping?.integration_department_key ??
          (isAdmin ? 'hr' : null),
        last_target_department_key: employeeProfile?.last_target_department_key ?? null,
        last_event_id: employeeProfile?.last_event_id ?? null,
        last_dispatched_at: employeeProfile?.last_dispatched_at ?? null,
        last_synced_at: employeeProfile?.last_synced_at ?? null,
        connected_systems: connectedSystems,
        connected_system_count: connectedSystems.length,
        integration_ready: integrationReady,
        integration_metadata: employeeProfile?.metadata ?? {},
        created_at: asString(employeeRecord.created_at),
        updated_at: asString(employeeRecord.updated_at),
      } satisfies IntegrationReadyEmployee;
    })
    .filter((employee) => employee.integration_ready)
    .filter((employee) => {
      if (!includeInactive && !['active', 'probation', 'on_leave'].includes(employee.employment_status)) {
        return false;
      }

      if (onlyAdmins && !employee.is_admin) {
        return false;
      }

      if (!targetDepartmentKey) {
        return true;
      }

      return employee.connected_systems.some((system) => {
        if (system.department_key !== targetDepartmentKey) {
          return false;
        }

        return employee.is_admin ? system.supports_admin_sync : system.supports_employee_sync;
      });
    });
}

function normalizeBatchDispatchResult(payload: unknown): EmployeeProfileBatchDispatchResult {
  const record = asObject(payload);

  if (!record) {
    return {
      ok: false,
      results: [],
      message: 'Unexpected empty response from employee sync endpoint.',
    };
  }

  return {
    ok: Boolean(record.ok),
    partial_success: typeof record.partial_success === 'boolean' ? record.partial_success : undefined,
    status: asString(record.status) ?? undefined,
    employee_id: asString(record.employee_id) ?? undefined,
    employee_name: asString(record.employee_name) ?? undefined,
    attempted_target_count: typeof record.attempted_target_count === 'number' ? record.attempted_target_count : undefined,
    dispatched_target_count: typeof record.dispatched_target_count === 'number' ? record.dispatched_target_count : undefined,
    failed_target_count: typeof record.failed_target_count === 'number' ? record.failed_target_count : undefined,
    results: Array.isArray(record.results)
      ? record.results
          .map((item) => asObject(item))
          .filter((item): item is Record<string, unknown> => item !== null)
      : [],
    message: asString(record.message) ?? undefined,
  };
}

function normalizeDepartmentDirectoryDispatchResult(payload: unknown): DepartmentEmployeeDirectoryDispatchResult {
  const record = asObject(payload);

  if (!record) {
    return {
      ok: false,
      results: [],
      message: 'Unexpected empty response from department directory sync endpoint.',
    };
  }

  return {
    ok: Boolean(record.ok),
    partial_success: typeof record.partial_success === 'boolean' ? record.partial_success : undefined,
    status: asString(record.status) ?? undefined,
    department_id: asString(record.department_id) ?? undefined,
    department_name: asString(record.department_name) ?? undefined,
    department_code: asString(record.department_code) ?? undefined,
    attempted_employee_count:
      typeof record.attempted_employee_count === 'number' ? record.attempted_employee_count : undefined,
    dispatched_employee_count:
      typeof record.dispatched_employee_count === 'number' ? record.dispatched_employee_count : undefined,
    failed_employee_count:
      typeof record.failed_employee_count === 'number' ? record.failed_employee_count : undefined,
    results: Array.isArray(record.results)
      ? record.results
          .map((item) => asObject(item))
          .filter((item): item is Record<string, unknown> => item !== null)
      : [],
    message: asString(record.message) ?? undefined,
  };
}

function normalizeAcknowledgeResult(payload: unknown): AcknowledgeDepartmentFlowResult {
  const record = asObject(payload);

  if (!record) {
    return {
      ok: false,
      message: 'Unexpected empty response from acknowledgment endpoint.',
    };
  }

  return {
    ok: Boolean(record.ok),
    event_id: asString(record.event_id) ?? undefined,
    correlation_id: asString(record.correlation_id) ?? undefined,
    status: asString(record.status) ?? undefined,
    acknowledged_at: asString(record.acknowledged_at) ?? undefined,
    last_error: asString(record.last_error),
    message: asString(record.message) ?? undefined,
  };
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
      _payload: toJson(payload),
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

export async function fetchDepartmentFlowEvents(input: FetchDepartmentFlowEventsInput = {}) {
  try {
    const { data, error } = await supabase.rpc('get_department_flow_events', {
      _department_key: input.departmentKey ?? 'hr',
      _direction: input.direction ?? 'all',
      _status: input.status ?? null,
      _counterparty_department_key: input.counterpartyDepartmentKey ?? null,
      _event_code: input.eventCode ?? null,
      _limit: input.limit ?? 50,
    });

    if (error) {
      throw error;
    }

    return { data: normalizeFlowEventsPayload(data), error: null };
  } catch (error) {
    console.error('Error fetching department flow events:', error);
    return {
      data: [] as DepartmentFlowEvent[],
      error: error instanceof Error ? error.message : 'Failed to fetch department flow events',
    };
  }
}

export async function acknowledgeDepartmentFlow(input: AcknowledgeDepartmentFlowInput) {
  try {
    const { data, error } = await supabase.rpc('acknowledge_department_flow', {
      _event_id: input.eventId,
      _status: input.status ?? 'completed',
      _response: toJson(input.response ?? {}),
      _error: input.error ?? null,
    });

    if (error) {
      throw error;
    }

    return { data: normalizeAcknowledgeResult(data), error: null };
  } catch (error) {
    console.error('Error acknowledging department flow:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to acknowledge department flow',
    };
  }
}

export async function fetchIntegrationReadyEmployees({
  targetDepartmentKey,
  includeInactive = false,
  onlyAdmins = false,
}: {
  targetDepartmentKey?: string | null;
  includeInactive?: boolean;
  onlyAdmins?: boolean;
} = {}) {
  try {
    const data = await fetchIntegrationReadyEmployeesFromTables({
      targetDepartmentKey,
      includeInactive,
      onlyAdmins,
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching integration-ready employees:', error);
    return {
      data: [] as IntegrationReadyEmployee[],
      error: error instanceof Error ? error.message : 'Failed to fetch integration-ready employees',
    };
  }
}

export async function dispatchEmployeeProfileToDepartment(input: DispatchEmployeeProfileToDepartmentInput) {
  try {
    const { data, error } = await supabase.rpc('dispatch_employee_profile_to_department', {
      _employee_id: input.employeeId,
      _target_department_key: input.targetDepartmentKey,
      _event_code: input.eventCode ?? 'employee_profile_sync',
      _requested_by: input.requestedBy ?? null,
      _metadata: toJson(input.metadata ?? {}),
    });

    if (error) {
      throw error;
    }

    return { data: normalizeDispatchResult(data), error: null };
  } catch (error) {
    console.error('Error dispatching employee profile to department:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to dispatch employee profile to department',
    };
  }
}

export async function dispatchEmployeeProfileToConnectedDepartments(
  input: DispatchEmployeeProfileToConnectedDepartmentsInput
) {
  try {
    const { data, error } = await supabase.rpc('dispatch_employee_profile_to_connected_departments', {
      _employee_id: input.employeeId,
      _requested_by: input.requestedBy ?? null,
      _only_primary: input.onlyPrimary ?? false,
      _metadata: toJson(input.metadata ?? {}),
    });

    if (error) {
      throw error;
    }

    return { data: normalizeBatchDispatchResult(data), error: null };
  } catch (error) {
    console.error('Error dispatching employee profile to connected departments:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to dispatch employee profile to connected departments',
    };
  }
}

export async function dispatchDepartmentEmployeeDirectory(input: DispatchDepartmentEmployeeDirectoryInput) {
  try {
    const { data, error } = await supabase.rpc('dispatch_department_employee_directory', {
      _department_id: input.departmentId,
      _target_department_key: input.targetDepartmentKey ?? null,
      _requested_by: input.requestedBy ?? null,
      _only_primary: input.onlyPrimary ?? false,
      _include_inactive: input.includeInactive ?? false,
      _metadata: toJson(input.metadata ?? {}),
    });

    if (error) {
      throw error;
    }

    return { data: normalizeDepartmentDirectoryDispatchResult(data), error: null };
  } catch (error) {
    console.error('Error dispatching department employee directory:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to dispatch department employee directory',
    };
  }
}
