import { supabase } from '@/integrations/supabase/client';

export interface EvaluationScore {
  id: string;
  evaluation_id: string;
  criteria_id: string;
  score: number;
  comments: string | null;
  performance_criteria?: {
    id: string;
    name: string;
    description: string | null;
    weight: number | null;
  };
}

export interface CreateEvaluationScoreInput {
  evaluation_id: string;
  criteria_id: string;
  score: number;
  comments?: string;
}

export interface UpdateEvaluationScoreInput extends Partial<CreateEvaluationScoreInput> {
  id: string;
}

// Fetch all evaluation scores
export async function fetchEvaluationScores() {
  try {
    const { data, error } = await supabase
      .from('evaluation_scores')
      .select(`
        *,
        performance_criteria(id, name, description, weight)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch evaluation scores by evaluation ID
export async function fetchEvaluationScoresByEvaluation(evaluationId: string) {
  try {
    const { data, error } = await supabase
      .from('evaluation_scores')
      .select(`
        *,
        performance_criteria(id, name, description, weight)
      `)
      .eq('evaluation_id', evaluationId)
      .order('performance_criteria(name)', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch single evaluation score
export async function fetchEvaluationScore(id: string) {
  try {
    const { data, error } = await supabase
      .from('evaluation_scores')
      .select(`
        *,
        performance_criteria(id, name, description, weight)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Create evaluation score
export async function createEvaluationScore(input: CreateEvaluationScoreInput) {
  try {
    const { data, error } = await supabase
      .from('evaluation_scores')
      .insert({
        evaluation_id: input.evaluation_id,
        criteria_id: input.criteria_id,
        score: input.score,
        comments: input.comments || null,
      })
      .select(`
        *,
        performance_criteria(id, name, description, weight)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Update evaluation score
export async function updateEvaluationScore(input: UpdateEvaluationScoreInput) {
  try {
    const { id, ...updates } = input;
    
    const { data, error } = await supabase
      .from('evaluation_scores')
      .update({
        score: updates.score,
        comments: updates.comments,
      })
      .eq('id', id)
      .select(`
        *,
        performance_criteria(id, name, description, weight)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Delete evaluation score
export async function deleteEvaluationScore(id: string) {
  try {
    const { error } = await supabase
      .from('evaluation_scores')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch all performance criteria for selection
export async function fetchPerformanceCriteria() {
  try {
    const { data, error } = await supabase
      .from('performance_criteria')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}
