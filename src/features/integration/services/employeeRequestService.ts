import { supabase } from '@/integrations/supabase/client';

export type EmployeeRequestStatus = 'pending' | 'approved' | 'rejected';
export type EmployeeRequestUrgency = 'low' | 'medium' | 'high' | 'urgent';

export interface EmployeeRequestRecord {
  id: string;
  department: string;
  position: string;
  reason: string;
  urgency: EmployeeRequestUrgency;
  status: EmployeeRequestStatus;
  hr_remarks: string | null;
  created_at: string;
}

export interface SubmitEmployeeRequestInput {
  department: string;
  position: string;
  reason: string;
  urgency: EmployeeRequestUrgency;
  notes?: string;
}

const NOTES_SEPARATOR = '\n\nNotes: ';

function normalizeUrgency(value: string): EmployeeRequestUrgency {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'urgent') {
    return value;
  }
  return 'medium';
}

function normalizeStatus(value: string): EmployeeRequestStatus {
  if (value === 'approved' || value === 'rejected' || value === 'pending') {
    return value;
  }
  return 'pending';
}

function mapRecord(row: Record<string, unknown>): EmployeeRequestRecord {
  return {
    id: String(row.id ?? ''),
    department: String(row.department ?? ''),
    position: String(row.position ?? ''),
    reason: String(row.reason ?? ''),
    urgency: normalizeUrgency(String(row.urgency ?? 'medium')),
    status: normalizeStatus(String(row.status ?? 'pending')),
    hr_remarks: typeof row.hr_remarks === 'string' ? row.hr_remarks : null,
    created_at: String(row.created_at ?? ''),
  };
}

// POST /employee-request
export async function postEmployeeRequest(input: SubmitEmployeeRequestInput) {
  const formattedReason = input.notes?.trim()
    ? `${input.reason}${NOTES_SEPARATOR}${input.notes.trim()}`
    : input.reason;

  const { data, error } = await supabase
    .from('employee_requests')
    .insert([
      {
        department: input.department,
        position: input.position,
        reason: formattedReason,
        urgency: input.urgency,
        status: 'pending',
      },
    ])
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapRecord((data as Record<string, unknown>) ?? {}), error: null };
}

// GET /employee-request/status
export async function getEmployeeRequestStatus(department: string) {
  const { data, error } = await supabase
    .from('employee_requests')
    .select('*')
    .eq('department', department)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [] as EmployeeRequestRecord[], error: error.message };
  }

  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return { data: rows.map(mapRecord), error: null };
}

export async function getAllEmployeeRequests() {
  const { data, error } = await supabase
    .from('employee_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [] as EmployeeRequestRecord[], error: error.message };
  }

  const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  return { data: rows.map(mapRecord), error: null };
}

// PUT /employee-request/{id}/approve
export async function approveEmployeeRequest(id: string, remarks: string, isHr: boolean) {
  if (!isHr) {
    return { data: null, error: 'Only HR can approve requests.' };
  }

  const { data, error } = await supabase
    .from('employee_requests')
    .update({
      status: 'approved',
      hr_remarks: remarks.trim() || null,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapRecord((data as Record<string, unknown>) ?? {}), error: null };
}

// PUT /employee-request/{id}/reject
export async function rejectEmployeeRequest(id: string, remarks: string, isHr: boolean) {
  if (!isHr) {
    return { data: null, error: 'Only HR can reject requests.' };
  }

  const { data, error } = await supabase
    .from('employee_requests')
    .update({
      status: 'rejected',
      hr_remarks: remarks.trim() || null,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapRecord((data as Record<string, unknown>) ?? {}), error: null };
}
