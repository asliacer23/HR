import { supabase } from '@/integrations/supabase/client';

// ============================================
// APPLICANT DOCUMENT TYPES
// ============================================
export interface ApplicantDocument {
  id: string;
  applicant_id: string;
  document_name: string;
  document_url: string;
  document_type: string;
  uploaded_at: string;
}

export interface ApplicantWithDocuments {
  id: string;
  user_id: string;
  resume_url: string | null;
  cover_letter: string | null;
  years_experience: number;
  education_level: string | null;
  skills: string[] | null;
  documents: ApplicantDocument[];
}

// ============================================
// FETCH APPLICANT WITH ALL DOCUMENTS
// ============================================
export async function fetchApplicantWithDocuments(userId: string) {
  try {
    // Get applicant
    const { data: applicant, error: appError } = await supabase
      .from('applicants')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (appError || !applicant) {
      return { data: null, error: appError?.message || 'Applicant not found' };
    }

    // Get all documents for applicant
    const { data: documents, error: docError } = await supabase
      .from('applicant_documents')
      .select('*')
      .eq('applicant_id', applicant.id)
      .order('uploaded_at', { ascending: false });

    if (docError) {
      return { data: null, error: docError.message };
    }

    return {
      data: {
        ...applicant,
        documents: documents || [],
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// UPLOAD APPLICANT DOCUMENT
// ============================================
export async function uploadApplicantDocument(
  applicantId: string,
  documentName: string,
  documentUrl: string,
  documentType: string
) {
  try {
    const { data, error } = await supabase
      .from('applicant_documents')
      .insert({
        applicant_id: applicantId,
        document_name: documentName,
        document_url: documentUrl,
        document_type: documentType,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// DELETE APPLICANT DOCUMENT
// ============================================
export async function deleteApplicantDocument(documentId: string) {
  try {
    const { error } = await supabase
      .from('applicant_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// GET DOCUMENT BY ID
// ============================================
export async function getApplicantDocument(documentId: string) {
  try {
    const { data, error } = await supabase
      .from('applicant_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// UPDATE DOCUMENT NAME
// ============================================
export async function updateDocumentName(documentId: string, newName: string) {
  try {
    const { data, error } = await supabase
      .from('applicant_documents')
      .update({ document_name: newName })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}
