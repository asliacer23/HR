/**
 * Canonical job titles (and owning departments) for cross-department employee requests
 * and job posting position pickers. Keep in sync with HR seed / positions table.
 */
export type CrossDepartmentJobPosition = {
  title: string;
  departmentName: string;
};

export const CROSS_DEPARTMENT_JOB_POSITIONS: readonly CrossDepartmentJobPosition[] = [
  { title: 'Business Administration Professor', departmentName: 'School Administration' },
  { title: 'Clinic Nurse', departmentName: 'Clinic' },
  { title: 'College Programming Instructor', departmentName: 'School Administration' },
  { title: 'Guidance Counselor', departmentName: 'Prefect and Guidance' },
  { title: 'HR Director', departmentName: 'Human Resources' },
  { title: 'HR Officer', departmentName: 'Human Resources' },
  { title: 'IT Support Specialist', departmentName: 'Computer Laboratory / IT Services' },
  { title: 'Payroll and Benefits Officer', departmentName: 'Finance and Cashier Coordination' },
  { title: 'PMED Coordinator', departmentName: 'PMED' },
  { title: 'Registrar Associate', departmentName: 'Registrar' },
  { title: 'Senior High School English Instructor', departmentName: 'School Administration' },
] as const;

export function formatCrossDepartmentPositionLabel(row: CrossDepartmentJobPosition): string {
  return `${row.title} (${row.departmentName})`;
}
