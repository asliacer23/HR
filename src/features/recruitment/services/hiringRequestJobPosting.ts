/**
 * When HR applies a new status to a department hiring request (from pending → active pipeline),
 * auto-create a job_posting row with generated copy linked to the request reference.
 */

import {
  type DepartmentHiringRequestRow,
  type DepartmentHiringRequestStatus,
  mergeDepartmentHiringRequestMetadata,
} from '@/features/recruitment/services/departmentHiringRequestsService';
import {
  createJobPosting,
  fetchPositions,
  type CreateJobPostingInput,
} from '@/features/recruitment/services/jobPostingsService';
import { supabase } from '@/integrations/supabase/client';

const METADATA_JOB_KEY = 'hr_auto_job_posting_id';

const RECRUITMENT_STATUSES: Set<DepartmentHiringRequestStatus> = new Set([
  'queue',
  'waiting_applicant',
  'hiring',
  'approved',
]);

export function getLinkedAutoJobPostingId(row: DepartmentHiringRequestRow): string | undefined {
  const v = row.metadata?.[METADATA_JOB_KEY];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export function shouldAutoCreateJobPostingFromRequest(
  previousStatus: DepartmentHiringRequestStatus,
  nextStatus: DepartmentHiringRequestStatus
): boolean {
  if (previousStatus !== 'pending') return false;
  return RECRUITMENT_STATUSES.has(nextStatus);
}

function parseRequestedCount(notes: string | null): number {
  if (!notes) return 1;
  const m = notes.match(/Requested count:\s*(\d+)/i);
  if (!m) return 1;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function roleLabel(role: 'doctor' | 'nurse'): string {
  return role === 'doctor' ? 'Doctor' : 'Nurse';
}

type PositionRow = {
  id: string;
  title: string;
  min_salary?: number | null;
  max_salary?: number | null;
  departments?: { name: string } | null;
};

export function pickPositionForHiringRequest(
  positions: PositionRow[],
  row: DepartmentHiringRequestRow
): PositionRow | null {
  const role = row.role_type;
  const dept = (row.department_name || '').toLowerCase();
  let best: { row: PositionRow; score: number } | null = null;
  for (const p of positions) {
    const t = (p.title || '').toLowerCase();
    const d = (p.departments?.name || '').toLowerCase();
    let score = 0;
    if (role === 'nurse' && t.includes('nurse')) score += 10;
    if (role === 'doctor' && (t.includes('doctor') || t.includes('physician'))) score += 10;
    if (role === 'doctor' && t.includes('nurse')) score -= 6;
    if (role === 'nurse' && (t.includes('doctor') || t.includes('physician'))) score -= 4;
    if (dept && d && (d.includes(dept.slice(0, 8)) || dept.includes(d.slice(0, 8)))) score += 5;
    if ((role === 'doctor' || role === 'nurse') && d.includes('clinic')) score += 3;
    if (score > (best?.score ?? -1)) best = { row: p, score };
  }
  return best && best.score > 0 ? best.row : null;
}

export function buildJobPostingInputFromHiringRequest(
  row: DepartmentHiringRequestRow,
  position: PositionRow | null
): CreateJobPostingInput {
  const count = parseRequestedCount(row.request_notes);
  const role = roleLabel(row.role_type);
  const dept = row.department_name || 'Clinic';
  const ref = row.request_reference;
  const by = row.requested_by || 'Requesting department';
  const notesBlock = row.request_notes?.trim()
    ? `\n\nNotes from request:\n${row.request_notes.trim()}`
    : '';

  const title =
    count > 1
      ? `${role} — ${dept} (${count} positions) · ${ref}`
      : `${role} — ${dept} · ${ref}`;

  const description = [
    `Staffing need raised by the Clinic / department and tracked in HR as ${ref}.`,
    '',
    `Department / unit: ${dept}`,
    `Role: ${role}${count > 1 ? ` × ${count}` : ''}`,
    `Requested by: ${by}`,
    `Request reference: ${ref}`,
    '',
    'Use this posting to collect and screen applicants until the hiring request is filled or closed in the department requests list.',
    notesBlock,
  ].join('\n');

  const requirements = [
    `Licensed or eligible to practice as a ${role.toLowerCase()} in line with institutional and regulatory requirements.`,
    `Able to support ${dept} operations as described in request ${ref}.`,
    'Completes HR onboarding, clearances, and credentialing after selection.',
  ].join('\n');

  const responsibilities = [
    `Provide ${role.toLowerCase()} coverage and duties aligned with ${dept} standards.`,
    'Coordinate with clinic leadership and HR on scheduling and staffing updates.',
    'Maintain accurate records and comply with school health and safety policies.',
  ].join('\n');

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 60);
  const deadlineStr = deadline.toISOString().split('T')[0];

  const min = position?.min_salary != null ? Number(position.min_salary) : null;
  const max = position?.max_salary != null ? Number(position.max_salary) : null;

  return {
    position_id: position?.id ?? null,
    title,
    description: description.trim(),
    requirements,
    responsibilities,
    salary_range_min: Number.isFinite(min as number) ? min : null,
    salary_range_max: Number.isFinite(max as number) ? max : null,
    deadline: deadlineStr,
    is_active: true,
  };
}

export type AutoJobPostingResult = { created: boolean; jobPostingId?: string; skippedReason?: string; error?: string };

/**
 * Creates at most one auto job posting per hiring request (stored in metadata).
 */
export async function createJobPostingForHiringRequestIfNeeded(
  row: DepartmentHiringRequestRow,
  previousStatus: DepartmentHiringRequestStatus,
  nextStatus: DepartmentHiringRequestStatus
): Promise<AutoJobPostingResult> {
  if (!shouldAutoCreateJobPostingFromRequest(previousStatus, nextStatus)) {
    return { created: false, skippedReason: 'not_eligible_status' };
  }
  if (getLinkedAutoJobPostingId(row)) {
    return { created: false, skippedReason: 'already_linked' };
  }

  const ref = row.request_reference;
  const { data: existingJobs } = await supabase
    .from('job_postings')
    .select('id, title')
    .ilike('title', `%${ref}%`)
    .limit(8);
  const existing = existingJobs?.find((j) => String(j.title || '').includes(ref));
  if (existing?.id) {
    try {
      await mergeDepartmentHiringRequestMetadata(row.id, { [METADATA_JOB_KEY]: String(existing.id) });
    } catch {
      /* ignore */
    }
    return { created: false, skippedReason: 'job_already_exists_for_ref' };
  }

  const { data: positions, error: posErr } = await fetchPositions();
  if (posErr) {
    return { created: false, error: posErr };
  }

  const picked = pickPositionForHiringRequest((positions || []) as PositionRow[], row);
  const input = buildJobPostingInputFromHiringRequest(row, picked);
  const { data: job, error: jobErr } = await createJobPosting(input);

  if (jobErr || !job?.id) {
    return { created: false, error: jobErr || 'Job posting insert failed' };
  }

  try {
    await mergeDepartmentHiringRequestMetadata(row.id, { [METADATA_JOB_KEY]: String(job.id) });
  } catch (e) {
    return {
      created: true,
      jobPostingId: String(job.id),
      error: e instanceof Error ? e.message : 'Job created but failed to link reference on request',
    };
  }

  return { created: true, jobPostingId: String(job.id) };
}
