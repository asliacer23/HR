-- Standalone HR employee directory + instructor compatibility layer
-- Run this after the main HR schema and integration migrations.

CREATE SCHEMA IF NOT EXISTS hr;

DO $$
BEGIN
  IF to_regclass('public.employee_directory') IS NULL THEN
    RAISE EXCEPTION 'public.employee_directory is missing. Run the main HR setup plus the employee integration migration first.';
  END IF;
END
$$;

CREATE OR REPLACE VIEW hr.department_integration_mappings AS
SELECT *
FROM public.department_integration_mappings;

CREATE OR REPLACE VIEW hr.employee_integration_profiles AS
SELECT *
FROM public.employee_integration_profiles;

CREATE OR REPLACE VIEW hr.employee_directory AS
SELECT *
FROM public.employee_directory;

CREATE OR REPLACE VIEW hr.connected_departments AS
SELECT
  dept.department_key,
  dept.department_name,
  dept.system_code,
  dept.module_directory,
  dept.dispatch_rpc_name,
  dept.default_action_label,
  dept.purpose,
  dept.is_active,
  COALESCE(route_summary.route_count, 0) AS route_count,
  COALESCE(route_summary.event_codes, ARRAY[]::text[]) AS event_codes
FROM public.integration_departments dept
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS route_count,
    array_agg(route.event_code ORDER BY route.priority, route.route_key) AS event_codes
  FROM public.integration_flow_routes route
  WHERE route.source_department_key = 'hr'
    AND route.target_department_key = dept.department_key
    AND route.is_active = true
) route_summary ON true
WHERE dept.is_active = true;

CREATE OR REPLACE VIEW hr.instructors AS
SELECT
  employee_id AS id,
  employee_id,
  employee_number AS employee_no,
  first_name,
  last_name,
  COALESCE(department_name, 'School Administration') AS department,
  COALESCE(position_title, '') AS specialization,
  CASE
    WHEN COALESCE(position_title, '') ILIKE '%assistant professor%' THEN 'Assistant Professor'
    WHEN COALESCE(position_title, '') ILIKE '%associate professor%' THEN 'Associate Professor'
    WHEN COALESCE(position_title, '') ILIKE '%professor%' THEN 'Professor'
    ELSE 'Instructor'
  END AS academic_rank,
  employment_status,
  primary_app_role,
  is_admin,
  connected_systems,
  integration_ready,
  created_at,
  updated_at
FROM public.employee_directory
WHERE employee_type IN ('teacher', 'principal', 'registrar')
   OR COALESCE(position_title, '') ILIKE '%instructor%'
   OR COALESCE(position_title, '') ILIKE '%professor%';
