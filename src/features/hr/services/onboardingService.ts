import { supabase } from '../../../integrations/supabase/client';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string | null;
  is_mandatory: boolean;
  department_id: string | null;
  created_at: string;
  updated_at?: string;
  departments?: { id: string; name: string } | null;
}

export interface CreateOnboardingTaskInput {
  title: string;
  description?: string;
  is_mandatory?: boolean;
  department_id?: string | null;
}

export interface UpdateOnboardingTaskInput extends Partial<CreateOnboardingTaskInput> {
  id: string;
}

// Fetch all onboarding tasks
export async function fetchOnboardingTasks() {
  try {
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .select(`
        *,
        departments(id, name)
      `)
      .order('title', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching onboarding tasks:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch onboarding tasks' };
  }
}

// Fetch single onboarding task
export async function fetchOnboardingTask(id: string) {
  try {
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .select(`
        *,
        departments(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching onboarding task:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch onboarding task' };
  }
}

// Create onboarding task
export async function createOnboardingTask(input: CreateOnboardingTaskInput) {
  try {
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .insert({
        title: input.title,
        description: input.description || null,
        is_mandatory: input.is_mandatory !== false,
        department_id: input.department_id || null,
      })
      .select(`
        *,
        departments(id, name)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating onboarding task:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create onboarding task' };
  }
}

// Update onboarding task
export async function updateOnboardingTask(input: UpdateOnboardingTaskInput) {
  try {
    const { id, ...updates } = input;
    
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .update({
        title: updates.title,
        description: updates.description !== undefined ? updates.description : undefined,
        is_mandatory: updates.is_mandatory !== undefined ? updates.is_mandatory : undefined,
        department_id: updates.department_id !== undefined ? updates.department_id : undefined,
      })
      .eq('id', id)
      .select(`
        *,
        departments(id, name)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating onboarding task:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Failed to update onboarding task' };
  }
}

// Delete onboarding task
export async function deleteOnboardingTask(id: string) {
  try {
    const { error } = await supabase
      .from('onboarding_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting onboarding task:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete onboarding task' };
  }
}

// Fetch departments for dropdown
export async function fetchDepartments() {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch departments' };
  }
}
