import { supabase } from '@/integrations/supabase/client';

export interface PayrollPeriod {
  id: string;
  period_start: string;
  period_end: string;
  pay_date: string;
  is_processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePayrollPeriodInput {
  period_start: string;
  period_end: string;
  pay_date: string;
  is_processed?: boolean;
}

export interface UpdatePayrollPeriodInput {
  id: string;
  period_start: string;
  period_end: string;
  pay_date: string;
  is_processed?: boolean;
}

export async function fetchPayrollPeriods() {
  try {
    const { data, error } = await supabase
      .from('payroll_periods')
      .select('*')
      .order('period_start', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as unknown as PayrollPeriod[], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payroll periods';
    return { data: [] as PayrollPeriod[], error: message };
  }
}

export async function createPayrollPeriod(input: CreatePayrollPeriodInput) {
  try {
    const { data, error } = await supabase
      .from('payroll_periods')
      .insert([
        {
          period_start: input.period_start,
          period_end: input.period_end,
          pay_date: input.pay_date,
          is_processed: input.is_processed || false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data: data as unknown as PayrollPeriod, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payroll period';
    return { data: null, error: message };
  }
}

export async function updatePayrollPeriod(input: UpdatePayrollPeriodInput) {
  try {
    const { data, error } = await supabase
      .from('payroll_periods')
      .update({
        period_start: input.period_start,
        period_end: input.period_end,
        pay_date: input.pay_date,
        is_processed: input.is_processed || false,
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as unknown as PayrollPeriod, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update payroll period';
    return { data: null, error: message };
  }
}

export async function deletePayrollPeriod(id: string) {
  try {
    const { error } = await supabase
      .from('payroll_periods')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete payroll period';
    return { error: message };
  }
}

export async function togglePayrollStatus(id: string, currentStatus: boolean) {
  try {
    const { data, error } = await supabase
      .from('payroll_periods')
      .update({
        is_processed: !currentStatus,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as unknown as PayrollPeriod, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update payroll status';
    return { data: null, error: message };
  }
}

// =====================================================
// PAYROLL RECORDS FUNCTIONS
// =====================================================

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period_id: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface PayrollRecordWithDetails extends PayrollRecord {
  employee_number?: string;
  employee_name?: string;
  period_start?: string;
  period_end?: string;
  pay_date?: string;
}

export interface CreatePayrollRecordInput {
  employee_id: string;
  period_id: string;
  basic_salary: number;
  allowances?: number;
  deductions?: number;
  net_pay: number;
}

export interface UpdatePayrollRecordInput {
  id: string;
  basic_salary?: number;
  allowances?: number;
  deductions?: number;
  net_pay?: number;
  is_paid?: boolean;
  paid_at?: string;
}

export async function fetchPayrollRecords(periodId?: string) {
  try {
    let query = supabase
      .from('payroll_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (periodId) {
      query = query.eq('period_id', periodId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Fetch employee and period data separately
    const employeeIds = [...new Set((data || []).map(r => r.employee_id))];
    const periodIds = [...new Set((data || []).map(r => r.period_id))];

    let employees: any[] = [];
    let periods: any[] = [];

    if (employeeIds.length > 0) {
      const { data: empData } = await supabase
        .from('employees')
        .select('id, employee_number')
        .in('id', employeeIds);
      employees = empData || [];
    }

    if (periodIds.length > 0) {
      const { data: periodData } = await supabase
        .from('payroll_periods')
        .select('id, period_start, period_end, pay_date')
        .in('id', periodIds);
      periods = periodData || [];
    }

    // Merge data
    const recordsWithDetails = (data || []).map(record => ({
      ...record,
      employee_number: employees.find(e => e.id === record.employee_id)?.employee_number,
      period_start: periods.find(p => p.id === record.period_id)?.period_start,
      period_end: periods.find(p => p.id === record.period_id)?.period_end,
      pay_date: periods.find(p => p.id === record.period_id)?.pay_date,
    }));

    return { data: recordsWithDetails as unknown as PayrollRecordWithDetails[], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payroll records';
    return { data: [] as PayrollRecordWithDetails[], error: message };
  }
}

export async function fetchPayrollRecordsByEmployee(employeeId: string) {
  try {
    const { data, error } = await supabase
      .from('payroll_records')
      .select(`
        *,
        payroll_periods (period_start, period_end, pay_date)
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as unknown as PayrollRecordWithDetails[], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch employee payroll records';
    return { data: [] as PayrollRecordWithDetails[], error: message };
  }
}

export async function fetchPayrollRecordsByPeriod(periodId: string) {
  try {
    const { data, error } = await supabase
      .from('payroll_records')
      .select('*')
      .eq('period_id', periodId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch employee data
    const employeeIds = [...new Set((data || []).map(r => r.employee_id))];
    let employees: any[] = [];

    if (employeeIds.length > 0) {
      const { data: empData } = await supabase
        .from('employees')
        .select('id, employee_number')
        .in('id', employeeIds);
      employees = empData || [];
    }

    // Fetch period data
    const { data: periodData } = await supabase
      .from('payroll_periods')
      .select('id, period_start, period_end, pay_date')
      .eq('id', periodId)
      .single();

    // Merge data
    const recordsWithDetails = (data || []).map(record => ({
      ...record,
      employee_number: employees.find(e => e.id === record.employee_id)?.employee_number,
      period_start: periodData?.period_start,
      period_end: periodData?.period_end,
      pay_date: periodData?.pay_date,
    }));

    return { data: recordsWithDetails as unknown as PayrollRecordWithDetails[], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch period payroll records';
    return { data: [] as PayrollRecordWithDetails[], error: message };
  }
}

export async function createPayrollRecord(input: CreatePayrollRecordInput) {
  try {
    const { data, error } = await supabase
      .from('payroll_records')
      .insert([
        {
          employee_id: input.employee_id,
          period_id: input.period_id,
          basic_salary: input.basic_salary,
          allowances: input.allowances || 0,
          deductions: input.deductions || 0,
          net_pay: input.net_pay,
          is_paid: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data: data as unknown as PayrollRecord, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payroll record';
    return { data: null, error: message };
  }
}

export async function updatePayrollRecord(input: UpdatePayrollRecordInput) {
  try {
    const updateData: Record<string, any> = {};
    
    if (input.basic_salary !== undefined) updateData.basic_salary = input.basic_salary;
    if (input.allowances !== undefined) updateData.allowances = input.allowances;
    if (input.deductions !== undefined) updateData.deductions = input.deductions;
    if (input.net_pay !== undefined) updateData.net_pay = input.net_pay;
    if (input.is_paid !== undefined) updateData.is_paid = input.is_paid;
    if (input.paid_at !== undefined) updateData.paid_at = input.paid_at;

    const { data, error } = await supabase
      .from('payroll_records')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as unknown as PayrollRecord, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update payroll record';
    return { data: null, error: message };
  }
}

export async function deletePayrollRecord(id: string) {
  try {
    const { error } = await supabase
      .from('payroll_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete payroll record';
    return { error: message };
  }
}

export async function markPayrollAsPaid(id: string) {
  try {
    const { data, error } = await supabase
      .from('payroll_records')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as unknown as PayrollRecord, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark payroll as paid';
    return { data: null, error: message };
  }
}
