-- Seed data to test "Convert to Employee" functionality
-- This script creates a new applicant who is already "Hired" but not yet an employee.

DO $$
DECLARE
    _applicant_user_id UUID := 'd50e8400-e29b-41d4-a716-446655440999'; -- Unique test ID
    _applicant_id UUID := 'a50e8400-e29b-41d4-a716-446655440999';
    _job_posting_id UUID;
    _target_schema text;
BEGIN
    -- 1. Determine target schema (hr or public)
    IF to_regclass('hr.profiles') IS NOT NULL THEN
        _target_schema := 'hr';
    ELSE
        _target_schema := 'public';
    END IF;

    PERFORM set_config('search_path', quote_ident(_target_schema) || ', public, auth', true);

    -- 2. Create Auth User
    INSERT INTO auth.users (
        id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
        _applicant_user_id, 'authenticated', 'authenticated', 'test.applicant@example.com', 
        extensions.crypt('password123', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, 
        '{"first_name":"Test","last_name":"Applicant"}'::jsonb, now(), now()
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Create Profile
    INSERT INTO profiles (user_id, first_name, last_name, email, city)
    VALUES (_applicant_user_id, 'Test', 'Applicant', 'test.applicant@example.com', 'Test City')
    ON CONFLICT (user_id) DO NOTHING;

    -- 4. Assign Applicant Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_applicant_user_id, 'applicant')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 5. Create Applicant record
    INSERT INTO applicants (id, user_id)
    VALUES (_applicant_id, _applicant_user_id)
    ON CONFLICT (id) DO NOTHING;

    -- 6. Get a valid job posting to link to
    SELECT id INTO _job_posting_id FROM job_postings LIMIT 1;

    -- 7. Create Job Application with 'hired' status
    IF _job_posting_id IS NOT NULL THEN
        INSERT INTO job_applications (applicant_id, job_posting_id, status)
        VALUES (_applicant_id, _job_posting_id, 'hired')
        ON CONFLICT (applicant_id, job_posting_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'Seed completed. Test Applicant "Test Applicant" (test.applicant@example.com) is now ready to be converted in the Employees page.';
END $$;
