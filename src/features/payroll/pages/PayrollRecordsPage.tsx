import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, MoreHorizontal, CheckCircle, Eye } from 'lucide-react';
import { formatCurrencyPHP } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  fetchPayrollRecords,
  fetchPayrollRecordsByPeriod,
  createPayrollRecord,
  updatePayrollRecord,
  deletePayrollRecord,
  markPayrollAsPaid,
  PayrollRecord,
  PayrollRecordWithDetails,
  CreatePayrollRecordInput,
  UpdatePayrollRecordInput,
  fetchPayrollPeriods,
  PayrollPeriod,
} from '../services/payrollService';
import { fetchEmployees } from '@/features/employees/services/employeeService';

interface Employee {
  id: string;
  employee_number: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
}

export function PayrollRecordsPage() {
  const [records, setRecords] = useState<PayrollRecordWithDetails[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all-periods');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all-employees');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecordWithDetails | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<PayrollRecordWithDetails | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecordWithDetails | null>(null);

  // Form fields
  const [formData, setFormData] = useState<CreatePayrollRecordInput>({
    employee_id: '',
    period_id: '',
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    net_pay: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [selectedPeriod]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [recordsRes, employeesRes, periodsRes] = await Promise.all([
        fetchPayrollRecords(),
        fetchEmployees(),
        fetchPayrollPeriods(),
      ]);

      if (recordsRes.error) {
        toast.error(recordsRes.error);
      } else {
        setRecords(recordsRes.data);
      }

      if (employeesRes.error) {
        toast.error(employeesRes.error);
      } else {
        // Map employee data to include name information
        const employeesWithNames = (employeesRes.data || []).map(emp => ({
          id: emp.id,
          employee_number: emp.employee_number,
          user_id: emp.user_id,
          first_name: emp.profiles?.first_name || '',
          last_name: emp.profiles?.last_name || '',
        }));
        setEmployees(employeesWithNames);
      }

      if (periodsRes.error) {
        toast.error(periodsRes.error);
      } else {
        setPeriods(periodsRes.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    }
    setIsLoading(false);
  };

  const loadRecords = async () => {
    try {
      if (selectedPeriod !== 'all-periods') {
        const { data, error } = await fetchPayrollRecordsByPeriod(selectedPeriod);
        if (error) {
          toast.error(error);
        } else {
          setRecords(data);
        }
      } else {
        const { data, error } = await fetchPayrollRecords();
        if (error) {
          toast.error(error);
        } else {
          setRecords(data);
        }
      }
    } catch (error) {
      toast.error('Failed to load records');
    }
  };

  const filteredRecords = records.filter(record => {
    const matchSearch =
      searchQuery === '' ||
      (record.employee_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchEmployee =
      selectedEmployee === 'all-employees' || record.employee_id === selectedEmployee;
    return matchSearch && matchEmployee;
  });

  const calculateStats = () => {
    const filtered = selectedPeriod !== 'all-periods'
      ? filteredRecords.filter(r => r.period_id === selectedPeriod)
      : filteredRecords;

    return {
      total: filtered.length,
      paid: filtered.filter(r => r.is_paid).length,
      pending: filtered.filter(r => !r.is_paid).length,
      totalAmount: filtered.reduce((sum, r) => sum + (r.net_pay || 0), 0),
    };
  };

  const stats = calculateStats();

  const handleAddRecord = () => {
    setEditingRecord(null);
    setFormData({
      employee_id: '',
      period_id: '',
      basic_salary: 0,
      allowances: 0,
      deductions: 0,
      net_pay: 0,
    });
    setShowCreateForm(true);
  };

  const handleEditRecord = (record: PayrollRecordWithDetails) => {
    setEditingRecord(record);
    setFormData({
      employee_id: record.employee_id,
      period_id: record.period_id,
      basic_salary: record.basic_salary,
      allowances: record.allowances,
      deductions: record.deductions,
      net_pay: record.net_pay,
    });
    setShowCreateForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.employee_id || !formData.period_id) {
      toast.error('Please select employee and period');
      return;
    }

    // Calculate net pay before submission
    const calculatedNetPay = formData.basic_salary + (formData.allowances || 0) - (formData.deductions || 0);
    const dataToSubmit = {
      ...formData,
      net_pay: calculatedNetPay,
    };

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        const { error } = await updatePayrollRecord({
          id: editingRecord.id,
          ...dataToSubmit,
        });
        if (error) {
          toast.error(error);
        } else {
          toast.success('Payroll record updated successfully');
          await loadRecords();
          setShowCreateForm(false);
        }
      } else {
        const { error } = await createPayrollRecord(dataToSubmit);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Payroll record created successfully');
          await loadRecords();
          setShowCreateForm(false);
        }
      }
    } catch (error) {
      toast.error('Failed to save record');
    }
    setIsSubmitting(false);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsSubmitting(true);
    try {
      const { error } = await deletePayrollRecord(recordToDelete.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Payroll record deleted successfully');
        setRecords(records.filter(r => r.id !== recordToDelete.id));
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      toast.error('Failed to delete record');
    }
    setIsSubmitting(false);
  };

  const handleMarkAsPaid = async (record: PayrollRecordWithDetails) => {
    try {
      const { error } = await markPayrollAsPaid(record.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Marked as paid');
        await loadRecords();
      }
    } catch (error) {
      toast.error('Failed to update record');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Records</h1>
          <p className="text-gray-500 mt-2">Manage employee payroll records and payments</p>
        </div>
        <Button onClick={handleAddRecord} className="gap-2">
          <Plus className="w-4 h-4" />
          New Payroll Record
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyPHP(stats.totalAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by employee number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-periods">All Periods</SelectItem>
            {periods.map(period => (
              <SelectItem key={period.id} value={period.id}>
                {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-employees">All Employees</SelectItem>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.employee_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payroll records found. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employee_number}</TableCell>
                  <TableCell>
                    {record.period_start && record.period_end
                      ? `${new Date(record.period_start).toLocaleDateString()} - ${new Date(record.period_end).toLocaleDateString()}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrencyPHP(record.basic_salary, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right text-green-600">
                    +{formatCurrencyPHP(record.allowances, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrencyPHP(record.deductions, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrencyPHP(record.net_pay, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {record.is_paid ? (
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedRecord(record);
                          setShowDetailView(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!record.is_paid && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(record)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setRecordToDelete(record);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Form Dialog */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingRecord ? 'Edit Payroll Record' : 'Create Payroll Record'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Employee</label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name && emp.last_name 
                          ? `${emp.first_name} ${emp.last_name}` 
                          : emp.employee_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Period</label>
                <Select value={formData.period_id} onValueChange={(value) => setFormData({ ...formData, period_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map(period => (
                      <SelectItem key={period.id} value={period.id}>
                        {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Basic Salary</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.basic_salary}
                  onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Allowances</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.allowances}
                  onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Deductions</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div className="bg-gray-100 p-3 rounded">
                <div className="text-sm text-gray-600">Net Pay</div>
                <div className="text-2xl font-bold">
                  {formatCurrencyPHP(formData.basic_salary + formData.allowances - formData.deductions, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleSubmit();
                  }}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingRecord ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail View Modal */}
      {showDetailView && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Payroll Record Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Employee</label>
                <p className="text-lg font-medium">{selectedRecord.employee_number || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Period</label>
                <p className="text-lg font-medium">
                  {selectedRecord.period_start && selectedRecord.period_end
                    ? `${new Date(selectedRecord.period_start).toLocaleDateString()} - ${new Date(selectedRecord.period_end).toLocaleDateString()}`
                    : 'N/A'}
                </p>
              </div>

              <hr />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Basic Salary</label>
                  <p className="text-lg font-semibold">{formatCurrencyPHP(selectedRecord.basic_salary, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Allowances</label>
                  <p className="text-lg font-semibold text-green-600">+{formatCurrencyPHP(selectedRecord.allowances, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Deductions</label>
                  <p className="text-lg font-semibold text-red-600">-{formatCurrencyPHP(selectedRecord.deductions, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Net Pay</label>
                  <p className="text-lg font-bold">{formatCurrencyPHP(selectedRecord.net_pay, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <hr />

              <div>
                <label className="text-sm text-gray-600">Status</label>
                <div className="mt-2">
                  {selectedRecord.is_paid ? (
                    <Badge className="bg-green-100 text-green-800">
                      Paid on {new Date(selectedRecord.paid_at!).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailView(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleEditRecord(selectedRecord);
                    setShowDetailView(false);
                  }}
                  className="flex-1"
                >
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payroll record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecord}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




