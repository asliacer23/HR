import { supabase } from '../../../integrations/supabase/client';

export interface EmployeeTraining {
  id: string;
  employee_id: string;
  program_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string | null;
  completion_date: string | null;
  score: number | null;
  certificate_url: string | null;
  created_at: string;
  employees?: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  training_programs?: {
    id: string;
    title: string;
    description: string | null;
    duration_hours: number | null;
    is_mandatory: boolean;
  } | null;
}

export interface CreateEmployeeTrainingInput {
  employee_id: string;
  program_id: string;
  start_date?: string;
}

export interface UpdateEmployeeTrainingInput extends Partial<CreateEmployeeTrainingInput> {
  id: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completion_date?: string | null;
  score?: number | null;
  certificate_url?: string | null;
}

// Fetch all employee trainings with related data
export async function fetchEmployeeTrainings() {
  try {
    const { data: trainings, error: trainingError } = await supabase
      .from('employee_trainings')
      .select('*')
      .order('created_at', { ascending: false });

    if (trainingError) throw trainingError;

    // Fetch all employees for mapping
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, employee_number');

    if (empError) throw empError;

    // Fetch all profiles for mapping
    const userIds = (employees || []).map(e => e.user_id);
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (profileError) throw profileError;
      profiles = profilesData || [];
    }

    // Fetch all training programs for mapping
    const { data: programs, error: programError } = await supabase
      .from('training_programs')
      .select('id, title, description, duration_hours, is_mandatory');

    if (programError) throw programError;

    // Merge data
    const transformedData = (trainings || []).map(record => {
      const employee = employees?.find(e => e.id === record.employee_id);
      const profile = profiles.find(p => p.user_id === employee?.user_id);
      const program = programs?.find(p => p.id === record.program_id);

      return {
        ...record,
        employees: {
          id: employee?.id || '',
          employee_number: employee?.employee_number || '',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          email: profile?.email || '',
        },
        training_programs: program || null,
      };
    });

    return { data: transformedData as EmployeeTraining[], error: null };
  } catch (error) {
    console.error('Error fetching employee trainings:', error);
    return { data: [] as EmployeeTraining[], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch employee trainings by employee ID
export async function fetchEmployeeTrainingsByEmployee(employeeId: string) {
  try {
    const { data: trainings, error: trainingError } = await supabase
      .from('employee_trainings')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (trainingError) throw trainingError;

    // Fetch the training programs
    const programIds = (trainings || []).map(t => t.program_id);
    let programs = [];
    if (programIds.length > 0) {
      const { data: programsData, error: programError } = await supabase
        .from('training_programs')
        .select('id, title, description, duration_hours, is_mandatory')
        .in('id', programIds);

      if (programError) throw programError;
      programs = programsData || [];
    }

    // Merge data
    const transformedData = (trainings || []).map(record => {
      const program = programs.find(p => p.id === record.program_id);

      return {
        ...record,
        training_programs: program || null,
      };
    });

    return { data: transformedData as EmployeeTraining[], error: null };
  } catch (error) {
    console.error('Error fetching employee trainings by employee:', error);
    return { data: [] as EmployeeTraining[], error: error instanceof Error ? error.message : String(error) };
  }
}

// Create employee training assignment
export async function createEmployeeTraining(input: CreateEmployeeTrainingInput) {
  try {
    const { data, error } = await supabase
      .from('employee_trainings')
      .insert([
        {
          employee_id: input.employee_id,
          program_id: input.program_id,
          start_date: input.start_date || null,
          status: 'scheduled',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Update employee training
export async function updateEmployeeTraining(input: UpdateEmployeeTrainingInput) {
  try {
    const { data, error } = await supabase
      .from('employee_trainings')
      .update({
        ...(input.status && { status: input.status }),
        ...(input.start_date !== undefined && { start_date: input.start_date }),
        ...(input.completion_date !== undefined && { completion_date: input.completion_date }),
        ...(input.score !== undefined && { score: input.score }),
        ...(input.certificate_url !== undefined && { certificate_url: input.certificate_url }),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Delete employee training
export async function deleteEmployeeTraining(id: string) {
  try {
    const { error } = await supabase
      .from('employee_trainings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch available training programs for assignment
export async function fetchAvailableTrainingPrograms() {
  try {
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .order('title');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch all employees for training assignment
export async function fetchEmployeesForTraining() {
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, employee_number')
      .eq('employment_status', 'active');

    if (empError) throw empError;

    // Fetch profiles
    const userIds = (employees || []).map(e => e.user_id);
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      if (profileError) throw profileError;
      profiles = profilesData || [];
    }

    // Merge data
    const transformedData = (employees || []).map(employee => {
      const profile = profiles.find(p => p.user_id === employee.user_id);
      return {
        id: employee.id,
        employee_number: employee.employee_number,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
      };
    });

    return { data: transformedData, error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}
