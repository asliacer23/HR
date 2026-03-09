import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, UserCheck, Calendar, X, FileText } from 'lucide-react';
import { STATUS_LABELS, ApplicationStatus } from '@/lib/constants';
import { FileViewer } from '@/features/shared/components/FileViewer';
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

export function ApplicantsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [applicantDocuments, setApplicantDocuments] = useState<Record<string, any[]>>({});
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);

    // Fetch applications
    const { data: apps, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        applicants!inner (
          id,
          user_id,
          resume_url,
          years_experience,
          education_level,
          cover_letter,
          skills
        ),
        job_postings (
          title,
          positions (title)
        )
      `)
      .order('applied_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch applications');
      setIsLoading(false);
      return;
    }

    // Fetch profiles for applicants
    const userIds = (apps || []).map(a => a.applicants.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email, phone')
      .in('user_id', userIds);

    // Fetch all applicant documents
    const applicantIds = (apps || []).map(a => a.applicants.id);
    const { data: documents } = await supabase
      .from('applicant_documents')
      .select('*')
      .in('applicant_id', applicantIds);

    // Map documents by applicant_id
    const docsMap: Record<string, any[]> = {};
    (documents || []).forEach(doc => {
      if (!docsMap[doc.applicant_id]) {
        docsMap[doc.applicant_id] = [];
      }
      docsMap[doc.applicant_id].push(doc);
    });
    setApplicantDocuments(docsMap);

    const appsWithProfiles = (apps || []).map(app => ({
      ...app,
      applicants: {
        ...app.applicants,
        profiles: profiles?.find(p => p.user_id === app.applicants.user_id),
      },
    }));

    setApplications(appsWithProfiles as ApplicationWithDetails[]);
    setIsLoading(false);
  };

  const handleViewDetails = (app: ApplicationWithDetails) => {
    setSelectedApp(app);
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

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied': return 'status-applied';
      case 'interview': return 'status-interview';
      case 'hired': return 'status-hired';
      case 'rejected': return 'status-rejected';
      default: return 'bg-muted';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.applicants.profiles?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicants.profiles?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicants.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_postings.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Job Applications</h1>
        <p>Review and manage applicant submissions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
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
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
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
                        {app.applicants.profiles?.first_name} {app.applicants.profiles?.last_name}
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
              <div className="flex items-center justify-between pt-4 border-t">
                <Badge className={getStatusColor(selectedApp.status)}>
                  Current: {STATUS_LABELS[selectedApp.status]}
                </Badge>

                <div className="flex gap-2">
                  {selectedApp.status === 'applied' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsScheduleOpen(true)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Interview
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleUpdateStatus('rejected')}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedApp.status === 'interview' && (
                    <>
                      <Button
                        className="btn-primary-gradient"
                        onClick={() => handleUpdateStatus('hired')}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Hire Applicant
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleUpdateStatus('rejected')}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
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
    </div>
  );
}
