import { dispatchDepartmentFlow, getFlowEventStatus, type FlowEventStatus } from './departmentIntegration';

type TrackedHrDispatch<T> = FlowEventStatus & {
  payload?: T;
};

async function trackHrDispatch<T>(
  targetDepartment: 'cashier' | 'clinic' | 'comlab' | 'pmed',
  eventCode: string,
  payload: Record<string, unknown>,
  sourceRecordId: string | undefined,
  attachment: T,
  fallbackMessage: string
): Promise<TrackedHrDispatch<T>> {
  const result = await dispatchDepartmentFlow('hr', targetDepartment, eventCode, payload, sourceRecordId);

  if (result.ok && result.correlation_id) {
    const status = await getFlowEventStatus(undefined, result.correlation_id);
    return {
      ...status,
      payload: attachment
    };
  }

  return {
    ok: false,
    last_error: result.message || fallbackMessage,
    payload: attachment
  };
}

export type HrPayrollDataDispatch = {
  batch_label: string;
  period: string;
  employee_count: number;
  net_amount?: number;
  remarks?: string;
  requested_by?: string;
};

export async function dispatchPayrollDataToCashier(
  data: HrPayrollDataDispatch,
  sourceRecordId?: string
): Promise<TrackedHrDispatch<HrPayrollDataDispatch>> {
  return await trackHrDispatch(
    'cashier',
    'payroll_submission',
    {
      batch_label: data.batch_label,
      pay_period: data.period,
      employee_count: data.employee_count,
      net_amount: data.net_amount,
      remarks: data.remarks,
      requested_by: data.requested_by
    },
    sourceRecordId,
    data,
    'Failed to dispatch payroll data to Cashier.'
  );
}

export type HrStaffProfileSync = {
  employee_id: string;
  employee_number?: string;
  employee_name: string;
  department?: string;
  employment_status?: string;
  schedule?: string;
  role?: string;
  account_requests?: string[];
};

export async function dispatchStaffProfileSyncToClinic(
  profile: HrStaffProfileSync,
  sourceRecordId?: string
): Promise<TrackedHrDispatch<HrStaffProfileSync>> {
  return await trackHrDispatch(
    'clinic',
    'employee_profile_sync',
    {
      employee_id: profile.employee_id,
      employee_number: profile.employee_number,
      employee_name: profile.employee_name,
      department_name: profile.department,
      employment_status: profile.employment_status,
      schedule: profile.schedule
    },
    sourceRecordId,
    profile,
    'Failed to dispatch staff profile sync to Clinic.'
  );
}

export async function dispatchStaffProfileSyncToComlab(
  profile: HrStaffProfileSync,
  sourceRecordId?: string
): Promise<TrackedHrDispatch<HrStaffProfileSync>> {
  return await trackHrDispatch(
    'comlab',
    'employee_profile_sync',
    {
      employee_id: profile.employee_id,
      employee_number: profile.employee_number,
      employee_name: profile.employee_name,
      role: profile.role,
      department_name: profile.department,
      account_requests: profile.account_requests
    },
    sourceRecordId,
    profile,
    'Failed to dispatch staff profile sync to COMLAB.'
  );
}

export async function dispatchStaffProfileSyncToPmed(
  profile: HrStaffProfileSync,
  sourceRecordId?: string
): Promise<TrackedHrDispatch<HrStaffProfileSync>> {
  return await trackHrDispatch(
    'pmed',
    'employee_profile_sync',
    {
      employee_id: profile.employee_id,
      employee_number: profile.employee_number,
      employee_name: profile.employee_name,
      department_name: profile.department,
      employment_status: profile.employment_status,
      schedule: profile.schedule
    },
    sourceRecordId,
    profile,
    'Failed to dispatch staff profile sync to PMED.'
  );
}
