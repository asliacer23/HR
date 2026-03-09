import { supabase } from '@/integrations/supabase/client';

// ============================================
// EMPLOYEE SUMMARY REPORT TYPES
// ============================================
export interface DetailedEmployeeInfo {
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string;
  employment_status: string;
  employee_type: string;
  hire_date: string;
}

export interface EmployeeSummaryReport {
  total_employees: number;
  active_employees: number;
  on_leave_employees: number;
  terminated_employees: number;
  probation_employees: number;
  detailed_employees: DetailedEmployeeInfo[];
}

// ============================================
// PERFORMANCE REPORT TYPES
// ============================================
export interface PerformanceDetailRecord {
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string;
  evaluation_date: string;
  overall_rating: number;
  feedback: string;
  status: string;
}

export interface PerformanceReportData {
  total_evaluations: number;
  completed: number;
  pending: number;
  in_progress: number;
  average_score: number;
  all_evaluations: PerformanceDetailRecord[];
}

// ============================================
// PAYROLL REPORT TYPES
// ============================================
export interface PayrollDetailRecord {
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  period_start: string;
  period_end: string;
  is_paid: boolean;
}

export interface PayrollReportData {
  total_records: number;
  paid_records: number;
  pending_records: number;
  total_net_pay: number;
  total_basic_salary: number;
  total_allowances: number;
  total_deductions: number;
  all_records: PayrollDetailRecord[];
}

// ============================================
// TRAINING REPORT TYPES
// ============================================
export interface TrainingDetailRecord {
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string;
  training_title: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_hours: number;
}

export interface TrainingReportData {
  total_training_programs: number;
  total_enrollments: number;
  completed_trainings: number;
  scheduled_trainings: number;
  in_progress_trainings: number;
  cancelled_trainings: number;
  all_trainings: TrainingDetailRecord[];
}

// ============================================
// BENEFITS REPORT TYPES
// ============================================
export interface BenefitDetailRecord {
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string;
  benefit_name: string;
  coverage_amount: number;
  is_active: boolean;
  enrollment_date: string;
}

export interface BenefitsReportData {
  total_benefits: number;
  total_employees_with_benefits: number;
  all_benefits: BenefitDetailRecord[];
}

// ============================================
// FETCH EMPLOYEE SUMMARY REPORT
// ============================================
export async function fetchEmployeeSummaryReport() {
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_number, employment_status, employee_type, department_id, user_id, hire_date');

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name');

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email');

    if (empError || deptError || profileError) {
      const errorMsg = empError?.message || deptError?.message || profileError?.message;
      return { data: null, error: errorMsg };
    }

    if (!employees) {
      return { data: null, error: 'No employee data found' };
    }

    // Build detailed employee list
    const detailedEmployees: DetailedEmployeeInfo[] = employees.map(emp => {
      const profile = profiles?.find(p => p.user_id === emp.user_id);
      const dept = departments?.find(d => d.id === emp.department_id);
      return {
        employee_id: emp.id,
        employee_number: emp.employee_number,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        department_name: dept?.name || 'Unassigned',
        employment_status: emp.employment_status,
        employee_type: emp.employee_type,
        hire_date: new Date(emp.hire_date).toLocaleDateString(),
      };
    });

    const report: EmployeeSummaryReport = {
      total_employees: employees.length,
      active_employees: employees.filter(e => e.employment_status === 'active').length,
      on_leave_employees: employees.filter(e => e.employment_status === 'on_leave').length,
      terminated_employees: employees.filter(e => e.employment_status === 'terminated').length,
      probation_employees: employees.filter(e => e.employment_status === 'probation').length,
      detailed_employees: detailedEmployees,
    };

    return { data: report, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// FETCH PERFORMANCE REPORT
// ============================================
export async function fetchPerformanceReport() {
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_number, department_id, user_id');

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name');

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email');

    const { data: evaluations, error: evalError } = await supabase
      .from('performance_evaluations')
      .select('id, employee_id, overall_rating, status, created_at');

    if (empError || deptError || profileError || evalError) {
      const errorMsg = empError?.message || deptError?.message || profileError?.message || evalError?.message;
      return { data: null, error: errorMsg };
    }

    if (!evaluations) {
      return { data: null, error: 'No evaluation data found' };
    }

    // Build detailed evaluations list
    const allEvaluations: PerformanceDetailRecord[] = evaluations.map(evaluation => {
      const emp = employees?.find(e => e.id === evaluation.employee_id);
      const profile = profiles?.find(p => p.user_id === emp?.user_id);
      const dept = departments?.find(d => d.id === emp?.department_id);

      return {
        employee_id: evaluation.employee_id,
        employee_number: emp?.employee_number || '',
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        department_name: dept?.name || 'Unassigned',
        evaluation_date: new Date(evaluation.created_at).toLocaleDateString(),
        overall_rating: evaluation.overall_rating || 0,
        feedback: '',
        status: evaluation.status,
      };
    });

    const totalScore = evaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0);
    const avgScore = evaluations.length > 0 ? Math.round((totalScore / evaluations.length) * 10) / 10 : 0;

    const report: PerformanceReportData = {
      total_evaluations: evaluations.length,
      completed: evaluations.filter(e => e.status === 'completed').length,
      pending: evaluations.filter(e => e.status === 'pending').length,
      in_progress: evaluations.filter(e => e.status === 'in_progress').length,
      average_score: avgScore,
      all_evaluations: allEvaluations,
    };

    return { data: report, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// FETCH PAYROLL REPORT
// ============================================
export async function fetchPayrollReport(periodId?: string) {
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_number, department_id, user_id');

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name');

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email');

    let query = supabase
      .from('payroll_records')
      .select('id, employee_id, basic_salary, allowances, deductions, net_pay, is_paid, period_id, payroll_periods(period_start, period_end)');

    if (periodId) {
      query = query.eq('period_id', periodId);
    }

    const { data: payrollRecords, error: payrollError } = await query;

    if (empError || deptError || profileError || payrollError) {
      const errorMsg = empError?.message || deptError?.message || profileError?.message || payrollError?.message;
      return { data: null, error: errorMsg };
    }

    if (!payrollRecords) {
      return { data: null, error: 'No payroll records found' };
    }

    // Build detailed payroll records
    const allRecords: PayrollDetailRecord[] = payrollRecords.map(record => {
      const emp = employees?.find(e => e.id === record.employee_id);
      const profile = profiles?.find(p => p.user_id === emp?.user_id);
      const dept = departments?.find(d => d.id === emp?.department_id);

      return {
        employee_id: record.employee_id,
        employee_number: emp?.employee_number || '',
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        department_name: dept?.name || 'Unassigned',
        basic_salary: record.basic_salary,
        allowances: record.allowances,
        deductions: record.deductions,
        net_pay: record.net_pay,
        period_start: new Date(record.payroll_periods.period_start).toLocaleDateString(),
        period_end: new Date(record.payroll_periods.period_end).toLocaleDateString(),
        is_paid: record.is_paid,
      };
    });

    const totalNetPay = allRecords.reduce((sum, r) => sum + r.net_pay, 0);
    const totalBasic = allRecords.reduce((sum, r) => sum + r.basic_salary, 0);
    const totalAllowances = allRecords.reduce((sum, r) => sum + r.allowances, 0);
    const totalDeductions = allRecords.reduce((sum, r) => sum + r.deductions, 0);

    const report: PayrollReportData = {
      total_records: payrollRecords.length,
      paid_records: payrollRecords.filter(r => r.is_paid).length,
      pending_records: payrollRecords.filter(r => !r.is_paid).length,
      total_net_pay: totalNetPay,
      total_basic_salary: totalBasic,
      total_allowances: totalAllowances,
      total_deductions: totalDeductions,
      all_records: allRecords,
    };

    return { data: report, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// FETCH TRAINING REPORT
// ============================================
export async function fetchTrainingReport() {
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_number, department_id, user_id');

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name');

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email');

    const { data: trainings, error: trainError } = await supabase
      .from('employee_trainings')
      .select('id, employee_id, status, training_programs(id, title)');

    if (empError || deptError || profileError || trainError) {
      const errorMsg = empError?.message || deptError?.message || profileError?.message || trainError?.message;
      return { data: null, error: errorMsg };
    }

    if (!trainings) {
      return { data: null, error: 'No training data found' };
    }

    // Build detailed trainings list
    const allTrainings: TrainingDetailRecord[] = trainings.map(training => {
      const emp = employees?.find(e => e.id === training.employee_id);
      const profile = profiles?.find(p => p.user_id === emp?.user_id);
      const dept = departments?.find(d => d.id === emp?.department_id);

      return {
        employee_id: training.employee_id,
        employee_number: emp?.employee_number || '',
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        department_name: dept?.name || 'Unassigned',
        training_title: training.training_programs?.title || 'Unknown',
        status: training.status,
        start_date: '-',
        end_date: '-',
        duration_hours: 0,
      };
    });

    const report: TrainingReportData = {
      total_training_programs: new Set(trainings.map(t => t.training_programs?.id).filter(Boolean)).size,
      total_enrollments: trainings.length,
      completed_trainings: trainings.filter(t => t.status === 'completed').length,
      scheduled_trainings: trainings.filter(t => t.status === 'scheduled').length,
      in_progress_trainings: trainings.filter(t => t.status === 'in_progress').length,
      cancelled_trainings: trainings.filter(t => t.status === 'cancelled').length,
      all_trainings: allTrainings,
    };

    return { data: report, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// FETCH BENEFITS REPORT
// ============================================
export async function fetchBenefitsReport() {
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employee_number, department_id, user_id');

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name');

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email');

    const { data: benefits, error: benefitsError } = await supabase
      .from('benefits')
      .select('id, name');

    const { data: empBenefits, error: empBenefitsError } = await supabase
      .from('employee_benefits')
      .select('id, employee_id, benefit_id, coverage_amount, is_active, benefits(name)');

    if (empError || deptError || profileError || benefitsError || empBenefitsError) {
      const errorMsg = empError?.message || deptError?.message || profileError?.message || benefitsError?.message || empBenefitsError?.message;
      return { data: null, error: errorMsg };
    }

    if (!empBenefits) {
      return { data: null, error: 'No benefits data found' };
    }

    // Build detailed benefits list
    const allBenefits: BenefitDetailRecord[] = empBenefits.map(eb => {
      const emp = employees?.find(e => e.id === eb.employee_id);
      const profile = profiles?.find(p => p.user_id === emp?.user_id);
      const dept = departments?.find(d => d.id === emp?.department_id);

      return {
        employee_id: eb.employee_id,
        employee_number: emp?.employee_number || '',
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        department_name: dept?.name || 'Unassigned',
        benefit_name: eb.benefits?.name || 'Unknown',
        coverage_amount: eb.coverage_amount || 0,
        is_active: eb.is_active,
        enrollment_date: new Date().toLocaleDateString(),
      };
    });

    const report: BenefitsReportData = {
      total_benefits: benefits?.length || 0,
      total_employees_with_benefits: new Set(empBenefits.map(b => b.employee_id)).size,
      all_benefits: allBenefits,
    };

    return { data: report, error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}

// ============================================
// FETCH PAYROLL PERIODS (for period filter)
// ============================================
export async function fetchPayrollPeriods() {
  try {
    const { data, error } = await supabase
      .from('payroll_periods')
      .select('id, period_start, period_end')
      .order('period_start', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error: String(error) };
  }
}
