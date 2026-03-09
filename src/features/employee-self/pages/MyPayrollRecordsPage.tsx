import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { PesoSign } from '@/components/icons/PesoSign';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface PayrollRecord {
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
  payroll_periods?: {
    id: string;
    period_start: string;
    period_end: string;
    pay_date: string;
    is_processed: boolean;
  } | null;
}

// Helper function to format currency in Philippine Peso
const formatPeso = (amount: number) => {
  return `â‚±${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export function MyPayrollRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyPayrollRecords();
    }
  }, [user]);

  const fetchMyPayrollRecords = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // First, get the employee ID for the current user
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        setError('Failed to load your employee information');
        toast.error('Failed to load your employee information');
        return;
      }

      if (!employeeData) {
        setError('Employee record not found');
        toast.error('Employee record not found');
        setRecords([]);
        return;
      }

      // Now fetch payroll records for this employee
      const { data, error: payrollError } = await supabase
        .from('payroll_records')
        .select('*, payroll_periods(*)')
        .eq('employee_id', employeeData.id)
        .order('created_at', { ascending: false });

      if (payrollError) {
        console.error('Error fetching payroll records:', payrollError);
        setError('Failed to load your payroll records');
        toast.error('Failed to load your payroll records');
      } else {
        setRecords(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const paidRecords = records.filter(r => r.is_paid);
  const pendingRecords = records.filter(r => !r.is_paid);
  const totalNetPay = records.reduce((sum, r) => sum + r.net_pay, 0);
  const totalEarned = records.reduce((sum, r) => sum + (r.basic_salary + r.allowances), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>My Payroll Records</h1>
        <p>View your salary statements and payment history</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Error Loading Records</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : records.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <PesoSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No payroll records found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your payroll records will appear here once they are processed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-elevated p-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                Total Net Pay
              </p>
              <p className="text-3xl font-bold text-green-600">
                {formatPeso(totalNetPay)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{records.length} records</p>
            </div>

            <div className="card-elevated p-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                Total Earned
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {formatPeso(totalEarned)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Salary + Allowances</p>
            </div>

            <div className="card-elevated p-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                Paid Records
              </p>
              <p className="text-3xl font-bold text-purple-600">{paidRecords.length}</p>
              <p className="text-xs text-muted-foreground mt-2">{pendingRecords.length} pending</p>
            </div>
          </div>

          {/* Paid Records */}
          {paidRecords.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Paid ({paidRecords.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Pay Date</th>
                      <th className="text-right">Basic Salary</th>
                      <th className="text-right">Allowances</th>
                      <th className="text-right">Deductions</th>
                      <th className="text-right">Net Pay</th>
                      <th className="w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidRecords.map((record) => (
                      <PayrollTableRow key={record.id} record={record} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Records */}
          {pendingRecords.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending ({pendingRecords.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Pay Date</th>
                      <th className="text-right">Basic Salary</th>
                      <th className="text-right">Allowances</th>
                      <th className="text-right">Deductions</th>
                      <th className="text-right">Net Pay</th>
                      <th className="w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRecords.map((record) => (
                      <PayrollTableRow key={record.id} record={record} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PayrollTableRowProps {
  record: PayrollRecord;
}

function PayrollTableRow({ record }: PayrollTableRowProps) {
  const period = record.payroll_periods;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <tr className="cursor-pointer hover:bg-muted/50 transition-colors">
          <td className="font-medium">
            {period ? `${new Date(period.period_start).toLocaleDateString()} - ${new Date(period.period_end).toLocaleDateString()}` : 'N/A'}
          </td>
          <td>
            {period ? new Date(period.pay_date).toLocaleDateString() : 'N/A'}
          </td>
          <td className="text-right font-medium">
            {formatPeso(record.basic_salary)}
          </td>
          <td className="text-right text-green-600 font-medium">
            {formatPeso(record.allowances)}
          </td>
          <td className="text-right text-red-600 font-medium">
            {formatPeso(record.deductions)}
          </td>
          <td className="text-right font-bold text-lg">
            {formatPeso(record.net_pay)}
          </td>
          <td>
            {record.is_paid ? (
              <Badge className="bg-green-100 text-green-700 border-green-300">Paid</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-amber-300">Pending</Badge>
            )}
          </td>
        </tr>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Payroll Statement -{' '}
            {record.payroll_periods
              ? `${new Date(record.payroll_periods.period_start).toLocaleDateString()} to ${new Date(record.payroll_periods.period_end).toLocaleDateString()}`
              : 'Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Information */}
          <div className="bg-muted/50 rounded p-4 space-y-2">
            <h3 className="font-semibold">Period Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Period Start</p>
                <p className="font-medium">
                  {record.payroll_periods ? new Date(record.payroll_periods.period_start).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Period End</p>
                <p className="font-medium">
                  {record.payroll_periods ? new Date(record.payroll_periods.period_end).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pay Date</p>
                <p className="font-medium">
                  {record.payroll_periods ? new Date(record.payroll_periods.pay_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">
                  {record.is_paid ? (
                    <span className="text-green-600">Paid {record.paid_at ? `on ${new Date(record.paid_at).toLocaleDateString()}` : ''}</span>
                  ) : (
                    <span className="text-amber-600">Pending</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Earnings */}
          <div className="space-y-3">
            <h3 className="font-semibold">Earnings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-muted/30 rounded">
                <span>Basic Salary</span>
                <span className="font-medium">
                  {formatPeso(record.basic_salary)}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
                <span className="text-green-700">Allowances</span>
                <span className="font-medium text-green-700">
                  +{formatPeso(record.allowances)}
                </span>
              </div>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between p-2 font-semibold">
                <span>Gross Pay</span>
                <span>
                  {formatPeso(record.basic_salary + record.allowances)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div className="space-y-3">
            <h3 className="font-semibold">Deductions</h3>
            <div className="flex justify-between p-2 bg-red-50 rounded border border-red-200">
              <span className="text-red-700">Total Deductions</span>
              <span className="font-medium text-red-700">
                -{formatPeso(record.deductions)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded p-4 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-blue-900">Net Pay (Take Home)</span>
              <span className="text-3xl font-bold text-blue-600">
                {formatPeso(record.net_pay)}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div className={`rounded p-4 ${record.is_paid ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-sm font-medium ${record.is_paid ? 'text-green-900' : 'text-amber-900'}`}>
              {record.is_paid
                ? `âœ“ Payment received on ${record.paid_at ? new Date(record.paid_at).toLocaleDateString() : 'the scheduled pay date'}`
                : 'This payment is pending and will be processed on the scheduled pay date'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

