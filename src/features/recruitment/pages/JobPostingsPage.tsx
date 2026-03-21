import { formatCurrencyPHP } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
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

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!isAuthenticated) {
      setJobs([]);
      setIsLoading(false);
      return;
    }

    loadJobs();
  }, [authReady, isAuthenticated]);

  const loadJobs = async () => {
    setIsLoading(true);
    const { data, error } = await fetchJobPostings();
    if (error) {
      toast.error(error);
    } else {
      setJobs(data);
    }
    setIsLoading(false);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    </div>
  );
}


