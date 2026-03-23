import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  employee_number: string;
  position_id: string | null;
  department_id: string | null;
  employee_type: string;
  hire_date: string;
  employment_status: string;
  supervisor_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithDetails extends Employee {
  departments?: { name: string } | null;
  positions?: { title: string } | null;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  error: string | null;
}

export async function fetchEmployees(pagination?: PaginationParams): Promise<PaginatedResult<EmployeeWithDetails>> {
  try {
    let query = supabase
      .from('employees')
      .select('id, employee_number, position_id, department_id, employee_type, hire_date, employment_status, supervisor_id, user_id, created_at, updated_at, departments (name), positions (title)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (pagination?.page && pagination?.pageSize) {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch user profiles separately
    const userIds = (data || []).map(e => e.user_id).filter(Boolean);
    let profiles: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);
      profiles = profilesData || [];
    }

    // Merge profiles with employees
    const employeesWithProfiles = (data || []).map(emp => ({
      ...emp,
      profiles: profiles.find(p => p.user_id === emp.user_id),
    })) as unknown as EmployeeWithDetails[];

    return { data: employeesWithProfiles, totalCount: count ?? 0, error: null };
  } catch (error) {
    return { data: [] as EmployeeWithDetails[], totalCount: 0, error: String(error) };
  }
}

export async function fetchEmployeeById(id: string) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_number, position_id, department_id, employee_type, hire_date, employment_status, supervisor_id, user_id, created_at, updated_at, departments (name), positions (title)')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch user profile
    let profile = null;
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('user_id', data.user_id)
        .single();
      profile = profileData;
    }

    const employeeWithProfile = {
      ...data,
      profiles: profile,
    } as unknown as EmployeeWithDetails;

    return { data: employeeWithProfile, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

export async function searchEmployees(searchTerm: string, pagination?: PaginationParams): Promise<PaginatedResult<EmployeeWithDetails>> {
  try {
    let query = supabase
      .from('employees')
      .select('id, employee_number, position_id, department_id, employee_type, hire_date, employment_status, supervisor_id, user_id, created_at, updated_at, departments (name), positions (title)', { count: 'exact' })
      .or(`employee_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (pagination?.page && pagination?.pageSize) {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch user profiles separately
    const userIds = (data || []).map(e => e.user_id).filter(Boolean);
    let profiles: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);
      profiles = profilesData || [];
    }

    // Merge profiles with employees
    const employeesWithProfiles = (data || []).map(emp => ({
      ...emp,
      profiles: profiles.find(p => p.user_id === emp.user_id),
    })) as unknown as EmployeeWithDetails[];

    return { data: employeesWithProfiles, totalCount: count ?? 0, error: null };
  } catch (error) {
    return { data: [] as EmployeeWithDetails[], totalCount: 0, error: String(error) };
  }
}

export async function fetchEmployeesByDepartment(departmentId: string, pagination?: PaginationParams): Promise<PaginatedResult<EmployeeWithDetails>> {
  try {
    let query = supabase
      .from('employees')
      .select('id, employee_number, position_id, department_id, employee_type, hire_date, employment_status, supervisor_id, user_id, created_at, updated_at, departments (name), positions (title)', { count: 'exact' })
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false });

    if (pagination?.page && pagination?.pageSize) {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch user profiles separately
    const userIds = (data || []).map(e => e.user_id).filter(Boolean);
    let profiles: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);
      profiles = profilesData || [];
    }

    // Merge profiles with employees
    const employeesWithProfiles = (data || []).map(emp => ({
      ...emp,
      profiles: profiles.find(p => p.user_id === emp.user_id),
    })) as unknown as EmployeeWithDetails[];

    return { data: employeesWithProfiles, totalCount: count ?? 0, error: null };
  } catch (error) {
    return { data: [] as EmployeeWithDetails[], totalCount: 0, error: String(error) };
  }
}
