import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, UserPlus, Loader2 } from 'lucide-react';
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

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [hiredApplicants, setHiredApplicants] = useState<HiredApplicant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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
    employee_number: '',
    employee_type: 'staff' as EmployeeType,
    department_id: '',
    position_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'full_time' as ContractType,
    salary: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch employees
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('*, departments(name), positions(title)')
      .order('employee_number');

    if (empError) {
      toast.error('Failed to fetch employees');
    }

    // Fetch user profiles for employees
    const userIds = (empData || []).map(e => e.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email')
      .in('user_id', userIds.length ? userIds : ['none']);

    const employeesWithProfiles = (empData || []).map(emp => ({
      ...emp,
      profiles: profiles?.find(p => p.user_id === emp.user_id),
    }));

    setEmployees(employeesWithProfiles);

    // Fetch departments
    const { data: deptData } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setDepartments(deptData || []);

    // Fetch positions
    const { data: posData } = await supabase
      .from('positions')
      .select('id, title, department_id')
      .eq('is_active', true)
      .order('title');
    setPositions(posData || []);

    // Fetch hired applicants not yet converted to employees
    const { data: existingEmployeeUserIds } = await supabase
      .from('employees')
      .select('user_id');

    const existingIds = (existingEmployeeUserIds || []).map(e => e.user_id);

    // Get hired applications with full job posting details
    const { data: hiredApps } = await supabase
      .from('job_applications')
      .select(`
        applicant_id,
        job_postings (
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

      // Filter out those already employees
      const notYetEmployees = (applicantsData || []).filter(
        a => !existingIds.includes(a.user_id)
      );

      // Get profiles
      const applicantUserIds = notYetEmployees.map(a => a.user_id);
      const { data: appProfiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', applicantUserIds.length ? applicantUserIds : ['none']);

      const hiredWithDetails = notYetEmployees.map(app => {
        const appHired = hiredApps?.find(h => h.applicant_id === app.id);
        return {
          ...app,
          profiles: appProfiles?.find(p => p.user_id === app.user_id),
          job_applications: appHired ? [{ job_postings: appHired.job_postings }] : [],
        };
      });

      setHiredApplicants(hiredWithDetails);
    } else {
      setHiredApplicants([]);
    }

    setIsLoading(false);
  };

  const generateEmployeeNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EMP-${year}-${random}`;
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
      employee_type: detectedType,
      department_id: position?.department_id || prev.department_id,
      position_id: position?.id || prev.position_id,
      salary: avgSalary,
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

    // Create employee record
    const { data: newEmployee, error: empError } = await supabase
      .from('employees')
      .insert({
        user_id: applicant.user_id,
        employee_number: generateEmployeeNumber(),
        employee_type: formData.employee_type,
        department_id: position?.department_id || formData.department_id || null,
        position_id: position?.id || formData.position_id || null,
        hire_date: formData.hire_date,
        employment_status: 'probation',
      })
      .select()
      .single();

    if (empError) {
      toast.error('Failed to create employee record');
      setIsSubmitting(false);
      return;
    }

    // Create initial contract
    if (formData.salary) {
      await supabase.from('employment_contracts').insert({
        employee_id: newEmployee.id,
        contract_type: formData.contract_type,
        start_date: formData.hire_date,
        salary: parseFloat(formData.salary),
        is_current: true,
      });
    }

    // Migrate applicant documents to employee documents
    const { data: applicantDocs, error: docsFetchError } = await supabase
      .from('applicant_documents')
      .select('*')
      .eq('applicant_id', applicant.id);

    if (!docsFetchError && applicantDocs && applicantDocs.length > 0) {
      const employeeDocuments = applicantDocs.map((doc: any) => ({
        employee_id: newEmployee.id,
        document_name: doc.document_name,
        document_url: doc.document_url,
        document_type: doc.document_type,
        uploaded_by: applicant.user_id,
      }));

      const { error: insertDocsError } = await supabase
        .from('employee_documents')
        .insert(employeeDocuments);

      if (insertDocsError) {
        console.error('Failed to migrate documents:', insertDocsError);
        toast.error('Employee created but some documents failed to migrate');
      }
    }

    // Update user role to employee
    // First check if they already have a role, then update or insert
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', applicant.user_id)
      .single();

    if (existingRole) {
      // Update existing role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'employee' })
        .eq('user_id', applicant.user_id);
      
      if (roleError) {
        console.error('Failed to update role:', roleError);
        toast.error('Employee created but role update failed. Please update role manually.');
      }
    } else {
      // Insert new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: applicant.user_id, role: 'employee' });
      
      if (roleError) {
        console.error('Failed to insert role:', roleError);
        toast.error('Employee created but role assignment failed. Please assign role manually.');
      }
    }

    toast.success('Applicant converted to employee successfully!');
    setIsConvertOpen(false);
    setSelectedApplicant('');
    resetForm();
    fetchData();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      employee_number: '',
      employee_type: 'staff',
      department_id: '',
      position_id: '',
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: 'full_time',
      salary: '',
    });
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

      toast.success('Employee updated successfully!');
      setIsViewOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error updating employee');
    }
    setIsSubmitting(false);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.employee_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.profiles?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.profiles?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Employees</h1>
          <p>Manage employee records</p>
        </div>
        <div className="flex gap-2">
          {hiredApplicants.length > 0 && (
            <Button variant="outline" onClick={() => setIsConvertOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Convert Hired ({hiredApplicants.length})
            </Button>
          )}
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
                <p className="text-sm text-muted-foreground">
                  To add a new employee, first have them register as an applicant, apply for a position, and then hire them through the recruitment process.
                </p>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Understood
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading employees...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
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
