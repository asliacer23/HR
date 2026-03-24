import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, UserCheck, Calendar, X, Plus, Loader2, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { STATUS_LABELS, ApplicationStatus } from '@/lib/constants';
import { FileViewer } from '@/features/shared/components/FileViewer';
import { useAuth } from '@/features/auth/context/AuthContext';
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
import { toast } from 'sonner';

interface ApplicationWithDetails {
  id: string;
  status: ApplicationStatus;
  applied_at: string;
  notes: string | null;
  applicant_id: string;
  job_posting_id: string;
  manual_applicant_name?: string | null;
  applicants: {
    id: string;
    user_id: string;
    resume_url: string | null;
    years_experience: number;
    education_level: string | null;
    cover_letter: string | null;
    skills: string[] | null;
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
    };
  };
  job_postings: {
    title: string;
    positions?: { title: string } | null;
  };
}

interface JobPostingOption {
  id: string;
  title: string;
}

export function ApplicantsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [jobPostingOptions, setJobPostingOptions] = useState<JobPostingOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
  const [isCreatingApplicant, setIsCreatingApplicant] = useState(false);
  const [editableStatus, setEditableStatus] = useState<ApplicationStatus>('applied');
  const [applicantDocuments, setApplicantDocuments] = useState<Record<string, any[]>>({});
  
  // Pagination State
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    location: '',
    notes: '',
  });
  const [newApplicantData, setNewApplicantData] = useState({
    job_posting_id: '',
    applicant_name: '',
    years_experience: '',
    interview_date: '',
  });
  const acceptedApplications = applications.filter((app) => app.status === 'hired');

  useEffect(() => {
    fetchApplications();
  }, [page]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchApplications();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (isAddApplicantOpen) {
      fetchJobPostingOptions();
    }
  }, [isAddApplicantOpen]);

  const fetchJobPostingOptions = async () => {
    const { data, error } = await supabase
      .from('job_postings')
      .select('id, title')
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (error) {
      toast.error('Failed to load job postings');
      setJobPostingOptions([]);
      return;
    }
    setJobPostingOptions(data || []);
  };

  const fetchApplications = async () => {
    setIsLoading(true);

    let matchingApplicantIds: string[] = [];
    let matchingJobPostingIds: string[] = [];
    let hasSearchFilter = false;

    // 1. Initial lookup if search query exists
    if (searchQuery.trim()) {
      hasSearchFilter = true;
      const searchPattern = `%${searchQuery}%`;
      
      // Search Profiles
      const { data: matchingProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`);
      
      if (matchingProfiles && matchingProfiles.length > 0) {
        const userIds = matchingProfiles.map(p => p.user_id);
        const { data: applicants } = await supabase.from('applicants').select('id').in('user_id', userIds);
        if (applicants) matchingApplicantIds = applicants.map(a => a.id);
      }

      // Search Job Postings
      const { data: jobPostings } = await supabase
        .from('job_postings')
        .select('id')
        .ilike('title', searchPattern);
      
      if (jobPostings) matchingJobPostingIds = jobPostings.map(j => j.id);
    }

    // 2. Query Job Applications
    let query = supabase
      .from('job_applications')
      .select('*', { count: 'exact' });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as NonNullable<ApplicationStatus>);
    }

    if (hasSearchFilter) {
      if (matchingApplicantIds.length === 0 && matchingJobPostingIds.length === 0) {
        // Search term didn't match any Applicant or Job Posting, return empty
        setApplications([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }
      
      let orStrings = [];
      if (matchingApplicantIds.length > 0) {
        orStrings.push(`applicant_id.in.(${matchingApplicantIds.join(',')})`);
      }
      if (matchingJobPostingIds.length > 0) {
        orStrings.push(`job_posting_id.in.(${matchingJobPostingIds.join(',')})`);
      }
      query = query.or(orStrings.join(','));
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: apps, error, count } = await query
      .order('applied_at', { ascending: false })
      .range(from, to);

    if (error) {
      toast.error('Failed to fetch applications');
      setIsLoading(false);
      return;
    }

    setTotalCount(count || 0);

    // Fetch related data for the current page only
    const applicantIds = (apps || []).map(a => a.applicant_id).filter(Boolean);
    const jobPostingIds = (apps || []).map(a => a.job_posting_id).filter(Boolean);

    if (apps && apps.length === 0) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    const [
      { data: applicantsData },
      { data: jobPostingsData },
      { data: positionsData }
    ] = await Promise.all([
      supabase.from('applicants').select('*').in('id', applicantIds),
      supabase.from('job_postings').select('id, title, position_id').in('id', jobPostingIds),
      supabase.from('positions').select('id, title')
    ]);

    // Fetch profiles for the current page's applicants
    const userIds = (applicantsData || []).map(a => a.user_id).filter(Boolean);
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, phone')
        .in('user_id', userIds);
      profiles = data || [];
    }

    // Fetch documents for the current page's applicants
    const docsMap: Record<string, any[]> = {};
    if (applicantIds.length > 0) {
      const { data: documents } = await supabase
        .from('applicant_documents')
        .select('*')
        .in('applicant_id', applicantIds);
        
      (documents || []).forEach(doc => {
        if (!docsMap[doc.applicant_id]) {
          docsMap[doc.applicant_id] = [];
        }
        docsMap[doc.applicant_id].push(doc);
      });
    }
    setApplicantDocuments(docsMap);

    const appsWithProfiles = (apps || []).map(app => {
      const applicant = applicantsData?.find(a => a.id === app.applicant_id);
      const jobPosting = jobPostingsData?.find(j => j.id === app.job_posting_id);
      const position = positionsData?.find(p => p.id === jobPosting?.position_id);
      const manualName = typeof app.notes === 'string' && app.notes.startsWith('HR_MANUAL_APPLICANT:')
        ? app.notes.replace('HR_MANUAL_APPLICANT:', '').trim()
        : null;

      return {
        ...app,
        manual_applicant_name: manualName,
        applicants: {
          ...applicant,
          profiles: profiles?.find(p => p.user_id === applicant?.user_id),
        },
        job_postings: {
          ...jobPosting,
          positions: position,
        },
      };
    });

    setApplications(appsWithProfiles as ApplicationWithDetails[]);
    setIsLoading(false);
  };

  const handleViewDetails = (app: ApplicationWithDetails) => {
    setSelectedApp(app);
    setEditableStatus(app.status);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (!selectedApp) return;

    const { error } = await supabase
      .from('job_applications')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selectedApp.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Application ${STATUS_LABELS[newStatus].toLowerCase()}`);
      fetchApplications();
      setIsDetailsOpen(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedApp) return;
    await handleUpdateStatus(editableStatus);
  };

  const handleDeleteApplication = async () => {
    if (!selectedApp) return;

    const applicantName = selectedApp.manual_applicant_name
      || `${selectedApp.applicants.profiles?.first_name || ''} ${selectedApp.applicants.profiles?.last_name || ''}`.trim()
      || 'this applicant';
    const confirmed = window.confirm(`Delete application for ${applicantName}? This cannot be undone.`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', selectedApp.id);

    if (error) {
      toast.error(error.message || 'Failed to delete application');
      return;
    }

    toast.success('Application deleted successfully');
    setIsDetailsOpen(false);
    setSelectedApp(null);
    await fetchApplications();
  };

  const handleScheduleInterview = async () => {
    if (!selectedApp || !scheduleData.date || !scheduleData.time) {
      toast.error('Please fill in date and time');
      return;
    }

    const scheduledDate = new Date(`${scheduleData.date}T${scheduleData.time}`);

    const { error } = await supabase.from('interview_schedules').insert({
      application_id: selectedApp.id,
      scheduled_date: scheduledDate.toISOString(),
      location: scheduleData.location,
      notes: scheduleData.notes,
    });

    if (error) {
      toast.error('Failed to schedule interview');
      return;
    }

    // Update application status
    await supabase
      .from('job_applications')
      .update({ status: 'interview' })
      .eq('id', selectedApp.id);

    toast.success('Interview scheduled successfully');
    setIsScheduleOpen(false);
    setScheduleData({ date: '', time: '', location: '', notes: '' });
    fetchApplications();
    setIsDetailsOpen(false);
  };

  const resetAddApplicantForm = () => {
    setNewApplicantData({
      job_posting_id: '',
      applicant_name: '',
      years_experience: '',
      interview_date: '',
    });
  };

  const handleCreateApplicant = async () => {
    if (!newApplicantData.job_posting_id || !newApplicantData.applicant_name.trim() || !newApplicantData.interview_date) {
      toast.error('Please complete all required fields');
      return;
    }
    if (!user?.id) {
      toast.error('You must be logged in to add an applicant');
      return;
    }

    const trimmedName = newApplicantData.applicant_name.trim().replace(/\s+/g, ' ');
    const yearsExperience = Number.isFinite(Number(newApplicantData.years_experience))
      ? Number(newApplicantData.years_experience)
      : 0;

    setIsCreatingApplicant(true);

    try {
      // applicants.user_id is unique. Reuse the current user's applicant row
      // when it already exists; otherwise create a new applicant row.
      let applicantId = '';
      const { data: existingApplicant, error: existingApplicantError } = await supabase
        .from('applicants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingApplicantError) {
        toast.error(existingApplicantError.message || 'Failed to validate applicant record');
        return;
      }

      if (existingApplicant?.id) {
        applicantId = existingApplicant.id;
        // Keep applicant profile current based on latest form input.
        const { error: updateApplicantError } = await supabase
          .from('applicants')
          .update({
            years_experience: yearsExperience,
          })
          .eq('id', applicantId);

        if (updateApplicantError) {
          toast.error(updateApplicantError.message || 'Failed to update applicant record');
          return;
        }
      } else {
        const { data: createdApplicant, error: createApplicantError } = await supabase
          .from('applicants')
          .insert({
            // applicants.user_id has FK + unique constraint
            user_id: user.id,
            years_experience: yearsExperience,
            resume_url: null,
          })
          .select('id')
          .single();

        if (createApplicantError || !createdApplicant) {
          toast.error(createApplicantError?.message || 'Failed to create applicant record');
          return;
        }

        applicantId = createdApplicant.id;
      }

      const { data: createdApplication, error: applicationError } = await supabase
        .from('job_applications')
        .insert({
          applicant_id: applicantId,
          job_posting_id: newApplicantData.job_posting_id,
          status: 'interview',
          notes: `HR_MANUAL_APPLICANT:${trimmedName}`,
        })
        .select('id')
        .single();

      if (applicationError || !createdApplication) {
        toast.error(applicationError?.message || 'Failed to create job application');
        return;
      }

      const interviewDate = new Date(newApplicantData.interview_date);
      const { error: interviewError } = await supabase.from('interview_schedules').insert({
        application_id: createdApplication.id,
        scheduled_date: interviewDate.toISOString(),
        notes: 'Interview schedule created from Add New Applicant form.',
        is_completed: false,
      });

      if (interviewError) {
        toast.error(interviewError.message || 'Applicant created, but failed to create interview schedule');
        return;
      }

      // Confirm persistence from DB (not local state) before success toast.
      const { data: persistedInterview, error: persistedInterviewError } = await supabase
        .from('interview_schedules')
        .select('id')
        .eq('application_id', createdApplication.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (persistedInterviewError || !persistedInterview) {
        toast.error(persistedInterviewError?.message || 'Saved application, but interview record was not persisted');
        return;
      }

      toast.success('Applicant added and interview scheduled');
      setIsAddApplicantOpen(false);
      resetAddApplicantForm();
      setPage(1);
      await fetchApplications();
    } catch (error) {
      console.error('Failed to create applicant flow:', error);
      toast.error('Failed to add applicant');
    } finally {
      setIsCreatingApplicant(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied': return 'status-applied';
      case 'interview': return 'status-interview';
      case 'hired': return 'status-hired';
      case 'rejected': return 'status-rejected';
      default: return 'bg-muted';
    }
  };

  const filteredApplications = applications; // search matches handle server-side now

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Job Applications</h1>
        <p>Review and manage applicant submissions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="hired">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        </div>
        <Button
          type="button"
          className="btn-primary-gradient"
          onClick={() => setIsAddApplicantOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Applicant
        </Button>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Accepted Applicants</h3>
            <p className="text-sm text-muted-foreground">Applicants marked as hired and ready for employee onboarding</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = '/employees';
            }}
          >
            Proceed to Employee List
          </Button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Position Applied</th>
              <th>Experience</th>
              <th>Accepted</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {acceptedApplications.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-muted-foreground">
                  No accepted applicants yet
                </td>
              </tr>
            ) : (
              acceptedApplications.map((app) => (
                <tr key={`accepted-${app.id}`}>
                  <td>
                    <div>
                      <p className="font-medium">
                        {app.manual_applicant_name || `${app.applicants.profiles?.first_name || ''} ${app.applicants.profiles?.last_name || ''}`.trim() || 'Applicant'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.applicants.profiles?.email}
                      </p>
                    </div>
                  </td>
                  <td>{app.job_postings.title}</td>
                  <td>{app.applicants.years_experience} years</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td>
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(app)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Position Applied</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Applied</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading applications...
                </td>
              </tr>
            ) : filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No applications found
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div>
                      <p className="font-medium">
                        {app.manual_applicant_name || `${app.applicants.profiles?.first_name || ''} ${app.applicants.profiles?.last_name || ''}`.trim() || 'Applicant'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.applicants.profiles?.email}
                      </p>
                    </div>
                  </td>
                  <td>{app.job_postings.title}</td>
                  <td>{app.applicants.years_experience} years</td>
                  <td>
                    <Badge className={getStatusColor(app.status)}>
                      {STATUS_LABELS[app.status]}
                    </Badge>
                  </td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(app)}>
                        <Eye className="h-4 w-4" />
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

      {/* Application Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Applicant Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Name</Label>
                  <p className="font-medium">
                    {selectedApp.applicants.profiles?.first_name} {selectedApp.applicants.profiles?.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium">{selectedApp.applicants.profiles?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="font-medium">{selectedApp.applicants.profiles?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Experience</Label>
                  <p className="font-medium">{selectedApp.applicants.years_experience} years</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Education</Label>
                  <p className="font-medium">{selectedApp.applicants.education_level || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Position Applied</Label>
                  <p className="font-medium">{selectedApp.job_postings.title}</p>
                </div>
              </div>

              {/* Skills */}
              {selectedApp.applicants.skills && selectedApp.applicants.skills.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs">Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApp.applicants.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedApp.applicants.cover_letter && (
                <div>
                  <Label className="text-muted-foreground text-xs">Cover Letter</Label>
                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">
                    {selectedApp.applicants.cover_letter}
                  </p>
                </div>
              )}

              {/* Documents Section */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-semibold">Documents</Label>

                {/* Uploaded Documents */}
                {applicantDocuments[selectedApp.applicants.id] && applicantDocuments[selectedApp.applicants.id].length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Uploaded Documents</div>
                    <div className="space-y-2">
                      {applicantDocuments[selectedApp.applicants.id].map((doc) => (
                        <div key={doc.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{doc.document_name}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                {doc.document_type && (
                                  <span className="capitalize">{doc.document_type}</span>
                                )}
                                {doc.uploaded_at && (
                                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            {doc.document_url && (
                              <div className="flex-shrink-0">
                                <FileViewer url={doc.document_url} fileName={doc.document_name} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : applicantDocuments[selectedApp.applicants.id]?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                ) : null}
              </div>

              {/* Status & Actions */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(selectedApp.status)}>
                    Current: {STATUS_LABELS[selectedApp.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                  <div className="space-y-2">
                    <Label>Update Application Status</Label>
                    <Select
                      value={editableStatus}
                      onValueChange={(v) => setEditableStatus(v as ApplicationStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="hired">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setIsScheduleOpen(true)}
                    disabled={editableStatus !== 'applied'}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>

                  <Button
                    className="btn-primary-gradient"
                    onClick={handleSaveStatus}
                    disabled={editableStatus === selectedApp.status}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Save Status
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteApplication}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., HR Office, Room 201"
                value={scheduleData.location}
                onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Interview instructions or notes..."
                value={scheduleData.notes}
                onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
              />
            </div>
            <Button onClick={handleScheduleInterview} className="w-full btn-primary-gradient">
              Schedule Interview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Applicant Dialog */}
      <Dialog
        open={isAddApplicantOpen}
        onOpenChange={(open) => {
          setIsAddApplicantOpen(open);
          if (!open) resetAddApplicantForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Applicant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Job Posting *</Label>
              <Select
                value={newApplicantData.job_posting_id}
                onValueChange={(value) => setNewApplicantData((prev) => ({ ...prev, job_posting_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job posting" />
                </SelectTrigger>
                <SelectContent>
                  {jobPostingOptions.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Applicant Name *</Label>
              <Input
                placeholder="e.g., Juan Dela Cruz"
                value={newApplicantData.applicant_name}
                onChange={(e) => setNewApplicantData((prev) => ({ ...prev, applicant_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Experience (years) *</Label>
              <Input
                type="number"
                min={0}
                value={newApplicantData.years_experience}
                onChange={(e) => setNewApplicantData((prev) => ({ ...prev, years_experience: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Assign Interview Date *</Label>
              <Input
                type="datetime-local"
                value={newApplicantData.interview_date}
                onChange={(e) => setNewApplicantData((prev) => ({ ...prev, interview_date: e.target.value }))}
              />
            </div>

            <Button
              type="button"
              className="w-full btn-primary-gradient"
              onClick={handleCreateApplicant}
              disabled={isCreatingApplicant}
            >
              {isCreatingApplicant ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Applicant'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
