-- BEGIN 20260122000230_02cd305d-a53e-4be5-9eef-dd8375323d6e.sql
-- Create ENUM types for roles and statuses
CREATE TYPE public.app_role AS ENUM ('system_admin', 'hr_admin', 'employee', 'applicant');
CREATE TYPE public.application_status AS ENUM ('applied', 'interview', 'hired', 'rejected');
CREATE TYPE public.employment_status AS ENUM ('active', 'on_leave', 'terminated', 'probation');
CREATE TYPE public.contract_type AS ENUM ('full_time', 'part_time', 'contractual', 'temporary');
CREATE TYPE public.employee_type AS ENUM ('teacher', 'principal', 'registrar', 'staff', 'admin');
CREATE TYPE public.training_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.evaluation_status AS ENUM ('pending', 'in_progress', 'completed');

-- =====================================================
-- 1. DEPARTMENTS TABLE (1NF - No repeating groups)
-- =====================================================
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. POSITIONS TABLE (2NF - Non-key dependent on full key)
-- =====================================================
CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    min_salary DECIMAL(12,2),
    max_salary DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. USER ROLES TABLE (RBAC - Separate from profiles)
-- =====================================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'applicant',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- =====================================================
-- 4. PROFILES TABLE (User base info)
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. EMPLOYEES TABLE (3NF - No transitive dependencies)
-- =====================================================
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    employee_type employee_type NOT NULL DEFAULT 'staff',
    hire_date DATE NOT NULL,
    employment_status employment_status NOT NULL DEFAULT 'active',
    supervisor_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. EMPLOYMENT CONTRACTS TABLE (4NF - No multi-valued dependencies)
-- =====================================================
CREATE TABLE public.employment_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    contract_type contract_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    salary DECIMAL(12,2) NOT NULL,
    is_current BOOLEAN DEFAULT true,
    terms TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 7. JOB POSTINGS TABLE
-- =====================================================
CREATE TABLE public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    salary_range_min DECIMAL(12,2),
    salary_range_max DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deadline DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 8. APPLICANTS TABLE
-- =====================================================
CREATE TABLE public.applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    resume_url TEXT,
    cover_letter TEXT,
    years_experience INTEGER DEFAULT 0,
    education_level VARCHAR(100),
    skills TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 9. JOB APPLICATIONS TABLE
-- =====================================================
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'applied',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    UNIQUE(applicant_id, job_posting_id)
);

-- =====================================================
-- 10. INTERVIEW SCHEDULES TABLE
-- =====================================================
CREATE TABLE public.interview_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    interviewer_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 11. APPLICANT DOCUMENTS TABLE (Separate for 4NF)
-- =====================================================
CREATE TABLE public.applicant_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    document_type VARCHAR(50), -- resume, certificate, etc.
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 12. ONBOARDING TASKS TABLE
-- =====================================================
CREATE TABLE public.onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT true,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 13. EMPLOYEE ONBOARDING TABLE
-- =====================================================
CREATE TABLE public.employee_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.onboarding_tasks(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(employee_id, task_id)
);

-- =====================================================
-- 14. TRAINING PROGRAMS TABLE
-- =====================================================
CREATE TABLE public.training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_hours INTEGER,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 15. EMPLOYEE TRAININGS TABLE
-- =====================================================
CREATE TABLE public.employee_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
    status training_status NOT NULL DEFAULT 'scheduled',
    start_date DATE,
    completion_date DATE,
    score DECIMAL(5,2),
    certificate_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, program_id)
);

-- =====================================================
-- 16. PERFORMANCE EVALUATIONS TABLE
-- =====================================================
CREATE TABLE public.performance_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    evaluation_period_start DATE NOT NULL,
    evaluation_period_end DATE NOT NULL,
    status evaluation_status NOT NULL DEFAULT 'pending',
    overall_rating DECIMAL(3,2),
    strengths TEXT,
    areas_for_improvement TEXT,
    recommendations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 17. PERFORMANCE CRITERIA TABLE (4NF separation)
-- =====================================================
CREATE TABLE public.performance_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 18. EVALUATION SCORES TABLE
-- =====================================================
CREATE TABLE public.evaluation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES public.performance_evaluations(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES public.performance_criteria(id) ON DELETE CASCADE,
    score DECIMAL(3,2) NOT NULL,
    comments TEXT,
    UNIQUE(evaluation_id, criteria_id)
);

-- =====================================================
-- 19. PAYROLL PERIODS TABLE
-- =====================================================
CREATE TABLE public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 20. PAYROLL RECORDS TABLE
-- =====================================================
CREATE TABLE public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    basic_salary DECIMAL(12,2) NOT NULL,
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, period_id)
);

-- =====================================================
-- 21. BENEFITS TABLE
-- =====================================================
CREATE TABLE public.benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50), -- health, insurance, allowance
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 22. EMPLOYEE BENEFITS TABLE (4NF - Multi-valued)
-- =====================================================
CREATE TABLE public.employee_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    benefit_id UUID NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    coverage_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(employee_id, benefit_id)
);

-- =====================================================
-- 23. EMPLOYEE DOCUMENTS TABLE
-- =====================================================
CREATE TABLE public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    document_type VARCHAR(50),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 24. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKING
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- =====================================================
-- FUNCTION TO GET USER'S HIGHEST ROLE
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    ORDER BY 
        CASE role 
            WHEN 'system_admin' THEN 1 
            WHEN 'hr_admin' THEN 2 
            WHEN 'employee' THEN 3 
            WHEN 'applicant' THEN 4 
        END
    LIMIT 1
$$;

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employment_contracts_updated_at BEFORE UPDATE ON public.employment_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON public.applicants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interview_schedules_updated_at BEFORE UPDATE ON public.interview_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_performance_evaluations_updated_at BEFORE UPDATE ON public.performance_evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR USER_ROLES
-- =====================================================
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin'));

-- =====================================================
-- RLS POLICIES FOR PROFILES
-- =====================================================
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR DEPARTMENTS
-- =====================================================
CREATE POLICY "Authenticated users can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin'));

-- =====================================================
-- RLS POLICIES FOR POSITIONS
-- =====================================================
CREATE POLICY "Authenticated users can view positions" ON public.positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage positions" ON public.positions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR EMPLOYEES
-- =====================================================
CREATE POLICY "Employees can view own record" ON public.employees FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "HR and Admins can view all employees" ON public.employees FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR and Admins can manage employees" ON public.employees FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR EMPLOYMENT_CONTRACTS
-- =====================================================
CREATE POLICY "Employees can view own contracts" ON public.employment_contracts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "HR and Admins can manage contracts" ON public.employment_contracts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR JOB_POSTINGS
-- =====================================================
CREATE POLICY "Everyone can view active job postings" ON public.job_postings FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "HR can manage job postings" ON public.job_postings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR APPLICANTS
-- =====================================================
CREATE POLICY "Applicants can view own record" ON public.applicants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Applicants can manage own record" ON public.applicants FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "HR can view all applicants" ON public.applicants FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR JOB_APPLICATIONS
-- =====================================================
CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.applicants a WHERE a.id = applicant_id AND a.user_id = auth.uid()));
CREATE POLICY "Applicants can create applications" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.applicants a WHERE a.id = applicant_id AND a.user_id = auth.uid()));
CREATE POLICY "HR can manage all applications" ON public.job_applications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR INTERVIEW_SCHEDULES
-- =====================================================
CREATE POLICY "Applicants can view own interviews" ON public.interview_schedules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.job_applications ja JOIN public.applicants a ON a.id = ja.applicant_id WHERE ja.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "HR can manage interviews" ON public.interview_schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR APPLICANT_DOCUMENTS
-- =====================================================
CREATE POLICY "Applicants can manage own documents" ON public.applicant_documents FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.applicants a WHERE a.id = applicant_id AND a.user_id = auth.uid()));
CREATE POLICY "HR can view applicant documents" ON public.applicant_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR TRAINING AND ONBOARDING
-- =====================================================
CREATE POLICY "View onboarding tasks" ON public.onboarding_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage onboarding tasks" ON public.onboarding_tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "Employees view own onboarding" ON public.employee_onboarding FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "HR manages employee onboarding" ON public.employee_onboarding FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "View training programs" ON public.training_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR manages training programs" ON public.training_programs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "Employees view own trainings" ON public.employee_trainings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "HR manages employee trainings" ON public.employee_trainings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR PERFORMANCE EVALUATIONS
-- =====================================================
CREATE POLICY "Employees view own evaluations" ON public.performance_evaluations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "HR manages evaluations" ON public.performance_evaluations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "View performance criteria" ON public.performance_criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage criteria" ON public.performance_criteria FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Employees view own scores" ON public.evaluation_scores FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.performance_evaluations pe JOIN public.employees e ON e.id = pe.employee_id WHERE pe.id = evaluation_id AND e.user_id = auth.uid()));
CREATE POLICY "HR manages scores" ON public.evaluation_scores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR PAYROLL
-- =====================================================
CREATE POLICY "View payroll periods" ON public.payroll_periods FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));
CREATE POLICY "HR manages payroll periods" ON public.payroll_periods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "Employees view own payroll" ON public.payroll_records FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "HR manages payroll" ON public.payroll_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR BENEFITS
-- =====================================================
CREATE POLICY "View benefits" ON public.benefits FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR manages benefits" ON public.benefits FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "Employees view own benefits" ON public.employee_benefits FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "HR manages employee benefits" ON public.employee_benefits FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR EMPLOYEE DOCUMENTS
-- =====================================================
CREATE POLICY "Employees view own documents" ON public.employee_documents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "HR manages employee documents" ON public.employee_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- RLS POLICIES FOR AUDIT LOGS
-- =====================================================
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'system_admin'));
CREATE POLICY "System inserts audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- TRIGGER TO AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        NEW.email
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'applicant');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_department_id ON public.employees(department_id);
CREATE INDEX idx_job_applications_applicant ON public.job_applications(applicant_id);
CREATE INDEX idx_job_applications_job ON public.job_applications(job_posting_id);
CREATE INDEX idx_payroll_records_employee ON public.payroll_records(employee_id);
CREATE INDEX idx_performance_evaluations_employee ON public.performance_evaluations(employee_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
-- END 20260122000230_02cd305d-a53e-4be5-9eef-dd8375323d6e.sql

-- BEGIN 20260122000241_30b8c149-0008-4c57-86a3-2848baff6229.sql
-- Fix the audit logs INSERT policy to be more restrictive
DROP POLICY IF EXISTS "System inserts audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);
-- END 20260122000241_30b8c149-0008-4c57-86a3-2848baff6229.sql

-- BEGIN 20260122001319_25697eaa-0fe7-48e8-9043-d5df67a78d54.sql
-- Create storage bucket for HR documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hr-documents', 'hr-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'hr-documents');

CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'hr-documents');

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'hr-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'hr-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "HR admins can manage all files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'hr-documents' AND (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('system_admin', 'hr_admin'))
));
-- END 20260122001319_25697eaa-0fe7-48e8-9043-d5df67a78d54.sql

-- BEGIN 20260122002842_0470fbd6-11fb-4d83-b2d9-ea4183028d07.sql
-- Disable RLS on all tables for testing
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_trainings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_criteria DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_benefits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "System admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view positions" ON public.positions;
DROP POLICY IF EXISTS "Admins can manage positions" ON public.positions;
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
DROP POLICY IF EXISTS "HR and Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "HR and Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view own contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "HR and Admins can manage contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "Everyone can view active job postings" ON public.job_postings;
DROP POLICY IF EXISTS "HR can manage job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Applicants can view own record" ON public.applicants;
DROP POLICY IF EXISTS "Applicants can manage own record" ON public.applicants;
DROP POLICY IF EXISTS "HR can view all applicants" ON public.applicants;
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "HR can manage all applications" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can view own interviews" ON public.interview_schedules;
DROP POLICY IF EXISTS "HR can manage interviews" ON public.interview_schedules;
DROP POLICY IF EXISTS "Applicants can manage own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "HR can view applicant documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "View onboarding tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "Admins manage onboarding tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "Employees view own onboarding" ON public.employee_onboarding;
DROP POLICY IF EXISTS "HR manages employee onboarding" ON public.employee_onboarding;
DROP POLICY IF EXISTS "View training programs" ON public.training_programs;
DROP POLICY IF EXISTS "HR manages training programs" ON public.training_programs;
DROP POLICY IF EXISTS "Employees view own trainings" ON public.employee_trainings;
DROP POLICY IF EXISTS "HR manages employee trainings" ON public.employee_trainings;
DROP POLICY IF EXISTS "Employees view own evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "HR manages evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "View performance criteria" ON public.performance_criteria;
DROP POLICY IF EXISTS "Admins manage criteria" ON public.performance_criteria;
DROP POLICY IF EXISTS "Employees view own scores" ON public.evaluation_scores;
DROP POLICY IF EXISTS "HR manages scores" ON public.evaluation_scores;
DROP POLICY IF EXISTS "View payroll periods" ON public.payroll_periods;
DROP POLICY IF EXISTS "HR manages payroll periods" ON public.payroll_periods;
DROP POLICY IF EXISTS "Employees view own payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "HR manages payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "View benefits" ON public.benefits;
DROP POLICY IF EXISTS "HR manages benefits" ON public.benefits;
DROP POLICY IF EXISTS "Employees view own benefits" ON public.employee_benefits;
DROP POLICY IF EXISTS "HR manages employee benefits" ON public.employee_benefits;
DROP POLICY IF EXISTS "Employees view own documents" ON public.employee_documents;
DROP POLICY IF EXISTS "HR manages employee documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
-- END 20260122002842_0470fbd6-11fb-4d83-b2d9-ea4183028d07.sql

-- BEGIN 20260122004934_2a8cb50e-5448-4058-b8cc-4654a8d02f1a.sql

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "HR and admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System creates profiles on signup"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- USER_ROLES POLICIES
-- =============================================
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'))
WITH CHECK (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System can insert default role on signup"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'applicant');

-- =============================================
-- DEPARTMENTS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view departments"
ON public.departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage departments"
ON public.departments FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- POSITIONS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view positions"
ON public.positions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can manage positions"
ON public.positions FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- EMPLOYEES POLICIES
-- =============================================
CREATE POLICY "Employees can view their own record"
ON public.employees FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "HR can view all employees"
ON public.employees FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can manage employees"
ON public.employees FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- EMPLOYMENT_CONTRACTS POLICIES
-- =============================================
CREATE POLICY "Employees can view their own contracts"
ON public.employment_contracts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employment_contracts.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all contracts"
ON public.employment_contracts FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- EMPLOYEE_DOCUMENTS POLICIES
-- =============================================
CREATE POLICY "Employees can view their own documents"
ON public.employee_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_documents.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all employee documents"
ON public.employee_documents FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- ONBOARDING_TASKS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view onboarding tasks"
ON public.onboarding_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can manage onboarding tasks"
ON public.onboarding_tasks FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- EMPLOYEE_ONBOARDING POLICIES
-- =============================================
CREATE POLICY "Employees can view their own onboarding"
ON public.employee_onboarding FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_onboarding.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all onboarding"
ON public.employee_onboarding FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- BENEFITS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view benefits"
ON public.benefits FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can manage benefits"
ON public.benefits FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- EMPLOYEE_BENEFITS POLICIES
-- =============================================
CREATE POLICY "Employees can view their own benefits"
ON public.employee_benefits FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_benefits.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all employee benefits"
ON public.employee_benefits FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- PAYROLL_PERIODS POLICIES
-- =============================================
CREATE POLICY "Employees can view payroll periods"
ON public.payroll_periods FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin') OR
  public.has_role(auth.uid(), 'employee')
);

CREATE POLICY "HR can manage payroll periods"
ON public.payroll_periods FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- PAYROLL_RECORDS POLICIES
-- =============================================
CREATE POLICY "Employees can view their own payroll"
ON public.payroll_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = payroll_records.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all payroll records"
ON public.payroll_records FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- TRAINING_PROGRAMS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view training programs"
ON public.training_programs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can manage training programs"
ON public.training_programs FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- EMPLOYEE_TRAININGS POLICIES
-- =============================================
CREATE POLICY "Employees can view their own trainings"
ON public.employee_trainings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_trainings.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all employee trainings"
ON public.employee_trainings FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- PERFORMANCE_CRITERIA POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view performance criteria"
ON public.performance_criteria FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can manage performance criteria"
ON public.performance_criteria FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- PERFORMANCE_EVALUATIONS POLICIES
-- =============================================
CREATE POLICY "Employees can view their own evaluations"
ON public.performance_evaluations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = performance_evaluations.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all evaluations"
ON public.performance_evaluations FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- EVALUATION_SCORES POLICIES
-- =============================================
CREATE POLICY "Employees can view their own evaluation scores"
ON public.evaluation_scores FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.performance_evaluations pe
    JOIN public.employees e ON e.id = pe.employee_id
    WHERE pe.id = evaluation_scores.evaluation_id 
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all evaluation scores"
ON public.evaluation_scores FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- JOB_POSTINGS POLICIES
-- =============================================
CREATE POLICY "Anyone can view active job postings"
ON public.job_postings FOR SELECT
TO authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "HR can manage job postings"
ON public.job_postings FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- APPLICANTS POLICIES
-- =============================================
CREATE POLICY "Applicants can view their own record"
ON public.applicants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Applicants can manage their own record"
ON public.applicants FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR can view all applicants"
ON public.applicants FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- APPLICANT_DOCUMENTS POLICIES
-- =============================================
CREATE POLICY "Applicants can manage their own documents"
ON public.applicant_documents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = applicant_documents.applicant_id 
    AND applicants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = applicant_documents.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all applicant documents"
ON public.applicant_documents FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- JOB_APPLICATIONS POLICIES
-- =============================================
CREATE POLICY "Applicants can view their own applications"
ON public.job_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = job_applications.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "Applicants can create applications"
ON public.job_applications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = job_applications.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all applications"
ON public.job_applications FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- INTERVIEW_SCHEDULES POLICIES
-- =============================================
CREATE POLICY "Applicants can view their own interviews"
ON public.interview_schedules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.applicants a ON a.id = ja.applicant_id
    WHERE ja.id = interview_schedules.application_id 
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "HR can manage all interviews"
ON public.interview_schedules FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- AUDIT_LOGS POLICIES
-- =============================================
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- END 20260122004934_2a8cb50e-5448-4058-b8cc-4654a8d02f1a.sql

-- BEGIN 20260122004942_409560ec-1e77-44ea-89b8-c95c9324f8d8.sql

-- Fix the permissive audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a more restrictive policy - only authenticated users can insert their own audit logs
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- END 20260122004942_409560ec-1e77-44ea-89b8-c95c9324f8d8.sql

-- BEGIN 20260122005700_b7df6c98-92a9-4e24-b541-bd6635af63d4.sql

-- Drop all existing policies and recreate them properly
-- The issue is that multiple SELECT policies with FOR ALL cause conflicts

-- =============================================
-- USER_ROLES - Fix the policies to allow HR to update roles
-- =============================================
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can insert default role on signup" ON public.user_roles;

-- Users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- System admin and HR admin can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- System admin can insert/update/delete roles
CREATE POLICY "System admin can manage all roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System admin can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'))
WITH CHECK (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "System admin can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'));

-- HR admin can update roles (to employee only)
CREATE POLICY "HR admin can update roles to employee"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'hr_admin'))
WITH CHECK (public.has_role(auth.uid(), 'hr_admin') AND role = 'employee');

-- HR admin can insert employee roles
CREATE POLICY "HR admin can insert employee roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'hr_admin') AND role = 'employee');

-- =============================================
-- EMPLOYEES - Fix policies
-- =============================================
DROP POLICY IF EXISTS "Employees can view their own record" ON public.employees;
DROP POLICY IF EXISTS "HR can view all employees" ON public.employees;
DROP POLICY IF EXISTS "HR can manage employees" ON public.employees;

CREATE POLICY "Employees can view their own record"
ON public.employees FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "HR can view all employees"
ON public.employees FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert employees"
ON public.employees FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update employees"
ON public.employees FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete employees"
ON public.employees FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- EMPLOYMENT_CONTRACTS - Fix policies
-- =============================================
DROP POLICY IF EXISTS "Employees can view their own contracts" ON public.employment_contracts;
DROP POLICY IF EXISTS "HR can manage all contracts" ON public.employment_contracts;

CREATE POLICY "Employees can view their own contracts"
ON public.employment_contracts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employment_contracts.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all contracts"
ON public.employment_contracts FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert contracts"
ON public.employment_contracts FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update contracts"
ON public.employment_contracts FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete contracts"
ON public.employment_contracts FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- APPLICANTS - Fix policies (HR needs full access)
-- =============================================
DROP POLICY IF EXISTS "Applicants can view their own record" ON public.applicants;
DROP POLICY IF EXISTS "Applicants can manage their own record" ON public.applicants;
DROP POLICY IF EXISTS "HR can view all applicants" ON public.applicants;

CREATE POLICY "Applicants can view their own record"
ON public.applicants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Applicants can insert their own record"
ON public.applicants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Applicants can update their own record"
ON public.applicants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR can view all applicants"
ON public.applicants FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can manage all applicants"
ON public.applicants FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- JOB_APPLICATIONS - Fix policies
-- =============================================
DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "HR can manage all applications" ON public.job_applications;

CREATE POLICY "Applicants can view their own applications"
ON public.job_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = job_applications.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "Applicants can create applications"
ON public.job_applications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = job_applications.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all applications"
ON public.job_applications FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update applications"
ON public.job_applications FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete applications"
ON public.job_applications FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- INTERVIEW_SCHEDULES - Fix policies
-- =============================================
DROP POLICY IF EXISTS "Applicants can view their own interviews" ON public.interview_schedules;
DROP POLICY IF EXISTS "HR can manage all interviews" ON public.interview_schedules;

CREATE POLICY "Applicants can view their own interviews"
ON public.interview_schedules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.applicants a ON a.id = ja.applicant_id
    WHERE ja.id = interview_schedules.application_id 
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all interviews"
ON public.interview_schedules FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert interviews"
ON public.interview_schedules FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update interviews"
ON public.interview_schedules FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete interviews"
ON public.interview_schedules FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- JOB_POSTINGS - Fix policies
-- =============================================
DROP POLICY IF EXISTS "Anyone can view active job postings" ON public.job_postings;
DROP POLICY IF EXISTS "HR can manage job postings" ON public.job_postings;

CREATE POLICY "Anyone can view active job postings"
ON public.job_postings FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "HR can view all job postings"
ON public.job_postings FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert job postings"
ON public.job_postings FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update job postings"
ON public.job_postings FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete job postings"
ON public.job_postings FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- DEPARTMENTS - Fix policies
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;

CREATE POLICY "Authenticated users can view departments"
ON public.departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can insert departments"
ON public.departments FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update departments"
ON public.departments FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete departments"
ON public.departments FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- POSITIONS - Fix policies
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view positions" ON public.positions;
DROP POLICY IF EXISTS "HR can manage positions" ON public.positions;

CREATE POLICY "Authenticated users can view positions"
ON public.positions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can insert positions"
ON public.positions FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update positions"
ON public.positions FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete positions"
ON public.positions FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- =============================================
-- PROFILES - Fix policies
-- =============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "HR and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "System creates profiles on signup" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "HR can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "System creates profiles on signup"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Fix remaining tables with FOR ALL policies
-- =============================================

-- EMPLOYEE_DOCUMENTS
DROP POLICY IF EXISTS "Employees can view their own documents" ON public.employee_documents;
DROP POLICY IF EXISTS "HR can manage all employee documents" ON public.employee_documents;

CREATE POLICY "Employees can view their own documents"
ON public.employee_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_documents.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all employee documents"
ON public.employee_documents FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert employee documents"
ON public.employee_documents FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update employee documents"
ON public.employee_documents FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete employee documents"
ON public.employee_documents FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- ONBOARDING_TASKS
DROP POLICY IF EXISTS "Authenticated users can view onboarding tasks" ON public.onboarding_tasks;
DROP POLICY IF EXISTS "HR can manage onboarding tasks" ON public.onboarding_tasks;

CREATE POLICY "Authenticated users can view onboarding tasks"
ON public.onboarding_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can insert onboarding tasks"
ON public.onboarding_tasks FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update onboarding tasks"
ON public.onboarding_tasks FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete onboarding tasks"
ON public.onboarding_tasks FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- EMPLOYEE_ONBOARDING
DROP POLICY IF EXISTS "Employees can view their own onboarding" ON public.employee_onboarding;
DROP POLICY IF EXISTS "HR can manage all onboarding" ON public.employee_onboarding;

CREATE POLICY "Employees can view their own onboarding"
ON public.employee_onboarding FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_onboarding.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all onboarding"
ON public.employee_onboarding FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert onboarding"
ON public.employee_onboarding FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update onboarding"
ON public.employee_onboarding FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete onboarding"
ON public.employee_onboarding FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- BENEFITS
DROP POLICY IF EXISTS "Authenticated users can view benefits" ON public.benefits;
DROP POLICY IF EXISTS "HR can manage benefits" ON public.benefits;

CREATE POLICY "Authenticated users can view benefits"
ON public.benefits FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can insert benefits"
ON public.benefits FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update benefits"
ON public.benefits FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete benefits"
ON public.benefits FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- EMPLOYEE_BENEFITS
DROP POLICY IF EXISTS "Employees can view their own benefits" ON public.employee_benefits;
DROP POLICY IF EXISTS "HR can manage all employee benefits" ON public.employee_benefits;

CREATE POLICY "Employees can view their own benefits"
ON public.employee_benefits FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_benefits.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all employee benefits"
ON public.employee_benefits FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert employee benefits"
ON public.employee_benefits FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update employee benefits"
ON public.employee_benefits FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete employee benefits"
ON public.employee_benefits FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- PAYROLL_PERIODS
DROP POLICY IF EXISTS "Employees can view payroll periods" ON public.payroll_periods;
DROP POLICY IF EXISTS "HR can manage payroll periods" ON public.payroll_periods;

CREATE POLICY "Employees can view payroll periods"
ON public.payroll_periods FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin') OR
  public.has_role(auth.uid(), 'employee')
);

CREATE POLICY "HR can insert payroll periods"
ON public.payroll_periods FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update payroll periods"
ON public.payroll_periods FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete payroll periods"
ON public.payroll_periods FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- PAYROLL_RECORDS
DROP POLICY IF EXISTS "Employees can view their own payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "HR can manage all payroll records" ON public.payroll_records;

CREATE POLICY "Employees can view their own payroll"
ON public.payroll_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = payroll_records.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all payroll records"
ON public.payroll_records FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert payroll records"
ON public.payroll_records FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update payroll records"
ON public.payroll_records FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete payroll records"
ON public.payroll_records FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- TRAINING_PROGRAMS
DROP POLICY IF EXISTS "Authenticated users can view training programs" ON public.training_programs;
DROP POLICY IF EXISTS "HR can manage training programs" ON public.training_programs;

CREATE POLICY "Authenticated users can view training programs"
ON public.training_programs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can insert training programs"
ON public.training_programs FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update training programs"
ON public.training_programs FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete training programs"
ON public.training_programs FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- EMPLOYEE_TRAININGS
DROP POLICY IF EXISTS "Employees can view their own trainings" ON public.employee_trainings;
DROP POLICY IF EXISTS "HR can manage all employee trainings" ON public.employee_trainings;

CREATE POLICY "Employees can view their own trainings"
ON public.employee_trainings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = employee_trainings.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all employee trainings"
ON public.employee_trainings FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert employee trainings"
ON public.employee_trainings FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update employee trainings"
ON public.employee_trainings FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete employee trainings"
ON public.employee_trainings FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- PERFORMANCE_CRITERIA
DROP POLICY IF EXISTS "Authenticated users can view performance criteria" ON public.performance_criteria;
DROP POLICY IF EXISTS "HR can manage performance criteria" ON public.performance_criteria;

CREATE POLICY "Authenticated users can view performance criteria"
ON public.performance_criteria FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "HR can insert performance criteria"
ON public.performance_criteria FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update performance criteria"
ON public.performance_criteria FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete performance criteria"
ON public.performance_criteria FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- PERFORMANCE_EVALUATIONS
DROP POLICY IF EXISTS "Employees can view their own evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "HR can manage all evaluations" ON public.performance_evaluations;

CREATE POLICY "Employees can view their own evaluations"
ON public.performance_evaluations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE employees.id = performance_evaluations.employee_id 
    AND employees.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all evaluations"
ON public.performance_evaluations FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert evaluations"
ON public.performance_evaluations FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update evaluations"
ON public.performance_evaluations FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete evaluations"
ON public.performance_evaluations FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- EVALUATION_SCORES
DROP POLICY IF EXISTS "Employees can view their own evaluation scores" ON public.evaluation_scores;
DROP POLICY IF EXISTS "HR can manage all evaluation scores" ON public.evaluation_scores;

CREATE POLICY "Employees can view their own evaluation scores"
ON public.evaluation_scores FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.performance_evaluations pe
    JOIN public.employees e ON e.id = pe.employee_id
    WHERE pe.id = evaluation_scores.evaluation_id 
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all evaluation scores"
ON public.evaluation_scores FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can insert evaluation scores"
ON public.evaluation_scores FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can update evaluation scores"
ON public.evaluation_scores FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

CREATE POLICY "HR can delete evaluation scores"
ON public.evaluation_scores FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- APPLICANT_DOCUMENTS
DROP POLICY IF EXISTS "Applicants can manage their own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "HR can view all applicant documents" ON public.applicant_documents;

CREATE POLICY "Applicants can view their own documents"
ON public.applicant_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = applicant_documents.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "Applicants can insert their own documents"
ON public.applicant_documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = applicant_documents.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "Applicants can update their own documents"
ON public.applicant_documents FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = applicant_documents.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "Applicants can delete their own documents"
ON public.applicant_documents FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants 
    WHERE applicants.id = applicant_documents.applicant_id 
    AND applicants.user_id = auth.uid()
  )
);

CREATE POLICY "HR can view all applicant documents"
ON public.applicant_documents FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin') OR 
  public.has_role(auth.uid(), 'hr_admin')
);

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "HR can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- END 20260122005700_b7df6c98-92a9-4e24-b541-bd6635af63d4.sql

-- BEGIN 20260123000000_make_evaluator_id_nullable.sql
-- =====================================================
-- Make evaluator_id nullable for HR Admins
-- =====================================================

-- Drop the existing constraint
ALTER TABLE public.performance_evaluations
DROP CONSTRAINT IF EXISTS performance_evaluations_evaluator_id_fkey;

-- Add back the constraint with ON DELETE SET NULL
ALTER TABLE public.performance_evaluations
ADD CONSTRAINT performance_evaluations_evaluator_id_fkey 
  FOREIGN KEY (evaluator_id) 
  REFERENCES public.employees(id) 
  ON DELETE SET NULL;

-- Make the column nullable
ALTER TABLE public.performance_evaluations
ALTER COLUMN evaluator_id DROP NOT NULL;

-- END 20260123000000_make_evaluator_id_nullable.sql

-- BEGIN 20260320193000_merge_hr_integration_schema.sql
-- Merge the shared department integration schema into the HR app database.
-- This preserves the app's existing public.* tables while adding the clinic/hr
-- integration objects from the integration-merge scripts.

CREATE SCHEMA IF NOT EXISTS clinic;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET search_path TO clinic, public;

CREATE OR REPLACE FUNCTION clinic.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS clinic.department_flow_profiles (
  department_key TEXT PRIMARY KEY,
  department_name TEXT NOT NULL,
  flow_order INT NOT NULL UNIQUE,
  clearance_stage_order INT NOT NULL UNIQUE,
  receives JSONB NOT NULL DEFAULT '[]'::jsonb,
  sends JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic.department_clearance_records (
  id BIGSERIAL PRIMARY KEY,
  clearance_reference TEXT NOT NULL UNIQUE,
  patient_id TEXT NULL,
  patient_code TEXT NULL,
  patient_name TEXT NOT NULL,
  patient_type TEXT NOT NULL DEFAULT 'unknown',
  department_key TEXT NOT NULL REFERENCES clinic.department_flow_profiles (department_key) ON DELETE RESTRICT,
  department_name TEXT NOT NULL,
  stage_order INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  remarks TEXT NULL,
  approver_name TEXT NULL,
  approver_role TEXT NULL,
  external_reference TEXT NULL,
  requested_by TEXT NULL,
  decided_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic.cashier_integration_events (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  source_module TEXT NOT NULL,
  source_entity TEXT NOT NULL,
  source_key TEXT NOT NULL,
  patient_name TEXT NULL,
  patient_type TEXT NOT NULL DEFAULT 'unknown',
  reference_no TEXT NULL,
  amount_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'PHP',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  sync_status TEXT NOT NULL DEFAULT 'pending',
  last_error TEXT NULL,
  synced_at TIMESTAMPTZ NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic.cashier_payment_links (
  id BIGSERIAL PRIMARY KEY,
  source_module TEXT NOT NULL,
  source_key TEXT NOT NULL,
  cashier_reference TEXT NULL,
  cashier_billing_id BIGINT NULL,
  invoice_number TEXT NULL,
  official_receipt TEXT NULL,
  amount_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  latest_payment_method TEXT NULL,
  cashier_can_proceed SMALLINT NOT NULL DEFAULT 0,
  cashier_verified_at TIMESTAMPTZ NULL,
  paid_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_module, source_key)
);

CREATE TABLE IF NOT EXISTS clinic.clinic_cashier_sync_logs (
  id BIGSERIAL PRIMARY KEY,
  source_module TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  cashier_billing_id BIGINT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NULL,
  extra_payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic.clinic_cashier_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  source_module TEXT NOT NULL,
  source_id TEXT NOT NULL,
  action_name TEXT NOT NULL,
  status_after TEXT NOT NULL,
  remarks TEXT NULL,
  actor_name TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clearance_department
  ON clinic.department_clearance_records (department_key, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clearance_patient
  ON clinic.department_clearance_records (patient_name, patient_code);
CREATE INDEX IF NOT EXISTS idx_cashier_events_sync_status
  ON clinic.cashier_integration_events (sync_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashier_events_source_lookup
  ON clinic.cashier_integration_events (source_module, source_key);
CREATE INDEX IF NOT EXISTS idx_cashier_reference
  ON clinic.cashier_payment_links (cashier_reference);
CREATE INDEX IF NOT EXISTS idx_clinic_cashier_sync_lookup
  ON clinic.clinic_cashier_sync_logs (source_module, source_id);
CREATE INDEX IF NOT EXISTS idx_clinic_cashier_sync_status
  ON clinic.clinic_cashier_sync_logs (sync_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinic_cashier_audit_source
  ON clinic.clinic_cashier_audit_logs (source_module, source_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_department_flow_profiles_updated_at ON clinic.department_flow_profiles;
CREATE TRIGGER trg_department_flow_profiles_updated_at
BEFORE UPDATE ON clinic.department_flow_profiles
FOR EACH ROW
EXECUTE FUNCTION clinic.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_department_clearance_records_updated_at ON clinic.department_clearance_records;
CREATE TRIGGER trg_department_clearance_records_updated_at
BEFORE UPDATE ON clinic.department_clearance_records
FOR EACH ROW
EXECUTE FUNCTION clinic.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_cashier_integration_events_updated_at ON clinic.cashier_integration_events;
CREATE TRIGGER trg_cashier_integration_events_updated_at
BEFORE UPDATE ON clinic.cashier_integration_events
FOR EACH ROW
EXECUTE FUNCTION clinic.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_cashier_payment_links_updated_at ON clinic.cashier_payment_links;
CREATE TRIGGER trg_cashier_payment_links_updated_at
BEFORE UPDATE ON clinic.cashier_payment_links
FOR EACH ROW
EXECUTE FUNCTION clinic.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_clinic_cashier_sync_logs_updated_at ON clinic.clinic_cashier_sync_logs;
CREATE TRIGGER trg_clinic_cashier_sync_logs_updated_at
BEFORE UPDATE ON clinic.clinic_cashier_sync_logs
FOR EACH ROW
EXECUTE FUNCTION clinic.set_updated_at_timestamp();

UPDATE clinic.department_flow_profiles
SET
  flow_order = CASE WHEN flow_order = 3 THEN flow_order + 100 ELSE flow_order END,
  clearance_stage_order = CASE
    WHEN clearance_stage_order = 3 THEN clearance_stage_order + 100
    ELSE clearance_stage_order
  END,
  updated_at = NOW()
WHERE (flow_order = 3 OR clearance_stage_order = 3)
  AND department_key <> 'clinic';

INSERT INTO clinic.department_flow_profiles (
  department_key,
  department_name,
  flow_order,
  clearance_stage_order,
  receives,
  sends,
  notes
)
VALUES (
  'clinic',
  'Clinic',
  3,
  3,
  '["pmed"]'::jsonb,
  '["guidance"]'::jsonb,
  'Health clearance validation.'
)
ON CONFLICT (department_key) DO UPDATE
SET
  department_name = EXCLUDED.department_name,
  flow_order = EXCLUDED.flow_order,
  clearance_stage_order = EXCLUDED.clearance_stage_order,
  receives = EXCLUDED.receives,
  sends = EXCLUDED.sends,
  notes = EXCLUDED.notes,
  updated_at = NOW();

SET search_path TO hr, clinic, public;

DO $$
DECLARE
  rel record;
BEGIN
  FOR rel IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'hr'
      AND c.relname = ANY (ARRAY[
        'department_flow_profiles',
        'department_clearance_records',
        'cashier_integration_events',
        'cashier_payment_links',
        'clinic_cashier_sync_logs',
        'clinic_cashier_audit_logs'
      ])
  LOOP
    IF rel.relkind = 'v' THEN
      EXECUTE format('DROP VIEW IF EXISTS hr.%I CASCADE', rel.relname);
    ELSIF rel.relkind = 'm' THEN
      EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS hr.%I CASCADE', rel.relname);
    ELSE
      EXECUTE format('DROP TABLE IF EXISTS hr.%I CASCADE', rel.relname);
    END IF;
  END LOOP;
END
$$;

CREATE OR REPLACE VIEW hr.department_flow_profiles AS SELECT * FROM clinic.department_flow_profiles;
CREATE OR REPLACE VIEW hr.department_clearance_records AS SELECT * FROM clinic.department_clearance_records;
CREATE OR REPLACE VIEW hr.cashier_integration_events AS SELECT * FROM clinic.cashier_integration_events;
CREATE OR REPLACE VIEW hr.cashier_payment_links AS SELECT * FROM clinic.cashier_payment_links;
CREATE OR REPLACE VIEW hr.clinic_cashier_sync_logs AS SELECT * FROM clinic.clinic_cashier_sync_logs;
CREATE OR REPLACE VIEW hr.clinic_cashier_audit_logs AS SELECT * FROM clinic.clinic_cashier_audit_logs;

UPDATE clinic.department_flow_profiles
SET
  flow_order = CASE WHEN flow_order = 1 THEN flow_order + 100 ELSE flow_order END,
  clearance_stage_order = CASE
    WHEN clearance_stage_order = 1 THEN clearance_stage_order + 100
    ELSE clearance_stage_order
  END,
  updated_at = NOW()
WHERE (flow_order = 1 OR clearance_stage_order = 1)
  AND department_key <> 'hr';

INSERT INTO clinic.department_flow_profiles (
  department_key,
  department_name,
  flow_order,
  clearance_stage_order,
  receives,
  sends,
  notes
)
VALUES (
  'hr',
  'HR',
  1,
  1,
  '[]'::jsonb,
  '["pmed"]'::jsonb,
  'Employment verification and staffing clearance.'
)
ON CONFLICT (department_key) DO UPDATE
SET
  department_name = EXCLUDED.department_name,
  flow_order = EXCLUDED.flow_order,
  clearance_stage_order = EXCLUDED.clearance_stage_order,
  receives = EXCLUDED.receives,
  sends = EXCLUDED.sends,
  notes = EXCLUDED.notes,
  updated_at = NOW();

SET search_path TO public;

-- END 20260320193000_merge_hr_integration_schema.sql

-- BEGIN 20260320203000_restore_public_compat_views.sql
-- Restore public compatibility views for frontend queries.
-- The live project exposes HR tables under the hr schema and already has
-- public.hr_* views. The app expects public.<table_name>, so we provide
-- thin public views that point at hr.<table_name>.

CREATE OR REPLACE FUNCTION public.ensure_hr_compat_view(alias_name text, source_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  existing_relkind "char";
BEGIN
  SELECT c.relkind
  INTO existing_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = alias_name;

  IF existing_relkind IS NULL OR existing_relkind = 'v' THEN
    EXECUTE format(
      'CREATE OR REPLACE VIEW public.%I AS SELECT * FROM hr.%I',
      alias_name,
      source_name
    );

    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated, service_role',
      alias_name
    );
  END IF;
END;
$$;

SELECT public.ensure_hr_compat_view('departments', 'departments');
SELECT public.ensure_hr_compat_view('positions', 'positions');
SELECT public.ensure_hr_compat_view('user_roles', 'user_roles');
SELECT public.ensure_hr_compat_view('profiles', 'profiles');
SELECT public.ensure_hr_compat_view('employees', 'employees');
SELECT public.ensure_hr_compat_view('employment_contracts', 'employment_contracts');
SELECT public.ensure_hr_compat_view('job_postings', 'job_postings');
SELECT public.ensure_hr_compat_view('applicants', 'applicants');
SELECT public.ensure_hr_compat_view('job_applications', 'job_applications');
SELECT public.ensure_hr_compat_view('interview_schedules', 'interview_schedules');
SELECT public.ensure_hr_compat_view('applicant_documents', 'applicant_documents');
SELECT public.ensure_hr_compat_view('onboarding_tasks', 'onboarding_tasks');
SELECT public.ensure_hr_compat_view('employee_onboarding', 'employee_onboarding');
SELECT public.ensure_hr_compat_view('training_programs', 'training_programs');
SELECT public.ensure_hr_compat_view('employee_trainings', 'employee_trainings');
SELECT public.ensure_hr_compat_view('performance_evaluations', 'performance_evaluations');
SELECT public.ensure_hr_compat_view('performance_criteria', 'performance_criteria');
SELECT public.ensure_hr_compat_view('evaluation_scores', 'evaluation_scores');
SELECT public.ensure_hr_compat_view('payroll_periods', 'payroll_periods');
SELECT public.ensure_hr_compat_view('payroll_records', 'payroll_records');
SELECT public.ensure_hr_compat_view('benefits', 'benefits');
SELECT public.ensure_hr_compat_view('employee_benefits', 'employee_benefits');
SELECT public.ensure_hr_compat_view('employee_documents', 'employee_documents');

DROP FUNCTION public.ensure_hr_compat_view(text, text);

-- END 20260320203000_restore_public_compat_views.sql

-- BEGIN 20260320213000_department_integration_endpoints.sql
-- =====================================================
-- Department Integration Registry + Dataflow RPC Endpoints
-- =====================================================
-- This migration prepares the HR system for cross-application department
-- routing using Supabase/PostgREST RPC endpoints.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.integration_departments (
    department_key TEXT PRIMARY KEY,
    department_name TEXT NOT NULL,
    system_code TEXT NOT NULL UNIQUE,
    module_directory TEXT NOT NULL,
    owning_schema TEXT NOT NULL DEFAULT 'public',
    dispatch_rpc_name TEXT NOT NULL,
    status_rpc_name TEXT NOT NULL DEFAULT 'get_department_flow_status',
    ack_rpc_name TEXT NOT NULL DEFAULT 'acknowledge_department_flow',
    purpose TEXT NOT NULL,
    default_action_label TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_flow_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_key TEXT NOT NULL UNIQUE,
    flow_name TEXT NOT NULL,
    source_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    target_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    event_code TEXT NOT NULL,
    request_method TEXT NOT NULL DEFAULT 'POST',
    endpoint_path TEXT NOT NULL,
    request_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority INTEGER NOT NULL DEFAULT 100,
    is_required BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT integration_flow_routes_source_target_event_key UNIQUE (
        source_department_key,
        target_department_key,
        event_code
    )
);

CREATE TABLE IF NOT EXISTS public.integration_flow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id TEXT NOT NULL UNIQUE,
    route_key TEXT NOT NULL REFERENCES public.integration_flow_routes(route_key) ON DELETE RESTRICT,
    source_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    target_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE RESTRICT,
    source_record_id TEXT,
    event_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    dispatch_endpoint TEXT NOT NULL,
    initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    last_error TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_flow_routes_source_target
    ON public.integration_flow_routes (source_department_key, target_department_key, priority, is_active);

CREATE INDEX IF NOT EXISTS idx_integration_flow_events_target_status
    ON public.integration_flow_events (target_department_key, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_flow_events_source_status
    ON public.integration_flow_events (source_department_key, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_flow_events_route_key
    ON public.integration_flow_events (route_key, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_integration_departments_updated_at ON public.integration_departments;
CREATE TRIGGER update_integration_departments_updated_at
BEFORE UPDATE ON public.integration_departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_flow_routes_updated_at ON public.integration_flow_routes;
CREATE TRIGGER update_integration_flow_routes_updated_at
BEFORE UPDATE ON public.integration_flow_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_flow_events_updated_at ON public.integration_flow_events;
CREATE TRIGGER update_integration_flow_events_updated_at
BEFORE UPDATE ON public.integration_flow_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.integration_departments (
    department_key,
    department_name,
    system_code,
    module_directory,
    owning_schema,
    dispatch_rpc_name,
    status_rpc_name,
    ack_rpc_name,
    purpose,
    default_action_label,
    is_active,
    metadata
)
VALUES
    (
        'hr',
        'HR Department',
        'HR',
        'HR',
        'public',
        'dispatch_department_flow',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Employee records, onboarding, payroll coordination, performance, renewal and clearance orchestration.',
        'Dispatch from HR',
        true,
        '{"type":"source_system","module":"HR","supports":["records","onboarding","payroll","clearance","evaluation"]}'::jsonb
    ),
    (
        'cashier',
        'Cashier',
        'CASHIER',
        'cashier-system',
        'public',
        'dispatch_to_cashier',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Payroll endorsement, collection blocking, accountability hold and final financial clearance.',
        'Send to Cashier',
        true,
        '{"type":"connected_department","module":"cashier-system","supports":["payroll_submission","clearance_hold","accountability_settlement"]}'::jsonb
    ),
    (
        'clinic',
        'Clinic',
        'CLINIC',
        'clinicsystem',
        'clinic',
        'dispatch_to_clinic',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Return-to-work advice, health advisory routing and school clinic coordination.',
        'Send to Clinic',
        true,
        '{"type":"connected_department","module":"clinicsystem","supports":["health_clearance","return_to_work_advice"]}'::jsonb
    ),
    (
        public.resolve_integration_department_key('comlab'),
        'Computer Laboratory / IT',
        'COMLAB',
        'Computer-Laboratory',
        'public',
        'dispatch_to_comlab',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Account provisioning, ID/device release and laboratory clearance.',
        'Send to Computer Lab / IT',
        true,
        '{"type":"connected_department","module":"Computer-Laboratory","supports":["account_provision","asset_clearance","access_revoke"]}'::jsonb
    ),
    (
        'crad',
        'CRAD Management',
        'CRAD',
        'CRADManagement',
        'public',
        'dispatch_to_crad',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Case routing, research/records coordination and compliance documentation support.',
        'Send to CRAD',
        true,
        '{"type":"connected_department","module":"CRADManagement","supports":["case_record_sync","compliance_case_endorsement"]}'::jsonb
    ),
    (
        'guidance',
        'Guidance System',
        'GUIDANCE',
        'guidance-system',
        'public',
        'dispatch_to_guidance',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Counseling referral, employee support and behavioral case coordination.',
        'Send to Guidance',
        true,
        '{"type":"connected_department","module":"guidance-system","supports":["counseling_referral","employee_case_referral"]}'::jsonb
    ),
    (
        'pmed',
        'PMED',
        'PMED',
        'PMED',
        'public',
        'dispatch_to_pmed',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Pre-employment medical, fit-to-work and annual medical endorsement.',
        'Send to PMED',
        true,
        '{"type":"connected_department","module":"PMED","supports":["medical_endorsement","fit_to_work","annual_medical_review"]}'::jsonb
    ),
    (
        'prefect',
        'Prefect Management',
        'PREFECT',
        'PrefectManagementsSystem',
        'public',
        'dispatch_to_prefect',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Conduct verification, incident endorsement and exit clearance assistance.',
        'Send to Prefect',
        true,
        '{"type":"connected_department","module":"PrefectManagementsSystem","supports":["conduct_clearance","incident_verification"]}'::jsonb
    ),
    (
        'registrar',
        'Registrar',
        'REGISTRAR',
        'Registrar',
        'public',
        'dispatch_to_registrar',
        'get_department_flow_status',
        'acknowledge_department_flow',
        'Faculty assignment validation, teaching load confirmation and exit clearance.',
        'Send to Registrar',
        true,
        '{"type":"connected_department","module":"Registrar","supports":["faculty_assignment_validation","exit_clearance_validation"]}'::jsonb
    )
ON CONFLICT (department_key) DO UPDATE
SET
    department_name = EXCLUDED.department_name,
    system_code = EXCLUDED.system_code,
    module_directory = EXCLUDED.module_directory,
    owning_schema = EXCLUDED.owning_schema,
    dispatch_rpc_name = EXCLUDED.dispatch_rpc_name,
    status_rpc_name = EXCLUDED.status_rpc_name,
    ack_rpc_name = EXCLUDED.ack_rpc_name,
    purpose = EXCLUDED.purpose,
    default_action_label = EXCLUDED.default_action_label,
    is_active = EXCLUDED.is_active,
    metadata = EXCLUDED.metadata,
    updated_at = now();

INSERT INTO public.integration_flow_routes (
    route_key,
    flow_name,
    source_department_key,
    target_department_key,
    event_code,
    request_method,
    endpoint_path,
    request_contract,
    response_contract,
    priority,
    is_required,
    is_active,
    notes,
    metadata
)
VALUES
    (
        'hr_to_cashier_payroll_submission',
        'HR Payroll Submission to Cashier',
        'hr',
        'cashier',
        'payroll_submission',
        'POST',
        '/rest/v1/rpc/dispatch_to_cashier',
        '{"required":["batch_label","pay_period","employee_count","net_amount"],"optional":["variance_notes","attachments","requested_by_name"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Used when HR submits a payroll coordination batch to Cashier.',
        '{"module":"payroll","category":"financial_endorsement"}'::jsonb
    ),
    (
        'hr_to_cashier_clearance_hold',
        'HR Clearance Hold to Cashier',
        'hr',
        'cashier',
        'clearance_hold',
        'POST',
        '/rest/v1/rpc/dispatch_to_cashier',
        '{"required":["employee_id","employee_name","clearance_reason"],"optional":["accountability_items","effective_date"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        20,
        true,
        true,
        'Used when HR starts a clearance case that requires financial clearance.',
        '{"module":"clearance","category":"financial_hold"}'::jsonb
    ),
    (
        'hr_to_registrar_faculty_assignment',
        'HR Faculty Assignment Validation',
        'hr',
        'registrar',
        'faculty_assignment_validation',
        'POST',
        '/rest/v1/rpc/dispatch_to_registrar',
        '{"required":["employee_id","employee_name","college_unit","semester"],"optional":["teaching_load","schedule_matrix","remarks"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Validates faculty assignment and registrar alignment.',
        '{"module":"faculty_assignment","category":"academic_load"}'::jsonb
    ),
    (
        'hr_to_registrar_exit_clearance',
        'HR Exit Clearance Validation',
        'hr',
        'registrar',
        'exit_clearance_validation',
        'POST',
        '/rest/v1/rpc/dispatch_to_registrar',
        '{"required":["employee_id","employee_name","effective_date"],"optional":["accountabilities","clearance_batch"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        30,
        true,
        true,
        'Used during resignation or transfer clearance.',
        '{"module":"clearance","category":"academic_records"}'::jsonb
    ),
    (
        'hr_to_comlab_account_provision',
        'HR Account Provisioning to Computer Laboratory / IT',
        'hr',
        'comlab',
        'account_provision',
        'POST',
        '/rest/v1/rpc/dispatch_to_comlab',
        '{"required":["employee_id","employee_name","position_title"],"optional":["requested_access","department_code","start_date"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Starts account and equipment provisioning for new hires.',
        '{"module":"onboarding","category":"access_provisioning"}'::jsonb
    ),
    (
        'hr_to_comlab_asset_clearance',
        'HR Asset Clearance to Computer Laboratory / IT',
        'hr',
        'comlab',
        'asset_clearance',
        'POST',
        '/rest/v1/rpc/dispatch_to_comlab',
        '{"required":["employee_id","employee_name","clearance_reason"],"optional":["device_list","account_list"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        20,
        true,
        true,
        'Collects IT accountability during exit clearance.',
        '{"module":"clearance","category":"asset_return"}'::jsonb
    ),
    (
        'hr_to_pmed_medical_endorsement',
        'HR Medical Endorsement to PMED',
        'hr',
        'pmed',
        'medical_endorsement',
        'POST',
        '/rest/v1/rpc/dispatch_to_pmed',
        '{"required":["employee_id","employee_name","employment_stage"],"optional":["medical_notes","requested_schedule"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Routes pre-employment medical requirements to PMED.',
        '{"module":"onboarding","category":"medical"}'::jsonb
    ),
    (
        'hr_to_clinic_health_clearance',
        'HR Health Clearance to Clinic',
        'hr',
        'clinic',
        'health_clearance',
        'POST',
        '/rest/v1/rpc/dispatch_to_clinic',
        '{"required":["employee_id","employee_name","clearance_reason"],"optional":["clinic_notes","return_to_work_date"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        10,
        true,
        true,
        'Routes employee health-related endorsements to the school clinic.',
        '{"module":"clearance","category":"health"}'::jsonb
    ),
    (
        'hr_to_guidance_counseling_referral',
        'HR Counseling Referral to Guidance',
        'hr',
        'guidance',
        'counseling_referral',
        'POST',
        '/rest/v1/rpc/dispatch_to_guidance',
        '{"required":["employee_id","employee_name","referral_reason"],"optional":["case_notes","priority_level"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Routes employee support or counseling requests.',
        '{"module":"employee_relations","category":"guidance"}'::jsonb
    ),
    (
        'hr_to_prefect_conduct_clearance',
        'HR Conduct Clearance to Prefect',
        'hr',
        'prefect',
        'conduct_clearance',
        'POST',
        '/rest/v1/rpc/dispatch_to_prefect',
        '{"required":["employee_id","employee_name","clearance_reason"],"optional":["incident_notes","report_reference"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Requests conduct validation during employee case review or clearance.',
        '{"module":"employee_relations","category":"conduct"}'::jsonb
    ),
    (
        'hr_to_crad_case_record_sync',
        'HR Case Record Sync to CRAD',
        'hr',
        'crad',
        'case_record_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_crad',
        '{"required":["employee_id","employee_name","record_type"],"optional":["case_notes","reference_no","attachments"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        25,
        false,
        true,
        'Keeps CRAD case or compliance records in sync with HR decisions.',
        '{"module":"records","category":"case_sync"}'::jsonb
    )
ON CONFLICT (route_key) DO UPDATE
SET
    flow_name = EXCLUDED.flow_name,
    source_department_key = EXCLUDED.source_department_key,
    target_department_key = EXCLUDED.target_department_key,
    event_code = EXCLUDED.event_code,
    request_method = EXCLUDED.request_method,
    endpoint_path = EXCLUDED.endpoint_path,
    request_contract = EXCLUDED.request_contract,
    response_contract = EXCLUDED.response_contract,
    priority = EXCLUDED.priority,
    is_required = EXCLUDED.is_required,
    is_active = EXCLUDED.is_active,
    notes = EXCLUDED.notes,
    metadata = EXCLUDED.metadata,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.get_department_integration_registry(
    _source_department_key TEXT DEFAULT 'hr'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'department_key', registry.department_key,
                'department_name', registry.department_name,
                'system_code', registry.system_code,
                'module_directory', registry.module_directory,
                'purpose', registry.purpose,
                'default_action_label', registry.default_action_label,
                'dispatch_rpc_name', registry.dispatch_rpc_name,
                'status_rpc_name', registry.status_rpc_name,
                'ack_rpc_name', registry.ack_rpc_name,
                'dispatch_endpoint', '/rest/v1/rpc/' || registry.dispatch_rpc_name,
                'pending_count', registry.pending_count,
                'in_progress_count', registry.in_progress_count,
                'failed_count', registry.failed_count,
                'completed_count', registry.completed_count,
                'route_count', registry.route_count,
                'latest_status', registry.latest_status,
                'latest_event_code', registry.latest_event_code,
                'latest_correlation_id', registry.latest_correlation_id,
                'latest_created_at', registry.latest_created_at,
                'routes', registry.routes
            )
            ORDER BY registry.department_name
        ),
        '[]'::jsonb
    )
    INTO result
    FROM (
        SELECT
            target.department_key,
            target.department_name,
            target.system_code,
            target.module_directory,
            target.purpose,
            target.default_action_label,
            target.dispatch_rpc_name,
            target.status_rpc_name,
            target.ack_rpc_name,
            COUNT(DISTINCT route.id)::INT AS route_count,
            COUNT(event.id) FILTER (WHERE event.status IN ('queued', 'pending'))::INT AS pending_count,
            COUNT(event.id) FILTER (WHERE event.status IN ('dispatched', 'in_progress', 'awaiting_acknowledgement'))::INT AS in_progress_count,
            COUNT(event.id) FILTER (WHERE event.status IN ('failed', 'blocked'))::INT AS failed_count,
            COUNT(event.id) FILTER (WHERE event.status IN ('acknowledged', 'completed'))::INT AS completed_count,
            latest_event.status AS latest_status,
            latest_event.event_code AS latest_event_code,
            latest_event.correlation_id AS latest_correlation_id,
            latest_event.created_at AS latest_created_at,
            COALESCE(
                jsonb_agg(
                DISTINCT jsonb_build_object(
                    'route_key', route.route_key,
                    'flow_name', route.flow_name,
                    'event_code', route.event_code,
                    'endpoint_path', route.endpoint_path,
                    'priority', route.priority,
                    'is_required', route.is_required
                )
            ) FILTER (WHERE route.route_key IS NOT NULL),
            '[]'::jsonb
            ) AS routes
        FROM public.integration_departments target
        JOIN public.integration_flow_routes route
          ON target.department_key = route.target_department_key
         AND route.is_active = true
        LEFT JOIN public.integration_flow_events event
          ON event.route_key = route.route_key
        LEFT JOIN LATERAL (
            SELECT e.status, e.event_code, e.correlation_id, e.created_at
            FROM public.integration_flow_events e
            WHERE e.target_department_key = target.department_key
              AND (_source_department_key IS NULL OR e.source_department_key = _source_department_key)
            ORDER BY e.created_at DESC
            LIMIT 1
        ) latest_event ON true
        WHERE target.is_active = true
          AND (_source_department_key IS NULL OR route.source_department_key = _source_department_key)
        GROUP BY
            target.department_key,
            target.department_name,
            target.system_code,
            target.module_directory,
            target.purpose,
            target.default_action_label,
            target.dispatch_rpc_name,
            target.status_rpc_name,
            target.ack_rpc_name,
            latest_event.status,
            latest_event.event_code,
            latest_event.correlation_id,
            latest_event.created_at
    ) registry;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_department_flow(
    _source_department_key TEXT,
    _target_department_key TEXT,
    _event_code TEXT DEFAULT NULL,
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    selected_route RECORD;
    new_event public.integration_flow_events%ROWTYPE;
    resolved_event_code TEXT;
    correlation TEXT;
BEGIN
    SELECT
        route.route_key,
        route.event_code,
        route.endpoint_path
    INTO selected_route
    FROM public.integration_flow_routes route
    WHERE route.source_department_key = _source_department_key
      AND route.target_department_key = _target_department_key
      AND route.is_active = true
      AND (_event_code IS NULL OR route.event_code = _event_code)
    ORDER BY route.priority ASC
    LIMIT 1;

    IF selected_route.route_key IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'message', format(
                'No active integration route from %s to %s for event %s.',
                COALESCE(_source_department_key, 'unknown'),
                COALESCE(_target_department_key, 'unknown'),
                COALESCE(_event_code, 'default')
            ),
            'status', 'route_not_configured'
        );
    END IF;

    resolved_event_code := COALESCE(_event_code, selected_route.event_code);
    correlation := lower(
        concat(
            _source_department_key,
            '-',
            _target_department_key,
            '-',
            to_char(now(), 'YYYYMMDDHH24MISSMS'),
            '-',
            substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)
        )
    );

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
        metadata
    )
    VALUES (
        correlation,
        selected_route.route_key,
        _source_department_key,
        _target_department_key,
        _source_record_id,
        resolved_event_code,
        'queued',
        COALESCE(_payload, '{}'::jsonb),
        '{}'::jsonb,
        selected_route.endpoint_path,
        COALESCE(_requested_by, auth.uid()),
        now(),
        jsonb_build_object(
            'source_department_key', _source_department_key,
            'target_department_key', _target_department_key,
            'queued_from', 'hr_system'
        )
    )
    RETURNING * INTO new_event;

    RETURN jsonb_build_object(
        'ok', true,
        'event_id', new_event.id,
        'correlation_id', new_event.correlation_id,
        'route_key', new_event.route_key,
        'source_department_key', new_event.source_department_key,
        'target_department_key', new_event.target_department_key,
        'event_code', new_event.event_code,
        'status', new_event.status,
        'dispatch_endpoint', new_event.dispatch_endpoint,
        'message', 'Department flow queued successfully.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_department_flow_status(
    _event_id UUID DEFAULT NULL,
    _correlation_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payload JSONB;
BEGIN
    SELECT jsonb_build_object(
        'ok', true,
        'event_id', event.id,
        'correlation_id', event.correlation_id,
        'route_key', event.route_key,
        'flow_name', route.flow_name,
        'source_department_key', event.source_department_key,
        'target_department_key', event.target_department_key,
        'event_code', event.event_code,
        'status', event.status,
        'dispatch_endpoint', event.dispatch_endpoint,
        'source_record_id', event.source_record_id,
        'request_payload', event.request_payload,
        'response_payload', event.response_payload,
        'initiated_by', event.initiated_by,
        'dispatched_at', event.dispatched_at,
        'acknowledged_at', event.acknowledged_at,
        'last_error', event.last_error,
        'created_at', event.created_at,
        'updated_at', event.updated_at
    )
    INTO payload
    FROM public.integration_flow_events event
    JOIN public.integration_flow_routes route
      ON route.route_key = event.route_key
    WHERE (_event_id IS NOT NULL AND event.id = _event_id)
       OR (_correlation_id IS NOT NULL AND event.correlation_id = _correlation_id)
    ORDER BY event.created_at DESC
    LIMIT 1;

    IF payload IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'message', 'Integration event was not found.',
            'status', 'not_found'
        );
    END IF;

    RETURN payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_department_flow(
    _event_id UUID,
    _status TEXT DEFAULT 'acknowledged',
    _response JSONB DEFAULT '{}'::jsonb,
    _error TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_event public.integration_flow_events%ROWTYPE;
BEGIN
    UPDATE public.integration_flow_events
    SET
        status = COALESCE(NULLIF(_status, ''), 'acknowledged'),
        response_payload = COALESCE(_response, '{}'::jsonb),
        last_error = _error,
        acknowledged_at = now(),
        updated_at = now()
    WHERE id = _event_id
    RETURNING * INTO updated_event;

    IF updated_event.id IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'message', 'Integration event was not found.',
            'status', 'not_found'
        );
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'event_id', updated_event.id,
        'correlation_id', updated_event.correlation_id,
        'status', updated_event.status,
        'acknowledged_at', updated_event.acknowledged_at,
        'last_error', updated_event.last_error,
        'message', 'Department flow updated successfully.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_cashier(
    _event_code TEXT DEFAULT 'payroll_submission',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'cashier', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_clinic(
    _event_code TEXT DEFAULT 'health_clearance',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'clinic', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_comlab(
    _event_code TEXT DEFAULT 'account_provision',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'comlab', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_crad(
    _event_code TEXT DEFAULT 'case_record_sync',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'crad', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_guidance(
    _event_code TEXT DEFAULT 'counseling_referral',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'guidance', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_pmed(
    _event_code TEXT DEFAULT 'medical_endorsement',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'pmed', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_prefect(
    _event_code TEXT DEFAULT 'conduct_clearance',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'prefect', _event_code, _source_record_id, _payload, _requested_by);
$$;

CREATE OR REPLACE FUNCTION public.dispatch_to_registrar(
    _event_code TEXT DEFAULT 'faculty_assignment_validation',
    _source_record_id TEXT DEFAULT NULL,
    _payload JSONB DEFAULT '{}'::jsonb,
    _requested_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.dispatch_department_flow('hr', 'registrar', _event_code, _source_record_id, _payload, _requested_by);
$$;

GRANT SELECT ON public.integration_departments TO authenticated, service_role;
GRANT SELECT ON public.integration_flow_routes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.integration_flow_events TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_department_integration_registry(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_department_flow(TEXT, TEXT, TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_department_flow_status(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.acknowledge_department_flow(UUID, TEXT, JSONB, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_cashier(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_clinic(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_comlab(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_crad(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_guidance(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_pmed(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_prefect(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_to_registrar(TEXT, TEXT, JSONB, UUID) TO authenticated, service_role;

-- END 20260320213000_department_integration_endpoints.sql

-- BEGIN 20260123141500_seed_data.sql
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
                'comlab',
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

-- END 20260123141500_seed_data.sql


-- BEGIN 20260321113000_employee_directory_integration_ready.sql
-- =====================================================
-- Employee Directory + Integration Readiness Layer
-- =====================================================
-- This migration turns the existing employee records into a canonical
-- integration directory for admins, staff, and faculty.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS hr;

-- Some projects expose public.departments and public.employees as compatibility
-- views backed by hr.* tables. Keep these columns flexible instead of using
-- table-only foreign keys so the migration works in both layouts.
CREATE OR REPLACE FUNCTION public.resolve_integration_department_key(_department_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    IF _department_key = 'comlab' THEN
        IF EXISTS (
            SELECT 1
            FROM public.integration_departments
            WHERE department_key = 'comlab'
        ) THEN
            RETURN 'comlab';
        ELSIF EXISTS (
            SELECT 1
            FROM public.integration_departments
            WHERE department_key = 'comlab_it'
        ) THEN
            RETURN 'comlab_it';
        END IF;
    END IF;

    RETURN _department_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.present_integration_department_key(_department_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    IF _department_key = 'comlab_it' THEN
        RETURN 'comlab';
    END IF;

    RETURN _department_key;
END;
$$;

CREATE TABLE IF NOT EXISTS public.department_integration_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL,
    integration_department_key TEXT NOT NULL REFERENCES public.integration_departments(department_key) ON DELETE CASCADE,
    relationship_kind TEXT NOT NULL DEFAULT 'connected',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    supports_employee_sync BOOLEAN NOT NULL DEFAULT true,
    supports_admin_sync BOOLEAN NOT NULL DEFAULT true,
    default_event_code TEXT NOT NULL DEFAULT 'employee_profile_sync',
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT department_integration_mappings_unique UNIQUE (department_id, integration_department_key),
    CONSTRAINT department_integration_mappings_kind_check CHECK (
        relationship_kind IN ('owner', 'connected', 'clearance', 'oversight', 'shared')
    )
);

CREATE INDEX IF NOT EXISTS idx_department_integration_mappings_department_id
    ON public.department_integration_mappings (department_id);

CREATE INDEX IF NOT EXISTS idx_department_integration_mappings_integration_key
    ON public.department_integration_mappings (integration_department_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_department_integration_mappings_primary
    ON public.department_integration_mappings (department_id)
    WHERE is_primary = true;

DROP TRIGGER IF EXISTS update_department_integration_mappings_updated_at ON public.department_integration_mappings;
CREATE TRIGGER update_department_integration_mappings_updated_at
BEFORE UPDATE ON public.department_integration_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.employee_integration_profiles (
    employee_id UUID PRIMARY KEY,
    primary_integration_department_key TEXT REFERENCES public.integration_departments(department_key) ON DELETE SET NULL,
    integration_status TEXT NOT NULL DEFAULT 'ready',
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    allow_admin_sync BOOLEAN NOT NULL DEFAULT true,
    allow_department_sync BOOLEAN NOT NULL DEFAULT true,
    external_directory_id TEXT,
    last_dispatched_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    last_target_department_key TEXT REFERENCES public.integration_departments(department_key) ON DELETE SET NULL,
    last_event_id UUID REFERENCES public.integration_flow_events(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT employee_integration_profiles_status_check CHECK (
        integration_status IN ('ready', 'pending_sync', 'synced', 'paused', 'error')
    )
);

CREATE INDEX IF NOT EXISTS idx_employee_integration_profiles_primary_department
    ON public.employee_integration_profiles (primary_integration_department_key);

CREATE INDEX IF NOT EXISTS idx_employee_integration_profiles_status
    ON public.employee_integration_profiles (integration_status, sync_enabled);

DROP TRIGGER IF EXISTS update_employee_integration_profiles_updated_at ON public.employee_integration_profiles;
CREATE TRIGGER update_employee_integration_profiles_updated_at
BEFORE UPDATE ON public.employee_integration_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.department_integration_mappings (
    department_id,
    integration_department_key,
    relationship_kind,
    is_primary,
    supports_employee_sync,
    supports_admin_sync,
    default_event_code,
    notes,
    metadata
)
SELECT
    d.id,
    public.resolve_integration_department_key(mapping.integration_department_key),
    mapping.relationship_kind,
    mapping.is_primary,
    mapping.supports_employee_sync,
    mapping.supports_admin_sync,
    mapping.default_event_code,
    mapping.notes,
    mapping.metadata
FROM public.departments d
JOIN (
    VALUES
        ('HR', 'hr', 'owner', true, true, true, 'employee_profile_sync', 'Primary HR ownership for employee master records.', '{"source":"integration_ready_migration"}'::jsonb),
        ('FIN', 'cashier', 'connected', true, true, true, 'employee_profile_sync', 'Finance and payroll records can be synchronized with cashier operations.', '{"source":"integration_ready_migration"}'::jsonb),
        ('IT', 'comlab', 'connected', true, true, true, 'employee_profile_sync', 'IT and COMLAB account provisioning depends on employee records.', '{"source":"integration_ready_migration"}'::jsonb),
        ('REG', 'registrar', 'connected', true, true, true, 'employee_profile_sync', 'Registrar validation can consume employee and faculty directory data.', '{"source":"integration_ready_migration"}'::jsonb),
        ('PMED', 'pmed', 'connected', true, true, true, 'employee_profile_sync', 'PMED receives employee master records for medical workflows.', '{"source":"integration_ready_migration"}'::jsonb),
        ('CLINIC', 'clinic', 'connected', true, true, true, 'employee_profile_sync', 'Clinic receives employee roster and health-related profile handoffs.', '{"source":"integration_ready_migration"}'::jsonb),
        ('GUIDE', 'guidance', 'connected', true, true, true, 'employee_profile_sync', 'Guidance receives employee support and roster context.', '{"source":"integration_ready_migration"}'::jsonb),
        ('GUIDE', 'prefect', 'shared', false, true, true, 'employee_profile_sync', 'Prefect-related conduct workflows can resolve employees from the shared directory.', '{"source":"integration_ready_migration"}'::jsonb)
) AS mapping (
    department_code,
    integration_department_key,
    relationship_kind,
    is_primary,
    supports_employee_sync,
    supports_admin_sync,
    default_event_code,
    notes,
    metadata
)
    ON d.code = mapping.department_code
ON CONFLICT (department_id, integration_department_key) DO UPDATE
SET
    relationship_kind = EXCLUDED.relationship_kind,
    is_primary = EXCLUDED.is_primary,
    supports_employee_sync = EXCLUDED.supports_employee_sync,
    supports_admin_sync = EXCLUDED.supports_admin_sync,
    default_event_code = EXCLUDED.default_event_code,
    notes = EXCLUDED.notes,
    metadata = EXCLUDED.metadata,
    updated_at = now();

INSERT INTO public.integration_flow_routes (
    route_key,
    flow_name,
    source_department_key,
    target_department_key,
    event_code,
    request_method,
    endpoint_path,
    request_contract,
    response_contract,
    priority,
    is_required,
    is_active,
    notes,
    metadata
)
VALUES
    (
        'hr_to_cashier_employee_profile_sync',
        'HR Employee Profile Sync to Cashier',
        'hr',
        'cashier',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_cashier',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Synchronizes employee or admin master data to Cashier for payroll and accountability alignment.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_clinic_employee_profile_sync',
        'HR Employee Profile Sync to Clinic',
        'hr',
        'clinic',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_clinic',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Keeps the clinic-side directory aligned with the HR employee roster.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_clinic_pre_employment_clearance_request',
        'HR Pre-Employment Clearance Request to Clinic',
        'hr',
        'clinic',
        'pre_employment_clearance_request',
        'POST',
        '/rest/v1/rpc/dispatch_to_clinic',
        '{"required":["employee_id","employee_name","position","department"],"optional":["start_date","previous_medical_history","request_date","requested_by","notes"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        25,
        true,
        true,
        'Routes pre-employment or clinic-side health clearance requests for new hires.',
        '{"module":"onboarding","category":"clinic_clearance"}'::jsonb
    ),
    (
        'hr_to_comlab_employee_profile_sync',
        'HR Employee Profile Sync to Computer Laboratory / IT',
        'hr',
        'comlab',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_comlab',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Synchronizes employee and admin profile data for account provisioning and device access.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_crad_employee_profile_sync',
        'HR Employee Profile Sync to CRAD',
        'hr',
        'crad',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_crad',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        40,
        false,
        true,
        'Makes employee master data available to CRAD-related records workflows.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_guidance_employee_profile_sync',
        'HR Employee Profile Sync to Guidance',
        'hr',
        'guidance',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_guidance',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        30,
        false,
        true,
        'Provides employee roster context for guidance and employee support workflows.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_pmed_employee_profile_sync',
        'HR Employee Profile Sync to PMED',
        'hr',
        'pmed',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_pmed',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        15,
        false,
        true,
        'Synchronizes employee records to PMED for pre-employment and monitoring workflows.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_prefect_employee_profile_sync',
        'HR Employee Profile Sync to Prefect',
        'hr',
        'prefect',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_prefect',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        35,
        false,
        true,
        'Provides employee profile data to prefect workflows when conduct cases are opened.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    ),
    (
        'hr_to_registrar_employee_profile_sync',
        'HR Employee Profile Sync to Registrar',
        'hr',
        'registrar',
        'employee_profile_sync',
        'POST',
        '/rest/v1/rpc/dispatch_to_registrar',
        '{"required":["employee_id","employee_number","employee_name","department_name","employment_status"],"optional":["email","position_title","employee_type","role_names","is_admin","metadata"]}'::jsonb,
        '{"returns":["event_id","correlation_id","status","dispatch_endpoint"]}'::jsonb,
        20,
        false,
        true,
        'Keeps faculty and employee profile details aligned with registrar-facing systems.',
        '{"module":"employee_directory","category":"master_data_sync"}'::jsonb
    )
ON CONFLICT (route_key) DO UPDATE
SET
    flow_name = EXCLUDED.flow_name,
    source_department_key = EXCLUDED.source_department_key,
    target_department_key = EXCLUDED.target_department_key,
    event_code = EXCLUDED.event_code,
    request_method = EXCLUDED.request_method,
    endpoint_path = EXCLUDED.endpoint_path,
    request_contract = EXCLUDED.request_contract,
    response_contract = EXCLUDED.response_contract,
    priority = EXCLUDED.priority,
    is_required = EXCLUDED.is_required,
    is_active = EXCLUDED.is_active,
    notes = EXCLUDED.notes,
    metadata = EXCLUDED.metadata,
    updated_at = now();

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["payroll_submission","clearance_hold","accountability_settlement","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'cashier';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["health_clearance","return_to_work_advice","employee_profile_sync","pre_employment_clearance_request"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'clinic';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["account_provision","asset_clearance","access_revoke","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = public.resolve_integration_department_key('comlab');

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["case_record_sync","compliance_case_endorsement","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'crad';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["counseling_referral","employee_case_referral","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'guidance';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["medical_endorsement","fit_to_work","annual_medical_review","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'pmed';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["conduct_clearance","incident_verification","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'prefect';

UPDATE public.integration_departments
SET
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{supports}',
        '["faculty_assignment_validation","exit_clearance_validation","employee_profile_sync"]'::jsonb,
        true
    ),
    updated_at = now()
WHERE department_key = 'registrar';

WITH primary_targets AS (
    SELECT DISTINCT ON (dim.department_id)
        dim.department_id,
        dim.integration_department_key
    FROM public.department_integration_mappings dim
    WHERE dim.is_primary = true
    ORDER BY dim.department_id, dim.created_at
)
INSERT INTO public.employee_integration_profiles (
    employee_id,
    primary_integration_department_key,
    integration_status,
    sync_enabled,
    allow_admin_sync,
    allow_department_sync,
    metadata
)
SELECT
    e.id,
    COALESCE(
        pt.integration_department_key,
        CASE
            WHEN e.employee_type = 'admin' THEN 'hr'
            ELSE NULL
        END
    ),
    'ready',
    true,
    true,
    true,
    jsonb_build_object(
        'seeded_from', 'employees',
        'department_id', e.department_id
    )
FROM public.employees e
LEFT JOIN primary_targets pt
    ON pt.department_id = e.department_id
ON CONFLICT (employee_id) DO NOTHING;

CREATE OR REPLACE VIEW public.employee_directory AS
WITH role_rank AS (
    SELECT
        ur.user_id,
        ur.role::text AS role_name,
        CASE ur.role
            WHEN 'system_admin' THEN 1
            WHEN 'hr_admin' THEN 2
            WHEN 'employee' THEN 3
            WHEN 'applicant' THEN 4
            ELSE 99
        END AS role_priority
    FROM public.user_roles ur
),
role_agg AS (
    SELECT
        rr.user_id,
        array_agg(rr.role_name ORDER BY rr.role_priority, rr.role_name) AS role_names,
        (array_agg(rr.role_name ORDER BY rr.role_priority, rr.role_name))[1] AS primary_app_role,
        bool_or(rr.role_name IN ('system_admin', 'hr_admin')) AS is_admin_account
    FROM role_rank rr
    GROUP BY rr.user_id
),
route_catalog AS (
    SELECT
        route.target_department_key,
        MIN(route.priority) AS min_priority,
        (array_agg(route.event_code ORDER BY route.priority, route.route_key))[1] AS default_event_code,
        jsonb_agg(
            jsonb_build_object(
                'route_key', route.route_key,
                'flow_name', route.flow_name,
                'event_code', route.event_code,
                'endpoint_path', route.endpoint_path,
                'priority', route.priority,
                'is_required', route.is_required
            )
            ORDER BY route.priority, route.route_key
        ) AS available_routes
    FROM public.integration_flow_routes route
    WHERE route.source_department_key = 'hr'
      AND route.is_active = true
    GROUP BY route.target_department_key
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
    trim(concat_ws(' ', sup_profile.first_name, sup_profile.last_name)) AS supervisor_name,
    profile.first_name,
    profile.last_name,
    trim(concat_ws(' ', profile.first_name, profile.last_name)) AS full_name,
    trim(concat_ws(' ', profile.first_name, profile.last_name)) AS employee_name,
    profile.email,
    profile.phone,
    profile.city,
    COALESCE(role_agg.primary_app_role, 'employee') AS primary_app_role,
    COALESCE(role_agg.role_names, ARRAY[]::text[]) AS role_names,
    (COALESCE(role_agg.is_admin_account, false) OR e.employee_type = 'admin') AS is_admin,
    COALESCE(eip.integration_status, 'ready') AS integration_status,
    COALESCE(eip.sync_enabled, true) AS sync_enabled,
    COALESCE(eip.allow_admin_sync, true) AS allow_admin_sync,
    COALESCE(eip.allow_department_sync, true) AS allow_department_sync,
    eip.external_directory_id,
    public.present_integration_department_key(
        COALESCE(
            eip.primary_integration_department_key,
            (
                SELECT dim.integration_department_key
                FROM public.department_integration_mappings dim
                WHERE dim.department_id = e.department_id
                  AND dim.is_primary = true
                ORDER BY dim.created_at
                LIMIT 1
            ),
            CASE
                WHEN COALESCE(role_agg.is_admin_account, false) OR e.employee_type = 'admin' THEN 'hr'
                ELSE NULL
            END
        )
    ) AS primary_integration_department_key,
    public.present_integration_department_key(eip.last_target_department_key) AS last_target_department_key,
    eip.last_event_id,
    eip.last_dispatched_at,
    eip.last_synced_at,
    COALESCE(targets.connected_systems, '[]'::jsonb) AS connected_systems,
    jsonb_array_length(COALESCE(targets.connected_systems, '[]'::jsonb)) AS connected_system_count,
    (
        COALESCE(eip.sync_enabled, true)
        AND e.employment_status <> 'terminated'
        AND jsonb_array_length(COALESCE(targets.connected_systems, '[]'::jsonb)) > 0
    ) AS integration_ready,
    COALESCE(eip.metadata, '{}'::jsonb) AS integration_metadata,
    e.created_at,
    e.updated_at
FROM public.employees e
LEFT JOIN public.profiles profile
    ON profile.user_id = e.user_id
LEFT JOIN public.departments d
    ON d.id = e.department_id
LEFT JOIN public.positions p
    ON p.id = e.position_id
LEFT JOIN public.employees supervisor
    ON supervisor.id = e.supervisor_id
LEFT JOIN public.profiles sup_profile
    ON sup_profile.user_id = supervisor.user_id
LEFT JOIN role_agg
    ON role_agg.user_id = e.user_id
LEFT JOIN public.employee_integration_profiles eip
    ON eip.employee_id = e.id
LEFT JOIN LATERAL (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_strip_nulls(
                jsonb_build_object(
                    'department_key', public.present_integration_department_key(target.department_key),
                    'department_name', target.department_name,
                    'system_code', target.system_code,
                    'module_directory', target.module_directory,
                    'dispatch_rpc_name', target.dispatch_rpc_name,
                    'default_action_label', target.default_action_label,
                    'is_department_default', (dim.department_id IS NOT NULL),
                    'is_primary', COALESCE(dim.is_primary, false),
                    'relationship_kind', dim.relationship_kind,
                    'supports_employee_sync', COALESCE(dim.supports_employee_sync, true),
                    'supports_admin_sync', COALESCE(dim.supports_admin_sync, true),
                    'default_event_code', COALESCE(dim.default_event_code, route_catalog.default_event_code),
                    'available_routes', route_catalog.available_routes
                )
            )
            ORDER BY COALESCE(dim.is_primary, false) DESC, route_catalog.min_priority ASC, target.department_name ASC
        ),
        '[]'::jsonb
    ) AS connected_systems
    FROM route_catalog
    JOIN public.integration_departments target
        ON target.department_key = route_catalog.target_department_key
       AND target.is_active = true
    LEFT JOIN public.department_integration_mappings dim
        ON dim.department_id = e.department_id
       AND dim.integration_department_key = target.department_key
) targets ON true;

CREATE OR REPLACE FUNCTION public.get_integration_ready_employees(
    _target_department_key TEXT DEFAULT NULL,
    _include_inactive BOOLEAN DEFAULT false,
    _only_admins BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payload JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(to_jsonb(directory) ORDER BY directory.is_admin DESC, directory.last_name, directory.first_name, directory.employee_number),
        '[]'::jsonb
    )
    INTO payload
    FROM public.employee_directory directory
    WHERE directory.integration_ready = true
      AND (
        _include_inactive = true
        OR directory.employment_status IN ('active', 'probation', 'on_leave')
      )
      AND (
        _only_admins = false
        OR directory.is_admin = true
      )
      AND (
        _target_department_key IS NULL
        OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(directory.connected_systems) AS target
            WHERE target->>'department_key' = _target_department_key
              AND (
                CASE
                    WHEN directory.is_admin
                        THEN COALESCE((target->>'supports_admin_sync')::boolean, true)
                    ELSE COALESCE((target->>'supports_employee_sync')::boolean, true)
                END
              )
        )
      );

    RETURN payload;
END;
$$;

CREATE OR REPLACE FUNCTION public.build_employee_integration_payload(
    _employee_id UUID,
    _target_department_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    employee_record RECORD;
    target_config JSONB;
    resolved_target_department_key TEXT;
BEGIN
    SELECT *
    INTO employee_record
    FROM public.employee_directory
    WHERE employee_id = _employee_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    resolved_target_department_key := public.resolve_integration_department_key(_target_department_key);

    IF _target_department_key IS NOT NULL THEN
        SELECT target
        INTO target_config
        FROM jsonb_array_elements(COALESCE(employee_record.connected_systems, '[]'::jsonb)) AS target
        WHERE target->>'department_key' = _target_department_key
        LIMIT 1;
    END IF;

    RETURN jsonb_strip_nulls(
        jsonb_build_object(
            'employee_id', employee_record.employee_id,
            'user_id', employee_record.user_id,
            'employee_number', employee_record.employee_number,
            'first_name', employee_record.first_name,
            'last_name', employee_record.last_name,
            'employee_name', employee_record.employee_name,
            'full_name', employee_record.full_name,
            'email', employee_record.email,
            'phone', employee_record.phone,
            'city', employee_record.city,
            'employee_type', employee_record.employee_type,
            'employment_status', employee_record.employment_status,
            'hire_date', employee_record.hire_date,
            'department_id', employee_record.department_id,
            'department_name', employee_record.department_name,
            'department_code', employee_record.department_code,
            'position_id', employee_record.position_id,
            'position_title', employee_record.position_title,
            'primary_app_role', employee_record.primary_app_role,
            'role_names', to_jsonb(employee_record.role_names),
            'is_admin', employee_record.is_admin,
            'supervisor_id', employee_record.supervisor_id,
            'supervisor_name', employee_record.supervisor_name,
            'primary_integration_department_key', employee_record.primary_integration_department_key,
            'integration_status', employee_record.integration_status,
            'external_directory_id', employee_record.external_directory_id,
            'integration_ready', employee_record.integration_ready,
            'target_department_key', public.present_integration_department_key(resolved_target_department_key),
            'target_department', COALESCE(target_config, '{}'::jsonb),
            'connected_systems', employee_record.connected_systems,
            'integration_metadata', employee_record.integration_metadata
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_employee_profile_to_department(
    _employee_id UUID,
    _target_department_key TEXT,
    _event_code TEXT DEFAULT 'employee_profile_sync',
    _requested_by UUID DEFAULT NULL,
    _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    employee_record RECORD;
    target_config JSONB;
    payload JSONB;
    result JSONB;
    resolved_event_code TEXT;
    resolved_target_department_key TEXT;
BEGIN
    SELECT *
    INTO employee_record
    FROM public.employee_directory
    WHERE employee_id = _employee_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'not_found',
            'message', 'Employee was not found in the integration directory.'
        );
    END IF;

    IF COALESCE(employee_record.integration_ready, false) = false THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'not_ready',
            'message', 'Employee is not currently marked as integration ready.'
        );
    END IF;

    resolved_target_department_key := public.resolve_integration_department_key(_target_department_key);

    SELECT target
    INTO target_config
    FROM jsonb_array_elements(COALESCE(employee_record.connected_systems, '[]'::jsonb)) AS target
    WHERE target->>'department_key' = _target_department_key
    LIMIT 1;

    IF target_config IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'target_not_configured',
            'message', format(
                'Target department %s is not configured for HR employee integration.',
                COALESCE(_target_department_key, 'unknown')
            )
        );
    END IF;

    IF COALESCE(employee_record.is_admin, false)
       AND COALESCE((target_config->>'supports_admin_sync')::boolean, true) = false THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'admin_sync_not_allowed',
            'message', 'This connected department is not enabled for admin sync.'
        );
    END IF;

    IF COALESCE(employee_record.is_admin, false) = false
       AND COALESCE((target_config->>'supports_employee_sync')::boolean, true) = false THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'employee_sync_not_allowed',
            'message', 'This connected department is not enabled for employee sync.'
        );
    END IF;

    resolved_event_code := COALESCE(NULLIF(_event_code, ''), 'employee_profile_sync');
    payload := public.build_employee_integration_payload(_employee_id, _target_department_key);

    IF payload IS NULL THEN
        RETURN jsonb_build_object(
            'ok', false,
            'status', 'payload_not_available',
            'message', 'Employee integration payload could not be built.'
        );
    END IF;

    payload := payload || jsonb_build_object(
        'dispatch_metadata', COALESCE(_metadata, '{}'::jsonb)
    );

    result := public.dispatch_department_flow(
        'hr',
        resolved_target_department_key,
        resolved_event_code,
        _employee_id::text,
        payload,
        _requested_by
    );

    IF COALESCE(result->>'ok', 'false') = 'true' THEN
        INSERT INTO public.employee_integration_profiles (
            employee_id,
            primary_integration_department_key,
            integration_status,
            sync_enabled,
            allow_admin_sync,
            allow_department_sync,
            last_target_department_key,
            last_event_id,
            last_dispatched_at,
            metadata
        )
        VALUES (
            _employee_id,
            COALESCE(employee_record.primary_integration_department_key, 'hr'),
            'pending_sync',
            true,
            true,
            true,
            resolved_target_department_key,
            NULLIF(result->>'event_id', '')::uuid,
            now(),
            jsonb_build_object(
                'last_dispatched_event_code', resolved_event_code,
                'last_dispatch_metadata', COALESCE(_metadata, '{}'::jsonb)
            )
        )
        ON CONFLICT (employee_id) DO UPDATE
        SET
            primary_integration_department_key = COALESCE(
                public.employee_integration_profiles.primary_integration_department_key,
                EXCLUDED.primary_integration_department_key
            ),
            integration_status = 'pending_sync',
            last_target_department_key = EXCLUDED.last_target_department_key,
            last_event_id = EXCLUDED.last_event_id,
            last_dispatched_at = EXCLUDED.last_dispatched_at,
            metadata = COALESCE(public.employee_integration_profiles.metadata, '{}'::jsonb) || jsonb_build_object(
                'last_dispatched_event_code', resolved_event_code,
                'last_dispatch_metadata', COALESCE(_metadata, '{}'::jsonb)
            ),
            updated_at = now();
    END IF;

    RETURN result;
END;
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

GRANT USAGE ON SCHEMA hr TO authenticated, service_role;

GRANT SELECT ON public.department_integration_mappings TO authenticated, service_role;
GRANT SELECT ON public.employee_integration_profiles TO authenticated, service_role;
GRANT SELECT ON public.employee_directory TO authenticated, service_role;

GRANT SELECT ON hr.department_integration_mappings TO authenticated, service_role;
GRANT SELECT ON hr.employee_integration_profiles TO authenticated, service_role;
GRANT SELECT ON hr.employee_directory TO authenticated, service_role;
GRANT SELECT ON hr.instructors TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_integration_ready_employees(TEXT, BOOLEAN, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.build_employee_integration_payload(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_employee_profile_to_department(UUID, TEXT, TEXT, UUID, JSONB) TO authenticated, service_role;

-- END 20260321113000_employee_directory_integration_ready.sql

