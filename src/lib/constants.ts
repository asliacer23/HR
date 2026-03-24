export type AppRole = 'system_admin' | 'hr_admin' | 'employee' | 'applicant';

export type ApplicationStatus = 'applied' | 'interview' | 'hired' | 'rejected';
export type EmploymentStatus = 'active' | 'on_leave' | 'terminated' | 'probation';
export type ContractType = 'full_time' | 'part_time' | 'contractual' | 'temporary';
export type EmployeeType = 'teacher' | 'principal' | 'registrar' | 'staff' | 'admin';
export type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type EvaluationStatus = 'pending' | 'in_progress' | 'completed';

export const ROLE_LABELS: Record<AppRole, string> = {
  system_admin: 'System Admin',
  hr_admin: 'HR Admin',
  employee: 'Employee',
  applicant: 'Applicant',
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  interview: 'Interview',
  hired: 'Hired',
  rejected: 'Rejected',
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  on_leave: 'On Leave',
  terminated: 'Terminated',
  probation: 'Probation',
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contractual: 'Contractual',
  temporary: 'Temporary',
};

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  teacher: 'Teacher',
  principal: 'Principal',
  registrar: 'Registrar',
  staff: 'Staff',
  admin: 'Admin',
};
