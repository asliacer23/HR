-- Fix the audit logs INSERT policy to be more restrictive
DROP POLICY IF EXISTS "System inserts audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);