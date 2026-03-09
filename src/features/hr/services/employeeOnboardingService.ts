import { supabase } from '../../../integrations/supabase/client';

export interface EmployeeOnboarding {
  id: string;
  employee_id: string;
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  onboarding_tasks?: {
    id: string;
    title: string;
    description: string | null;
    is_mandatory: boolean;
  } | null;
}

export interface CreateEmployeeOnboardingInput {
  employee_id: string;
  task_id: string;
  notes?: string;
}

export interface UpdateEmployeeOnboardingInput extends Partial<CreateEmployeeOnboardingInput> {
  id: string;
  is_completed?: boolean;
  completed_at?: string | null;
}

// Fetch all employee onboarding records
export async function fetchEmployeeOnboardings() {
  try {
    // Fetch onboarding records with employee and task details
    const { data: onboardings, error: onboardingError } = await supabase
      .from('employee_onboarding')
      .select('*')
      .order('completed_at', { ascending: false, nullsFirst: true });

    if (onboardingError) throw onboardingError;

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

    // Fetch all onboarding tasks for mapping
    const { data: tasks, error: taskError } = await supabase
      .from('onboarding_tasks')
      .select('id, title, description, is_mandatory');

    if (taskError) throw taskError;

    // Merge data
    const transformedData = (onboardings || []).map(record => {
      const employee = employees?.find(e => e.id === record.employee_id);
      const profile = profiles.find(p => p.user_id === employee?.user_id);
      const task = tasks?.find(t => t.id === record.task_id);

      return {
        ...record,
        employees: {
          id: employee?.id || '',
          employee_number: employee?.employee_number || '',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          email: profile?.email || '',
        },
        onboarding_tasks: task || null,
      };
    });

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching employee onboardings:', error);
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch employee onboarding records by employee ID
export async function fetchEmployeeOnboardingsByEmployee(employeeId: string) {
  try {
    // Fetch onboarding records for the employee
    const { data: onboardings, error: onboardingError } = await supabase
      .from('employee_onboarding')
      .select('*')
      .eq('employee_id', employeeId)
      .order('completed_at', { ascending: false, nullsFirst: true });

    if (onboardingError) throw onboardingError;

    if (!onboardings || onboardings.length === 0) {
      return { data: [], error: null };
    }

    // Fetch the employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, employee_number')
      .eq('id', employeeId)
      .single();

    if (empError) throw empError;

    // Fetch profile for the employee
    let profile = null;
    if (employee?.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('user_id', employee.user_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      profile = profileData;
    }

    // Fetch all onboarding tasks for mapping
    const { data: tasks, error: taskError } = await supabase
      .from('onboarding_tasks')
      .select('id, title, description, is_mandatory');

    if (taskError) throw taskError;

    // Merge data
    const transformedData = (onboardings || []).map(record => {
      const task = tasks?.find(t => t.id === record.task_id);

      return {
        ...record,
        employees: {
          id: employee?.id || '',
          employee_number: employee?.employee_number || '',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          email: profile?.email || '',
        },
        onboarding_tasks: task || null,
      };
    });

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching employee onboardings:', error);
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch single employee onboarding record
export async function fetchEmployeeOnboarding(id: string) {
  try {
    // Fetch the onboarding record
    const { data: record, error: recordError } = await supabase
      .from('employee_onboarding')
      .select('*')
      .eq('id', id)
      .single();

    if (recordError) throw recordError;

    if (!record) {
      return { data: null, error: 'Record not found' };
    }

    // Fetch the employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, employee_number')
      .eq('id', record.employee_id)
      .single();

    if (empError) throw empError;

    // Fetch profile for the employee
    let profile = null;
    if (employee?.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('user_id', employee.user_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      profile = profileData;
    }

    // Fetch the onboarding task
    const { data: task, error: taskError } = await supabase
      .from('onboarding_tasks')
      .select('id, title, description, is_mandatory')
      .eq('id', record.task_id)
      .single();

    if (taskError && taskError.code !== 'PGRST116') throw taskError;

    // Merge data
    const transformedData = {
      ...record,
      employees: {
        id: employee?.id || '',
        employee_number: employee?.employee_number || '',
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
      },
      onboarding_tasks: task || null,
    };

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching employee onboarding:', error);
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Create employee onboarding record
export async function createEmployeeOnboarding(input: CreateEmployeeOnboardingInput) {
  try {
    // Insert the record
    const { data: record, error: insertError } = await supabase
      .from('employee_onboarding')
      .insert({
        employee_id: input.employee_id,
        task_id: input.task_id,
        notes: input.notes || null,
        is_completed: false,
        completed_at: null,
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    if (!record) {
      return { data: null, error: 'Failed to create record' };
    }

    // Fetch the employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, employee_number')
      .eq('id', record.employee_id)
      .single();

    if (empError) throw empError;

    // Fetch profile for the employee
    let profile = null;
    if (employee?.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('user_id', employee.user_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      profile = profileData;
    }

    // Fetch the onboarding task
    const { data: task, error: taskError } = await supabase
      .from('onboarding_tasks')
      .select('id, title, description, is_mandatory')
      .eq('id', record.task_id)
      .single();

    if (taskError && taskError.code !== 'PGRST116') throw taskError;

    // Merge data
    const transformedData = {
      ...record,
      employees: {
        id: employee?.id || '',
        employee_number: employee?.employee_number || '',
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
      },
      onboarding_tasks: task || null,
    };

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error creating employee onboarding:', error);
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Update employee onboarding record
export async function updateEmployeeOnboarding(input: UpdateEmployeeOnboardingInput) {
  try {
    const { id, ...updates } = input;

    const updateData: Record<string, any> = {};
    
    if (updates.is_completed !== undefined) {
      updateData.is_completed = updates.is_completed;
      updateData.completed_at = updates.is_completed ? new Date().toISOString() : null;
    }
    
    if (updates.completed_at !== undefined) {
      updateData.completed_at = updates.completed_at;
    }
    
    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }

    // Update the record
    const { data: record, error: updateError } = await supabase
      .from('employee_onboarding')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    if (!record) {
      return { data: null, error: 'Record not found' };
    }

    // Fetch the employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, employee_number')
      .eq('id', record.employee_id)
      .single();

    if (empError) throw empError;

    // Fetch profile for the employee
    let profile = null;
    if (employee?.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('user_id', employee.user_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      profile = profileData;
    }

    // Fetch the onboarding task
    const { data: task, error: taskError } = await supabase
      .from('onboarding_tasks')
      .select('id, title, description, is_mandatory')
      .eq('id', record.task_id)
      .single();

    if (taskError && taskError.code !== 'PGRST116') throw taskError;

    // Merge data
    const transformedData = {
      ...record,
      employees: {
        id: employee?.id || '',
        employee_number: employee?.employee_number || '',
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
      },
      onboarding_tasks: task || null,
    };

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error updating employee onboarding:', error);
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

// Delete employee onboarding record
export async function deleteEmployeeOnboarding(id: string) {
  try {
    const { error } = await supabase
      .from('employee_onboarding')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting employee onboarding:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete employee onboarding' };
  }
}

// Fetch all employees with their profile info
export async function fetchEmployees() {
  try {
    // First fetch employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, user_id, employee_number, employment_status')
      .eq('employment_status', 'active')
      .order('employee_number', { ascending: true });

    if (empError) throw empError;

    if (!employees || employees.length === 0) {
      return { data: [], error: null };
    }

    // Get user IDs and fetch profiles
    const userIds = employees.map(e => e.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email')
      .in('user_id', userIds);

    if (profileError) throw profileError;

    // Create a map of profiles by user_id for easy lookup
    const profileMap = profiles?.reduce((acc: any, profile: any) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {}) || {};

    // Combine employees with their profiles
    const transformedData = employees.map((emp: any) => {
      const profile = profileMap[emp.user_id];
      return {
        id: emp.id,
        employee_number: emp.employee_number,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
      };
    });

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch all onboarding tasks
export async function fetchOnboardingTasks() {
  try {
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .select('id, title, description, is_mandatory')
      .order('title', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching onboarding tasks:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch onboarding tasks' };
  }
}

// Get employee onboarding progress
export async function getEmployeeOnboardingProgress(employeeId: string) {
  try {
    const { data, error } = await supabase
      .from('employee_onboarding')
      .select('id, is_completed')
      .eq('employee_id', employeeId);

    if (error) throw error;

    const total = data?.length || 0;
    const completed = data?.filter(item => item.is_completed).length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { data: { total, completed, percentage }, error: null };
  } catch (error) {
    console.error('Error getting employee onboarding progress:', error);
    return { data: { total: 0, completed: 0, percentage: 0 }, error: error instanceof Error ? error.message : 'Failed to get onboarding progress' };
  }
}
