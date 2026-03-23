import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EMPLOYEE_TYPE_LABELS, EMPLOYMENT_STATUS_LABELS, EmploymentStatus } from '@/lib/constants';
import { toast } from 'sonner';
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import {
  fetchHrInstructors,
  type HrInstructorRecord,
} from '@/features/integration/services/hrInstructorRegistrarService';
import {
  fetchEmployees,
  type EmployeeWithDetails,
} from '@/features/employees/services/employeeService';

type DirectoryTab = 'instructors' | 'other-employees';
type StatusFilter = 'all' | EmploymentStatus;

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'probation':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'on_leave':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'terminated':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getStatusLabel(status: string) {
  return EMPLOYMENT_STATUS_LABELS[status as EmploymentStatus] ?? status.replace(/_/g, ' ');
}

function getEmployeeName(employee: EmployeeWithDetails) {
  const firstName = employee.profiles?.first_name ?? '';
  const lastName = employee.profiles?.last_name ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || 'Unknown employee';
}

function getInstructorName(instructor: HrInstructorRecord) {
  const fullName = `${instructor.first_name} ${instructor.last_name}`.trim();
  return fullName || 'Unknown instructor';
}

function compareEmployees(left: EmployeeWithDetails, right: EmployeeWithDetails) {
  return (
    getEmployeeName(left).localeCompare(getEmployeeName(right)) ||
    left.employee_number.localeCompare(right.employee_number)
  );
}

export function WorkforceDirectoryPage() {
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [instructors, setInstructors] = useState<HrInstructorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DirectoryTab>('instructors');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [instructorsPage, setInstructorsPage] = useState(1);
  const [otherEmployeesPage, setOtherEmployeesPage] = useState(1);
  const PAGE_SIZE = 12;

  const loadDirectory = async () => {
    setIsLoading(true);

    const [employeesResult, instructorsResult] = await Promise.all([
      fetchEmployees(),
      fetchHrInstructors({ limit: 300 }),
    ]);

    if (employeesResult.error) {
      toast.error(employeesResult.error);
    }

    if (instructorsResult.error) {
      toast.error(instructorsResult.error);
    }

    setEmployees((employeesResult.data ?? []).slice().sort(compareEmployees));
    setInstructors(instructorsResult.data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadDirectory();
  }, []);

  const instructorEmployeeIds = new Set(
    instructors.map((instructor) => instructor.employee_id || instructor.id)
  );

  const otherEmployees = employees.filter((employee) => !instructorEmployeeIds.has(employee.id));

  const departmentOptions = Array.from(
    new Set(
      [
        ...instructors.map((instructor) => instructor.department),
        ...otherEmployees.map((employee) => employee.departments?.name ?? ''),
      ].filter((value) => value.trim().length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredInstructors = instructors.filter((instructor) => {
    const matchesQuery =
      !normalizedQuery ||
      [
        instructor.employee_no,
        instructor.first_name,
        instructor.last_name,
        instructor.department,
        instructor.specialization,
        instructor.academic_rank,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesStatus =
      statusFilter === 'all' || instructor.employment_status === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' || instructor.department === departmentFilter;

    return matchesQuery && matchesStatus && matchesDepartment;
  });

  const filteredOtherEmployees = otherEmployees.filter((employee) => {
    const matchesQuery =
      !normalizedQuery ||
      [
        employee.employee_number,
        getEmployeeName(employee),
        employee.profiles?.email ?? '',
        employee.departments?.name ?? '',
        employee.positions?.title ?? '',
        employee.employee_type,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesStatus =
      statusFilter === 'all' || employee.employment_status === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' || employee.departments?.name === departmentFilter;

    return matchesQuery && matchesStatus && matchesDepartment;
  });

  const activeEmployeesCount = employees.filter(
    (employee) => employee.employment_status === 'active'
  ).length;

  const instructorsTotalPages = Math.max(1, Math.ceil(filteredInstructors.length / PAGE_SIZE));
  const otherEmployeesTotalPages = Math.max(1, Math.ceil(filteredOtherEmployees.length / PAGE_SIZE));

  useEffect(() => {
    setInstructorsPage(1);
    setOtherEmployeesPage(1);
  }, [searchQuery, statusFilter, departmentFilter, activeTab]);

  const pagedInstructors = useMemo(() => {
    const start = (instructorsPage - 1) * PAGE_SIZE;
    return filteredInstructors.slice(start, start + PAGE_SIZE);
  }, [filteredInstructors, instructorsPage]);

  const pagedOtherEmployees = useMemo(() => {
    const start = (otherEmployeesPage - 1) * PAGE_SIZE;
    return filteredOtherEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredOtherEmployees, otherEmployeesPage]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1>HR Workforce Directory</h1>
          <p>View instructors and other employees from one HR-only directory page.</p>
        </div>

        <Button variant="outline" onClick={() => void loadDirectory()} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh Directory
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-semibold">{employees.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-sky-500/10 p-3">
              <GraduationCap className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Instructors</p>
              <p className="text-2xl font-semibold">{instructors.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-amber-500/10 p-3">
              <BriefcaseBusiness className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Other Employees</p>
              <p className="text-2xl font-semibold">{otherEmployees.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Employees</p>
              <p className="text-2xl font-semibold">{activeEmployeesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Directory Filters</CardTitle>
            <CardDescription>
              Search and narrow the HR directory by employment status or department.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, employee number, department, or position..."
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="lg:w-[220px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departmentOptions.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DirectoryTab)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 md:w-[360px]">
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="other-employees">Other Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="instructors">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Instructor Directory</CardTitle>
              <CardDescription>
                Faculty and instructor-aligned records pulled into the HR directory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="data-table min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Employee #</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Specialization</th>
                      <th>Academic Rank</th>
                      <th>Status</th>
                      <th>Integration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          Loading instructors...
                        </td>
                      </tr>
                    ) : filteredInstructors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No instructors matched the current filters.
                        </td>
                      </tr>
                    ) : (
                      pagedInstructors.map((instructor) => (
                        <tr key={instructor.id}>
                          <td className="font-mono">{instructor.employee_no}</td>
                          <td className="font-medium">{getInstructorName(instructor)}</td>
                          <td>{instructor.department}</td>
                          <td>{instructor.specialization || 'Not specified'}</td>
                          <td>{instructor.academic_rank}</td>
                          <td>
                            <Badge className={getStatusBadgeClass(instructor.employment_status)}>
                              {getStatusLabel(instructor.employment_status)}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              className={
                                instructor.integration_ready
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }
                            >
                              {instructor.integration_ready ? 'Ready' : 'Needs setup'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredInstructors.length > 0 ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(instructorsPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(instructorsPage * PAGE_SIZE, filteredInstructors.length)} of {filteredInstructors.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => setInstructorsPage(1)} disabled={instructorsPage === 1 || isLoading}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setInstructorsPage((prev) => Math.max(1, prev - 1))}
                      disabled={instructorsPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm font-medium">
                      Page {instructorsPage} of {instructorsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setInstructorsPage((prev) => Math.min(instructorsTotalPages, prev + 1))}
                      disabled={instructorsPage === instructorsTotalPages || isLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setInstructorsPage(instructorsTotalPages)}
                      disabled={instructorsPage === instructorsTotalPages || isLoading}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other-employees">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Other Employees</CardTitle>
              <CardDescription>
                HR can also review non-instructor employees in the same directory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="data-table min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Employee #</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          Loading employees...
                        </td>
                      </tr>
                    ) : filteredOtherEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No other employees matched the current filters.
                        </td>
                      </tr>
                    ) : (
                      pagedOtherEmployees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="font-mono">{employee.employee_number}</td>
                          <td className="font-medium">{getEmployeeName(employee)}</td>
                          <td>{employee.departments?.name || 'Unassigned'}</td>
                          <td>{employee.positions?.title || 'Not assigned'}</td>
                          <td>
                            {EMPLOYEE_TYPE_LABELS[employee.employee_type as keyof typeof EMPLOYEE_TYPE_LABELS] ??
                              employee.employee_type}
                          </td>
                          <td>
                            <Badge className={getStatusBadgeClass(employee.employment_status)}>
                              {getStatusLabel(employee.employment_status)}
                            </Badge>
                          </td>
                          <td>{employee.profiles?.email || 'No email on file'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredOtherEmployees.length > 0 ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(otherEmployeesPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(otherEmployeesPage * PAGE_SIZE, filteredOtherEmployees.length)} of {filteredOtherEmployees.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => setOtherEmployeesPage(1)} disabled={otherEmployeesPage === 1 || isLoading}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setOtherEmployeesPage((prev) => Math.max(1, prev - 1))}
                      disabled={otherEmployeesPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm font-medium">
                      Page {otherEmployeesPage} of {otherEmployeesTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setOtherEmployeesPage((prev) => Math.min(otherEmployeesTotalPages, prev + 1))}
                      disabled={otherEmployeesPage === otherEmployeesTotalPages || isLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setOtherEmployeesPage(otherEmployeesTotalPages)}
                      disabled={otherEmployeesPage === otherEmployeesTotalPages || isLoading}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
