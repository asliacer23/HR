import { supabase } from '../../../integrations/supabase/client';

export interface JobPosting {
  id: string;
  position_id: string | null;
  title: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  is_active: boolean;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  posted_by: string | null;
  positions?: { id: string; title: string; department_id: string; departments?: { name: string } } | null;
}

export interface CreateJobPostingInput {
  position_id: string | null;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  deadline?: string;
  is_active?: boolean;
}

// Fetch all job postings
export async function fetchJobPostings() {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        *,
        positions(id, title, department_id, departments(name))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch job postings' };
  }
}

// Fetch single job posting
export async function fetchJobPosting(id: string) {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        *,
        positions(id, title, department_id, departments(name))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching job posting:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch job posting' };
  }
}

// Create job posting
export async function createJobPosting(input: CreateJobPostingInput) {
  try {
    const { data: userSession } = await supabase.auth.getSession();
    const userId = userSession?.session?.user?.id;

    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        position_id: input.position_id,
        title: input.title,
        description: input.description,
        requirements: input.requirements || null,
        responsibilities: input.responsibilities || null,
        salary_range_min: input.salary_range_min || null,
        salary_range_max: input.salary_range_max || null,
        deadline: input.deadline || null,
        is_active: input.is_active !== false,
        posted_by: userId,
      })
      .select(`
        *,
        positions(id, title, department_id, departments(name))
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating job posting:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create job posting' };
  }
}

// Update job posting
export async function updateJobPosting(id: string, input: Partial<CreateJobPostingInput>) {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.position_id !== undefined) updateData.position_id = input.position_id;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.requirements !== undefined) updateData.requirements = input.requirements;
    if (input.responsibilities !== undefined) updateData.responsibilities = input.responsibilities;
    if (input.salary_range_min !== undefined) updateData.salary_range_min = input.salary_range_min;
    if (input.salary_range_max !== undefined) updateData.salary_range_max = input.salary_range_max;
    if (input.deadline !== undefined) updateData.deadline = input.deadline;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data, error } = await supabase
      .from('job_postings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        positions(id, title, department_id, departments(name))
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating job posting:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update job posting' };
  }
}

// Delete job posting
export async function deleteJobPosting(id: string) {
  try {
    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting job posting:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete job posting' };
  }
}

// Toggle job posting active status
export async function toggleJobPostingStatus(id: string, currentStatus: boolean) {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .update({
        is_active: !currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        positions(id, title, department_id, departments(name))
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error toggling job posting status:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to toggle job posting status' };
  }
}

// Fetch positions for dropdown
export async function fetchPositions() {
  try {
    const { data, error } = await supabase
      .from('positions')
      .select(`
        id,
        title,
        department_id,
        departments(name)
      `)
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching positions:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch positions' };
  }
}
