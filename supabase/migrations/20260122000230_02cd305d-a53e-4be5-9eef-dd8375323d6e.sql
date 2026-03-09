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