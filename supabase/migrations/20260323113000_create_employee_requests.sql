create table if not exists public.employee_requests (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  position text not null,
  reason text not null,
  urgency text not null default 'medium',
  status text not null default 'pending',
  hr_remarks text null,
  created_at timestamptz not null default now(),
  constraint employee_requests_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint employee_requests_urgency_check check (urgency in ('low', 'medium', 'high', 'urgent'))
);

create index if not exists idx_employee_requests_department_created_at
  on public.employee_requests (department, created_at desc);

create index if not exists idx_employee_requests_status_created_at
  on public.employee_requests (status, created_at desc);
