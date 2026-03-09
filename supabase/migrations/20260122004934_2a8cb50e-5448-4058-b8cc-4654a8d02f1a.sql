
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
