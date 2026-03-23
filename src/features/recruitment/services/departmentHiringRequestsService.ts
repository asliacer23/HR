/**
 * Department Hiring Requests — reads public.hr_staff_requests in Supabase directly.
 *
 * Both HR and Clinic share Supabase project cbwgqzrgcyxycajvmvwr.
 * The tables live in public schema (exposed to PostgREST by default).
 * Run HR/supabase/migrations/20260323195000_create_hiring_request_tables_if_missing.sql
 * once in the Supabase SQL Editor to create them if they don't exist yet.
 */

import { supabase } from '@/integrations/supabase/client';

export type DepartmentHiringRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'queue'
  | 'waiting_applicant'
  | 'hiring'
  | 'hired';

export interface DepartmentHiringRequestRow {
  id: number;
  request_reference: string;
  staff_name: string;
  role_type: 'doctor' | 'nurse';
  department_name: string;
  request_status: DepartmentHiringRequestStatus;
  requested_by: string | null;
  created_at: string;
  request_notes: string | null;
  metadata: Record<string, unknown> | null;
}

export type DepartmentHiringRequestsPagedParams = {
  page: number;
  perPage: number;
  statusFilter: 'all' | DepartmentHiringRequestStatus;
};

export type DepartmentHiringRequestsPagedResult = {
  items: DepartmentHiringRequestRow[];
  total: number;
};

// ─── Internal types ───────────────────────────────────────────────────────────

type RequestRow = {
  id: number;
  request_reference: string;
  staff_id: number;
  request_status: string;
  requested_by: string | null;
  created_at: string;
  request_notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

type StaffRow = {
  id: number;
  full_name: string;
  role_type: string;
  department_name: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRow(req: RequestRow, staff: StaffRow | undefined): DepartmentHiringRequestRow {
  const role = (staff?.role_type || 'nurse').toLowerCase();
  const meta = req.metadata;
  return {
    id: req.id,
    request_reference: req.request_reference,
    staff_name: staff?.full_name || 'Unknown Staff',
    role_type: role === 'doctor' ? 'doctor' : 'nurse',
    department_name: staff?.department_name || 'Unknown Department',
    request_status: req.request_status as DepartmentHiringRequestStatus,
    requested_by: req.requested_by,
    created_at: req.created_at,
    request_notes: req.request_notes ?? null,
    metadata: meta && typeof meta === 'object' && !Array.isArray(meta) ? (meta as Record<string, unknown>) : null,
  };
}

async function resolveStaff(staffIds: number[]): Promise<Map<number, StaffRow>> {
  if (staffIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('hr_staff_directory')
    .select('id, full_name, role_type, department_name')
    .in('id', staffIds);
  if (error) throw new Error(error.message);
  return new Map((data || []).map((row) => [row.id as number, row as StaffRow]));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Paginated hiring requests. Queries public.hr_staff_requests via Supabase JS.
 */
export async function fetchDepartmentHiringRequestsPaged(
  params: DepartmentHiringRequestsPagedParams
): Promise<DepartmentHiringRequestsPagedResult> {
  const page = Math.max(1, params.page);
  const perPage = Math.min(50, Math.max(1, params.perPage));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let q = supabase
    .from('hr_staff_requests')
    .select('id, request_reference, staff_id, request_status, requested_by, created_at, request_notes, metadata', {
      count: 'exact',
    });

  if (params.statusFilter === 'all') {
    q = q.neq('request_status', 'hired');
  } else {
    q = q.eq('request_status', params.statusFilter);
  }

  const { data, error, count } = await q
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message || 'Failed to load hiring requests.');

  const rows = (data || []) as RequestRow[];
  const staffIds = Array.from(new Set(rows.map((r) => r.staff_id).filter(Boolean)));
  const staffMap = await resolveStaff(staffIds);

  return {
    items: rows.map((r) => buildRow(r, staffMap.get(r.staff_id))),
    total: typeof count === 'number' ? count : rows.length,
  };
}

/** Alias kept for catch-block callers in JobPostingsPage */
export async function fetchDepartmentHiringRequestsPagedViaApi(
  params: DepartmentHiringRequestsPagedParams
): Promise<DepartmentHiringRequestsPagedResult> {
  return fetchDepartmentHiringRequestsPaged(params);
}

/**
 * Lightweight urgent-only fetch for badge + notifications.
 * Only **pending** (new / untouched) requests — clears once HR applies another status in the modal.
 */
export async function fetchUrgentDepartmentHiringRequestsForNotify(
  limit: number
): Promise<DepartmentHiringRequestRow[]> {
  const safeLimit = Math.min(50, Math.max(1, limit));
  try {
    const { data, error } = await supabase
      .from('hr_staff_requests')
      .select('id, request_reference, staff_id, request_status, requested_by, created_at, request_notes, metadata')
      .eq('request_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) throw new Error(error.message);

    const rows = (data || []) as RequestRow[];
    const staffIds = Array.from(new Set(rows.map((r) => r.staff_id).filter(Boolean)));
    const staffMap = await resolveStaff(staffIds);
    return rows.map((r) => buildRow(r, staffMap.get(r.staff_id)));
  } catch {
    return [];
  }
}

/**
 * Update request status — writes directly to public.hr_staff_requests.
 */
export async function updateDepartmentHiringRequestStatus(payload: {
  id: number;
  requestStatus: DepartmentHiringRequestStatus;
  decidedBy?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('hr_staff_requests')
    .update({
      request_status: payload.requestStatus,
      decided_by: payload.decidedBy || 'HR Admin',
      decided_at: new Date().toISOString(),
    })
    .eq('id', payload.id);

  if (error) throw new Error(error.message || 'Failed to update request status.');
}

/** Merge keys into hr_staff_requests.metadata (read-modify-write). */
export async function mergeDepartmentHiringRequestMetadata(
  id: number,
  patch: Record<string, unknown>
): Promise<void> {
  const { data, error } = await supabase.from('hr_staff_requests').select('metadata').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message || 'Failed to read request metadata.');
  const current = (data?.metadata as Record<string, unknown>) || {};
  const next = { ...current, ...patch };
  const { error: uerr } = await supabase.from('hr_staff_requests').update({ metadata: next }).eq('id', id);
  if (uerr) throw new Error(uerr.message || 'Failed to update request metadata.');
}

/** @deprecated — use fetchDepartmentHiringRequestsPaged */
export async function fetchDepartmentHiringRequests(): Promise<DepartmentHiringRequestRow[]> {
  const { items } = await fetchDepartmentHiringRequestsPaged({ page: 1, perPage: 100, statusFilter: 'all' });
  return items;
}
