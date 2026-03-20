-- =====================================================
-- Demo Seed Data for HR Management System
-- =====================================================
-- This seed provisions the default administrator account plus
-- realistic sample records for the main HR modules so the admin
-- dashboard, recruitment, employee, payroll, onboarding, and report
-- pages all have data to render during testing.
--
-- Default admin login:
--   email: adminhr@gmail.com
--   password: admin123
--
-- All additional demo accounts below also use:
--   password: admin123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    "role",
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
VALUES
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, 'authenticated', 'authenticated', 'adminhr@gmail.com', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"System","last_name":"Administrator"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440002'::uuid, 'authenticated', 'authenticated', 'hrlead@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Hannah","last_name":"Reyes"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440003'::uuid, 'authenticated', 'authenticated', 'maria.finance@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Maria","last_name":"Santos"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440004'::uuid, 'authenticated', 'authenticated', 'john.it@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"John","last_name":"Dela Cruz"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440005'::uuid, 'authenticated', 'authenticated', 'clara.registrar@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Clara","last_name":"Mendoza"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440006'::uuid, 'authenticated', 'authenticated', 'nina.clinic@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Nina","last_name":"Ramos"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440007'::uuid, 'authenticated', 'authenticated', 'mark.guidance@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Mark","last_name":"Villanueva"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440008'::uuid, 'authenticated', 'authenticated', 'lea.faculty@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Lea","last_name":"Martinez"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440009'::uuid, 'authenticated', 'authenticated', 'jenny.applicant@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Jenny","last_name":"Flores"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440010'::uuid, 'authenticated', 'authenticated', 'paolo.applicant@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Paolo","last_name":"Garcia"}'::jsonb, false, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, 'd50e8400-e29b-41d4-a716-446655440011'::uuid, 'authenticated', 'authenticated', 'nikki.applicant@bestlink.local', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Nikki","last_name":"Torres"}'::jsonb, false, now(), now(), '', '', '', '')
ON CONFLICT (id) DO UPDATE
SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = now();

INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    id
)
VALUES
    ('adminhr@gmail.com', 'd50e8400-e29b-41d4-a716-446655440001'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440001', 'adminhr@gmail.com')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440001'::uuid),
    ('hrlead@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440002'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440002', 'hrlead@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440002'::uuid),
    ('maria.finance@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440003'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440003', 'maria.finance@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440003'::uuid),
    ('john.it@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440004'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440004', 'john.it@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440004'::uuid),
    ('clara.registrar@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440005'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440005', 'clara.registrar@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440005'::uuid),
    ('nina.clinic@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440006'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440006', 'nina.clinic@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440006'::uuid),
    ('mark.guidance@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440007'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440007', 'mark.guidance@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440007'::uuid),
    ('lea.faculty@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440008'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440008', 'lea.faculty@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440008'::uuid),
    ('jenny.applicant@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440009'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440009', 'jenny.applicant@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440009'::uuid),
    ('paolo.applicant@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440010'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440010', 'paolo.applicant@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440010'::uuid),
    ('nikki.applicant@bestlink.local', 'd50e8400-e29b-41d4-a716-446655440011'::uuid, format('{"sub":"%s","email":"%s"}', 'd50e8400-e29b-41d4-a716-446655440011', 'nikki.applicant@bestlink.local')::jsonb, 'email', now(), now(), now(), 'e50e8400-e29b-41d4-a716-446655440011'::uuid)
ON CONFLICT (provider_id, provider) DO UPDATE
SET
    user_id = EXCLUDED.user_id,
    identity_data = EXCLUDED.identity_data,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    updated_at = now();

DO $$
DECLARE
    target_schema text;
BEGIN
    IF to_regclass('hr.profiles') IS NOT NULL THEN
        target_schema := 'hr';
    ELSIF to_regclass('public.profiles') IS NOT NULL THEN
        target_schema := 'public';
    ELSE
        RAISE EXCEPTION 'Neither hr.profiles nor public.profiles exists. Run the schema setup first.';
    END IF;

    PERFORM set_config('search_path', quote_ident(target_schema) || ', public', true);

    INSERT INTO departments (id, name, code, description, is_active)
    VALUES
        ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Human Resources', 'HR', 'Handles hiring, onboarding, contracts, evaluations, and employee relations.', true),
        ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Finance and Cashier Coordination', 'FIN', 'Coordinates payroll endorsement, salary release routing, and employee finance clearances.', true),
        ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Computer Laboratory / IT Services', 'IT', 'Manages accounts, devices, biometrics, and system access for employees and faculty.', true),
        ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'School Administration', 'ADMIN', 'Supports faculty loading, contracts, and approvals from school administration.', true),
        ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Registrar', 'REG', 'Validates faculty assignments, academic records, and clearance dependencies.', true),
        ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'PMED', 'PMED', 'Oversees pre-employment medical endorsements and health documentation routing.', true),
        ('550e8400-e29b-41d4-a716-446655440007'::uuid, 'Clinic', 'CLINIC', 'Handles clinical clearance follow-up, fit-to-work notices, and employee wellness support.', true),
        ('550e8400-e29b-41d4-a716-446655440008'::uuid, 'Prefect and Guidance', 'GUIDE', 'Supports employee conduct cases, guidance referrals, and discipline clearance.', true)
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = now();

    INSERT INTO positions (id, department_id, title, description, min_salary, max_salary, is_active)
    VALUES
        ('650e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'HR Director', 'Leads college-wide HR operations, policy approvals, and cross-department endorsements.', 52000.00, 72000.00, true),
        ('650e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'HR Officer', 'Handles employee records, onboarding, leave validation, and day-to-day HR workflow.', 32000.00, 46000.00, true),
        ('650e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Payroll and Benefits Officer', 'Coordinates payroll batches, benefit enrollment, and cashier routing.', 30000.00, 42000.00, true),
        ('650e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 'IT Support Specialist', 'Supports faculty devices, system access, biometric setup, and computer laboratory onboarding.', 28000.00, 40000.00, true),
        ('650e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, 'Registrar Associate', 'Coordinates records verification, class loading validation, and clearance sign-off.', 26000.00, 36000.00, true),
        ('650e8400-e29b-41d4-a716-446655440006'::uuid, '550e8400-e29b-41d4-a716-446655440006'::uuid, 'PMED Coordinator', 'Tracks pre-employment medical referrals, physical exam results, and PMED endorsements.', 28000.00, 38000.00, true),
        ('650e8400-e29b-41d4-a716-446655440007'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid, 'Clinic Nurse', 'Manages employee health clearances, fit-to-work monitoring, and clinic referrals.', 30000.00, 41000.00, true),
        ('650e8400-e29b-41d4-a716-446655440008'::uuid, '550e8400-e29b-41d4-a716-446655440008'::uuid, 'Guidance Counselor', 'Supports employee welfare cases, counseling coordination, and guidance clearance routing.', 29000.00, 39000.00, true),
        ('650e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, 'Senior High School English Instructor', 'Handles faculty teaching load in the Senior High School department.', 27000.00, 37000.00, true)
    ON CONFLICT (id) DO UPDATE
    SET
        department_id = EXCLUDED.department_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        min_salary = EXCLUDED.min_salary,
        max_salary = EXCLUDED.max_salary,
        is_active = EXCLUDED.is_active,
        updated_at = now();

    INSERT INTO profiles (user_id, first_name, last_name, email, phone, city)
    VALUES
        ('d50e8400-e29b-41d4-a716-446655440001'::uuid, 'System', 'Administrator', 'adminhr@gmail.com', '09170000001', 'Quezon City'),
        ('d50e8400-e29b-41d4-a716-446655440002'::uuid, 'Hannah', 'Reyes', 'hrlead@bestlink.local', '09170000002', 'Caloocan City'),
        ('d50e8400-e29b-41d4-a716-446655440003'::uuid, 'Maria', 'Santos', 'maria.finance@bestlink.local', '09170000003', 'Valenzuela City'),
        ('d50e8400-e29b-41d4-a716-446655440004'::uuid, 'John', 'Dela Cruz', 'john.it@bestlink.local', '09170000004', 'Quezon City'),
        ('d50e8400-e29b-41d4-a716-446655440005'::uuid, 'Clara', 'Mendoza', 'clara.registrar@bestlink.local', '09170000005', 'Meycauayan'),
        ('d50e8400-e29b-41d4-a716-446655440006'::uuid, 'Nina', 'Ramos', 'nina.clinic@bestlink.local', '09170000006', 'Marilao'),
        ('d50e8400-e29b-41d4-a716-446655440007'::uuid, 'Mark', 'Villanueva', 'mark.guidance@bestlink.local', '09170000007', 'Quezon City'),
        ('d50e8400-e29b-41d4-a716-446655440008'::uuid, 'Lea', 'Martinez', 'lea.faculty@bestlink.local', '09170000008', 'Malolos'),
        ('d50e8400-e29b-41d4-a716-446655440009'::uuid, 'Jenny', 'Flores', 'jenny.applicant@bestlink.local', '09170000009', 'Bulacan'),
        ('d50e8400-e29b-41d4-a716-446655440010'::uuid, 'Paolo', 'Garcia', 'paolo.applicant@bestlink.local', '09170000010', 'Novaliches'),
        ('d50e8400-e29b-41d4-a716-446655440011'::uuid, 'Nikki', 'Torres', 'nikki.applicant@bestlink.local', '09170000011', 'Fairview')
    ON CONFLICT (user_id) DO UPDATE
    SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        city = EXCLUDED.city,
        updated_at = now();

    DELETE FROM user_roles
    WHERE user_id IN (
        'd50e8400-e29b-41d4-a716-446655440001'::uuid,
        'd50e8400-e29b-41d4-a716-446655440002'::uuid,
        'd50e8400-e29b-41d4-a716-446655440003'::uuid,
        'd50e8400-e29b-41d4-a716-446655440004'::uuid,
        'd50e8400-e29b-41d4-a716-446655440005'::uuid,
        'd50e8400-e29b-41d4-a716-446655440006'::uuid,
        'd50e8400-e29b-41d4-a716-446655440007'::uuid,
        'd50e8400-e29b-41d4-a716-446655440008'::uuid,
        'd50e8400-e29b-41d4-a716-446655440009'::uuid,
        'd50e8400-e29b-41d4-a716-446655440010'::uuid,
        'd50e8400-e29b-41d4-a716-446655440011'::uuid
    );

    INSERT INTO user_roles (user_id, role)
    VALUES
        ('d50e8400-e29b-41d4-a716-446655440001'::uuid, 'system_admin'),
        ('d50e8400-e29b-41d4-a716-446655440002'::uuid, 'hr_admin'),
        ('d50e8400-e29b-41d4-a716-446655440003'::uuid, 'employee'),
        ('d50e8400-e29b-41d4-a716-446655440004'::uuid, 'employee'),
        ('d50e8400-e29b-41d4-a716-446655440005'::uuid, 'employee'),
        ('d50e8400-e29b-41d4-a716-446655440006'::uuid, 'employee'),
        ('d50e8400-e29b-41d4-a716-446655440007'::uuid, 'employee'),
        ('d50e8400-e29b-41d4-a716-446655440008'::uuid, 'employee'),
        ('d50e8400-e29b-41d4-a716-446655440009'::uuid, 'applicant'),
        ('d50e8400-e29b-41d4-a716-446655440010'::uuid, 'applicant'),
        ('d50e8400-e29b-41d4-a716-446655440011'::uuid, 'applicant')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO employees (
        id,
        user_id,
        employee_number,
        position_id,
        department_id,
        employee_type,
        hire_date,
        employment_status,
        supervisor_id
    )
    VALUES
        ('f50e8400-e29b-41d4-a716-446655440001'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, 'EMP-ADMIN-001', '650e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'admin', '2024-06-03'::date, 'active', null),
        ('f50e8400-e29b-41d4-a716-446655440002'::uuid, 'd50e8400-e29b-41d4-a716-446655440002'::uuid, 'EMP-HR-002', '650e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'admin', '2024-08-12'::date, 'active', 'f50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('f50e8400-e29b-41d4-a716-446655440003'::uuid, 'd50e8400-e29b-41d4-a716-446655440003'::uuid, 'EMP-FIN-003', '650e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'staff', '2025-01-15'::date, 'active', 'f50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('f50e8400-e29b-41d4-a716-446655440004'::uuid, 'd50e8400-e29b-41d4-a716-446655440004'::uuid, 'EMP-IT-004', '650e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 'staff', '2025-02-03'::date, 'active', 'f50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('f50e8400-e29b-41d4-a716-446655440005'::uuid, 'd50e8400-e29b-41d4-a716-446655440005'::uuid, 'EMP-REG-005', '650e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, 'registrar', '2024-11-04'::date, 'active', 'f50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('f50e8400-e29b-41d4-a716-446655440006'::uuid, 'd50e8400-e29b-41d4-a716-446655440006'::uuid, 'EMP-CLN-006', '650e8400-e29b-41d4-a716-446655440007'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid, 'staff', '2025-01-06'::date, 'active', 'f50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('f50e8400-e29b-41d4-a716-446655440007'::uuid, 'd50e8400-e29b-41d4-a716-446655440007'::uuid, 'EMP-GUI-007', '650e8400-e29b-41d4-a716-446655440008'::uuid, '550e8400-e29b-41d4-a716-446655440008'::uuid, 'staff', '2025-02-17'::date, 'on_leave', 'f50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('f50e8400-e29b-41d4-a716-446655440008'::uuid, 'd50e8400-e29b-41d4-a716-446655440008'::uuid, 'EMP-FAC-008', '650e8400-e29b-41d4-a716-446655440009'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, 'teacher', '2026-01-08'::date, 'probation', 'f50e8400-e29b-41d4-a716-446655440002'::uuid)
    ON CONFLICT (user_id) DO UPDATE
    SET
        employee_number = EXCLUDED.employee_number,
        position_id = EXCLUDED.position_id,
        department_id = EXCLUDED.department_id,
        employee_type = EXCLUDED.employee_type,
        hire_date = EXCLUDED.hire_date,
        employment_status = EXCLUDED.employment_status,
        supervisor_id = EXCLUDED.supervisor_id,
        updated_at = now();

    INSERT INTO employment_contracts (
        id,
        employee_id,
        contract_type,
        start_date,
        end_date,
        salary,
        is_current,
        terms
    )
    VALUES
        ('151e8400-e29b-41d4-a716-446655440001'::uuid, 'f50e8400-e29b-41d4-a716-446655440001'::uuid, 'full_time', '2024-06-03'::date, null, 68000.00, true, 'System administrator contract for institutional HR operations.'),
        ('151e8400-e29b-41d4-a716-446655440002'::uuid, 'f50e8400-e29b-41d4-a716-446655440002'::uuid, 'full_time', '2024-08-12'::date, null, 42000.00, true, 'HR lead supporting employee services and faculty clearances.'),
        ('151e8400-e29b-41d4-a716-446655440003'::uuid, 'f50e8400-e29b-41d4-a716-446655440003'::uuid, 'full_time', '2025-01-15'::date, null, 39000.00, true, 'Payroll and benefits processing contract.'),
        ('151e8400-e29b-41d4-a716-446655440004'::uuid, 'f50e8400-e29b-41d4-a716-446655440004'::uuid, 'full_time', '2025-02-03'::date, null, 36000.00, true, 'IT support and laboratory onboarding support contract.'),
        ('151e8400-e29b-41d4-a716-446655440005'::uuid, 'f50e8400-e29b-41d4-a716-446655440005'::uuid, 'full_time', '2024-11-04'::date, null, 34000.00, true, 'Registrar support contract for records and scheduling validation.'),
        ('151e8400-e29b-41d4-a716-446655440006'::uuid, 'f50e8400-e29b-41d4-a716-446655440006'::uuid, 'full_time', '2025-01-06'::date, null, 35500.00, true, 'Clinic support contract for employee health endorsements.'),
        ('151e8400-e29b-41d4-a716-446655440007'::uuid, 'f50e8400-e29b-41d4-a716-446655440007'::uuid, 'full_time', '2025-02-17'::date, null, 34500.00, true, 'Guidance support contract for counseling and clearance coordination.'),
        ('151e8400-e29b-41d4-a716-446655440008'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'temporary', '2026-01-08'::date, '2026-05-31'::date, 33000.00, true, 'Probationary faculty contract pending renewal endorsement.')
    ON CONFLICT (id) DO UPDATE
    SET
        employee_id = EXCLUDED.employee_id,
        contract_type = EXCLUDED.contract_type,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        salary = EXCLUDED.salary,
        is_current = EXCLUDED.is_current,
        terms = EXCLUDED.terms,
        updated_at = now();

    INSERT INTO job_postings (
        id,
        position_id,
        title,
        description,
        requirements,
        responsibilities,
        salary_range_min,
        salary_range_max,
        is_active,
        deadline,
        posted_by
    )
    VALUES
        ('c50e8400-e29b-41d4-a716-446655440001'::uuid, '650e8400-e29b-41d4-a716-446655440002'::uuid, 'HR Generalist', 'Support employee records, onboarding, leave coordination, and inter-office endorsements.', 'Bachelor degree in Psychology, HRM, or related field. Knowledge of labor compliance and HRIS workflows.', 'Maintain employee files, coordinate HR approvals, and route staffing requests to school administration.', 28000.00, 36000.00, true, '2026-04-15'::date, 'd50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('c50e8400-e29b-41d4-a716-446655440002'::uuid, '650e8400-e29b-41d4-a716-446655440004'::uuid, 'IT Support Assistant', 'Handle account provisioning, device deployment, and computer laboratory support.', 'Graduate of BSIT/BSCS. Familiar with networking, support tickets, and inventory tracking.', 'Prepare devices, activate user accounts, and support onboarding for faculty and staff.', 24000.00, 32000.00, true, '2026-04-22'::date, 'd50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('c50e8400-e29b-41d4-a716-446655440003'::uuid, '650e8400-e29b-41d4-a716-446655440005'::uuid, 'Registrar Assistant', 'Assist with academic records, faculty loading coordination, and student information validation.', 'Experience in records management and school information systems preferred.', 'Validate schedules, encode records, and support registrar clearance sign-off.', 23000.00, 30000.00, true, '2026-04-10'::date, 'd50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('c50e8400-e29b-41d4-a716-446655440004'::uuid, '650e8400-e29b-41d4-a716-446655440009'::uuid, 'Senior High School English Instructor', 'Teach English subjects and coordinate academic requirements for Senior High School.', 'Licensed teacher preferred. Experience with SHS curriculum and class advisory work.', 'Deliver instruction, prepare lesson plans, and coordinate with school administration and registrar.', 28000.00, 36000.00, true, '2026-04-30'::date, 'd50e8400-e29b-41d4-a716-446655440002'::uuid),
        ('c50e8400-e29b-41d4-a716-446655440005'::uuid, '650e8400-e29b-41d4-a716-446655440006'::uuid, 'PMED Clearance Coordinator', 'Handle pre-employment medical referrals and PMED endorsement tracking.', 'Background in allied health or medical administration preferred.', 'Monitor exam schedules, validate documents, and endorse fit-to-work status back to HR.', 25000.00, 33000.00, true, '2026-04-18'::date, 'd50e8400-e29b-41d4-a716-446655440002'::uuid)
    ON CONFLICT (id) DO UPDATE
    SET
        position_id = EXCLUDED.position_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        requirements = EXCLUDED.requirements,
        responsibilities = EXCLUDED.responsibilities,
        salary_range_min = EXCLUDED.salary_range_min,
        salary_range_max = EXCLUDED.salary_range_max,
        is_active = EXCLUDED.is_active,
        deadline = EXCLUDED.deadline,
        posted_by = EXCLUDED.posted_by,
        updated_at = now();

    INSERT INTO applicants (
        id,
        user_id,
        resume_url,
        cover_letter,
        years_experience,
        education_level,
        skills
    )
    VALUES
        ('161e8400-e29b-41d4-a716-446655440001'::uuid, 'd50e8400-e29b-41d4-a716-446655440009'::uuid, 'https://example.com/resumes/jenny-flores.pdf', 'Interested in supporting HR operations and employee engagement programs at Bestlink College.', 2, 'BS Psychology', ARRAY['Recruitment coordination', 'Employee files', 'MS Office']),
        ('161e8400-e29b-41d4-a716-446655440002'::uuid, 'd50e8400-e29b-41d4-a716-446655440010'::uuid, 'https://example.com/resumes/paolo-garcia.pdf', 'Ready to support IT deployment, help desk, and laboratory setup operations.', 1, 'BS Information Technology', ARRAY['Hardware troubleshooting', 'Network setup', 'Help desk']),
        ('161e8400-e29b-41d4-a716-446655440003'::uuid, 'd50e8400-e29b-41d4-a716-446655440011'::uuid, 'https://example.com/resumes/nikki-torres.pdf', 'Applying for the Senior High School faculty opening with classroom and curriculum experience.', 4, 'MA English Education', ARRAY['Teaching', 'Curriculum planning', 'Classroom management'])
    ON CONFLICT (user_id) DO UPDATE
    SET
        resume_url = EXCLUDED.resume_url,
        cover_letter = EXCLUDED.cover_letter,
        years_experience = EXCLUDED.years_experience,
        education_level = EXCLUDED.education_level,
        skills = EXCLUDED.skills,
        updated_at = now();

    INSERT INTO job_applications (
        id,
        applicant_id,
        job_posting_id,
        status,
        applied_at,
        notes,
        reviewed_by,
        reviewed_at
    )
    VALUES
        ('171e8400-e29b-41d4-a716-446655440001'::uuid, '161e8400-e29b-41d4-a716-446655440001'::uuid, 'c50e8400-e29b-41d4-a716-446655440001'::uuid, 'applied', '2026-03-12 09:00:00+08'::timestamptz, 'Initial screening scheduled for HR review.', null, null),
        ('171e8400-e29b-41d4-a716-446655440002'::uuid, '161e8400-e29b-41d4-a716-446655440002'::uuid, 'c50e8400-e29b-41d4-a716-446655440002'::uuid, 'interview', '2026-03-10 10:30:00+08'::timestamptz, 'Passed resume review and waiting for IT panel interview.', 'd50e8400-e29b-41d4-a716-446655440002'::uuid, '2026-03-14 14:15:00+08'::timestamptz),
        ('171e8400-e29b-41d4-a716-446655440003'::uuid, '161e8400-e29b-41d4-a716-446655440003'::uuid, 'c50e8400-e29b-41d4-a716-446655440004'::uuid, 'hired', '2026-03-05 08:45:00+08'::timestamptz, 'Approved for hiring subject to PMED and clearance completion.', 'd50e8400-e29b-41d4-a716-446655440001'::uuid, '2026-03-11 11:00:00+08'::timestamptz),
        ('171e8400-e29b-41d4-a716-446655440004'::uuid, '161e8400-e29b-41d4-a716-446655440001'::uuid, 'c50e8400-e29b-41d4-a716-446655440003'::uuid, 'rejected', '2026-03-01 13:20:00+08'::timestamptz, 'Profile retained for future HR openings; registrar post filled internally.', 'd50e8400-e29b-41d4-a716-446655440002'::uuid, '2026-03-09 16:00:00+08'::timestamptz)
    ON CONFLICT (applicant_id, job_posting_id) DO UPDATE
    SET
        status = EXCLUDED.status,
        applied_at = EXCLUDED.applied_at,
        notes = EXCLUDED.notes,
        reviewed_by = EXCLUDED.reviewed_by,
        reviewed_at = EXCLUDED.reviewed_at;

    INSERT INTO interview_schedules (
        id,
        application_id,
        scheduled_date,
        location,
        interviewer_id,
        notes,
        is_completed,
        feedback
    )
    VALUES
        ('181e8400-e29b-41d4-a716-446655440001'::uuid, '171e8400-e29b-41d4-a716-446655440002'::uuid, '2026-03-25 09:00:00+08'::timestamptz, 'Computer Laboratory Office', 'f50e8400-e29b-41d4-a716-446655440004'::uuid, 'Technical interview with IT and HR panel.', false, null),
        ('181e8400-e29b-41d4-a716-446655440002'::uuid, '171e8400-e29b-41d4-a716-446655440003'::uuid, '2026-03-07 13:30:00+08'::timestamptz, 'School Administration Conference Room', 'f50e8400-e29b-41d4-a716-446655440002'::uuid, 'Final teaching demo and contract discussion.', true, 'Strong communication and classroom management; endorsed for hiring.')
    ON CONFLICT (id) DO UPDATE
    SET
        application_id = EXCLUDED.application_id,
        scheduled_date = EXCLUDED.scheduled_date,
        location = EXCLUDED.location,
        interviewer_id = EXCLUDED.interviewer_id,
        notes = EXCLUDED.notes,
        is_completed = EXCLUDED.is_completed,
        feedback = EXCLUDED.feedback,
        updated_at = now();

    INSERT INTO applicant_documents (
        id,
        applicant_id,
        document_name,
        document_url,
        document_type,
        uploaded_at
    )
    VALUES
        ('191e8400-e29b-41d4-a716-446655440001'::uuid, '161e8400-e29b-41d4-a716-446655440001'::uuid, 'Jenny Flores Resume', 'https://example.com/documents/jenny-resume.pdf', 'resume', '2026-03-12 09:05:00+08'::timestamptz),
        ('191e8400-e29b-41d4-a716-446655440002'::uuid, '161e8400-e29b-41d4-a716-446655440002'::uuid, 'Paolo Garcia Resume', 'https://example.com/documents/paolo-resume.pdf', 'resume', '2026-03-10 10:35:00+08'::timestamptz),
        ('191e8400-e29b-41d4-a716-446655440003'::uuid, '161e8400-e29b-41d4-a716-446655440003'::uuid, 'Nikki Torres Teaching Portfolio', 'https://example.com/documents/nikki-portfolio.pdf', 'portfolio', '2026-03-05 09:00:00+08'::timestamptz)
    ON CONFLICT (id) DO UPDATE
    SET
        applicant_id = EXCLUDED.applicant_id,
        document_name = EXCLUDED.document_name,
        document_url = EXCLUDED.document_url,
        document_type = EXCLUDED.document_type,
        uploaded_at = EXCLUDED.uploaded_at;

    INSERT INTO onboarding_tasks (
        id,
        title,
        description,
        is_mandatory,
        department_id
    )
    VALUES
        ('b50e8400-e29b-41d4-a716-446655440001'::uuid, 'HR Orientation and Policy Briefing', 'Review employee handbook, attendance rules, and code of conduct.', true, '550e8400-e29b-41d4-a716-446655440001'::uuid),
        ('b50e8400-e29b-41d4-a716-446655440002'::uuid, 'IT and Biometrics Activation', 'Create accounts, email, LMS access, and biometric enrollment.', true, '550e8400-e29b-41d4-a716-446655440003'::uuid),
        ('b50e8400-e29b-41d4-a716-446655440003'::uuid, 'PMED and Clinic Endorsement', 'Complete medical routing with PMED and clinic fit-to-work confirmation.', true, '550e8400-e29b-41d4-a716-446655440006'::uuid),
        ('b50e8400-e29b-41d4-a716-446655440004'::uuid, 'Registrar and Faculty Load Validation', 'Confirm teaching load and academic requirements before deployment.', true, '550e8400-e29b-41d4-a716-446655440005'::uuid),
        ('b50e8400-e29b-41d4-a716-446655440005'::uuid, 'Guidance and Welfare Briefing', 'Introduce counseling, welfare support, and conduct referral procedures.', false, '550e8400-e29b-41d4-a716-446655440008'::uuid)
    ON CONFLICT (id) DO UPDATE
    SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_mandatory = EXCLUDED.is_mandatory,
        department_id = EXCLUDED.department_id;

    INSERT INTO employee_onboarding (
        id,
        employee_id,
        task_id,
        is_completed,
        completed_at,
        notes
    )
    VALUES
        ('1a1e8400-e29b-41d4-a716-446655440001'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'b50e8400-e29b-41d4-a716-446655440001'::uuid, true, '2026-01-08 10:00:00+08'::timestamptz, 'Orientation completed during first day onboarding.'),
        ('1a1e8400-e29b-41d4-a716-446655440002'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'b50e8400-e29b-41d4-a716-446655440002'::uuid, true, '2026-01-09 09:30:00+08'::timestamptz, 'Laptop and school accounts issued.'),
        ('1a1e8400-e29b-41d4-a716-446655440003'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'b50e8400-e29b-41d4-a716-446655440003'::uuid, false, null, 'Awaiting PMED laboratory result upload.'),
        ('1a1e8400-e29b-41d4-a716-446655440004'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'b50e8400-e29b-41d4-a716-446655440004'::uuid, true, '2026-01-10 14:00:00+08'::timestamptz, 'Registrar confirmed advisory and subject loading.'),
        ('1a1e8400-e29b-41d4-a716-446655440005'::uuid, 'f50e8400-e29b-41d4-a716-446655440003'::uuid, 'b50e8400-e29b-41d4-a716-446655440005'::uuid, true, '2025-01-16 11:00:00+08'::timestamptz, 'Completed wellness and employee support orientation.')
    ON CONFLICT (employee_id, task_id) DO UPDATE
    SET
        is_completed = EXCLUDED.is_completed,
        completed_at = EXCLUDED.completed_at,
        notes = EXCLUDED.notes;

    INSERT INTO training_programs (
        id,
        title,
        description,
        duration_hours,
        is_mandatory
    )
    VALUES
        ('850e8400-e29b-41d4-a716-446655440001'::uuid, 'Faculty Orientation Program', 'College-wide orientation for new faculty members covering academics and student handling.', 8, true),
        ('850e8400-e29b-41d4-a716-446655440002'::uuid, 'Data Privacy and Records Handling', 'Records management and compliance workshop for HR, registrar, and admin teams.', 6, true),
        ('850e8400-e29b-41d4-a716-446655440003'::uuid, 'Payroll Systems and Cashier Routing', 'Training for payroll endorsement, cashier coordination, and payroll reconciliation.', 4, false)
    ON CONFLICT (id) DO UPDATE
    SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        duration_hours = EXCLUDED.duration_hours,
        is_mandatory = EXCLUDED.is_mandatory;

    INSERT INTO employee_trainings (
        id,
        employee_id,
        program_id,
        status,
        start_date,
        completion_date,
        score,
        certificate_url
    )
    VALUES
        ('1b1e8400-e29b-41d4-a716-446655440001'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, '850e8400-e29b-41d4-a716-446655440001'::uuid, 'in_progress', '2026-01-08'::date, null, null, null),
        ('1b1e8400-e29b-41d4-a716-446655440002'::uuid, 'f50e8400-e29b-41d4-a716-446655440003'::uuid, '850e8400-e29b-41d4-a716-446655440003'::uuid, 'completed', '2025-02-01'::date, '2025-02-03'::date, 95.50, 'https://example.com/certificates/payroll-routing.pdf'),
        ('1b1e8400-e29b-41d4-a716-446655440003'::uuid, 'f50e8400-e29b-41d4-a716-446655440005'::uuid, '850e8400-e29b-41d4-a716-446655440002'::uuid, 'scheduled', '2026-04-05'::date, null, null, null)
    ON CONFLICT (employee_id, program_id) DO UPDATE
    SET
        status = EXCLUDED.status,
        start_date = EXCLUDED.start_date,
        completion_date = EXCLUDED.completion_date,
        score = EXCLUDED.score,
        certificate_url = EXCLUDED.certificate_url;

    INSERT INTO performance_criteria (
        id,
        name,
        description,
        weight
    )
    VALUES
        ('950e8400-e29b-41d4-a716-446655440001'::uuid, 'Quality of Work', 'Accuracy and completeness of deliverables.', 30.00),
        ('950e8400-e29b-41d4-a716-446655440002'::uuid, 'Timeliness', 'Ability to meet deadlines and process requests on time.', 20.00),
        ('950e8400-e29b-41d4-a716-446655440003'::uuid, 'Compliance', 'Observance of school rules, HR policies, and documentation standards.', 25.00),
        ('950e8400-e29b-41d4-a716-446655440004'::uuid, 'Communication', 'Responsiveness and coordination with employees, students, and partner offices.', 25.00)
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        weight = EXCLUDED.weight;

    INSERT INTO performance_evaluations (
        id,
        employee_id,
        evaluator_id,
        evaluation_period_start,
        evaluation_period_end,
        status,
        overall_rating,
        strengths,
        areas_for_improvement,
        recommendations
    )
    VALUES
        ('1c1e8400-e29b-41d4-a716-446655440001'::uuid, 'f50e8400-e29b-41d4-a716-446655440003'::uuid, 'f50e8400-e29b-41d4-a716-446655440001'::uuid, '2025-10-01'::date, '2025-12-31'::date, 'completed', 4.60, 'Consistent payroll coordination and accurate reconciliation.', 'Needs faster escalation on late cashier endorsements.', 'Prepare succession checklist and train backup processor.'),
        ('1c1e8400-e29b-41d4-a716-446655440002'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'f50e8400-e29b-41d4-a716-446655440002'::uuid, '2026-01-01'::date, '2026-03-31'::date, 'in_progress', null, 'Strong classroom presence and faculty teamwork.', 'Needs completion of PMED routing and document clearance.', 'Finalize probation review after first quarter observations.')
    ON CONFLICT (id) DO UPDATE
    SET
        employee_id = EXCLUDED.employee_id,
        evaluator_id = EXCLUDED.evaluator_id,
        evaluation_period_start = EXCLUDED.evaluation_period_start,
        evaluation_period_end = EXCLUDED.evaluation_period_end,
        status = EXCLUDED.status,
        overall_rating = EXCLUDED.overall_rating,
        strengths = EXCLUDED.strengths,
        areas_for_improvement = EXCLUDED.areas_for_improvement,
        recommendations = EXCLUDED.recommendations,
        updated_at = now();

    INSERT INTO evaluation_scores (
        id,
        evaluation_id,
        criteria_id,
        score,
        comments
    )
    VALUES
        ('1d1e8400-e29b-41d4-a716-446655440001'::uuid, '1c1e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440001'::uuid, 4.70, 'Payroll endorsements were complete and accurate.'),
        ('1d1e8400-e29b-41d4-a716-446655440002'::uuid, '1c1e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440002'::uuid, 4.40, 'Met submission timelines for most payroll cycles.'),
        ('1d1e8400-e29b-41d4-a716-446655440003'::uuid, '1c1e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440003'::uuid, 4.80, 'Documentation was complete for auditing.'),
        ('1d1e8400-e29b-41d4-a716-446655440004'::uuid, '1c1e8400-e29b-41d4-a716-446655440001'::uuid, '950e8400-e29b-41d4-a716-446655440004'::uuid, 4.50, 'Coordinated well with HR and cashier units.')
    ON CONFLICT (evaluation_id, criteria_id) DO UPDATE
    SET
        score = EXCLUDED.score,
        comments = EXCLUDED.comments;

    INSERT INTO payroll_periods (
        id,
        period_start,
        period_end,
        pay_date,
        is_processed,
        processed_at,
        processed_by
    )
    VALUES
        ('a50e8400-e29b-41d4-a716-446655440001'::uuid, '2026-02-16'::date, '2026-02-28'::date, '2026-03-05'::date, true, '2026-03-04 15:00:00+08'::timestamptz, 'd50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('a50e8400-e29b-41d4-a716-446655440002'::uuid, '2026-03-01'::date, '2026-03-15'::date, '2026-03-20'::date, false, null, null)
    ON CONFLICT (id) DO UPDATE
    SET
        period_start = EXCLUDED.period_start,
        period_end = EXCLUDED.period_end,
        pay_date = EXCLUDED.pay_date,
        is_processed = EXCLUDED.is_processed,
        processed_at = EXCLUDED.processed_at,
        processed_by = EXCLUDED.processed_by;

    INSERT INTO payroll_records (
        id,
        employee_id,
        period_id,
        basic_salary,
        allowances,
        deductions,
        net_pay,
        is_paid,
        paid_at
    )
    VALUES
        ('1e1e8400-e29b-41d4-a716-446655440001'::uuid, 'f50e8400-e29b-41d4-a716-446655440001'::uuid, 'a50e8400-e29b-41d4-a716-446655440001'::uuid, 34000.00, 5000.00, 2500.00, 36500.00, true, '2026-03-05 13:00:00+08'::timestamptz),
        ('1e1e8400-e29b-41d4-a716-446655440002'::uuid, 'f50e8400-e29b-41d4-a716-446655440003'::uuid, 'a50e8400-e29b-41d4-a716-446655440001'::uuid, 19500.00, 2500.00, 1000.00, 21000.00, true, '2026-03-05 13:05:00+08'::timestamptz),
        ('1e1e8400-e29b-41d4-a716-446655440003'::uuid, 'f50e8400-e29b-41d4-a716-446655440005'::uuid, 'a50e8400-e29b-41d4-a716-446655440001'::uuid, 17000.00, 1800.00, 900.00, 17900.00, true, '2026-03-05 13:08:00+08'::timestamptz),
        ('1e1e8400-e29b-41d4-a716-446655440004'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'a50e8400-e29b-41d4-a716-446655440001'::uuid, 16500.00, 1000.00, 750.00, 16750.00, true, '2026-03-05 13:12:00+08'::timestamptz),
        ('1e1e8400-e29b-41d4-a716-446655440005'::uuid, 'f50e8400-e29b-41d4-a716-446655440001'::uuid, 'a50e8400-e29b-41d4-a716-446655440002'::uuid, 34000.00, 5000.00, 2500.00, 36500.00, false, null),
        ('1e1e8400-e29b-41d4-a716-446655440006'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'a50e8400-e29b-41d4-a716-446655440002'::uuid, 16500.00, 1000.00, 750.00, 16750.00, false, null)
    ON CONFLICT (employee_id, period_id) DO UPDATE
    SET
        basic_salary = EXCLUDED.basic_salary,
        allowances = EXCLUDED.allowances,
        deductions = EXCLUDED.deductions,
        net_pay = EXCLUDED.net_pay,
        is_paid = EXCLUDED.is_paid,
        paid_at = EXCLUDED.paid_at;

    INSERT INTO benefits (
        id,
        name,
        description,
        type,
        is_active
    )
    VALUES
        ('750e8400-e29b-41d4-a716-446655440001'::uuid, 'Health Insurance', 'Institution-backed HMO coverage for employees and qualified dependents.', 'health', true),
        ('750e8400-e29b-41d4-a716-446655440002'::uuid, 'Rice Subsidy', 'Monthly subsidy released through payroll coordination.', 'allowance', true),
        ('750e8400-e29b-41d4-a716-446655440003'::uuid, 'Faculty Development Grant', 'Professional development support for faculty members.', 'allowance', true)
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        is_active = EXCLUDED.is_active;

    INSERT INTO employee_benefits (
        id,
        employee_id,
        benefit_id,
        enrolled_at,
        coverage_amount,
        is_active
    )
    VALUES
        ('1f1e8400-e29b-41d4-a716-446655440001'::uuid, 'f50e8400-e29b-41d4-a716-446655440001'::uuid, '750e8400-e29b-41d4-a716-446655440001'::uuid, '2024-06-03 09:00:00+08'::timestamptz, 150000.00, true),
        ('1f1e8400-e29b-41d4-a716-446655440002'::uuid, 'f50e8400-e29b-41d4-a716-446655440003'::uuid, '750e8400-e29b-41d4-a716-446655440002'::uuid, '2025-01-15 09:00:00+08'::timestamptz, 1500.00, true),
        ('1f1e8400-e29b-41d4-a716-446655440003'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, '750e8400-e29b-41d4-a716-446655440001'::uuid, '2026-01-08 09:00:00+08'::timestamptz, 120000.00, true),
        ('1f1e8400-e29b-41d4-a716-446655440004'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, '750e8400-e29b-41d4-a716-446655440003'::uuid, '2026-01-15 13:00:00+08'::timestamptz, 10000.00, true)
    ON CONFLICT (employee_id, benefit_id) DO UPDATE
    SET
        enrolled_at = EXCLUDED.enrolled_at,
        coverage_amount = EXCLUDED.coverage_amount,
        is_active = EXCLUDED.is_active;

    INSERT INTO employee_documents (
        id,
        employee_id,
        document_name,
        document_url,
        document_type,
        uploaded_at,
        uploaded_by
    )
    VALUES
        ('2a1e8400-e29b-41d4-a716-446655440001'::uuid, 'f50e8400-e29b-41d4-a716-446655440001'::uuid, 'HR Policy Manual Acknowledgment', 'https://example.com/employee-docs/hr-policy-manual.pdf', 'policy_acknowledgment', '2024-06-03 15:00:00+08'::timestamptz, 'd50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('2a1e8400-e29b-41d4-a716-446655440002'::uuid, 'f50e8400-e29b-41d4-a716-446655440003'::uuid, 'Payroll Authority Form', 'https://example.com/employee-docs/payroll-authority.pdf', 'payroll_form', '2025-01-16 10:00:00+08'::timestamptz, 'd50e8400-e29b-41d4-a716-446655440001'::uuid),
        ('2a1e8400-e29b-41d4-a716-446655440003'::uuid, 'f50e8400-e29b-41d4-a716-446655440008'::uuid, 'Faculty Contract Requirements Checklist', 'https://example.com/employee-docs/faculty-contract-checklist.pdf', 'contract_requirement', '2026-01-09 16:00:00+08'::timestamptz, 'd50e8400-e29b-41d4-a716-446655440002'::uuid)
    ON CONFLICT (id) DO UPDATE
    SET
        employee_id = EXCLUDED.employee_id,
        document_name = EXCLUDED.document_name,
        document_url = EXCLUDED.document_url,
        document_type = EXCLUDED.document_type,
        uploaded_at = EXCLUDED.uploaded_at,
        uploaded_by = EXCLUDED.uploaded_by;

    IF to_regclass('public.integration_flow_events') IS NOT NULL THEN
        INSERT INTO public.integration_flow_events (
            correlation_id,
            route_key,
            source_department_key,
            target_department_key,
            source_record_id,
            event_code,
            status,
            request_payload,
            response_payload,
            dispatch_endpoint,
            initiated_by,
            dispatched_at,
            acknowledged_at,
            last_error,
            metadata,
            created_at
        )
        VALUES
            (
                'hr-cashier-demo-001',
                'hr_to_cashier_payroll_submission',
                'hr',
                'cashier',
                'PAYROLL-BATCH-2026-03A',
                'payroll_submission',
                'queued',
                '{"batch_label":"March 1-15 Payroll","pay_period":"2026-03-01 to 2026-03-15","employee_count":6,"net_amount":126400}'::jsonb,
                '{}'::jsonb,
                '/rest/v1/rpc/dispatch_to_cashier',
                'd50e8400-e29b-41d4-a716-446655440001'::uuid,
                '2026-03-20 09:00:00+08'::timestamptz,
                null,
                null,
                '{"seeded":true,"source":"dashboard_demo"}'::jsonb,
                '2026-03-20 09:00:00+08'::timestamptz
            ),
            (
                'hr-registrar-demo-001',
                'hr_to_registrar_faculty_assignment',
                'hr',
                'registrar',
                'FAC-LOAD-LEA-2026Q1',
                'faculty_assignment_validation',
                'acknowledged',
                '{"employee_id":"f50e8400-e29b-41d4-a716-446655440008","employee_name":"Lea Martinez","semester":"2nd Semester","college_unit":"Senior High School"}'::jsonb,
                '{"status":"validated","remarks":"Faculty load confirmed by registrar."}'::jsonb,
                '/rest/v1/rpc/dispatch_to_registrar',
                'd50e8400-e29b-41d4-a716-446655440002'::uuid,
                '2026-03-19 09:45:00+08'::timestamptz,
                '2026-03-19 10:30:00+08'::timestamptz,
                null,
                '{"seeded":true,"source":"dashboard_demo"}'::jsonb,
                '2026-03-19 09:45:00+08'::timestamptz
            ),
            (
                'hr-pmed-demo-001',
                'hr_to_pmed_medical_endorsement',
                'hr',
                'pmed',
                'ONBOARD-LEA-2026',
                'medical_endorsement',
                'blocked',
                '{"employee_id":"f50e8400-e29b-41d4-a716-446655440008","employee_name":"Lea Martinez","employment_stage":"onboarding"}'::jsonb,
                '{"status":"awaiting_results"}'::jsonb,
                '/rest/v1/rpc/dispatch_to_pmed',
                'd50e8400-e29b-41d4-a716-446655440001'::uuid,
                '2026-03-19 08:40:00+08'::timestamptz,
                '2026-03-19 11:10:00+08'::timestamptz,
                'Awaiting CBC result upload.',
                '{"seeded":true,"source":"dashboard_demo"}'::jsonb,
                '2026-03-19 08:40:00+08'::timestamptz
            ),
            (
                'hr-clinic-demo-001',
                'hr_to_clinic_health_clearance',
                'hr',
                'clinic',
                'FITWORK-MARIA-2026',
                'health_clearance',
                'completed',
                '{"employee_id":"f50e8400-e29b-41d4-a716-446655440003","employee_name":"Maria Santos","clearance_reason":"return_to_work"}'::jsonb,
                '{"status":"cleared","clinic_advice":"Return-to-work approved."}'::jsonb,
                '/rest/v1/rpc/dispatch_to_clinic',
                'd50e8400-e29b-41d4-a716-446655440001'::uuid,
                '2026-03-18 13:20:00+08'::timestamptz,
                '2026-03-18 16:00:00+08'::timestamptz,
                null,
                '{"seeded":true,"source":"dashboard_demo"}'::jsonb,
                '2026-03-18 13:20:00+08'::timestamptz
            ),
            (
                'hr-comlab-demo-001',
                'hr_to_comlab_account_provision',
                'hr',
                'comlab_it',
                'ACC-PROVISION-LEA-2026',
                'account_provision',
                'dispatched',
                '{"employee_id":"f50e8400-e29b-41d4-a716-446655440008","employee_name":"Lea Martinez","position_title":"Senior High School English Instructor"}'::jsonb,
                '{"status":"processing"}'::jsonb,
                '/rest/v1/rpc/dispatch_to_comlab',
                'd50e8400-e29b-41d4-a716-446655440002'::uuid,
                '2026-03-20 08:20:00+08'::timestamptz,
                null,
                null,
                '{"seeded":true,"source":"dashboard_demo"}'::jsonb,
                '2026-03-20 08:20:00+08'::timestamptz
            ),
            (
                'hr-guidance-demo-001',
                'hr_to_guidance_counseling_referral',
                'hr',
                'guidance',
                'GUIDE-REF-2026-001',
                'counseling_referral',
                'acknowledged',
                '{"employee_id":"f50e8400-e29b-41d4-a716-446655440007","employee_name":"Mark Villanueva","referral_reason":"employee_support"}'::jsonb,
                '{"status":"scheduled","schedule":"2026-03-24T10:00:00+08:00"}'::jsonb,
                '/rest/v1/rpc/dispatch_to_guidance',
                'd50e8400-e29b-41d4-a716-446655440001'::uuid,
                '2026-03-18 15:00:00+08'::timestamptz,
                '2026-03-18 16:15:00+08'::timestamptz,
                null,
                '{"seeded":true,"source":"dashboard_demo"}'::jsonb,
                '2026-03-18 15:00:00+08'::timestamptz
            ),
            (
                'hr-prefect-demo-001',
                'hr_to_prefect_conduct_clearance',
                'hr',
                'prefect',
                'CLEARANCE-CONDUCT-2026-001',
                'conduct_clearance',
                'queued',
                '{"employee_id":"f50e8400-e29b-41d4-a716-446655440008","employee_name":"Lea Martinez","clearance_reason":"probation_review"}'::jsonb,
                '{}'::jsonb,
                '/rest/v1/rpc/dispatch_to_prefect',
                'd50e8400-e29b-41d4-a716-446655440002'::uuid,
                '2026-03-20 10:05:00+08'::timestamptz,
                null,
                null,
                '{"seeded":true,"source":"dashboard_demo"}'::jsonb,
                '2026-03-20 10:05:00+08'::timestamptz
            ),
            (
                'hr-crad-demo-001',
                'hr_to_crad_case_record_sync',
                'hr',
                'crad',
                'CASE-SYNC-2026-001',
                'case_record_sync',
                'completed',
                '{"employee_id":"f50e8400-e29b-41d4-a716-446655440007","employee_name":"Mark Villanueva","record_type":"employee_case"}'::jsonb,
                '{"status":"synced","reference_no":"CRAD-2026-441"}'::jsonb,
                '/rest/v1/rpc/dispatch_to_crad',
                'd50e8400-e29b-41d4-a716-446655440001'::uuid,
                '2026-03-17 14:30:00+08'::timestamptz,
                '2026-03-17 15:10:00+08'::timestamptz,
                null,
                '{"seeded":true,"source":"dashboard_demo"}'::jsonb,
                '2026-03-17 14:30:00+08'::timestamptz
            )
        ON CONFLICT (correlation_id) DO UPDATE
        SET
            route_key = EXCLUDED.route_key,
            source_department_key = EXCLUDED.source_department_key,
            target_department_key = EXCLUDED.target_department_key,
            source_record_id = EXCLUDED.source_record_id,
            event_code = EXCLUDED.event_code,
            status = EXCLUDED.status,
            request_payload = EXCLUDED.request_payload,
            response_payload = EXCLUDED.response_payload,
            dispatch_endpoint = EXCLUDED.dispatch_endpoint,
            initiated_by = EXCLUDED.initiated_by,
            dispatched_at = EXCLUDED.dispatched_at,
            acknowledged_at = EXCLUDED.acknowledged_at,
            last_error = EXCLUDED.last_error,
            metadata = EXCLUDED.metadata,
            created_at = EXCLUDED.created_at,
            updated_at = now();
    END IF;

    INSERT INTO audit_logs (
        id,
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        created_at
    )
    VALUES
        ('2b1e8400-e29b-41d4-a716-446655440001'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, 'seeded_department_records', 'departments', '550e8400-e29b-41d4-a716-446655440001'::uuid, '{}'::jsonb, '{"context":"Demo seed initialized department master data"}'::jsonb, '127.0.0.1', '2026-03-18 09:00:00+08'::timestamptz),
        ('2b1e8400-e29b-41d4-a716-446655440002'::uuid, 'd50e8400-e29b-41d4-a716-446655440002'::uuid, 'forwarded_to_cashier', 'payroll_periods', 'a50e8400-e29b-41d4-a716-446655440002'::uuid, '{}'::jsonb, '{"batch":"March 1-15 payroll","status":"Pending cashier endorsement"}'::jsonb, '127.0.0.1', '2026-03-18 10:15:00+08'::timestamptz),
        ('2b1e8400-e29b-41d4-a716-446655440003'::uuid, 'd50e8400-e29b-41d4-a716-446655440002'::uuid, 'endorsed_to_registrar', 'employment_contracts', '151e8400-e29b-41d4-a716-446655440008'::uuid, '{}'::jsonb, '{"employee":"Lea Martinez","reason":"Faculty load validation"}'::jsonb, '127.0.0.1', '2026-03-18 11:20:00+08'::timestamptz),
        ('2b1e8400-e29b-41d4-a716-446655440004'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, 'sent_to_pmed', 'employee_onboarding', '1a1e8400-e29b-41d4-a716-446655440003'::uuid, '{}'::jsonb, '{"employee":"Lea Martinez","status":"Awaiting laboratory results"}'::jsonb, '127.0.0.1', '2026-03-19 08:45:00+08'::timestamptz),
        ('2b1e8400-e29b-41d4-a716-446655440005'::uuid, 'd50e8400-e29b-41d4-a716-446655440001'::uuid, 'started_clearance', 'job_applications', '171e8400-e29b-41d4-a716-446655440003'::uuid, '{}'::jsonb, '{"applicant":"Nikki Torres","workflow":"HR -> PMED -> Clinic -> Administration"}'::jsonb, '127.0.0.1', '2026-03-19 14:10:00+08'::timestamptz)
    ON CONFLICT (id) DO UPDATE
    SET
        user_id = EXCLUDED.user_id,
        action = EXCLUDED.action,
        table_name = EXCLUDED.table_name,
        record_id = EXCLUDED.record_id,
        old_values = EXCLUDED.old_values,
        new_values = EXCLUDED.new_values,
        ip_address = EXCLUDED.ip_address,
        created_at = EXCLUDED.created_at;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
          AND column_name = 'actor_user_id'
    ) THEN
        INSERT INTO public.audit_logs (
            actor_user_id,
            actor_name,
            actor_role,
            module_key,
            entity_type,
            entity_id,
            action,
            before_status,
            after_status,
            before_stage,
            after_stage,
            remarks,
            created_at
        )
        SELECT *
        FROM (
            VALUES
                (null::integer, 'System Administrator', 'system_admin', 'departments', 'department', 1001, 'seeded_department_records', null, 'active', null, null, 'Demo seed initialized department master data.', '2026-03-18 09:00:00+08'::timestamptz),
                (null::integer, 'Hannah Reyes', 'hr_admin', 'payroll', 'payroll_period', 1002, 'forwarded_to_cashier', 'draft', 'pending_cashier', 'hr_review', 'cashier_queue', 'March 1-15 payroll batch forwarded to cashier endorsement.', '2026-03-18 10:15:00+08'::timestamptz),
                (null::integer, 'Hannah Reyes', 'hr_admin', 'contracts', 'employment_contract', 1003, 'endorsed_to_registrar', 'pending_validation', 'registrar_review', 'hr', 'registrar', 'Lea Martinez contract routed for faculty load validation.', '2026-03-18 11:20:00+08'::timestamptz),
                (null::integer, 'System Administrator', 'system_admin', 'onboarding', 'employee_onboarding', 1004, 'sent_to_pmed', 'awaiting_requirements', 'pending_medical', 'hr', 'pmed', 'PMED routing started for Lea Martinez.', '2026-03-19 08:45:00+08'::timestamptz),
                (null::integer, 'System Administrator', 'system_admin', 'recruitment', 'job_application', 1005, 'started_clearance', 'hired', 'clearance_in_progress', 'hr', 'clinic', 'Clearance workflow opened for Nikki Torres after hiring approval.', '2026-03-19 14:10:00+08'::timestamptz)
        ) AS seeded_logs (
            actor_user_id,
            actor_name,
            actor_role,
            module_key,
            entity_type,
            entity_id,
            action,
            before_status,
            after_status,
            before_stage,
            after_stage,
            remarks,
            created_at
        )
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.audit_logs existing
            WHERE existing.action = seeded_logs.action
              AND existing.remarks = seeded_logs.remarks
        );
    END IF;
END
$$;

-- =====================================================
-- Seed Completion Summary
-- =====================================================
-- Seeded user accounts: 11
-- Seeded employees: 8
-- Seeded applicants: 3
-- Seeded job postings: 5
-- Seeded payroll periods: 2
-- Seeded integration events: 8
-- Default admin login:
--   email: adminhr@gmail.com
--   password: admin123
