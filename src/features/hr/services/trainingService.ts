import { supabase } from '../../../integrations/supabase/client';

export interface TrainingProgram {
  id: string;
  title: string;
  description: string | null;
  duration_hours: number | null;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTrainingProgramInput {
  title: string;
  description?: string;
  duration_hours?: number;
  is_mandatory: boolean;
}

export interface UpdateTrainingProgramInput {
  id: string;
  title: string;
  description?: string;
  duration_hours?: number;
  is_mandatory: boolean;
}

export async function fetchTrainingPrograms() {
  try {
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .order('title');

    if (error) throw error;
    return { data: (data || []) as TrainingProgram[], error: null };
  } catch (error) {
    return { data: [] as TrainingProgram[], error: String(error) };
  }
}

export async function createTrainingProgram(input: CreateTrainingProgramInput) {
  try {
    const { data, error } = await supabase
      .from('training_programs')
      .insert([
        {
          title: input.title,
          description: input.description || null,
          duration_hours: input.duration_hours || null,
          is_mandatory: input.is_mandatory,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

export async function updateTrainingProgram(input: UpdateTrainingProgramInput) {
  try {
    const { data, error } = await supabase
      .from('training_programs')
      .update({
        title: input.title,
        description: input.description || null,
        duration_hours: input.duration_hours || null,
        is_mandatory: input.is_mandatory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

export async function deleteTrainingProgram(id: string) {
  try {
    const { error } = await supabase
      .from('training_programs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: String(error) };
  }
}
