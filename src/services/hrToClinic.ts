import { dispatchDepartmentFlow, getFlowEventStatus, type FlowEventStatus } from './departmentIntegration';

export type PreEmploymentClearanceRequest = {
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  start_date?: string;
  previous_medical_history?: string;
  request_date?: string;
  requested_by?: string;
  notes?: string;
};

export async function dispatchPreEmploymentClearanceRequestToClinic(
  request: PreEmploymentClearanceRequest,
  sourceRecordId?: string
): Promise<FlowEventStatus> {
  const payload: Record<string, unknown> = {
    employee_id: request.employee_id,
    employee_name: request.employee_name,
    position: request.position,
    department: request.department,
    start_date: request.start_date,
    previous_medical_history: request.previous_medical_history,
    request_date: request.request_date || new Date().toISOString(),
    requested_by: request.requested_by,
    notes: request.notes
  };

  const result = await dispatchDepartmentFlow(
    'hr',
    'clinic',
    'pre_employment_clearance_request',
    payload,
    sourceRecordId
  );

  if (result.ok && result.correlation_id) {
    return await getFlowEventStatus(undefined, result.correlation_id);
  }

  return {
    ok: false,
    last_error: result.message || 'Failed to dispatch pre-employment clearance request'
  } as FlowEventStatus;
}

export async function requestMedicalClearance(
  employeeId: string,
  employeeName: string,
  position: string,
  department: string,
  startDate?: string
): Promise<FlowEventStatus> {
  return dispatchPreEmploymentClearanceRequestToClinic({
    employee_id: employeeId,
    employee_name: employeeName,
    position,
    department,
    start_date: startDate
  });
}
