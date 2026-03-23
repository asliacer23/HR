-- Fix employee_directory view: add employee_name and connected_systems
-- so dispatch_employee_profile_to_connected_departments works correctly.
-- Error was: record "employee_record" has no field "employee_name"
-- Must DROP first because REPLACE cannot change column names/order.
-- Drop dependent view first, then public.

DROP VIEW IF EXISTS hr.employee_directory;
DROP VIEW IF EXISTS public.employee_directory;

CREATE VIEW public.employee_directory AS
WITH role_rank AS (
  SELECT ur.user_id, ur.role::text AS role_name,
    CASE ur.role
      WHEN 'system_admin' THEN 1 WHEN 'hr_admin' THEN 2
      WHEN 'employee' THEN 3 WHEN 'applicant' THEN 4
      ELSE 99
    END AS role_priority
  FROM public.user_roles ur
),
role_agg AS (
  SELECT rr.user_id,
    (array_agg(rr.role_name ORDER BY rr.role_priority, rr.role_name))[1] AS primary_app_role,
    bool_or(rr.role_name IN ('system_admin', 'hr_admin')) AS is_admin_account
  FROM role_rank rr
  GROUP BY rr.user_id
)
SELECT
  e.id AS employee_id,
  e.user_id,
  e.employee_number,
  e.employee_type::text AS employee_type,
  e.employment_status::text AS employment_status,
  e.hire_date,
  e.department_id,
  d.name AS department_name,
  d.code AS department_code,
  e.position_id,
  p.title AS position_title,
  e.supervisor_id,
  profile.first_name,
  profile.last_name,
  trim(concat_ws(' ', profile.first_name, profile.last_name)) AS full_name,
  trim(concat_ws(' ', profile.first_name, profile.last_name)) AS employee_name,
  profile.email,
  COALESCE(role_agg.primary_app_role, 'employee') AS primary_app_role,
  (COALESCE(role_agg.is_admin_account, false) OR e.employee_type::text = 'admin') AS is_admin,
  COALESCE(eip.integration_status, 'ready') AS integration_status,
  COALESCE(eip.sync_enabled, true) AS sync_enabled,
  '[]'::jsonb AS connected_systems,
  0::int AS connected_system_count,
  false AS integration_ready,
  e.created_at,
  e.updated_at
FROM hr.employees e
LEFT JOIN public.profiles profile ON profile.user_id = e.user_id
LEFT JOIN hr.departments d ON d.id = e.department_id
LEFT JOIN hr.positions p ON p.id = e.position_id
LEFT JOIN role_agg ON role_agg.user_id = e.user_id
LEFT JOIN public.employee_integration_profiles eip ON eip.employee_id = e.id;

GRANT SELECT ON public.employee_directory TO authenticated, service_role;

-- Recreate hr.employee_directory if it existed (depends on public.employee_directory)
CREATE OR REPLACE VIEW hr.employee_directory AS
SELECT * FROM public.employee_directory;

GRANT SELECT ON hr.employee_directory TO authenticated, service_role;
