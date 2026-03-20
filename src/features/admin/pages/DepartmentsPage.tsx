import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  acknowledgeDepartmentFlow,
  dispatchDepartmentEmployeeDirectory,
  fetchDepartmentFlowEvents,
  fetchDepartmentIntegrationRegistry,
  fetchIntegrationReadyEmployees,
  type DepartmentFlowDirection,
  type DepartmentFlowEvent,
  type DepartmentIntegrationRegistryItem,
  type IntegrationReadyEmployee,
} from '@/features/integration/services/departmentIntegrationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Download,
  Inbox,
  Loader2,
  Network,
  Plus,
  RefreshCw,
  Search,
  Send,
  TriangleAlert,
  Upload,
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

type DepartmentInsight = {
  readyEmployeeCount: number;
  connectedTargets: string[];
};

const flowStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'blocked', label: 'Blocked' },
];

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Date(value).toLocaleString();
}

function getFlowStatusBadgeClass(status: string) {
  switch (status) {
    case 'completed':
    case 'acknowledged':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'failed':
    case 'blocked':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'queued':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'in_progress':
    case 'awaiting_acknowledgement':
    case 'dispatched':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getRegistryHealthBadge(item: DepartmentIntegrationRegistryItem) {
  if (item.failed_count > 0) {
    return {
      label: `${item.failed_count} issue${item.failed_count > 1 ? 's' : ''}`,
      className: 'bg-red-100 text-red-700 border-red-200',
    };
  }

  if (item.pending_count > 0) {
    return {
      label: `${item.pending_count} queued`,
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    };
  }

  if (item.in_progress_count > 0) {
    return {
      label: `${item.in_progress_count} in progress`,
      className: 'bg-sky-100 text-sky-700 border-sky-200',
    };
  }

  if (item.completed_count > 0) {
    return {
      label: `${item.completed_count} completed`,
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
  }

  return {
    label: 'Ready',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

function buildDepartmentInsights(employees: IntegrationReadyEmployee[]) {
  return employees.reduce<Record<string, DepartmentInsight>>((accumulator, employee) => {
    if (!employee.department_id) {
      return accumulator;
    }

    const current = accumulator[employee.department_id] ?? {
      readyEmployeeCount: 0,
      connectedTargets: [],
    };

    const nextTargets = [...current.connectedTargets];
    employee.connected_systems.forEach((system) => {
      if (!nextTargets.includes(system.department_name)) {
        nextTargets.push(system.department_name);
      }
    });

    accumulator[employee.department_id] = {
      readyEmployeeCount: current.readyEmployeeCount + 1,
      connectedTargets: nextTargets.sort((left, right) => left.localeCompare(right)),
    };

    return accumulator;
  }, {});
}

export function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [integrationRegistry, setIntegrationRegistry] = useState<DepartmentIntegrationRegistryItem[]>([]);
  const [integrationReadyEmployees, setIntegrationReadyEmployees] = useState<IntegrationReadyEmployee[]>([]);
  const [flowEvents, setFlowEvents] = useState<DepartmentFlowEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [flowDirection, setFlowDirection] = useState<DepartmentFlowDirection>('all');
  const [flowStatus, setFlowStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isIntegrationLoading, setIsIntegrationLoading] = useState(true);
  const [isFlowLoading, setIsFlowLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [syncingDepartmentId, setSyncingDepartmentId] = useState<string | null>(null);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const loadDepartments = useCallback(async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch departments');
      setDepartments([]);
    } else {
      setDepartments(data || []);
    }

    setIsLoading(false);
  }, []);

  const loadIntegrationOverview = useCallback(async () => {
    setIsIntegrationLoading(true);

    const [registryResult, employeesResult] = await Promise.all([
      fetchDepartmentIntegrationRegistry('hr'),
      fetchIntegrationReadyEmployees({ includeInactive: true }),
    ]);

    if (registryResult.error) {
      toast.error(registryResult.error);
      setIntegrationRegistry([]);
    } else {
      setIntegrationRegistry(registryResult.data);
    }

    if (employeesResult.error) {
      toast.error(employeesResult.error);
      setIntegrationReadyEmployees([]);
    } else {
      setIntegrationReadyEmployees(employeesResult.data);
    }

    setIsIntegrationLoading(false);
  }, []);

  const loadFlowEvents = useCallback(async () => {
    setIsFlowLoading(true);

    const { data, error } = await fetchDepartmentFlowEvents({
      departmentKey: 'hr',
      direction: flowDirection,
      status: flowStatus === 'all' ? null : flowStatus,
      limit: 20,
    });

    if (error) {
      toast.error(error);
      setFlowEvents([]);
    } else {
      setFlowEvents(data);
    }

    setIsFlowLoading(false);
  }, [flowDirection, flowStatus]);

  useEffect(() => {
    void loadDepartments();
    void loadIntegrationOverview();
  }, [loadDepartments, loadIntegrationOverview]);

  useEffect(() => {
    void loadFlowEvents();
  }, [loadFlowEvents]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadDepartments(), loadIntegrationOverview(), loadFlowEvents()]);
  }, [loadDepartments, loadFlowEvents, loadIntegrationOverview]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const { error } = await supabase
      .from('departments')
      .insert([formData]);

    if (error) {
      toast.error('Failed to create department');
      return;
    }

    toast.success('Department created successfully');
    setIsDialogOpen(false);
    setFormData({ name: '', code: '', description: '' });
    await loadDepartments();
  };

  const handleDepartmentSync = async (department: Department) => {
    setSyncingDepartmentId(department.id);

    const { data, error } = await dispatchDepartmentEmployeeDirectory({
      departmentId: department.id,
      requestedBy: user?.id,
      metadata: {
        initiated_from: 'departments_page',
        department_code: department.code,
        requested_by_email: user?.email ?? null,
      },
    });

    if (error) {
      toast.error(error);
      setSyncingDepartmentId(null);
      return;
    }

    if (!data) {
      toast.error('Department sync did not return a response.');
      setSyncingDepartmentId(null);
      return;
    }

    if (data.ok || data.partial_success) {
      toast.success(data.message ?? `Department sync queued for ${department.name}.`, {
        description: `${data.dispatched_employee_count ?? 0} employee record${(data.dispatched_employee_count ?? 0) === 1 ? '' : 's'} queued`,
      });
    } else {
      toast.error(data.message ?? `Failed to sync ${department.name}.`);
    }

    await Promise.all([loadIntegrationOverview(), loadFlowEvents()]);
    setSyncingDepartmentId(null);
  };

  const handleFlowUpdate = async (
    flowEvent: DepartmentFlowEvent,
    status: 'completed' | 'failed'
  ) => {
    setUpdatingEventId(flowEvent.event_id);

    const { data, error } = await acknowledgeDepartmentFlow({
      eventId: flowEvent.event_id,
      status,
      response: {
        updated_from: 'departments_page',
        counterparty_department: flowEvent.counterparty_department_name,
        hr_recorded_at: new Date().toISOString(),
      },
      error: status === 'failed' ? 'Marked for follow-up from HR integration console.' : null,
    });

    if (error) {
      toast.error(error);
      setUpdatingEventId(null);
      return;
    }

    if (!data?.ok) {
      toast.error(data?.message ?? 'Failed to update department flow.');
      setUpdatingEventId(null);
      return;
    }

    toast.success(`Flow marked as ${status}.`);
    await Promise.all([loadIntegrationOverview(), loadFlowEvents()]);
    setUpdatingEventId(null);
  };

  const departmentInsights = buildDepartmentInsights(integrationReadyEmployees);

  const filteredDepartments = departments.filter((department) => {
    const query = searchQuery.toLowerCase();
    return (
      department.name.toLowerCase().includes(query) ||
      department.code.toLowerCase().includes(query)
    );
  });

  const readyEmployeesCount = integrationReadyEmployees.length;
  const completedResponsesCount = flowEvents.filter((flowEvent) =>
    ['acknowledged', 'completed'].includes(flowEvent.status)
  ).length;
  const activeFlowCount = flowEvents.filter((flowEvent) =>
    ['queued', 'in_progress', 'dispatched', 'awaiting_acknowledgement'].includes(flowEvent.status)
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1>Departments</h1>
          <p>Manage organizational departments and live end-to-end department handoffs.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void refreshAll()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-gradient">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Department</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Department Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(event) =>
                      setFormData({ ...formData, code: event.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(event) =>
                      setFormData({ ...formData, description: event.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full btn-primary-gradient">
                  Create Department
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Local Departments</p>
              <p className="text-2xl font-semibold">{departments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-sky-500/10 p-3">
              <Network className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connected Systems</p>
              <p className="text-2xl font-semibold">{integrationRegistry.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <Upload className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ready To Send</p>
              <p className="text-2xl font-semibold">{readyEmployeesCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-amber-500/10 p-3">
              <Inbox className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Received Responses</p>
              <p className="text-2xl font-semibold">{completedResponsesCount}</p>
              <p className="text-xs text-muted-foreground">{activeFlowCount} active handoffs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Department Directory Sync</CardTitle>
            <CardDescription>
              Send employee records to connected departments using each employee&apos;s mapped department targets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-border/60">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Ready Employees</th>
                    <th>Connected Systems</th>
                    <th>Status</th>
                    <th className="w-40">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading || isIntegrationLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Loading department integration data...
                      </td>
                    </tr>
                  ) : filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((department) => {
                      const insight = departmentInsights[department.id] ?? {
                        readyEmployeeCount: 0,
                        connectedTargets: [],
                      };

                      return (
                        <tr key={department.id}>
                          <td className="font-medium">{department.name}</td>
                          <td>{department.code}</td>
                          <td>{insight.readyEmployeeCount}</td>
                          <td className="max-w-xs text-sm text-muted-foreground">
                            {insight.connectedTargets.length > 0
                              ? insight.connectedTargets.join(', ')
                              : 'No mapped targets'}
                          </td>
                          <td>
                            <Badge className={department.is_active ? 'status-active' : 'bg-muted text-muted-foreground'}>
                              {department.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleDepartmentSync(department)}
                              disabled={
                                syncingDepartmentId === department.id ||
                                !department.is_active ||
                                insight.readyEmployeeCount === 0
                              }
                            >
                              {syncingDepartmentId === department.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-4 w-4" />
                              )}
                              Sync Employees
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Connected Department Registry</CardTitle>
            <CardDescription>
              Active endpoints that can receive HR data and send status back to HR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isIntegrationLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading connected departments...</div>
            ) : integrationRegistry.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No connected departments configured.</div>
            ) : (
              integrationRegistry.map((item) => {
                const badge = getRegistryHealthBadge(item);

                return (
                  <div key={item.department_key} className="rounded-xl border border-border/60 p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{item.department_name}</p>
                          <p className="text-sm text-muted-foreground">{item.purpose}</p>
                        </div>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-muted/30 p-3">
                          <p className="text-muted-foreground">Routes</p>
                          <p className="font-semibold">{item.route_count}</p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-3">
                          <p className="text-muted-foreground">Endpoint</p>
                          <p className="font-mono text-xs">{item.dispatch_endpoint}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.routes.map((route) => (
                          <Badge key={route.route_key} variant="outline">
                            {route.event_code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle>Department Flow Inbox / Outbox</CardTitle>
            <CardDescription>
              Track what HR has sent out and what departments have already sent back as responses.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={flowDirection} onValueChange={(value) => setFlowDirection(value as DepartmentFlowDirection)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All directions</SelectItem>
                <SelectItem value="outgoing">Outgoing only</SelectItem>
                <SelectItem value="incoming">Incoming only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={flowStatus} onValueChange={setFlowStatus}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {flowStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Direction</th>
                  <th>Counterparty</th>
                  <th>Flow</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Response</th>
                  <th className="w-44">Action</th>
                </tr>
              </thead>
              <tbody>
                {isFlowLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Loading flow events...
                    </td>
                  </tr>
                ) : flowEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No department handoffs found for this filter.
                    </td>
                  </tr>
                ) : (
                  flowEvents.map((flowEvent) => {
                    const isOutgoing = flowEvent.source_department_key === 'hr';
                    const canUpdate = !['acknowledged', 'completed', 'failed', 'blocked'].includes(flowEvent.status);

                    return (
                      <tr key={flowEvent.event_id}>
                        <td>
                          <Badge variant="outline" className="gap-1">
                            {isOutgoing ? (
                              <>
                                <Upload className="h-3 w-3" />
                                Outgoing
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3" />
                                Incoming
                              </>
                            )}
                          </Badge>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <p className="font-medium">{flowEvent.counterparty_department_name || 'HR'}</p>
                            <p className="font-mono text-xs text-muted-foreground">{flowEvent.correlation_id}</p>
                          </div>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <p className="font-medium">{flowEvent.flow_name}</p>
                            <p className="text-xs text-muted-foreground">{flowEvent.event_code}</p>
                          </div>
                        </td>
                        <td>
                          <Badge className={getFlowStatusBadgeClass(flowEvent.status)}>
                            {flowEvent.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {formatDateTime(flowEvent.created_at)}
                        </td>
                        <td className="max-w-xs text-sm text-muted-foreground">
                          {Object.keys(flowEvent.response_payload).length > 0
                            ? JSON.stringify(flowEvent.response_payload)
                            : flowEvent.last_error || 'Waiting for department response'}
                        </td>
                        <td>
                          {canUpdate ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void handleFlowUpdate(flowEvent, 'completed')}
                                disabled={updatingEventId === flowEvent.event_id}
                              >
                                {updatingEventId === flowEvent.event_id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Complete
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void handleFlowUpdate(flowEvent, 'failed')}
                                disabled={updatingEventId === flowEvent.event_id}
                              >
                                <TriangleAlert className="mr-2 h-4 w-4" />
                                Flag
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ArrowRightLeft className="h-4 w-4" />
                              Finalized
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
