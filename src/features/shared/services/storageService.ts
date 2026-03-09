import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'hr-documents';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export async function uploadFile(
  file: File,
  folder: string,
  userId: string
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${userId}/${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { url: '', path: '', error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return { url: data.publicUrl, path: filePath };
}

export async function deleteFile(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  return !error;
}

export function getFileUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

export function getFileType(fileName: string): 'pdf' | 'image' | 'document' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
  if (['doc', 'docx', 'txt'].includes(ext || '')) return 'document';
  return 'other';
}
