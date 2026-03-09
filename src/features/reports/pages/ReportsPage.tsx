import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, GraduationCap, Gift, Eye, Download, FileText } from 'lucide-react';
import { PesoSign } from '@/components/icons/PesoSign';
import { formatCurrencyPHP } from '@/lib/utils';
import { toast } from 'sonner';
import {
  fetchEmployeeSummaryReport,
  fetchPerformanceReport,
  fetchPayrollReport,
  fetchTrainingReport,
  fetchBenefitsReport,
  fetchPayrollPeriods,
  EmployeeSummaryReport,
  PerformanceReportData,
  PayrollReportData,
  TrainingReportData,
  BenefitsReportData,
  DetailedEmployeeInfo,
  PerformanceDetailRecord,
  PayrollDetailRecord,
  TrainingDetailRecord,
  BenefitDetailRecord,
} from '../services/reportService';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('employee-summary');
  const [isLoading, setIsLoading] = useState(false);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Report data states
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummaryReport | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReportData | null>(null);
  const [payrollReport, setPayrollReport] = useState<PayrollReportData | null>(null);
  const [trainingReport, setTrainingReport] = useState<TrainingReportData | null>(null);
  const [benefitsReport, setBenefitsReport] = useState<BenefitsReportData | null>(null);

  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailType, setDetailType] = useState<string>('');

  // Load periods on mount
  useEffect(() => {
    const loadPeriods = async () => {
      const { data } = await fetchPayrollPeriods();
      if (data) setPeriods(data);
    };
    loadPeriods();
  }, []);

  // Load reports based on active tab
  useEffect(() => {
    loadReports();
  }, [activeTab, selectedPeriod]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'employee-summary': {
          const { data, error } = await fetchEmployeeSummaryReport();
          if (error) toast.error(error);
          else setEmployeeSummary(data);
          break;
        }
        case 'performance': {
          const { data, error } = await fetchPerformanceReport();
          if (error) toast.error(error);
          else setPerformanceReport(data);
          break;
        }
        case 'payroll': {
          const periodId = selectedPeriod !== 'all' ? selectedPeriod : undefined;
          const { data, error } = await fetchPayrollReport(periodId);
          if (error) toast.error(error);
          else setPayrollReport(data);
          break;
        }
        case 'training': {
          const { data, error } = await fetchTrainingReport();
          if (error) toast.error(error);
          else setTrainingReport(data);
          break;
        }
        case 'benefits': {
          const { data, error } = await fetchBenefitsReport();
          if (error) toast.error(error);
          else setBenefitsReport(data);
          break;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported as CSV');
  };

  const exportToPDF = (title: string, data: any[]) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    let htmlTable = '<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">';
    htmlTable += '<thead style="background-color:#f0f0f0;"><tr>';
    headers.forEach(h => {
      htmlTable += `<th style="text-align:left; padding:10px;">${h.replace(/_/g, ' ').toUpperCase()}</th>`;
    });
    htmlTable += '</tr></thead><tbody>';

    data.forEach((row, idx) => {
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
      htmlTable += `<tr style="background-color:${bgColor};">`;
      headers.forEach(h => {
        const value = row[h];
        const displayValue = typeof value === 'number' && h.includes('salary')
          ? formatCurrencyPHP(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : value;
        htmlTable += `<td style="padding:10px;">${displayValue}</td>`;
      });
      htmlTable += '</tr>';
    });

    htmlTable += '</tbody></table>';

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
              .meta { margin-bottom: 20px; color: #666; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
            ${htmlTable}
            <div class="footer">This report is confidential and for authorized HR use only.</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success('Report opened for PDF printing');
  };

  const viewDetails = (item: any, type: string) => {
    setSelectedDetail(item);
    setDetailType(type);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h1 className="text-3xl font-bold text-slate-900">HR Reports</h1>
        <p className="text-slate-600 mt-2">Detailed employee information with export capabilities</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="employee-summary">
            <Users className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Employees</span>
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <PesoSign className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Payroll</span>
          </TabsTrigger>
          <TabsTrigger value="training">
            <GraduationCap className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Training</span>
          </TabsTrigger>
          <TabsTrigger value="benefits">
            <Gift className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Benefits</span>
          </TabsTrigger>
        </TabsList>

        {/* EMPLOYEE SUMMARY TAB */}
        <TabsContent value="employee-summary" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading employee data...</div>
          ) : employeeSummary ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{employeeSummary.total_employees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{employeeSummary.active_employees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">On Leave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{employeeSummary.on_leave_employees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Probation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{employeeSummary.probation_employees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Terminated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{employeeSummary.terminated_employees}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Employee Details Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Employees</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(employeeSummary.detailed_employees, 'employees')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => exportToPDF('Employee Summary Report', employeeSummary.detailed_employees)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeSummary.detailed_employees.map(emp => (
                          <TableRow key={emp.employee_id}>
                            <TableCell className="font-medium">{emp.employee_number}</TableCell>
                            <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                            <TableCell className="text-sm">{emp.email}</TableCell>
                            <TableCell>{emp.department_name}</TableCell>
                            <TableCell>
                              <Badge variant={emp.employment_status === 'active' ? 'default' : 'secondary'}>
                                {emp.employment_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{emp.employee_type}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDetails(emp, 'employee')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No employee data available</div>
          )}
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading performance data...</div>
          ) : performanceReport ? (
            <>
              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performanceReport.total_evaluations}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{performanceReport.completed}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{performanceReport.in_progress}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{performanceReport.pending}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Avg Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performanceReport.average_score.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Details Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Evaluations</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(performanceReport.all_evaluations, 'performance')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => exportToPDF('Performance Report', performanceReport.all_evaluations)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Evaluation Date</TableHead>
                          <TableHead className="text-right">Rating</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceReport.all_evaluations.map((evaluation, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{evaluation.employee_number}</TableCell>
                            <TableCell>{evaluation.first_name} {evaluation.last_name}</TableCell>
                            <TableCell className="text-sm">{evaluation.email}</TableCell>
                            <TableCell>{evaluation.department_name}</TableCell>
                            <TableCell>{evaluation.evaluation_date}</TableCell>
                            <TableCell className="text-right font-semibold">
                              <Badge variant={evaluation.overall_rating >= 4 ? 'default' : evaluation.overall_rating >= 3 ? 'secondary' : 'destructive'}>
                                {evaluation.overall_rating.toFixed(2)}/5
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
                                {evaluation.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDetails(evaluation, 'performance')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No performance data available</div>
          )}
        </TabsContent>

        {/* PAYROLL TAB */}
        <TabsContent value="payroll" className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {periods.map(period => (
                  <SelectItem key={period.id} value={period.id}>
                    {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading payroll data...</div>
          ) : payrollReport ? (
            <>
              {/* Payroll Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{payrollReport.total_records}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{payrollReport.paid_records}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{payrollReport.pending_records}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Net Pay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrencyPHP(payrollReport.total_net_pay, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Payroll Details Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payroll Records</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(payrollReport.all_records, 'payroll')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => exportToPDF('Payroll Report', payrollReport.all_records)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Basic Salary</TableHead>
                          <TableHead className="text-right">Allowances</TableHead>
                          <TableHead className="text-right">Deductions</TableHead>
                          <TableHead className="text-right">Net Pay</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollReport.all_records.map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{record.employee_number}</TableCell>
                            <TableCell>{record.first_name} {record.last_name}</TableCell>
                            <TableCell className="text-sm">{record.email}</TableCell>
                            <TableCell>{record.department_name}</TableCell>
                            <TableCell className="text-right">{formatCurrencyPHP(record.basic_salary, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right">{formatCurrencyPHP(record.allowances, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right">{formatCurrencyPHP(record.deductions, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrencyPHP(record.net_pay, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                              <Badge variant={record.is_paid ? 'default' : 'secondary'}>
                                {record.is_paid ? 'Paid' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDetails(record, 'payroll')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No payroll data available</div>
          )}
        </TabsContent>

        {/* TRAINING TAB */}
        <TabsContent value="training" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading training data...</div>
          ) : trainingReport ? (
            <>
              {/* Training Stats */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Programs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{trainingReport.total_training_programs}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Enrollments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{trainingReport.total_enrollments}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{trainingReport.completed_trainings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{trainingReport.in_progress_trainings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Scheduled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{trainingReport.scheduled_trainings}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Cancelled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{trainingReport.cancelled_trainings}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Training Details Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Training Records</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(trainingReport.all_trainings, 'training')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => exportToPDF('Training Report', trainingReport.all_trainings)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Training</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead className="text-center">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trainingReport.all_trainings.map((training, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{training.employee_number}</TableCell>
                            <TableCell>{training.first_name} {training.last_name}</TableCell>
                            <TableCell className="text-sm">{training.email}</TableCell>
                            <TableCell>{training.department_name}</TableCell>
                            <TableCell>{training.training_title}</TableCell>
                            <TableCell>
                              <Badge variant={training.status === 'completed' ? 'default' : 'secondary'}>
                                {training.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{training.duration_hours}h</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDetails(training, 'training')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No training data available</div>
          )}
        </TabsContent>

        {/* BENEFITS TAB */}
        <TabsContent value="benefits" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading benefits data...</div>
          ) : benefitsReport ? (
            <>
              {/* Benefits Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{benefitsReport.total_benefits}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Employees with Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{benefitsReport.total_employees_with_benefits}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Benefits Details Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Benefit Enrollments</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(benefitsReport.all_benefits, 'benefits')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => exportToPDF('Benefits Report', benefitsReport.all_benefits)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Benefit</TableHead>
                          <TableHead className="text-right">Coverage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {benefitsReport.all_benefits.map((benefit, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{benefit.employee_number}</TableCell>
                            <TableCell>{benefit.first_name} {benefit.last_name}</TableCell>
                            <TableCell className="text-sm">{benefit.email}</TableCell>
                            <TableCell>{benefit.department_name}</TableCell>
                            <TableCell>{benefit.benefit_name}</TableCell>
                            <TableCell className="text-right">{formatCurrencyPHP(benefit.coverage_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                              <Badge variant={benefit.is_active ? 'default' : 'secondary'}>
                                {benefit.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewDetails(benefit, 'benefit')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No benefits data available</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailType === 'employee' && 'Employee Details'}
              {detailType === 'performance' && 'Evaluation Details'}
              {detailType === 'payroll' && 'Payroll Details'}
              {detailType === 'training' && 'Training Details'}
              {detailType === 'benefit' && 'Benefit Details'}
            </DialogTitle>
            <DialogDescription>Full information for the selected record</DialogDescription>
          </DialogHeader>

          {selectedDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedDetail).map(([key, value]) => {
                  if (typeof value === 'boolean') {
                    return (
                      <div key={key} className="border-b pb-3">
                        <p className="text-xs font-semibold text-gray-600 uppercase">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm mt-1">
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Yes' : 'No'}
                          </Badge>
                        </p>
                      </div>
                    );
                  }
                  if (typeof value === 'number' && (key.includes('salary') || key.includes('allowance') || key.includes('deduction') || key.includes('net_pay') || key.includes('coverage'))) {
                    return (
                      <div key={key} className="border-b pb-3">
                        <p className="text-xs font-semibold text-gray-600 uppercase">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm mt-1 font-semibold">{formatCurrencyPHP(Number(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="border-b pb-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm mt-1">{String(value)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}




