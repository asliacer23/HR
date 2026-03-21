-- Migration to enforce department integrity in RLS
-- Refactors employee access policies to restrict cross-department visibility for non-system-admins

-- 1. DROP old policies
DROP POLICY IF EXISTS "HR and Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "HR and Admins can manage employees" ON public.employees;

-- 2. CREATE restricted policies
-- Allow system_admin to see everything
CREATE POLICY "System admins can view all employees"
ON public.employees FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'));

-- Allow hr_admin to see only their own department's employees
CREATE POLICY "HR admins can view department employees"
ON public.employees FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'hr_admin') 
    AND (
        department_id = (SELECT department_id FROM public.employees WHERE user_id = auth.uid())
        OR 
        EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND department_id IS NULL) -- Fallback for HR admins not yet assigned
    )
);

-- Management policies (Insert/Update/Delete)
CREATE POLICY "System admins can manage all employees"
ON public.employees FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "HR admins can manage department employees"
ON public.employees FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'hr_admin') 
    AND department_id = (SELECT department_id FROM public.employees WHERE user_id = auth.uid())
);

-- Employees can still see their own record
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record"
ON public.employees FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
