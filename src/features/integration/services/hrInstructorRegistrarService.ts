import { supabase } from '@/integrations/supabase/client';
import {
  dispatchDepartmentFlow,
  fetchDepartmentFlowEvents,
} from '@/features/integration/services/departmentIntegrationService';

export interface HrInstructorRecord {
  id: string;
  employee_id: string;
  employee_no: string;
  first_name: string;
  last_name: string;
  department: string;
  specialization: string;
  academic_rank: string;
  employment_status: string;
  primary_app_role: string;
  is_admin: boolean;
  connected_systems: Array<Record<string, unknown>>;
  integration_ready: boolean;
  created_at: string;
  updated_at: string;
}

export interface DispatchHrInstructorToRegistrarInput {
  instructorId: string;
  instructor?: HrInstructorRecord | null;
  collegeUnit: string;
  semester: string;
  teachingLoad?: string[];
  scheduleMatrix?: Record<string, unknown>;
  remarks?: string;
  requestedBy?: string;
}

export interface HrInstructorRegistrarDispatchResult {
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
  instructor_id?: string;
  employee_no?: string;
  employee_name?: string;
  college_unit?: string;
  semester?: string;
}

export interface HrInstructorRegistrarHistoryEvent {
  event_id: string;
  correlation_id: string;
  route_key: string;
  flow_name: string;
  source_record_id: string | null;
  event_code: string;
  status: string;
  dispatch_endpoint: string;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  last_error: string | null;
  dispatched_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function deriveAcademicRank(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes('assistant professor')) {
    return 'Assistant Professor';
  }

  if (normalized.includes('associate professor')) {
    return 'Associate Professor';
  }

  if (normalized.includes('professor')) {
    return 'Professor';
  }

  return 'Instructor';
}

function compareInstructorRecords(left: HrInstructorRecord, right: HrInstructorRecord) {
  return (
    left.last_name.localeCompare(right.last_name) ||
    left.first_name.localeCompare(right.first_name) ||
    left.employee_no.localeCompare(right.employee_no)
  );
}

function normalizeDispatchResult(payload: unknown): HrInstructorRegistrarDispatchResult {
  const record = asObject(payload);

  if (!record) {
    return {
      ok: false,
      message: 'Unexpected empty response from Registrar dispatch endpoint.',
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
    instructor_id: asString(record.instructor_id) ?? undefined,
    employee_no: asString(record.employee_no) ?? undefined,
    employee_name: asString(record.employee_name) ?? undefined,
    college_unit: asString(record.college_unit) ?? undefined,
    semester: asString(record.semester) ?? undefined,
  };
}

function applyInstructorFilters(
  records: HrInstructorRecord[],
  {
    search,
    employmentStatus,
    limit,
  }: {
    search?: string;
    employmentStatus?: string;
    limit: number;
  }
) {
  const normalizedSearch = search?.trim().toLowerCase() ?? '';
  const normalizedStatus = employmentStatus?.trim().toLowerCase() ?? '';

  return records
    .filter((record) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          record.employee_no,
          record.first_name,
          record.last_name,
          record.department,
          record.specialization,
          record.academic_rank,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        !normalizedStatus || record.employment_status.toLowerCase() === normalizedStatus;

      return matchesSearch && matchesStatus;
    })
    .sort(compareInstructorRecords)
    .slice(0, Math.max(limit, 1));
}

async function fetchHrInstructorsFromBaseTables(maxRows: number) {
  const { data: employees, error } = await supabase
    .from('employees')
    .select(
      `
        id,
        user_id,
        employee_number,
        employee_type,
        employment_status,
        created_at,
        updated_at,
        department:departments(name),
        position:positions(title)
      `
    )
    .limit(maxRows);

  if (error) {
    throw error;
  }

  const employeeRows = Array.isArray(employees) ? employees : [];
  const userIds = employeeRows
    .map((employee) => asString((employee as Record<string, unknown>).user_id))
    .filter((userId): userId is string => Boolean(userId));

  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
    userIds.length > 0
      ? await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', userIds),
          supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

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
    const entries = rolesByUserId.get(role.user_id) ?? [];
    entries.push(role.role);
    rolesByUserId.set(role.user_id, entries);
  }

  return employeeRows
    .map((employee) => {
      const record = employee as Record<string, unknown>;
      const positionTitle = String(asObject(record.position)?.title ?? '');
      const employeeType = String(record.employee_type ?? '').toLowerCase();
      const isInstructorLike =
        ['teacher', 'principal', 'registrar'].includes(employeeType) ||
        positionTitle.toLowerCase().includes('instructor') ||
        positionTitle.toLowerCase().includes('professor');

      if (!isInstructorLike) {
        return null;
      }

      const userId = asString(record.user_id) ?? '';
      const profile = userId ? profileByUserId.get(userId) : null;
      const roleNames = userId ? rolesByUserId.get(userId) ?? [] : [];
      const primaryRole = roleNames.includes('system_admin')
        ? 'system_admin'
        : roleNames.includes('hr_admin')
          ? 'hr_admin'
          : 'employee';

      return {
        id: String(record.id ?? ''),
        employee_id: String(record.id ?? ''),
        employee_no: String(record.employee_number ?? ''),
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        department: String(asObject(record.department)?.name ?? 'School Administration'),
        specialization: positionTitle,
        academic_rank: deriveAcademicRank(positionTitle),
        employment_status: String(record.employment_status ?? ''),
        primary_app_role: primaryRole,
        is_admin: roleNames.includes('system_admin') || roleNames.includes('hr_admin'),
        connected_systems: [],
        integration_ready: String(record.employment_status ?? '').toLowerCase() !== 'terminated',
        created_at: String(record.created_at ?? ''),
        updated_at: String(record.updated_at ?? ''),
      } satisfies HrInstructorRecord;
    })
    .filter((item): item is HrInstructorRecord => item !== null);
}

async function findHrInstructorById(instructorId: string) {
  const candidates = await fetchHrInstructorsFromBaseTables(500);
  return candidates.find(
    (candidate) => candidate.id === instructorId || candidate.employee_id === instructorId
  ) ?? null;
}

function buildInstructorName(instructor: HrInstructorRecord) {
  return `${instructor.first_name} ${instructor.last_name}`.trim();
}

function buildSourceRecordId(instructor: HrInstructorRecord) {
  const baseId = instructor.employee_no || instructor.employee_id.replaceAll('-', '').slice(0, 8);
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

  return `HR-INSTR-REG-${baseId}-${stamp}`;
}

export async function fetchHrInstructors({
  search,
  employmentStatus,
  limit = 100,
}: {
  search?: string;
  employmentStatus?: string;
  limit?: number;
} = {}) {
  try {
    const records = await fetchHrInstructorsFromBaseTables(Math.max(limit * 4, 200));

    return {
      data: applyInstructorFilters(records, { search, employmentStatus, limit }),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching HR instructors:', error);
    return {
      data: [] as HrInstructorRecord[],
      error: error instanceof Error ? error.message : 'Failed to fetch HR instructors',
    };
  }
}

export async function dispatchHrInstructorToRegistrar(input: DispatchHrInstructorToRegistrarInput) {
  try {
    const instructor =
      input.instructor && input.instructor.id === input.instructorId
        ? input.instructor
        : await findHrInstructorById(input.instructorId);

    if (!instructor) {
      return {
        data: null,
        error: 'Instructor was not found in the available HR sources.',
      };
    }

    const employeeName = buildInstructorName(instructor);
    const collegeUnit = input.collegeUnit.trim();
    const semester = input.semester.trim();
    const remarks = input.remarks?.trim();

    const payload = {
      employee_id: instructor.employee_id,
      employee_name: employeeName,
      employee_number: instructor.employee_no,
      department_name: instructor.department,
      specialization: instructor.specialization,
      academic_rank: instructor.academic_rank,
      employment_status: instructor.employment_status,
      college_unit: collegeUnit || undefined,
      semester: semester || undefined,
      teaching_load: input.teachingLoad?.filter(Boolean) ?? [],
      schedule_matrix: input.scheduleMatrix ?? {},
      remarks: remarks || undefined,
      source_view: 'hr.instructors',
    };

    const dispatchResult = await dispatchDepartmentFlow({
      targetDepartmentKey: 'registrar',
      eventCode: 'faculty_assignment_validation',
      sourceRecordId: buildSourceRecordId(instructor),
      payload,
      requestedBy: input.requestedBy,
    });

    if (dispatchResult.error) {
      throw new Error(dispatchResult.error);
    }

    return {
      data: {
        ...normalizeDispatchResult(dispatchResult.data),
        instructor_id: instructor.employee_id,
        employee_no: instructor.employee_no,
        employee_name: employeeName,
        college_unit: collegeUnit || undefined,
        semester: semester || undefined,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error dispatching HR instructor to Registrar:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to dispatch instructor to Registrar',
    };
  }
}

export async function fetchHrInstructorRegistrarHistory(instructorId: string, limit = 20) {
  try {
    const { data, error } = await fetchDepartmentFlowEvents({
      departmentKey: 'hr',
      direction: 'outgoing',
      counterpartyDepartmentKey: 'registrar',
      eventCode: 'faculty_assignment_validation',
      limit: Math.max(limit * 5, 50),
    });

    if (error) {
      throw new Error(error);
    }

    return {
      data: data
        .filter((event) => event.request_payload.employee_id === instructorId)
        .slice(0, Math.max(limit, 1))
        .map((event) => ({
          event_id: event.event_id,
          correlation_id: event.correlation_id,
          route_key: event.route_key,
          flow_name: event.flow_name,
          source_record_id: event.source_record_id,
          event_code: event.event_code,
          status: event.status,
          dispatch_endpoint: event.dispatch_endpoint,
          request_payload: event.request_payload,
          response_payload: event.response_payload,
          last_error: event.last_error,
          dispatched_at: event.dispatched_at,
          acknowledged_at: event.acknowledged_at,
          created_at: event.created_at,
          updated_at: event.updated_at,
        })),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching HR instructor Registrar history:', error);
    return {
      data: [] as HrInstructorRegistrarHistoryEvent[],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch instructor Registrar history',
    };
  }
}
