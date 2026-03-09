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