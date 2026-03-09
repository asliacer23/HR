import { supabase } from '../../../integrations/supabase/client';

export interface EmployeeBenefit {
  id: string;
  employee_id: string;
  benefit_id: string;
  enrolled_at: string;
  coverage_amount: number | null;
  is_active: boolean;
  employees?: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  benefits?: {
    id: string;
    name: string;
    description: string | null;
    type: string | null;
    is_active: boolean;
  } | null;
}

export interface CreateEmployeeBenefitInput {
  employee_id: string;
  benefit_id: string;
  coverage_amount?: number;
}

export interface UpdateEmployeeBenefitInput extends Partial<CreateEmployeeBenefitInput> {
  id: string;
  is_active?: boolean;
}

// Fetch all employee benefits with related data
export async function fetchEmployeeBenefits() {
  try {
    const { data: employeeBenefits, error: benefitError } = await supabase
      .from('employee_benefits')
      .select('*')
      .order('enrolled_at', { ascending: false });

    if (benefitError) throw benefitError;

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

    // Fetch all benefits for mapping
    const { data: benefits, error: benefitsError } = await supabase
      .from('benefits')
      .select('id, name, description, type, is_active');

    if (benefitsError) throw benefitsError;

    // Merge data
    const transformedData = (employeeBenefits || []).map(record => {
      const employee = employees?.find(e => e.id === record.employee_id);
      const profile = profiles.find(p => p.user_id === employee?.user_id);
      const benefit = benefits?.find(b => b.id === record.benefit_id);

      return {
        ...record,
        employees: {
          id: employee?.id || '',
          employee_number: employee?.employee_number || '',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          email: profile?.email || '',
        },
        benefits: benefit || null,
      };
    });

    return { data: transformedData as EmployeeBenefit[], error: null };
  } catch (error) {
    console.error('Error fetching employee benefits:', error);
    return { data: [] as EmployeeBenefit[], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch employee benefits by employee ID
export async function fetchEmployeeBenefitsByEmployee(employeeId: string) {
  try {
    const { data: employeeBenefits, error: benefitError } = await supabase
      .from('employee_benefits')
      .select('*')
      .eq('employee_id', employeeId)
      .order('enrolled_at', { ascending: false });

    if (benefitError) throw benefitError;

    // Fetch the benefits
    const benefitIds = (employeeBenefits || []).map(eb => eb.benefit_id);
    let benefits = [];
    if (benefitIds.length > 0) {
      const { data: benefitsData, error: benefitsError } = await supabase
        .from('benefits')
        .select('id, name, description, type, is_active')
        .in('id', benefitIds);

      if (benefitsError) throw benefitsError;
      benefits = benefitsData || [];
    }

    // Merge data
    const transformedData = (employeeBenefits || []).map(record => {
      const benefit = benefits.find(b => b.id === record.benefit_id);

      return {
        ...record,
        benefits: benefit || null,
      };
    });

    return { data: transformedData as EmployeeBenefit[], error: null };
  } catch (error) {
    console.error('Error fetching employee benefits by employee:', error);
    return { data: [] as EmployeeBenefit[], error: error instanceof Error ? error.message : String(error) };
  }
}

// Create employee benefit enrollment
export async function createEmployeeBenefit(input: CreateEmployeeBenefitInput) {
  try {
    const { data, error } = await supabase
      .from('employee_benefits')
      .insert([
        {
          employee_id: input.employee_id,
          benefit_id: input.benefit_id,
          coverage_amount: input.coverage_amount || null,
          is_active: true,
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

// Update employee benefit
export async function updateEmployeeBenefit(input: UpdateEmployeeBenefitInput) {
  try {
    const { data, error } = await supabase
      .from('employee_benefits')
      .update({
        ...(input.coverage_amount !== undefined && { coverage_amount: input.coverage_amount }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
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

// Delete employee benefit enrollment
export async function deleteEmployeeBenefit(id: string) {
  try {
    const { error } = await supabase
      .from('employee_benefits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch available benefits
export async function fetchAvailableBenefits() {
  try {
    const { data, error } = await supabase
      .from('benefits')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}

// Fetch all employees for benefit enrollment
export async function fetchEmployeesForBenefits() {
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

// Fetch all benefits (for listing purposes)
export async function fetchAllBenefits() {
  try {
    const { data, error } = await supabase
      .from('benefits')
      .select('*')
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error) };
  }
}
