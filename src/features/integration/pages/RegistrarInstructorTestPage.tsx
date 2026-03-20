import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  fetchHrInstructorRegistrarHistory,
  fetchHrInstructors,
  dispatchHrInstructorToRegistrar,
  type HrInstructorRecord,
  type HrInstructorRegistrarDispatchResult,
  type HrInstructorRegistrarHistoryEvent,
} from '@/features/integration/services/hrInstructorRegistrarService';
import {
  BookOpen,
  Building2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Send,
  UserRoundSearch,
} from 'lucide-react';

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Date(value).toLocaleString();
}

function getStatusBadgeClass(status: string) {
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
    case 'dispatched':
    case 'awaiting_acknowledgement':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function RegistrarInstructorTestPage() {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<HrInstructorRecord[]>([]);
  const [history, setHistory] = useState<HrInstructorRegistrarHistoryEvent[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<HrInstructorRegistrarDispatchResult | null>(null);
  const [formData, setFormData] = useState({
    collegeUnit: '',
    semester: '1st Semester',
    teachingLoad: '',
    remarks: '',
  });

  const loadInstructors = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await fetchHrInstructors({ limit: 200 });

    if (error) {
      toast.error(error);
      setInstructors([]);
    } else {
      setInstructors(data);
      if (!selectedInstructorId && data.length > 0) {
        setSelectedInstructorId(data[0].id);
      }
    }

    setIsLoading(false);
  }, [selectedInstructorId]);

  const loadHistory = useCallback(async (instructorId: string) => {
    setIsHistoryLoading(true);
    const { data, error } = await fetchHrInstructorRegistrarHistory(instructorId, 20);

    if (error) {
      toast.error(error);
      setHistory([]);
    } else {
      setHistory(data);
    }

    setIsHistoryLoading(false);
  }, []);

  useEffect(() => {
    void loadInstructors();
  }, [loadInstructors]);

  useEffect(() => {
    if (!selectedInstructorId) {
      setHistory([]);
      return;
    }

    void loadHistory(selectedInstructorId);
  }, [loadHistory, selectedInstructorId]);

  const selectedInstructor = instructors.find((instructor) => instructor.id === selectedInstructorId) ?? null;

  useEffect(() => {
    if (!selectedInstructor) {
      return;
    }

    setFormData((current) => ({
      ...current,
      collegeUnit: selectedInstructor.department || current.collegeUnit,
      teachingLoad: current.teachingLoad || selectedInstructor.specialization || '',
    }));
  }, [selectedInstructor]);

  const filteredInstructors = instructors.filter((instructor) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      `${instructor.employee_no} ${instructor.first_name} ${instructor.last_name} ${instructor.department} ${instructor.specialization}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || instructor.employment_status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const handleDispatch = async () => {
    if (!selectedInstructor) {
      toast.error('Select an instructor first.');
      return;
    }

    if (!formData.collegeUnit.trim() || !formData.semester.trim()) {
      toast.error('College unit and semester are required.');
      return;
    }

    setIsDispatching(true);

    try {
      const teachingLoad = formData.teachingLoad
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter(Boolean);

      const result = await dispatchHrInstructorToRegistrar({
        instructorId: selectedInstructor.id,
        instructor: selectedInstructor,
        collegeUnit: formData.collegeUnit.trim(),
        semester: formData.semester.trim(),
        teachingLoad,
        remarks: formData.remarks,
        requestedBy: user?.id,
        scheduleMatrix: {},
      });

      const { data, error } = result;

      if (error) {
        toast.error(error);
        return;
      }

      if (!data?.ok) {
        toast.error(data?.message ?? 'Failed to dispatch instructor to Registrar.');
        setDispatchResult(data ?? null);
        return;
      }

      setDispatchResult(data);
      toast.success('Instructor dispatched to Registrar.', {
        description: `${data.employee_name ?? `${selectedInstructor.first_name} ${selectedInstructor.last_name}`} queued for faculty assignment validation.`,
      });

      await loadHistory(selectedInstructor.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to dispatch instructor to Registrar.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1>Registrar Instructor Test</h1>
          <p>Send an instructor from the HR instructor directory to Registrar end to end.</p>
        </div>

        <Button variant="outline" onClick={() => void loadInstructors()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Instructors
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3">
              <UserRoundSearch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Instructor Source</p>
              <p className="text-lg font-semibold">HR instructor directory</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-sky-500/10 p-3">
              <Building2 className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Department</p>
              <p className="text-lg font-semibold">Registrar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-amber-500/10 p-3">
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent Handoffs</p>
              <p className="text-lg font-semibold">{history.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>HR Instructors</CardTitle>
            <CardDescription>Pick an instructor record from the HR instructor directory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search instructors..."
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[180px]">
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
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading instructors...</div>
              ) : filteredInstructors.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No instructors found.</div>
              ) : (
                filteredInstructors.map((instructor) => (
                  <button
                    key={instructor.id}
                    type="button"
                    onClick={() => setSelectedInstructorId(instructor.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedInstructorId === instructor.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {instructor.first_name} {instructor.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {instructor.employee_no} · {instructor.department}
                        </p>
                      </div>
                      <Badge
                        className={
                          instructor.integration_ready
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }
                      >
                        {instructor.integration_ready ? 'Ready' : 'Not Ready'}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>Specialization: {instructor.specialization || 'Not specified'}</p>
                      <p>Academic rank: {instructor.academic_rank}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Registrar Dispatch Form</CardTitle>
              <CardDescription>
                Build a live `faculty_assignment_validation` payload from the selected HR instructor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedInstructor ? (
                <>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">
                        {selectedInstructor.first_name} {selectedInstructor.last_name}
                      </p>
                      <Badge variant="outline">{selectedInstructor.employee_no}</Badge>
                      <Badge variant="outline">{selectedInstructor.academic_rank}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>Department: {selectedInstructor.department}</p>
                      <p>Specialization: {selectedInstructor.specialization || 'Not specified'}</p>
                      <p>Status: {selectedInstructor.employment_status}</p>
                      <p>Integration ready: {selectedInstructor.integration_ready ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>College Unit</Label>
                      <Input
                        value={formData.collegeUnit}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, collegeUnit: event.target.value }))
                        }
                        placeholder="e.g. Senior High School"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select
                        value={formData.semester}
                        onValueChange={(value) =>
                          setFormData((current) => ({ ...current, semester: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Semester">1st Semester</SelectItem>
                          <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Teaching Load</Label>
                    <Textarea
                      value={formData.teachingLoad}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, teachingLoad: event.target.value }))
                      }
                      placeholder="Enter one subject or load entry per line"
                      className="min-h-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={formData.remarks}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, remarks: event.target.value }))
                      }
                      placeholder="Optional notes for Registrar"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => void handleDispatch()}
                    disabled={isDispatching}
                    className="w-full btn-primary-gradient"
                  >
                    {isDispatching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Instructor To Registrar
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Select an instructor to start the Registrar handoff test.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Latest Dispatch Result</CardTitle>
              <CardDescription>
                Immediate response from the Registrar handoff RPC.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dispatchResult ? (
                <div className="space-y-3 rounded-xl border border-border/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusBadgeClass(dispatchResult.status ?? 'queued')}>
                      {dispatchResult.status ?? 'queued'}
                    </Badge>
                    {dispatchResult.event_code ? <Badge variant="outline">{dispatchResult.event_code}</Badge> : null}
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>Instructor: {dispatchResult.employee_name || 'Unknown'}</p>
                    <p>Employee No: {dispatchResult.employee_no || 'Unknown'}</p>
                    <p>College Unit: {dispatchResult.college_unit || 'Not supplied'}</p>
                    <p>Semester: {dispatchResult.semester || 'Not supplied'}</p>
                    <p>Event ID: {dispatchResult.event_id || 'Not returned'}</p>
                    <p>Correlation ID: {dispatchResult.correlation_id || 'Not returned'}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {dispatchResult.message || 'No message returned.'}
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No Registrar test dispatch has been sent yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Selected Instructor History</CardTitle>
              <CardDescription>
                Recent Registrar faculty-assignment events for the selected instructor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isHistoryLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No Registrar history found for this instructor.
                </div>
              ) : (
                history.map((event) => (
                  <div key={event.event_id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getStatusBadgeClass(event.status)}>{event.status}</Badge>
                        <Badge variant="outline">{event.event_code}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(event.created_at)}</p>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{event.flow_name}</p>
                      <p>Source Record: {event.source_record_id || 'Not set'}</p>
                      <p>Correlation ID: {event.correlation_id}</p>
                      <p>
                        Response:{' '}
                        {Object.keys(event.response_payload).length > 0
                          ? JSON.stringify(event.response_payload)
                          : event.last_error || 'Waiting for response'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
