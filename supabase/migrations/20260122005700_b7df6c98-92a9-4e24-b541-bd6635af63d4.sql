
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
