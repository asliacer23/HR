import { supabase } from '../../../integrations/supabase/client';

export interface Employee {
  id: string;
  employee_number: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
}

export interface PerformanceEvaluation {
  id: string;
  employee_id: string;
  employee_number?: string;
  employee_name?: string;
  evaluator_id: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  status: 'pending' | 'in_progress' | 'completed';
  overall_rating: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  recommendations: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePerformanceEvaluationInput {
  employee_id: string;
  evaluator_id?: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  status: 'pending' | 'in_progress' | 'completed';
  overall_rating?: number;
  strengths?: string;
  areas_for_improvement?: string;
  recommendations?: string;
}

export interface UpdatePerformanceEvaluationInput {
  id: string;
  employee_id: string;
  evaluator_id?: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  status: 'pending' | 'in_progress' | 'completed';
  overall_rating?: number;
  strengths?: string;
  areas_for_improvement?: string;
  recommendations?: string;
}

export async function fetchPerformanceEvaluations() {
  try {
    // Fetch evaluations with employee details
    const { data: evaluations, error: evalError } = await supabase
      .from('performance_evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (evalError) throw evalError;

    // Fetch all employees for mapping
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_number, user_id');

    if (empError) throw empError;

    // Fetch all profiles for mapping
    const userIds = (employees || []).map(e => e.user_id);
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;
      profiles = profilesData || [];
    }

    // Merge data
    const evaluationsWithDetails = (evaluations || []).map(evaluation => {
      const employee = employees?.find(e => e.id === evaluation.employee_id);
      const profile = profiles.find(p => p.user_id === employee?.user_id);

      return {
        ...evaluation,
        employee_number: employee?.employee_number || '',
        employee_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
      };
    });

    return { data: evaluationsWithDetails as PerformanceEvaluation[], error: null };
  } catch (error) {
    return { data: [] as PerformanceEvaluation[], error: String(error) };
  }
}

export async function fetchEmployees() {
  try {
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('id, employee_number, user_id')
      .order('employee_number');

    if (empError) throw empError;

    // Fetch profiles for employees
    const userIds = (empData || []).map(e => e.user_id);
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;
      profiles = profilesData || [];
    }

    // Merge profile data with employee data
    const employeesWithProfiles = (empData || []).map(emp => ({
      ...emp,
      first_name: profiles.find(p => p.user_id === emp.user_id)?.first_name || '',
      last_name: profiles.find(p => p.user_id === emp.user_id)?.last_name || '',
    }));

    return { data: employeesWithProfiles as Employee[], error: null };
  } catch (error) {
    return { data: [] as Employee[], error: String(error) };
  }
}

export async function createPerformanceEvaluation(input: CreatePerformanceEvaluationInput) {
  try {
    // Get current user for evaluator ID (optional - HR admins may not be employees)
    let evaluatorId: string | null = null;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: evaluatorEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (evaluatorEmployee) {
        evaluatorId = evaluatorEmployee.id;
      }
    }

    const evaluationData = {
      employee_id: input.employee_id,
      evaluator_id: evaluatorId,
      evaluation_period_start: input.evaluation_period_start,
      evaluation_period_end: input.evaluation_period_end,
      status: input.status,
      overall_rating: input.overall_rating ? Number(input.overall_rating) : null,
      strengths: input.strengths || null,
      areas_for_improvement: input.areas_for_improvement || null,
      recommendations: input.recommendations || null,
    };

    const { data, error } = await supabase
      .from('performance_evaluations')
      .insert([evaluationData])
      .select()
      .single();

    if (error) throw error;
    
    // Fetch employee details for the evaluation
    const { data: employee } = await supabase
      .from('employees')
      .select('id, employee_number, user_id')
      .eq('id', data.employee_id)
      .single();

    let employee_number = '';
    let employee_name = 'Unknown';

    if (employee) {
      employee_number = employee.employee_number;
      // Fetch profile for employee name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', employee.user_id)
        .single();

      if (profile) {
        employee_name = `${profile.first_name} ${profile.last_name}`;
      }
    }

    // Transform the response to include employee details
    const evaluationWithDetails = {
      ...data,
      employee_number,
      employee_name,
    } as PerformanceEvaluation;

    return { data: evaluationWithDetails, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create evaluation';
    console.error('Create evaluation error:', error);
    return { data: null, error: errorMessage };
  }
}

export async function updatePerformanceEvaluation(input: UpdatePerformanceEvaluationInput) {
  try {
    // Get current user for evaluator ID (optional - HR admins may not be employees)
    let evaluatorId: string | null = null;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: evaluatorEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (evaluatorEmployee) {
        evaluatorId = evaluatorEmployee.id;
      }
    }

    const updateData = {
      employee_id: input.employee_id,
      evaluator_id: evaluatorId,
      evaluation_period_start: input.evaluation_period_start,
      evaluation_period_end: input.evaluation_period_end,
      status: input.status,
      overall_rating: input.overall_rating ? Number(input.overall_rating) : null,
      strengths: input.strengths || null,
      areas_for_improvement: input.areas_for_improvement || null,
      recommendations: input.recommendations || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('performance_evaluations')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;
    
    // Fetch employee details for the evaluation
    const { data: employee } = await supabase
      .from('employees')
      .select('id, employee_number, user_id')
      .eq('id', data.employee_id)
      .single();

    let employee_number = '';
    let employee_name = 'Unknown';

    if (employee) {
      employee_number = employee.employee_number;
      // Fetch profile for employee name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', employee.user_id)
        .single();

      if (profile) {
        employee_name = `${profile.first_name} ${profile.last_name}`;
      }
    }

    // Transform the response to include employee details
    const evaluationWithDetails = {
      ...data,
      employee_number,
      employee_name,
    } as PerformanceEvaluation;

    return { data: evaluationWithDetails, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update evaluation';
    return { data: null, error: errorMessage };
  }
}

export async function deletePerformanceEvaluation(id: string) {
  try {
    const { error } = await supabase
      .from('performance_evaluations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: String(error) };
  }
}
