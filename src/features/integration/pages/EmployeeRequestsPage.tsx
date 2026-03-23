import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  approveEmployeeRequest,
  EmployeeRequestRecord,
  EmployeeRequestUrgency,
  getAllEmployeeRequests,
  getEmployeeRequestStatus,
  postEmployeeRequest,
  rejectEmployeeRequest,
} from '@/features/integration/services/employeeRequestService';
import {
  CROSS_DEPARTMENT_JOB_POSITIONS,
  formatCrossDepartmentPositionLabel,
} from '@/features/integration/constants/crossDepartmentJobPositions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

const CONNECTED_DEPARTMENTS = ['Prefect', 'Guidance', 'CRAD', 'PMED', 'Comlab', 'Clinic', 'Cashier'] as const;

type FormState = {
  department: string;
  position: string;
  reason: string;
  urgency: EmployeeRequestUrgency;
  notes: string;
};

function getRequestBadgeClass(status: EmployeeRequestRecord['status']) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function getUrgencyBadgeClass(urgency: EmployeeRequestUrgency) {
  if (urgency === 'urgent') return 'bg-red-100 text-red-700 border-red-200';
  if (urgency === 'high') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (urgency === 'medium') return 'bg-sky-100 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function EmployeeRequestsPage() {
  const { role, user } = useAuth();
  const isHr = role === 'system_admin' || role === 'hr_admin';
  const [departmentName, setDepartmentName] = useState<string>('Guidance');
  const [requests, setRequests] = useState<EmployeeRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [hrRemarksById, setHrRemarksById] = useState<Record<string, string>>({});
  const [formState, setFormState] = useState<FormState>({
    department: 'Guidance',
    position: '',
    reason: '',
    urgency: 'medium',
    notes: '',
  });

  useEffect(() => {
    void inferDepartment();
  }, [user?.id]);

  useEffect(() => {
    void loadRequests();
  }, [isHr, departmentName]);

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'pending').length,
    [requests]
  );

  const inferDepartment = async () => {
    if (!user?.id || isHr) {
      return;
    }

    const { data } = await supabase
      .from('employees')
      .select('departments(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    const raw = (data as { departments?: { name?: string | null } | null } | null)?.departments?.name;
    const matched = CONNECTED_DEPARTMENTS.find((item) => item.toLowerCase() === String(raw ?? '').toLowerCase());
    const fallback = matched ?? 'Guidance';
    setDepartmentName(fallback);
    setFormState((prev) => ({ ...prev, department: fallback }));
  };

  const loadRequests = async () => {
    setIsLoading(true);

    if (isHr) {
      const { data, error } = await getAllEmployeeRequests();
      if (error) {
        toast.error(error);
        setRequests([]);
      } else {
        setRequests(data);
      }
      setIsLoading(false);
      return;
    }

    const { data, error } = await getEmployeeRequestStatus(departmentName);
    if (error) {
      toast.error(error);
      setRequests([]);
    } else {
      setRequests(data);
    }
    setIsLoading(false);
  };

  const handleSubmitRequest = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.position.trim()) {
      toast.error('Please select a position.');
      return;
    }

    const { data, error } = await postEmployeeRequest({
      department: formState.department,
      position: formState.position.trim(),
      reason: formState.reason.trim(),
      urgency: formState.urgency,
      notes: formState.notes.trim(),
    });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(`Request submitted to HR (${data?.status ?? 'pending'}).`);
    setIsModalOpen(false);
    setFormState((prev) => ({
      ...prev,
      position: '',
      reason: '',
      urgency: 'medium',
      notes: '',
    }));
    await loadRequests();
  };

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setActioningId(id);
    const remarks = hrRemarksById[id] ?? '';
    const actionResult =
      action === 'approve'
        ? await approveEmployeeRequest(id, remarks, isHr)
        : await rejectEmployeeRequest(id, remarks, isHr);

    if (actionResult.error) {
      toast.error(actionResult.error);
      setActioningId(null);
      return;
    }

    toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}.`);
    await loadRequests();
    setActioningId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>Employee Requests</h1>
          <p>
            {isHr
              ? 'Review requests from Prefect, Guidance, CRAD, PMED, Comlab, Clinic, and Cashier.'
              : 'Submit staffing requests to HR and monitor request status with HR remarks.'}
          </p>
        </div>
        {!isHr ? (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-gradient">
                <Plus className="mr-2 h-4 w-4" />
                Submit Employee Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Employee Request</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmitRequest}>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={formState.department}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONNECTED_DEPARTMENTS.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={formState.position || undefined}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, position: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                    <SelectContent>
                      {CROSS_DEPARTMENT_JOB_POSITIONS.map((row) => {
                        const label = formatCrossDepartmentPositionLabel(row);
                        return (
                          <SelectItem key={label} value={label}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    value={formState.reason}
                    onChange={(event) => setFormState((prev) => ({ ...prev, reason: event.target.value }))}
                    placeholder="Outline the main responsibilities for this position..."
                    required
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select
                    value={formState.urgency}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, urgency: value as EmployeeRequestUrgency }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formState.notes}
                    onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="btn-primary-gradient w-full">
                    Submit
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Total Requests</CardTitle>
            <CardDescription>{isHr ? 'All departments' : `${departmentName} requests`}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{requests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Pending</CardTitle>
            <CardDescription>Waiting HR review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Role</CardTitle>
            <CardDescription>Access policy</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{isHr ? 'HR Reviewer' : 'Department Submitter'}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>{isHr ? 'HR Dashboard Table' : 'Request Status'}</CardTitle>
          <CardDescription>
            {isHr
              ? 'Approve or reject incoming requests. Departments cannot edit once submitted.'
              : 'Track status and HR remarks after submission.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>HR Remarks</th>
                  <th>Submitted</th>
                  {isHr ? <th className="w-72">Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={isHr ? 8 : 7} className="py-8 text-center text-muted-foreground">
                      Loading requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={isHr ? 8 : 7} className="py-8 text-center text-muted-foreground">
                      No employee requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((item) => {
                    const canReview = isHr && item.status === 'pending';
                    return (
                      <tr key={item.id}>
                        <td>{item.department}</td>
                        <td className="font-medium">{item.position}</td>
                        <td>
                          <Badge className={getUrgencyBadgeClass(item.urgency)}>
                            {item.urgency.toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          <Badge className={getRequestBadgeClass(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="max-w-xs text-sm text-muted-foreground">{item.reason}</td>
                        <td className="max-w-xs text-sm text-muted-foreground">
                          {item.hr_remarks || 'No remarks yet'}
                        </td>
                        <td>{new Date(item.created_at).toLocaleString()}</td>
                        {isHr ? (
                          <td>
                            {canReview ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Add HR remarks..."
                                  value={hrRemarksById[item.id] ?? ''}
                                  onChange={(event) =>
                                    setHrRemarksById((prev) => ({ ...prev, [item.id]: event.target.value }))
                                  }
                                />
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleReview(item.id, 'approve')}
                                    disabled={actioningId === item.id}
                                  >
                                    {actioningId === item.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleReview(item.id, 'reject')}
                                    disabled={actioningId === item.id}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Finalized</p>
                            )}
                          </td>
                        ) : null}
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
