import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Edit, Eye, Trash2, Loader2, UserPlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Interview {
  id: string;
  scheduled_date: string;
  location: string | null;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
  application_id: string;
  manual_applicant_name?: string | null;
  job_applications?: {
    id?: string;
    applicant_id?: string;
    status?: string;
    notes?: string | null;
    applicants?: {
      id?: string;
      user_id?: string;
      profiles?: {
        first_name: string;
        last_name: string;
      };
    };
    job_postings?: {
      title: string;
      salary_range_min?: number | null;
      salary_range_max?: number | null;
      positions?: {
        id: string;
        title: string;
        department_id: string | null;
      } | null;
    };
  };
}

export function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [pendingAcceptInterview, setPendingAcceptInterview] = useState<Interview | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [acceptingInterviewId, setAcceptingInterviewId] = useState<string | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    scheduled_date: '',
    location: '',
    is_completed: false,
    notes: '',
  });

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

  const fetchInterviews = useCallback(async () => {
    setIsLoading(true);
    try {
      let matchingApplicationIds: string[] = [];
      let hasSearchFilter = false;

      if (debouncedSearchQuery) {
        hasSearchFilter = true;
        const searchPattern = `%${debouncedSearchQuery}%`;
        
        // Search Profiles
        const { data: profiles } = await supabase.from('profiles').select('user_id').or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`);
        const userIds = profiles?.map(p => p.user_id) || [];
        const { data: applicants } = await supabase.from('applicants').select('id').in('user_id', userIds);
        const applicantIds = applicants?.map(a => a.id) || [];
        
        // Search Job Postings
        const { data: jobPostings } = await supabase.from('job_postings').select('id').ilike('title', searchPattern);
        const jobPostingIds = jobPostings?.map(j => j.id) || [];

        // Match Job Applications
        if (applicantIds.length > 0 || jobPostingIds.length > 0) {
          let appQuery = supabase.from('job_applications').select('id');
          const orClauses: string[] = [];
          if (applicantIds.length > 0) orClauses.push(`applicant_id.in.(${applicantIds.join(',')})`);
          if (jobPostingIds.length > 0) orClauses.push(`job_posting_id.in.(${jobPostingIds.join(',')})`);
          appQuery = appQuery.or(orClauses.join(','));
          const { data: apps } = await appQuery;
          matchingApplicationIds = apps?.map(a => a.id) || [];
        }
      }

      let query = supabase
        .from('interview_schedules')
        .select('*', { count: 'exact' });

      if (hasSearchFilter) {
        const orStr = [`location.ilike.%${debouncedSearchQuery}%`];
        if (matchingApplicationIds.length > 0) {
          orStr.push(`application_id.in.(${matchingApplicationIds.join(',')})`);
        }
        query = query.or(orStr.join(','));
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: interviewsData, error: interviewsError, count } = await query
        .order('scheduled_date', { ascending: true })
        .range(from, to);

      if (interviewsError) {
        toast.error('Failed to fetch interviews');
        setIsLoading(false);
        return;
      }

      setTotalCount(count || 0);

      if (!interviewsData || interviewsData.length === 0) {
        setInterviews([]);
        setIsLoading(false);
        return;
      }

      const applicationIds = [...new Set(interviewsData.map(i => i.application_id))].filter(Boolean);

      // Fetch related job applications for this page
      const { data: applicationsData } = await supabase
        .from('job_applications')
        .select('*')
        .in('id', applicationIds);

      // Get unique IDs for related data
      const applicantIds = [...new Set((applicationsData || []).map(a => a.applicant_id))].filter(Boolean);
      const jobPostingIds = [...new Set((applicationsData || []).map(a => a.job_posting_id))].filter(Boolean);

      const [
        { data: applicantsDataResult },
        { data: jobPostingsDataResult },
        { data: positionsDataResult }
      ] = await Promise.all([
        supabase.from('applicants').select('*').in('id', applicantIds),
        supabase.from('job_postings').select('*').in('id', jobPostingIds),
        supabase.from('positions').select('id, title')
      ]);

      // Fetch profiles
      const userIds = (applicantsDataResult || []).map(a => a.user_id).filter(Boolean);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

      // Combine the data
      const interviewsWithDetails = (interviewsData || []).map(interview => {
        const application = (applicationsData || []).find(a => a.id === interview.application_id);
        const applicant = (applicantsDataResult || []).find(a => a.id === application?.applicant_id);
        const profile = (profilesData || []).find(p => p.user_id === applicant?.user_id);
        const jobPosting = (jobPostingsDataResult || []).find(j => j.id === application?.job_posting_id);
        const position = (positionsDataResult || []).find(p => p.id === jobPosting?.position_id);
        const manualName = typeof application?.notes === 'string' && application.notes.startsWith('HR_MANUAL_APPLICANT:')
          ? application.notes.replace('HR_MANUAL_APPLICANT:', '').trim()
          : null;

        return {
          ...interview,
          manual_applicant_name: manualName,
          job_applications: {
            ...application,
            applicants: {
              ...applicant,
              profiles: profile,
            },
            job_postings: {
              ...jobPosting,
              positions: position,
            },
          },
        };
      });

      setInterviews(interviewsWithDetails);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to fetch interviews');
    }
    setIsLoading(false);
  }, [debouncedSearchQuery, page]);

  useEffect(() => {
    void fetchInterviews();
  }, [fetchInterviews]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const handleViewInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsViewOpen(true);
  };

  const handleEditClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setEditFormData({
      scheduled_date: interview.scheduled_date.split('T')[0],
      location: interview.location || '',
      is_completed: interview.is_completed,
      notes: interview.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsDeleteOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInterview) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('interview_schedules')
        .update({
          scheduled_date: new Date(editFormData.scheduled_date).toISOString(),
          location: editFormData.location || null,
          is_completed: editFormData.is_completed,
          notes: editFormData.notes || null,
        })
        .eq('id', selectedInterview.id);

      if (error) {
        toast.error('Failed to update interview');
      } else {
        toast.success('Interview updated successfully');
        setIsEditOpen(false);
        fetchInterviews();
      }
    } catch (error) {
      console.error('Error updating interview:', error);
      toast.error('Failed to update interview');
    }
    setIsSaving(false);
  };

  const handleDeleteInterview = async () => {
    if (!selectedInterview) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('interview_schedules')
        .delete()
        .eq('id', selectedInterview.id);

      if (error) {
        toast.error('Failed to delete interview');
      } else {
        toast.success('Interview deleted successfully');
        setIsDeleteOpen(false);
        fetchInterviews();
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error('Failed to delete interview');
    }
    setIsSaving(false);
  };

  const handleAcceptApplicant = async (interview: Interview) => {
    const applicationId = interview.job_applications?.id || interview.application_id;
    if (!applicationId) {
      toast.error('Missing application data');
      return;
    }

    setAcceptingInterviewId(interview.id);
    try {
      const { error: hireError } = await supabase
        .from('job_applications')
        .update({
          status: 'hired',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (hireError) {
        toast.error(hireError.message || 'Failed to mark applicant as hired');
        return;
      }

      toast.success('Applicant accepted. It is now available in Employees user account selection.');
      await fetchInterviews();
    } catch (error) {
      console.error('Failed to accept applicant:', error);
      toast.error('Failed to accept applicant');
    } finally {
      setAcceptingInterviewId(null);
    }
  };

  const filteredInterviews = interviews; // server side filtering

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Interviews</h1>
          <p>Schedule and manage interviews</p>
        </div>
        
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search interviews..."
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
              <th>Candidate</th>
              <th>Position</th>
              <th>Date & Time</th>
              <th>Location</th>
              <th>Status</th>
              <th>Notes</th>
              <th className="w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  Loading interviews...
                </td>
              </tr>
            ) : filteredInterviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No interviews scheduled
                </td>
              </tr>
            ) : (
              filteredInterviews.map((interview) => (
                <tr key={interview.id}>
                  <td className="font-medium">
                    {interview.manual_applicant_name ||
                      `${interview.job_applications?.applicants?.profiles?.first_name || ''} ${interview.job_applications?.applicants?.profiles?.last_name || ''}`.trim() ||
                      'Applicant'}
                  </td>
                  <td>{interview.job_applications?.job_postings?.title || '-'}</td>
                  <td className="font-medium">
                    {new Date(interview.scheduled_date).toLocaleString()}
                  </td>
                  <td>{interview.location || '-'}</td>
                  <td>
                    <Badge className={interview.is_completed ? 'status-completed' : 'status-pending'}>
                      {interview.is_completed ? 'Completed' : 'Scheduled'}
                    </Badge>
                  </td>
                  <td className="max-w-xs truncate">{interview.notes || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewInterview(interview)}
                        title="View interview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(interview)}
                        title="Edit interview"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(interview)}
                        title="Delete interview"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPendingAcceptInterview(interview);
                          setIsAcceptOpen(true);
                        }}
                        title="Accept applicant and add employee"
                        disabled={acceptingInterviewId === interview.id || interview.job_applications?.status === 'hired'}
                      >
                        {acceptingInterviewId === interview.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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

      {/* View Interview Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Candidate</Label>
                <p className="font-medium">
                  {selectedInterview.manual_applicant_name ||
                    `${selectedInterview.job_applications?.applicants?.profiles?.first_name || ''} ${selectedInterview.job_applications?.applicants?.profiles?.last_name || ''}`.trim() ||
                    'Applicant'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Position</Label>
                <p className="font-medium">
                  {selectedInterview.job_applications?.job_postings?.title || '-'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date & Time</Label>
                <p className="font-medium">
                  {new Date(selectedInterview.scheduled_date).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Location</Label>
                <p className="font-medium">{selectedInterview.location || '-'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge className={selectedInterview.is_completed ? 'status-completed' : 'status-pending'}>
                  {selectedInterview.is_completed ? 'Completed' : 'Scheduled'}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="font-medium text-sm">{selectedInterview.notes || '-'}</p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Interview Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Interview</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Candidate</Label>
                <p className="font-medium">
                  {selectedInterview.manual_applicant_name ||
                    `${selectedInterview.job_applications?.applicants?.profiles?.first_name || ''} ${selectedInterview.job_applications?.applicants?.profiles?.last_name || ''}`.trim() ||
                    'Applicant'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editFormData.scheduled_date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, scheduled_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Room 401"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Interview notes..."
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  className="min-h-24"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="completed"
                  checked={editFormData.is_completed}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, is_completed: e.target.checked })
                  }
                />
                <Label htmlFor="completed" className="font-normal">
                  Mark as completed
                </Label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Interview</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this interview with{' '}
            <strong>
              {selectedInterview?.manual_applicant_name ||
                `${selectedInterview?.job_applications?.applicants?.profiles?.first_name || ''} ${selectedInterview?.job_applications?.applicants?.profiles?.last_name || ''}`.trim() ||
                'Applicant'}
            </strong>
            ? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInterview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept Confirmation Dialog */}
      <AlertDialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Accept Applicant</AlertDialogTitle>
          <AlertDialogDescription>
            Accept this applicant now? This action is one-time only and will set the application status to hired.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAcceptInterview) {
                  void handleAcceptApplicant(pendingAcceptInterview);
                }
                setPendingAcceptInterview(null);
              }}
            >
              Confirm Accept
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
