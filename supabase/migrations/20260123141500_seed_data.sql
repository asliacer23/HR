-- =====================================================
-- Seed Data for HR Management System
-- 10 records for each table
-- =====================================================

-- =====================================================
-- 1. DEPARTMENTS - No dependencies
-- =====================================================
INSERT INTO public.departments (id, name, code, description, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Human Resources', 'HR', 'Human Resources Department', true),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Finance', 'FIN', 'Finance and Accounting Department', true),
    ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Information Technology', 'IT', 'IT and Systems Department', true),
    ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'Operations', 'OPS', 'Operations and Logistics', true),
    ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Sales', 'SALES', 'Sales and Business Development', true),
    ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'Marketing', 'MKTG', 'Marketing and Communications', true),
    ('550e8400-e29b-41d4-a716-446655440007'::uuid, 'Education', 'EDU', 'Education and Training', true),
    ('550e8400-e29b-41d4-a716-446655440008'::uuid, 'Administration', 'ADMIN', 'Administrative Services', true),
    ('550e8400-e29b-41d4-a716-446655440009'::uuid, 'Research', 'RES', 'Research and Development', true),
    ('550e8400-e29b-41d4-a716-446655440010'::uuid, 'Quality Assurance', 'QA', 'Quality Assurance and Testing', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. POSITIONS - Depends on departments
-- =====================================================
INSERT INTO public.positions (id, department_id, title, description, min_salary, max_salary, is_active)
VALUES 
    ('650e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'HR Manager', 'Manages human resources operations', 50000.00, 80000.00, true),
    ('650e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Finance Director', 'Manages financial operations', 70000.00, 120000.00, true),
    ('650e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 'Software Developer', 'Develops software solutions', 60000.00, 100000.00, true),
    ('650e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, 'Operations Manager', 'Manages daily operations', 45000.00, 75000.00, true),
    ('650e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, 'Sales Executive', 'Executes sales strategies', 40000.00, 70000.00, true),
    ('650e8400-e29b-41d4-a716-446655440006'::uuid, '550e8400-e29b-41d4-a716-446655440006'::uuid, 'Marketing Manager', 'Manages marketing campaigns', 50000.00, 85000.00, true),
    ('650e8400-e29b-41d4-a716-446655440007'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid, 'Training Specialist', 'Develops and delivers training', 45000.00, 70000.00, true),
    ('650e8400-e29b-41d4-a716-446655440008'::uuid, '550e8400-e29b-41d4-a716-446655440008'::uuid, 'Administrative Assistant', 'Provides administrative support', 30000.00, 45000.00, true),
    ('650e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-e29b-41d4-a716-446655440009'::uuid, 'Research Analyst', 'Conducts research analysis', 55000.00, 90000.00, true),
    ('650e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440010'::uuid, 'QA Engineer', 'Tests software quality', 50000.00, 80000.00, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. BENEFITS - No dependencies
-- =====================================================
INSERT INTO public.benefits (id, name, description, type, is_active)
VALUES 
    ('750e8400-e29b-41d4-a716-446655440001'::uuid, 'Health Insurance', 'Comprehensive health coverage', 'health', true),
    ('750e8400-e29b-41d4-a716-446655440002'::uuid, 'Dental Insurance', 'Dental care coverage', 'health', true),
    ('750e8400-e29b-41d4-a716-446655440003'::uuid, 'Vision Insurance', 'Eye care coverage', 'health', true),
    ('750e8400-e29b-41d4-a716-446655440004'::uuid, 'Life Insurance', 'Life protection coverage', 'insurance', true),
    ('750e8400-e29b-41d4-a716-446655440005'::uuid, 'Retirement Plan', '401(k) retirement savings', 'allowance', true),
    ('750e8400-e29b-41d4-a716-446655440006'::uuid, 'Stock Options', 'Employee stock purchase plan', 'allowance', true),
    ('750e8400-e29b-41d4-a716-446655440007'::uuid, 'Flexible Spending Account', 'FSA for healthcare expenses', 'allowance', true),
    ('750e8400-e29b-41d4-a716-446655440008'::uuid, 'Professional Development', 'Training and education budget', 'allowance', true),
    ('750e8400-e29b-41d4-a716-446655440009'::uuid, 'Gym Membership', 'Fitness center membership', 'allowance', true),
    ('750e8400-e29b-41d4-a716-446655440010'::uuid, 'Paid Time Off', 'Vacation and sick days', 'allowance', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. TRAINING PROGRAMS - No dependencies
-- =====================================================
INSERT INTO public.training_programs (id, title, description, duration_hours, is_mandatory)
VALUES 
    ('850e8400-e29b-41d4-a716-446655440001'::uuid, 'Onboarding Training', 'New employee orientation', 8, true),
    ('850e8400-e29b-41d4-a716-446655440002'::uuid, 'Leadership Development', 'Management skills training', 40, false),
    ('850e8400-e29b-41d4-a716-446655440003'::uuid, 'Software Training', 'Internal system training', 16, true),
    ('850e8400-e29b-41d4-a716-446655440004'::uuid, 'Communication Skills', 'Effective communication workshop', 12, false),
    ('850e8400-e29b-41d4-a716-446655440005'::uuid, 'Safety Compliance', 'Workplace safety training', 4, true),
    ('850e8400-e29b-41d4-a716-446655440006'::uuid, 'Customer Service', 'Customer interaction excellence', 8, false),
    ('850e8400-e29b-41d4-a716-446655440007'::uuid, 'Data Analysis', 'Advanced data analysis techniques', 24, false),
    ('850e8400-e29b-41d4-a716-446655440008'::uuid, 'Quality Assurance', 'QA best practices', 20, true),
    ('850e8400-e29b-41d4-a716-446655440009'::uuid, 'Project Management', 'Project management methodologies', 32, false),
    ('850e8400-e29b-41d4-a716-446655440010'::uuid, 'Diversity and Inclusion', 'D&I awareness training', 2, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. PERFORMANCE CRITERIA - No dependencies
-- =====================================================
INSERT INTO public.performance_criteria (id, name, description, weight)
VALUES 
    ('950e8400-e29b-41d4-a716-446655440001'::uuid, 'Quality of Work', 'Meeting quality standards', 20.00),
    ('950e8400-e29b-41d4-a716-446655440002'::uuid, 'Productivity', 'Output and efficiency', 20.00),
    ('950e8400-e29b-41d4-a716-446655440003'::uuid, 'Teamwork', 'Collaboration and cooperation', 15.00),
    ('950e8400-e29b-41d4-a716-446655440004'::uuid, 'Communication', 'Clear and effective communication', 15.00),
    ('950e8400-e29b-41d4-a716-446655440005'::uuid, 'Initiative', 'Taking on new responsibilities', 10.00),
    ('950e8400-e29b-41d4-a716-446655440006'::uuid, 'Reliability', 'Dependability and attendance', 10.00),
    ('950e8400-e29b-41d4-a716-446655440007'::uuid, 'Customer Focus', 'Customer satisfaction', 5.00),
    ('950e8400-e29b-41d4-a716-446655440008'::uuid, 'Problem Solving', 'Creative problem solving', 10.00),
    ('950e8400-e29b-41d4-a716-446655440009'::uuid, 'Time Management', 'Meeting deadlines', 8.00),
    ('950e8400-e29b-41d4-a716-446655440010'::uuid, 'Professional Development', 'Continuous learning', 7.00)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. PAYROLL PERIODS - No dependencies
-- =====================================================
INSERT INTO public.payroll_periods (id, period_start, period_end, pay_date, is_processed)
VALUES 
    ('a50e8400-e29b-41d4-a716-446655440001'::uuid, '2026-01-01'::date, '2026-01-15'::date, '2026-01-20'::date, true),
    ('a50e8400-e29b-41d4-a716-446655440002'::uuid, '2026-01-16'::date, '2026-01-31'::date, '2026-02-05'::date, true),
    ('a50e8400-e29b-41d4-a716-446655440003'::uuid, '2026-02-01'::date, '2026-02-15'::date, '2026-02-20'::date, true),
    ('a50e8400-e29b-41d4-a716-446655440004'::uuid, '2026-02-16'::date, '2026-02-28'::date, '2026-03-05'::date, true),
    ('a50e8400-e29b-41d4-a716-446655440005'::uuid, '2026-03-01'::date, '2026-03-15'::date, '2026-03-20'::date, true),
    ('a50e8400-e29b-41d4-a716-446655440006'::uuid, '2026-03-16'::date, '2026-03-31'::date, '2026-04-05'::date, false),
    ('a50e8400-e29b-41d4-a716-446655440007'::uuid, '2026-04-01'::date, '2026-04-15'::date, '2026-04-20'::date, false),
    ('a50e8400-e29b-41d4-a716-446655440008'::uuid, '2026-04-16'::date, '2026-04-30'::date, '2026-05-05'::date, false),
    ('a50e8400-e29b-41d4-a716-446655440009'::uuid, '2026-05-01'::date, '2026-05-15'::date, '2026-05-20'::date, false),
    ('a50e8400-e29b-41d4-a716-446655440010'::uuid, '2026-05-16'::date, '2026-05-31'::date, '2026-06-05'::date, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. ONBOARDING TASKS - Depends on departments
-- =====================================================
INSERT INTO public.onboarding_tasks (id, title, description, is_mandatory, department_id)
VALUES 
    ('b50e8400-e29b-41d4-a716-446655440001'::uuid, 'IT Setup', 'Configure computer and access', true, '550e8400-e29b-41d4-a716-446655440003'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440002'::uuid, 'HR Orientation', 'Policies and procedures briefing', true, '550e8400-e29b-41d4-a716-446655440001'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440003'::uuid, 'Office Tour', 'Facility introduction', true, '550e8400-e29b-41d4-a716-446655440008'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440004'::uuid, 'Benefits Enrollment', 'Setup health insurance and benefits', false, '550e8400-e29b-41d4-a716-446655440001'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440005'::uuid, 'Safety Training', 'Workplace safety initiation', true, '550e8400-e29b-41d4-a716-446655440004'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440006'::uuid, 'Compliance Training', 'Compliance and ethics training', true, '550e8400-e29b-41d4-a716-446655440001'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440007'::uuid, 'System Access', 'Grant necessary system permissions', true, '550e8400-e29b-41d4-a716-446655440003'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440008'::uuid, 'Team Introductions', 'Meet team members', false, '550e8400-e29b-41d4-a716-446655440001'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440009'::uuid, 'Documentation', 'Review job documentation', true, '550e8400-e29b-41d4-a716-446655440001'::uuid),
    ('b50e8400-e29b-41d4-a716-446655440010'::uuid, 'First Day Meeting', 'One-on-one with manager', false, '550e8400-e29b-41d4-a716-446655440001'::uuid)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. JOB POSTINGS - Depends on positions
-- =====================================================
INSERT INTO public.job_postings (id, position_id, title, description, requirements, responsibilities, salary_range_min, salary_range_max, is_active, deadline)
VALUES 
    ('c50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440003'::uuid, 'Senior Software Developer', 'Join our engineering team', '5+ years experience, Bachelor degree', 'Develop and maintain software', 80000.00, 120000.00, true, '2026-04-30'::date),
    ('c50e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440001'::uuid, 'HR Specialist', 'Support HR operations', '3+ years HR experience', 'Recruitment and employee relations', 45000.00, 70000.00, true, '2026-03-31'::date),
    ('c50e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, 'Accountant', 'Financial reporting role', 'CPA or equivalent, 2+ years', 'Manage accounts and reporting', 50000.00, 75000.00, true, '2026-04-15'::date),
    ('c50e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440005'::uuid, 'Sales Manager', 'Manage sales team', '5+ years sales experience', 'Lead sales operations', 60000.00, 100000.00, true, '2026-05-31'::date),
    ('c50e8400-e29b-41d4-a716-446655440005'::uuid, '650e8400-e29b-41d4-a716-446655440006'::uuid, 'Marketing Coordinator', 'Support marketing campaigns', '1+ years marketing', 'Content and campaign support', 35000.00, 50000.00, true, '2026-04-01'::date),
    ('c50e8400-e29b-41d4-a716-446655440006'::uuid, '650e8400-e29b-41d4-a716-446655440004'::uuid, 'Operations Supervisor', 'Supervise operations team', '3+ years operations', 'Team leadership and coordination', 50000.00, 75000.00, true, '2026-03-20'::date),
    ('c50e8400-e29b-41d4-a716-446655440007'::uuid, '650e8400-e29b-41d4-a716-446655440007'::uuid, 'Training Coordinator', 'Coordinate training programs', '2+ years training', 'Program management and delivery', 40000.00, 60000.00, true, '2026-04-10'::date),
    ('c50e8400-e29b-41d4-a716-446655440008'::uuid, '650e8400-e29b-41d4-a716-446655440010'::uuid, 'QA Specialist', 'Test and ensure quality', '1+ years QA experience', 'Software testing and reporting', 45000.00, 70000.00, true, '2026-04-20'::date),
    ('c50e8400-e29b-41d4-a716-446655440009'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid, 'Research Specialist', 'Conduct market research', '2+ years research', 'Data collection and analysis', 50000.00, 80000.00, true, '2026-05-15'::date),
    ('c50e8400-e29b-41d4-a716-446655440010'::uuid, '650e8400-e29b-41d4-a716-446655440008'::uuid, 'Executive Assistant', 'Support executives', '2+ years admin experience', 'Executive support and coordination', 40000.00, 60000.00, true, '2026-03-25'::date)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Seed Data Completion Summary
-- =====================================================
-- Total tables seeded: 8 (No auth.users dependencies)
-- Total records inserted: 80 (10 per table)
-- This seed file can run without any auth.users setup
-- =====================================================
-- 
-- TABLES SEEDED (No Foreign Key Errors):
-- 1. departments (10 records)
-- 2. positions (10 records) 
-- 3. benefits (10 records)
-- 4. training_programs (10 records)
-- 5. performance_criteria (10 records)
-- 6. payroll_periods (10 records)
-- 7. onboarding_tasks (10 records)
-- 8. job_postings (10 records)
-- 
