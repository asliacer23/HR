import { supabase } from '@/integrations/supabase/client';

export interface Benefit {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBenefitInput {
  name: string;
  description?: string;
  type?: string;
  is_active?: boolean;
}

export interface UpdateBenefitInput extends CreateBenefitInput {
  id: string;
}

export async function fetchBenefits() {
  try {
    const { data, error } = await supabase
      .from('benefits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data || []) as unknown as Benefit[], error: null };
  } catch (error) {
    return { data: [], error: 'Failed to fetch benefits' };
  }
}

export async function createBenefit(input: CreateBenefitInput) {
  try {
    const { data, error } = await supabase
      .from('benefits')
      .insert([
        {
          name: input.name,
          description: input.description || null,
          type: input.type || null,
          is_active: input.is_active ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as unknown as Benefit, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to create benefit' };
  }
}

export async function updateBenefit(input: UpdateBenefitInput) {
  try {
    const { data, error } = await supabase
      .from('benefits')
      .update({
        name: input.name,
        description: input.description || null,
        type: input.type || null,
        is_active: input.is_active ?? true,
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as unknown as Benefit, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to update benefit' };
  }
}

export async function deleteBenefit(id: string) {
  try {
    const { error } = await supabase
      .from('benefits')
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to delete benefit' };
  }
}

export async function toggleBenefitStatus(id: string, currentStatus: boolean) {
  try {
    const { data, error } = await supabase
      .from('benefits')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as unknown as Benefit, error: null };
  } catch (error) {
    return { data: null, error: 'Failed to toggle benefit status' };
  }
}
