import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  dispatchEmployeeProfileToConnectedDepartments,
  dispatchEmployeeProfileToDepartment,
  fetchIntegrationReadyEmployees,
  type IntegrationConnectedSystem,
  type IntegrationReadyEmployee,
} from '@/features/integration/services/departmentIntegrationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, UserPlus, Loader2, Send, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { EMPLOYMENT_STATUS_LABELS, EMPLOYEE_TYPE_LABELS, EmploymentStatus, EmployeeType, ContractType, CONTRACT_TYPE_LABELS } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Employee {
  id: string;
  employee_number: string;
  employee_type: EmployeeType;
  employment_status: EmploymentStatus;
  hire_date: string;
  user_id: string;
  departments?: { name: string } | null;
  positions?: { title: string } | null;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
  department_id: string | null;
}

interface HiredApplicant {
  id: string;
  user_id: string;
  manual_name?: string | null;
  display_name?: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  job_applications?: {
    job_postings?: {
      id: string;
      positions?: {
        id: string;
        title: string;
        department_id: string | null;
      } | null;
      salary_range_min: number | null;
      salary_range_max: number | null;
    } | null;
  }[];
}

function getIntegrationBadgeClass(employee: IntegrationReadyEmployee | null | undefined) {
  if (!employee) {
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  switch (employee.integration_status) {
    case 'synced':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending_sync':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'error':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'paused':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-sky-100 text-sky-700 border-sky-200';
  }
}

function getIntegrationLabel(employee: IntegrationReadyEmployee | null | undefined) {
  if (!employee) {
    return 'Not mapped';
  }

  return employee.integration_status.replace(/_/g, ' ');
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Date(value).toLocaleString();
}

export function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [hiredApplicants, setHiredApplicants] = useState<HiredApplicant[]>([]);
  const [integrationDirectory, setIntegrationDirectory] = useState<Record<string, IntegrationReadyEmployee>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isIntegrationLoading, setIsIntegrationLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingEmployeeId, setSyncingEmployeeId] = useState<string | null>(null);
  const [syncingTargetKey, setSyncingTargetKey] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<string>('');
  const [selectedAcceptedApplicantId, setSelectedAcceptedApplicantId] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [nextEmployeeNumber, setNextEmployeeNumber] = useState('EMP-0001');

  // Pagination state
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    employee_type: 'staff' as EmployeeType,
    employment_status: 'active' as EmploymentStatus,
    department_id: '',
    position_id: '',
    hire_date: '',
  });

  const [formData, setFormData] = useState({
    user_id: '',
    employee_number: '',
    employee_type: 'staff' as EmployeeType,
    department_id: '',
    position_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'full_time' as ContractType,
    salary: '',
  });

  const loadIntegrationDirectory = useCallback(async () => {
    setIsIntegrationLoading(true);

    const { data, error } = await fetchIntegrationReadyEmployees({ includeInactive: true });

    if (error) {
      toast.error(error);
      setIntegrationDirectory({});
      setIsIntegrationLoading(false);
      return;
    }

    setIntegrationDirectory(
      data.reduce<Record<string, IntegrationReadyEmployee>>((accumulator, employee) => {
        accumulator[employee.employee_id] = employee;
        return accumulator;
      }, {})
    );
    setIsIntegrationLoading(false);
  }, []);

  const syncEmployeeEverywhere = async (
    employeeId: string,
    reason: 'employee_created' | 'employee_updated'
  ) => {
    setSyncingEmployeeId(employeeId);

    const { data, error } = await dispatchEmployeeProfileToConnectedDepartments({
      employeeId,
      requestedBy: user?.id,
      metadata: {
        initiated_from: 'employees_page',
        sync_reason: reason,
        requested_by_email: user?.email ?? null,
      },
    });

    setSyncingEmployeeId(null);
    return { data, error };
  };

  const syncEmployeeToTarget = async (
    employeeId: string,
    system: IntegrationConnectedSystem
  ) => {
    const targetKey = `${employeeId}:${system.department_key}`;
    setSyncingTargetKey(targetKey);

    const { data, error } = await dispatchEmployeeProfileToDepartment({
      employeeId,
      targetDepartmentKey: system.department_key,
      eventCode: system.default_event_code,
      requestedBy: user?.id,
      metadata: {
        initiated_from: 'employees_page',
        sync_reason: 'manual_target_dispatch',
        target_department_name: system.department_name,
        requested_by_email: user?.email ?? null,
      },
    });

    setSyncingTargetKey(null);
    return { data, error };
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // --- Server-side search: find matching user_ids from profiles if searching ---
    let matchingUserIds: string[] | null = null;
    if (searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      const { data: matchedProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .or(`first_name.ilike.${term},last_name.ilike.${term}`);
      matchingUserIds = (matchedProfiles || []).map(p => p.user_id);
    }

    // --- Fetch paginated employees with server-side filtering ---
    let empQuery = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .order('employee_number');

    if (searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      if (matchingUserIds && matchingUserIds.length > 0) {
        // Match by employee_number OR by user_id from name search
        empQuery = empQuery.or(
          `employee_number.ilike.${term},user_id.in.(${matchingUserIds.join(',')})`
        );
      } else {
        // Only match by employee_number (no profile matches)
        empQuery = empQuery.ilike('employee_number', term);
      }
    }

    empQuery = empQuery.range(from, to);

    const { data: empData, error: empError, count: empCount } = await empQuery;

    if (empError) {
      toast.error('Failed to fetch employees');
      setIsLoading(false);
      return;
    }

    setTotalCount(empCount ?? 0);

    // Get next unique employee number from existing records.
    const { data: employeeNumbers } = await supabase
      .from('employees')
      .select('employee_number');
    const maxNumeric = (employeeNumbers || []).reduce((max, row) => {
      const match = row.employee_number?.match(/(\d+)(?!.*\d)/);
      const numeric = match ? Number(match[1]) : 0;
      return Number.isFinite(numeric) && numeric > max ? numeric : max;
    }, 0);
    setNextEmployeeNumber(`EMP-${String(maxNumeric + 1).padStart(4, '0')}`);

    // Fetch departments, positions, and profiles for THIS page of employees only
    const pageUserIds = (empData || []).map(e => e.user_id).filter(id => id && id.length > 0);
    const [
      { data: allDepts },
      { data: allPos },
      { data: profiles }
    ] = await Promise.all([
      supabase.from('departments').select('id, name'),
      supabase.from('positions').select('id, title'),
      supabase.from('profiles').select('user_id, first_name, last_name, email')
        .in('user_id', pageUserIds.length ? pageUserIds : ['00000000-0000-0000-0000-000000000000'])
    ]);

    // Get ALL employee user_ids to filter candidates (lightweight query)
    const { data: allEmployeeUserIds } = await supabase
      .from('employees')
      .select('user_id');

    const existingEmployeeUserIdSet = new Set(
      (allEmployeeUserIds || []).map(e => e.user_id)
    );
    const employeesWithProfiles = (empData || []).map(emp => ({
      ...emp,
      departments: allDepts?.find(d => d.id === emp.department_id),
      positions: allPos?.find(p => p.id === emp.position_id),
      profiles: profiles?.find(p => p.user_id === emp.user_id),
    }));

    setEmployees(employeesWithProfiles);

    // Fetch departments for select dropdowns
    const { data: deptData } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setDepartments(deptData || []);

    // Fetch positions for select dropdowns
    const { data: posData } = await supabase
      .from('positions')
      .select('id, title, department_id')
      .eq('is_active', true)
      .order('title');
    setPositions(posData || []);

    // Fetch hired applicants not yet converted to employees
    const existingIds = Array.from(existingEmployeeUserIdSet);

    // Get hired applications with full job posting details
    const { data: hiredApps } = await supabase
      .from('job_applications')
      .select(`
        id,
        applicant_id,
        notes,
        job_postings (
          title,
          id,
          positions (id, title, department_id),
          salary_range_min,
          salary_range_max
        )
      `)
      .eq('status', 'hired');

    const hiredApplicantIds = (hiredApps || []).map(a => a.applicant_id);

    if (hiredApplicantIds.length > 0) {
      const { data: applicantsData } = await supabase
        .from('applicants')
        .select('id, user_id')
        .in('id', hiredApplicantIds);

      // Get profiles
      const applicantUserIds = (applicantsData || []).map(a => a.user_id);
      const { data: appProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', applicantUserIds.length ? applicantUserIds : ['00000000-0000-0000-0000-000000000000']);

      const hiredWithDetails = (applicantsData || []).map(app => {
        const appHired = hiredApps?.find(h => h.applicant_id === app.id);
        const manualName =
          typeof appHired?.notes === 'string' && appHired.notes.startsWith('HR_MANUAL_APPLICANT:')
            ? appHired.notes.replace('HR_MANUAL_APPLICANT:', '').trim()
            : null;
        const profileName = appProfiles?.find(p => p.user_id === app.user_id)
          ? `${appProfiles?.find(p => p.user_id === app.user_id)?.first_name || ''} ${appProfiles?.find(p => p.user_id === app.user_id)?.last_name || ''}`.trim()
          : null;
        return {
          ...app,
          manual_name: manualName,
          display_name: manualName || profileName || 'Accepted Applicant',
          profiles: appProfiles?.find(p => p.user_id === app.user_id),
          job_applications: appHired ? [{ job_postings: appHired.job_postings }] : [],
        };
      });

      // Only show accepted applicants that are not yet employees.
      const availableAcceptedApplicants = hiredWithDetails.filter(
        (applicant) => !existingIds.includes(applicant.user_id)
      );
      setHiredApplicants(availableAcceptedApplicants);
    } else {
      setHiredApplicants([]);
    }

    await loadIntegrationDirectory();
    setIsLoading(false);
  }, [loadIntegrationDirectory, page, searchQuery]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Debounced search handler to reset page and trigger fetch
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  const getEmployeeTypeFromPosition = (positionTitle?: string): EmployeeType => {
    if (!positionTitle) return 'staff';
    
    const lowerTitle = positionTitle.toLowerCase();
    
    if (lowerTitle.includes('teacher') || lowerTitle.includes('instructor') || lowerTitle.includes('professor')) {
      return 'teacher';
    }
    if (lowerTitle.includes('admin') || lowerTitle.includes('administrative')) {
      return 'admin';
    }
    
    return 'staff';
  };

  const handleApplicantSelect = (applicantId: string) => {
    setSelectedApplicant(applicantId);
    
    // Find the selected applicant and auto-fill data from their job posting
    const applicant = hiredApplicants.find(a => a.id === applicantId);
    if (!applicant) return;

    const position = applicant.job_applications?.[0]?.job_postings?.positions;
    const jobPosting = applicant.job_applications?.[0]?.job_postings;

    // Auto-detect employee type from position title
    const detectedType = getEmployeeTypeFromPosition(position?.title);
    
    // Calculate average salary from range (or use midpoint)
    let avgSalary = '';
    if (jobPosting?.salary_range_min && jobPosting?.salary_range_max) {
      const avg = Math.round((jobPosting.salary_range_min + jobPosting.salary_range_max) / 2);
      avgSalary = avg.toString();
    } else if (jobPosting?.salary_range_min) {
      avgSalary = jobPosting.salary_range_min.toString();
    } else if (jobPosting?.salary_range_max) {
      avgSalary = jobPosting.salary_range_max.toString();
    }

    // Update form with auto-filled data
    setFormData(prev => ({
      ...prev,
      user_id: applicant.user_id,
      employee_type: detectedType,
      department_id: position?.department_id || prev.department_id,
      position_id: position?.id || prev.position_id,
      salary: avgSalary,
    }));
  };

  const acceptedApplicantByUserId = useMemo(() => {
    const map = new Map<string, HiredApplicant>();
    hiredApplicants.forEach((applicant) => {
      if (applicant.user_id) {
        map.set(applicant.user_id, applicant);
      }
    });
    return map;
  }, [hiredApplicants]);

  const handleUserAccountSelect = (applicantId: string) => {
    setSelectedAcceptedApplicantId(applicantId);
    const hiredApplicant = hiredApplicants.find((entry) => entry.id === applicantId);
    if (!hiredApplicant) return;
    const userId = hiredApplicant.user_id;

    const position = hiredApplicant.job_applications?.[0]?.job_postings?.positions;
    const jobPosting = hiredApplicant.job_applications?.[0]?.job_postings;
    const detectedType = getEmployeeTypeFromPosition(position?.title);

    let avgSalary = '';
    if (jobPosting?.salary_range_min && jobPosting?.salary_range_max) {
      avgSalary = Math.round((jobPosting.salary_range_min + jobPosting.salary_range_max) / 2).toString();
    } else if (jobPosting?.salary_range_min) {
      avgSalary = jobPosting.salary_range_min.toString();
    } else if (jobPosting?.salary_range_max) {
      avgSalary = jobPosting.salary_range_max.toString();
    }

    setFormData((prev) => ({
      ...prev,
      user_id: userId,
      employee_type: detectedType,
      department_id: position?.department_id || prev.department_id,
      position_id: position?.id || prev.position_id,
      salary: avgSalary || prev.salary,
    }));
  };

  const handleConvertApplicant = async () => {
    if (!selectedApplicant) {
      toast.error('Please select an applicant');
      return;
    }

    const applicant = hiredApplicants.find(a => a.id === selectedApplicant);
    if (!applicant) return;

    const position = applicant.job_applications?.[0]?.job_postings?.positions;

    setIsSubmitting(true);

    const { data: conversionData, error: conversionError } = await supabase.rpc(
      'convert_hired_applicant_to_employee',
      {
        _applicant_id: applicant.id,
        _applicant_user_id: applicant.user_id,
        _employee_type: formData.employee_type,
        _department_id: (position?.department_id || formData.department_id || null) as string | null,
        _position_id: (position?.id || formData.position_id || null) as string | null,
        _hire_date: formData.hire_date,
        _contract_type: formData.contract_type,
        _salary: formData.salary ? parseFloat(formData.salary) : null,
      }
    );

    const conversionResult = (conversionData ?? null) as {
      ok?: boolean;
      employee_id?: string;
      message?: string;
    } | null;

    if (conversionError || !conversionResult?.ok || !conversionResult.employee_id) {
      toast.error(
        conversionError?.message ||
          conversionResult?.message ||
          'Failed to create employee record'
      );
      setIsSubmitting(false);
      return;
    }

    const syncResult = await syncEmployeeEverywhere(conversionResult.employee_id, 'employee_created');

    toast.success('Applicant converted to employee successfully!');

    if (syncResult.error) {
      toast.error(`Employee created, but department sync failed: ${syncResult.error}`);
    } else if (syncResult.data) {
      if (syncResult.data.ok || syncResult.data.partial_success) {
        toast.success('Department sync queued', {
          description: `${syncResult.data.dispatched_target_count ?? 0} connected department${(syncResult.data.dispatched_target_count ?? 0) === 1 ? '' : 's'} notified.`,
        });
      } else if (syncResult.data.message) {
        toast.error(syncResult.data.message);
      }
    }

    setIsConvertOpen(false);
    setSelectedApplicant('');
    resetForm();
    await fetchData();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setSelectedAcceptedApplicantId('');
    setFormData({
      user_id: '',
      employee_number: nextEmployeeNumber,
      employee_type: 'staff',
      department_id: '',
      position_id: '',
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: 'full_time',
      salary: '',
    });
  };

  useEffect(() => {
    if (!isCreateOpen) return;
    setFormData((prev) => ({
      ...prev,
      employee_number: prev.employee_number || nextEmployeeNumber,
    }));
  }, [isCreateOpen, nextEmployeeNumber]);

  useEffect(() => {
    if (!isCreateOpen) return;
    void fetchData();
  }, [isCreateOpen, fetchData]);

  const handleCreateEmployee = async () => {
    if (!formData.user_id || !formData.employee_number.trim()) {
      toast.error('User and employee number are required.');
      return;
    }

    setIsSubmitting(true);
    // Safety check: prevent duplicate employee per accepted applicant/user.
    const { data: existingEmployee, error: existingEmployeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', formData.user_id)
      .maybeSingle();

    if (existingEmployeeError) {
      toast.error(`Failed to validate employee before save: ${existingEmployeeError.message}`);
      setIsSubmitting(false);
      return;
    }

    if (existingEmployee?.id) {
      toast.error('This accepted applicant is already in Employee List.');
      setIsSubmitting(false);
      await fetchData();
      return;
    }

    const { data: created, error } = await supabase
      .from('employees')
      .insert([
        {
          user_id: formData.user_id,
          employee_number: formData.employee_number.trim(),
          employee_type: formData.employee_type,
          department_id: formData.department_id || null,
          position_id: formData.position_id || null,
          hire_date: formData.hire_date,
          employment_status: 'active',
        },
      ])
      .select('id')
      .single();

    if (error) {
      toast.error(`Failed to add employee: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    const employeeId = (created as { id?: string } | null)?.id;
    toast.success('Employee added successfully.');

    if (employeeId) {
      const syncResult = await syncEmployeeEverywhere(employeeId, 'employee_created');
      if (syncResult.error) {
        toast.error(`Employee created, but sync failed: ${syncResult.error}`);
      }
    }

    setIsCreateOpen(false);
    await fetchData();
    resetForm();
    setIsSubmitting(false);
  };

  const openViewDialog = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditFormData({
      first_name: emp.profiles?.first_name || '',
      last_name: emp.profiles?.last_name || '',
      employee_type: emp.employee_type,
      employment_status: emp.employment_status,
      department_id: emp.departments?.name ? departments.find(d => d.name === emp.departments?.name)?.id || '' : '',
      position_id: emp.positions?.title ? positions.find(p => p.title === emp.positions?.title)?.id || '' : '',
      hire_date: emp.hire_date,
    });
    setIsViewOpen(true);
  };

  const handleManualSyncEmployee = async () => {
    if (!selectedEmployee) {
      return;
    }

    const syncResult = await syncEmployeeEverywhere(selectedEmployee.id, 'employee_updated');

    if (syncResult.error) {
      toast.error(syncResult.error);
      return;
    }

    if (!syncResult.data) {
      toast.error('Employee sync did not return a response.');
      return;
    }

    if (syncResult.data.ok || syncResult.data.partial_success) {
      toast.success(syncResult.data.message ?? 'Employee sync queued successfully.', {
        description: `${syncResult.data.dispatched_target_count ?? 0} connected department${(syncResult.data.dispatched_target_count ?? 0) === 1 ? '' : 's'} notified.`,
      });
    } else {
      toast.error(syncResult.data.message ?? 'Failed to queue employee sync.');
    }

    await fetchData();
  };

  const handleManualTargetSync = async (system: IntegrationConnectedSystem) => {
    if (!selectedEmployee) {
      return;
    }

    const syncResult = await syncEmployeeToTarget(selectedEmployee.id, system);

    if (syncResult.error) {
      toast.error(syncResult.error);
      return;
    }

    if (!syncResult.data?.ok) {
      toast.error(syncResult.data?.message ?? `Failed to sync to ${system.department_name}.`);
      return;
    }

    toast.success(`${system.department_name} sync queued`, {
      description: `${syncResult.data.event_code ?? system.default_event_code} routed successfully.`,
    });

    await fetchData();
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      // Update employee record
      const { error: empError } = await supabase
        .from('employees')
        .update({
          employee_type: editFormData.employee_type,
          employment_status: editFormData.employment_status,
          department_id: editFormData.department_id || null,
          position_id: editFormData.position_id || null,
          hire_date: editFormData.hire_date,
        })
        .eq('id', selectedEmployee.id);

      if (empError) {
        toast.error('Failed to update employee: ' + empError.message);
        setIsSubmitting(false);
        return;
      }

      // Update profile record (name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
        })
        .eq('user_id', selectedEmployee.user_id);

      if (profileError) {
        toast.error('Failed to update name: ' + profileError.message);
        setIsSubmitting(false);
        return;
      }

      const syncResult = await syncEmployeeEverywhere(selectedEmployee.id, 'employee_updated');

      toast.success('Employee updated successfully!');

      if (syncResult.error) {
        toast.error(`Employee updated, but department sync failed: ${syncResult.error}`);
      } else if (syncResult.data) {
        if (syncResult.data.ok || syncResult.data.partial_success) {
          toast.success('Department sync queued', {
            description: `${syncResult.data.dispatched_target_count ?? 0} connected department${(syncResult.data.dispatched_target_count ?? 0) === 1 ? '' : 's'} notified.`,
          });
        } else if (syncResult.data.message) {
          toast.error(syncResult.data.message);
        }
      }

      setIsViewOpen(false);
      await fetchData();
    } catch (error) {
      toast.error('Error updating employee');
    }
    setIsSubmitting(false);
  };

  // Filtering is now done server-side via the paginated query
  const filteredEmployees = employees;

  const getStatusColor = (status: EmploymentStatus) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'probation': return 'status-pending';
      case 'on_leave': return 'status-interview';
      case 'terminated': return 'status-rejected';
      default: return 'bg-muted';
    }
  };

  const filteredPositions = formData.department_id
    ? positions.filter(p => p.department_id === formData.department_id)
    : positions;
  const selectedEmployeeIntegration = selectedEmployee ? integrationDirectory[selectedEmployee.id] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Employees</h1>
          <p>Manage employee records</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-gradient">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Accepted List</Label>
                  <Select
                    value={selectedAcceptedApplicantId}
                    onValueChange={handleUserAccountSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select accepted applicant" />
                    </SelectTrigger>
                    <SelectContent>
                      {hiredApplicants.length > 0 ? (
                        hiredApplicants.map((applicant) => (
                          <SelectItem key={applicant.id} value={applicant.id}>
                            {applicant.display_name || 'Accepted Applicant'}
                            {applicant.job_applications?.[0]?.job_postings?.title
                              ? ` - ${applicant.job_applications[0].job_postings.title}`
                              : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__no_accepted__" disabled>
                          No accepted applicants available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Employee Number</Label>
                  <Input
                    value={formData.employee_number}
                    onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                    placeholder="e.g., EMP-2026-001"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee Type</Label>
                    <Select
                      value={formData.employee_type}
                      onValueChange={(v) => setFormData({ ...formData, employee_type: v as EmployeeType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMPLOYEE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hire Date</Label>
                    <Input
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={formData.department_id}
                      onValueChange={(v) => setFormData({ ...formData, department_id: v, position_id: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={formData.position_id}
                      onValueChange={(v) => setFormData({ ...formData, position_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPositions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleCreateEmployee}
                  disabled={isSubmitting || hiredApplicants.length === 0 || !formData.user_id}
                  className="w-full btn-primary-gradient"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Employee...
                    </>
                  ) : (
                    'Create Employee'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee #</th>
              <th>Name</th>
              <th>Position</th>
              <th>Department</th>
              <th>Type</th>
              <th>Status</th>
              <th>Integration</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading employees...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  No employees found
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td className="font-mono">{emp.employee_number}</td>
                  <td className="font-medium">
                    {emp.profiles?.first_name} {emp.profiles?.last_name}
                  </td>
                  <td>{emp.positions?.title || '-'}</td>
                  <td>{emp.departments?.name || '-'}</td>
                  <td>{EMPLOYEE_TYPE_LABELS[emp.employee_type]}</td>
                  <td>
                    <Badge className={getStatusColor(emp.employment_status)}>
                      {EMPLOYMENT_STATUS_LABELS[emp.employment_status]}
                    </Badge>
                  </td>
                  <td>
                    <Badge className={getIntegrationBadgeClass(integrationDirectory[emp.id])}>
                      {getIntegrationLabel(integrationDirectory[emp.id])}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openViewDialog(emp)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || isLoading}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Convert Hired Applicant Dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convert Hired Applicant to Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Hired Applicant</Label>
              <Select value={selectedApplicant} onValueChange={handleApplicantSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an applicant" />
                </SelectTrigger>
                <SelectContent>
                  {hiredApplicants.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.profiles?.first_name} {app.profiles?.last_name} - {app.profiles?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Type</Label>
                <Select
                  value={formData.employee_type}
                  onValueChange={(v) => setFormData({ ...formData, employee_type: v as EmployeeType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMPLOYEE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hire Date</Label>
                <Input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(v) => setFormData({ ...formData, department_id: v, position_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={formData.position_id}
                  onValueChange={(v) => setFormData({ ...formData, position_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPositions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(v) => setFormData({ ...formData, contract_type: v as ContractType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Salary (PHP)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 35000"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={handleConvertApplicant}
              disabled={!selectedApplicant || isSubmitting}
              className="w-full btn-primary-gradient"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Employee...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convert to Employee
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Employee Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details - {selectedEmployee?.profiles?.first_name} {selectedEmployee?.profiles?.last_name}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee Number</p>
                    <p className="font-mono font-semibold">{selectedEmployee.employee_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedEmployee.profiles?.first_name} {selectedEmployee.profiles?.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedEmployee.profiles?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hire Date</p>
                    <p className="font-medium">{new Date(selectedEmployee.hire_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <Badge className={getStatusColor(selectedEmployee.employment_status)}>
                      {EMPLOYMENT_STATUS_LABELS[selectedEmployee.employment_status]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">Department Integration</h3>
                      <Badge className={getIntegrationBadgeClass(selectedEmployeeIntegration)}>
                        {isIntegrationLoading ? 'Loading...' : getIntegrationLabel(selectedEmployeeIntegration)}
                      </Badge>
                    </div>

                    {selectedEmployeeIntegration ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          Connected systems: {selectedEmployeeIntegration.connected_system_count}
                        </p>
                        <p>
                          Last dispatched: {formatTimestamp(selectedEmployeeIntegration.last_dispatched_at)}
                        </p>
                        <p>
                          Last synced: {formatTimestamp(selectedEmployeeIntegration.last_synced_at)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This employee is not yet integration-ready. Department mapping or connected targets may still be missing.
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleManualSyncEmployee()}
                    disabled={
                      !selectedEmployeeIntegration ||
                      selectedEmployeeIntegration.connected_system_count === 0 ||
                      syncingEmployeeId === selectedEmployee.id
                    }
                  >
                    {syncingEmployeeId === selectedEmployee.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Sync Connected Departments
                  </Button>
                </div>

                {selectedEmployeeIntegration && selectedEmployeeIntegration.connected_systems.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployeeIntegration.connected_systems.map((system) => {
                      const targetKey = `${selectedEmployee.id}:${system.department_key}`;

                      return (
                        <div
                          key={system.department_key}
                          className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{system.department_name}</p>
                              {system.is_primary ? <Badge variant="outline">Primary</Badge> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Default event: {system.default_event_code}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {system.available_routes.map((route) => route.event_code).join(', ')}
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void handleManualTargetSync(system)}
                            disabled={syncingTargetKey === targetKey}
                          >
                            {syncingTargetKey === targetKey ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-4 w-4" />
                            )}
                            Send to {system.department_name}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Edit Fields */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Update Employee Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employment Status</Label>
                    <Select
                      value={editFormData.employment_status}
                      onValueChange={(v) => setEditFormData({ ...editFormData, employment_status: v as EmploymentStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Type</Label>
                    <Select
                      value={editFormData.employee_type}
                      onValueChange={(v) => setEditFormData({ ...editFormData, employee_type: v as EmployeeType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EMPLOYEE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={editFormData.department_id}
                      onValueChange={(v) => setEditFormData({ ...editFormData, department_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={editFormData.position_id}
                      onValueChange={(v) => setEditFormData({ ...editFormData, position_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <Input
                    type="date"
                    value={editFormData.hire_date}
                    onChange={(e) => setEditFormData({ ...editFormData, hire_date: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateEmployee}
                    disabled={isSubmitting}
                    className="btn-primary-gradient"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
