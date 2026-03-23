import { formatCurrencyPHP } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, MoreHorizontal, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/context/AuthContext';
import { JobPostingForm } from '../components/JobPostingForm';
import { JobPostingDetail } from '../components/JobPostingDetail';
import {
  fetchJobPostings,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  toggleJobPostingStatus,
  JobPosting,
  CreateJobPostingInput,
} from '@/features/recruitment/services/jobPostingsService';
import {
  fetchDepartmentHiringRequestsPaged,
  fetchDepartmentHiringRequestsPagedViaApi,
  fetchUrgentDepartmentHiringRequestsForNotify,
  updateDepartmentHiringRequestStatus,
  type DepartmentHiringRequestRow,
  type DepartmentHiringRequestStatus,
} from '@/features/recruitment/services/departmentHiringRequestsService';
import {
  createJobPostingForHiringRequestIfNeeded,
  hiringRequestRoleLabel,
} from '@/features/recruitment/services/hiringRequestJobPosting';

const REQUEST_MODAL_PAGE_SIZE = 8;

export function JobPostingsPage() {
  const { authReady, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);
  const [showDepartmentRequestsModal, setShowDepartmentRequestsModal] = useState(false);
  const [requestFilter, setRequestFilter] = useState<'all' | DepartmentHiringRequestStatus>('all');
  const [departmentHiringRequests, setDepartmentHiringRequests] = useState<DepartmentHiringRequestRow[]>([]);
  const [requestStatusDrafts, setRequestStatusDrafts] = useState<Record<number, DepartmentHiringRequestStatus>>({});
  const [requestLoading, setRequestLoading] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const [requestPage, setRequestPage] = useState(1);
  const [requestTotal, setRequestTotal] = useState(0);
  const [urgentNotifyRows, setUrgentNotifyRows] = useState<DepartmentHiringRequestRow[]>([]);

  // Pagination State
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadJobs = useCallback(async () => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      setJobs([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error, totalCount: count } = await fetchJobPostings({
      page,
      pageSize: PAGE_SIZE,
      searchQuery: debouncedSearchQuery || undefined,
    });
    if (error) {
      toast.error(error);
    } else {
      setJobs(data);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  }, [authReady, debouncedSearchQuery, isAuthenticated, page]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const filteredJobs = jobs; // server side filtering

  const handleCreateJob = async (data: CreateJobPostingInput) => {
    setIsSubmitting(true);
    const { data: newJob, error } = await createJobPosting(data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Job posting created successfully');
      setJobs([newJob, ...jobs]);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setShowCreateForm(true);
    setShowDetailView(false);
  };

  const handleUpdateJob = async (data: CreateJobPostingInput) => {
    if (!editingJob) return;
    setIsSubmitting(true);
    const { data: updatedJob, error } = await updateJobPosting(editingJob.id, data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Job posting updated successfully');
      setJobs(jobs.map(j => j.id === editingJob.id ? updatedJob : j));
      setEditingJob(null);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setIsSubmitting(true);
    const { error } = await deleteJobPosting(jobToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Job posting deleted successfully');
      setJobs(jobs.filter(j => j.id !== jobToDelete.id));
      setShowDeleteConfirm(false);
      setJobToDelete(null);
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (job: JobPosting) => {
    const { data: updatedJob, error } = await toggleJobPostingStatus(job.id, job.is_active);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Job posting ${updatedJob?.is_active ? 'activated' : 'deactivated'}`);
      setJobs(jobs.map(j => j.id === job.id ? updatedJob : j));
    }
  };

  const handleViewDetail = (job: JobPosting) => {
    setSelectedJob(job);
    setShowDetailView(true);
  };

  const statusClassMap: Record<string, string> = {
    pending: 'bg-red-100 text-red-700 border-red-200',
    queue: 'bg-amber-100 text-amber-700 border-amber-200',
    waiting_applicant: 'bg-sky-100 text-sky-700 border-sky-200',
    hiring: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-slate-100 text-slate-700 border-slate-200',
    hired: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const statusLabelMap: Record<string, string> = {
    pending: 'Pending',
    queue: 'Queue',
    waiting_applicant: 'Waiting Applicant',
    hiring: 'Hiring',
    approved: 'Approved',
    rejected: 'Rejected',
    hired: 'Hired',
  };

  const requestTotalPages = Math.max(1, Math.ceil(requestTotal / REQUEST_MODAL_PAGE_SIZE));
  const hasUrgentRequests = urgentNotifyRows.length > 0;

  const loadUrgentNotifySample = useCallback(async () => {
    try {
      const rows = await fetchUrgentDepartmentHiringRequestsForNotify(15);
      setUrgentNotifyRows(rows);
    } catch {
      setUrgentNotifyRows([]);
    }
  }, []);

  const loadDepartmentRequestsPage = useCallback(async () => {
    if (!showDepartmentRequestsModal) return;
    setRequestLoading(true);
    try {
      const { items, total } = await fetchDepartmentHiringRequestsPaged({
        page: requestPage,
        perPage: REQUEST_MODAL_PAGE_SIZE,
        statusFilter: requestFilter,
      });
      setDepartmentHiringRequests(items);
      setRequestTotal(total);
      setRequestStatusDrafts((prev) => {
        const next = { ...prev };
        items.forEach((row) => {
          if (!next[row.id]) next[row.id] = row.request_status;
        });
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load hiring requests';
      if (message.toLowerCase().includes("could not find the table 'public.hr_staff_requests'")) {
        try {
          const { items, total } = await fetchDepartmentHiringRequestsPagedViaApi({
            page: requestPage,
            perPage: REQUEST_MODAL_PAGE_SIZE,
            statusFilter: requestFilter,
          });
          setDepartmentHiringRequests(items);
          setRequestTotal(total);
          return;
        } catch (apiError) {
          toast.error(apiError instanceof Error ? apiError.message : 'Failed to load hiring requests');
        }
      } else {
        toast.error(message);
      }
      setDepartmentHiringRequests([]);
      setRequestTotal(0);
    } finally {
      setRequestLoading(false);
    }
  }, [showDepartmentRequestsModal, requestPage, requestFilter, REQUEST_MODAL_PAGE_SIZE]);

  const handleUpdateDepartmentRequest = async (requestId: number) => {
    const nextStatus = requestStatusDrafts[requestId];
    if (!nextStatus) return;
    const row = departmentHiringRequests.find((r) => r.id === requestId);
    if (!row) return;
    const previousStatus = row.request_status;
    if (nextStatus === previousStatus) {
      toast.info('Choose a different status, then click Apply.');
      return;
    }
    setUpdatingRequestId(requestId);
    try {
      await updateDepartmentHiringRequestStatus({ id: requestId, requestStatus: nextStatus, decidedBy: 'HR Admin' });
      const auto = await createJobPostingForHiringRequestIfNeeded(row, previousStatus, nextStatus);
      await Promise.all([loadDepartmentRequestsPage(), loadUrgentNotifySample()]);
      if (auto.created) {
        await loadJobs();
        toast.success('Request updated. A job posting was created from this request.');
      } else {
        toast.success('Request status updated');
      }
      if (auto.error) {
        toast.warning(auto.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update request status');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  useEffect(() => {
    urgentNotifyRows.forEach((item) => {
      const notifyKey = `hr_department_request_notified_${item.id}_${item.request_status}`;
      if (localStorage.getItem(notifyKey) === '1') {
        return;
      }

      window.dispatchEvent(
        new CustomEvent('hr:department-request', {
          detail: {
            title: `Urgent request: ${item.department_name}`,
            detail: `${item.staff_name} (${hiringRequestRoleLabel(item.role_type)}) is ${statusLabelMap[item.request_status] || item.request_status}`,
          },
        })
      );

      localStorage.setItem(notifyKey, '1');
    });
  }, [urgentNotifyRows, statusLabelMap]);

  useEffect(() => {
    void loadUrgentNotifySample();
    const timer = window.setInterval(() => {
      void loadUrgentNotifySample();
    }, 12000);
    return () => window.clearInterval(timer);
  }, [loadUrgentNotifySample]);

  useEffect(() => {
    if (!showDepartmentRequestsModal) return;
    void loadDepartmentRequestsPage();
  }, [showDepartmentRequestsModal, loadDepartmentRequestsPage]);

  useEffect(() => {
    setRequestPage(1);
  }, [requestFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Job Postings</h1>
          <p>Manage job openings and requirements</p>
        </div>
        <Button 
          onClick={() => {
            setEditingJob(null);
            setShowCreateForm(true);
          }} 
          className="btn-primary-gradient"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Job Posting
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setShowDepartmentRequestsModal(true)}
          className={
            hasUrgentRequests
              ? 'border-red-400 text-red-800 bg-red-50 shadow-sm ring-2 ring-red-400/40 hover:bg-red-100'
              : undefined
          }
        >
          {hasUrgentRequests ? (
            <span className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full bg-red-600" aria-hidden />
          ) : null}
          View Department Hiring Requests
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Position</th>
              <th>Deadline</th>
              <th>Salary Range</th>
              <th>Status</th>
              <th className="w-12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading job postings...
                </td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No matching job postings found' : 'No job postings yet. Click "Create Job Posting" to get started.'}
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td className="font-medium">{job.title}</td>
                  <td>{job.positions?.title || '-'}</td>
                  <td>{job.deadline ? new Date(job.deadline).toLocaleDateString() : '-'}</td>
                  <td>
                    {job.salary_range_min && job.salary_range_max
                      ? `${formatCurrencyPHP(job.salary_range_min, { maximumFractionDigits: 0 })} - ${formatCurrencyPHP(job.salary_range_max, { maximumFractionDigits: 0 })}`
                      : '-'}
                  </td>
                  <td>
                    <Badge className={job.is_active ? 'status-active' : 'bg-muted'}>
                      {job.is_active ? 'Open' : 'Closed'}
                    </Badge>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetail(job)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditJob(job)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(job)}
                        >
                          {job.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setJobToDelete(job);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalCount > 0 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(1)}
                disabled={page === 1 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium">
                Page {page} of {Math.ceil(totalCount / PAGE_SIZE) || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / PAGE_SIZE) || 1, p + 1))}
                disabled={page === (Math.ceil(totalCount / PAGE_SIZE) || 1) || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(Math.ceil(totalCount / PAGE_SIZE) || 1)}
                disabled={page === (Math.ceil(totalCount / PAGE_SIZE) || 1) || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <JobPostingForm
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) setEditingJob(null);
        }}
        onSubmit={editingJob ? handleUpdateJob : handleCreateJob}
        initialData={editingJob}
        isLoading={isSubmitting}
      />

      {/* Detail View Modal */}
      <JobPostingDetail
        open={showDetailView}
        onOpenChange={setShowDetailView}
        data={selectedJob}
        onEdit={handleEditJob}
        onDelete={async (id) => {
          setJobToDelete(selectedJob);
          setShowDetailView(false);
          setShowDeleteConfirm(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={showDepartmentRequestsModal}
        onOpenChange={(open) => {
          setShowDepartmentRequestsModal(open);
          if (open) {
            setRequestPage(1);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              Department Hiring / Employee Requests
              {hasUrgentRequests ? (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900 font-normal">
                  New pending requests
                </Badge>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Filter request urgency/status</p>
            <div className="flex items-center gap-2 w-full max-w-[240px]">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={requestFilter}
                onValueChange={(value: 'all' | DepartmentHiringRequestStatus) => {
                  setRequestFilter(value);
                  setRequestPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="queue">Queue</SelectItem>
                  <SelectItem value="waiting_applicant">Waiting Applicant</SelectItem>
                  <SelectItem value="hiring">Hiring</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {requestLoading ? (
              <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
                Loading department requests...
              </div>
            ) : null}
            {departmentHiringRequests.map((item) => (
                <div
                  key={String(item.id)}
                  className="rounded-lg border border-border/60 bg-card px-3 py-2 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {item.department_name} - {item.staff_name} ({hiringRequestRoleLabel(item.role_type)})
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Ref {item.request_reference} · Requested by {item.requested_by || 'Department'} · {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusClassMap[item.request_status]}>{statusLabelMap[item.request_status]}</Badge>
                    <Select
                      value={requestStatusDrafts[item.id] || item.request_status}
                      onValueChange={(value: DepartmentHiringRequestStatus) =>
                        setRequestStatusDrafts((prev) => ({ ...prev, [item.id]: value }))
                      }
                    >
                      <SelectTrigger className="h-8 w-[165px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="queue">Queue</SelectItem>
                        <SelectItem value="waiting_applicant">Waiting Applicant</SelectItem>
                        <SelectItem value="hiring">Hiring</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="hired">Hired (close request)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingRequestId === item.id}
                      onClick={() => void handleUpdateDepartmentRequest(item.id)}
                    >
                      {updatingRequestId === item.id ? 'Saving...' : 'Apply'}
                    </Button>
                  </div>
                </div>
              ))}
            {!requestLoading && departmentHiringRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
                No requests match this filter.
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 mt-2">
            <span className="text-xs text-muted-foreground">
              Page {requestPage} of {requestTotalPages}
              {requestTotal > 0 ? ` · ${requestTotal} total` : ''}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={requestLoading || requestPage <= 1}
                onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={requestLoading || requestPage >= requestTotalPages}
                onClick={() => setRequestPage((p) => Math.min(requestTotalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


