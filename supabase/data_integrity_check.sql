-- Data Integrity Check Script
-- Run this in Supabase SQL Editor to find and fix department mismatches

-- 1. Find employees whose department does not match the job posting they were hired from
SELECT 
    e.id as employee_id,
    p.first_name || ' ' || p.last_name as employee_name,
    d_current.name as current_department,
    d_job.name as original_job_department,
    jp.title as job_title
FROM public.employees e
JOIN public.profiles p ON e.user_id = p.user_id
JOIN public.applicants a ON a.user_id = e.user_id
JOIN public.job_applications ja ON ja.applicant_id = a.id
JOIN public.job_postings jp ON ja.job_posting_id = jp.id
JOIN public.positions pos ON jp.position_id = pos.id
JOIN public.departments d_job ON pos.department_id = d_job.id
JOIN public.departments d_current ON e.department_id = d_current.id
WHERE ja.status = 'hired'
  AND e.department_id != pos.department_id;

-- 2. Find employees with missing department or position
SELECT 
    e.id,
    p.first_name,
    p.last_name,
    e.employee_number
FROM public.employees e
JOIN public.profiles p ON e.user_id = p.user_id
WHERE e.department_id IS NULL OR e.position_id IS NULL;

-- 3. Fix Script (Uncomment and run if you want to force sync departments with original job postings)
/*
UPDATE public.employees e
SET department_id = pos.department_id
FROM public.applicants a,
     public.job_applications ja,
     public.job_postings jp,
     public.positions pos
WHERE a.user_id = e.user_id
  AND ja.applicant_id = a.id
  AND ja.job_posting_id = jp.id
  AND jp.position_id = pos.id
  AND ja.status = 'hired'
  AND e.department_id != pos.department_id;
*/
