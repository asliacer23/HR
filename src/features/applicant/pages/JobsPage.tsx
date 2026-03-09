import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Briefcase, Clock, Loader2, CheckCircle } from 'lucide-react';
import { PesoSign } from '@/components/icons/PesoSign';
import { FileUpload } from '@/features/shared/components/FileUpload';
import { FileViewer } from '@/features/shared/components/FileViewer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  deadline: string | null;
  positions?: { title: string; departments?: { name: string } | null } | null;
}

interface Applicant {
  id: string;
  resume_url: string | null;
}

interface Application {
  job_posting_id: string;
}

export function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');

  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchApplicantData();
    }
  }, [user]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('job_postings')
      .select('*, positions(title, departments(name))')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) toast.error('Failed to fetch jobs');
    else setJobs(data || []);
    setIsLoading(false);
  };

  const fetchApplicantData = async () => {
    if (!user) return;

    // Get or create applicant record
    let { data: applicantData } = await supabase
      .from('applicants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!applicantData) {
      const { data: newApplicant, error } = await supabase
        .from('applicants')
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (!error) applicantData = newApplicant;
    }

    if (applicantData) {
      setApplicant(applicantData);

      // Fetch existing applications
      const { data: applications } = await supabase
        .from('job_applications')
        .select('job_posting_id')
        .eq('applicant_id', applicantData.id);

      setMyApplications(applications || []);
    }
  };

  const hasApplied = (jobId: string) => {
    return myApplications.some(app => app.job_posting_id === jobId);
  };

  const handleApply = (job: JobPosting) => {
    setSelectedJob(job);
    setCoverLetter('');
    setResumeUrl('');
    setIsApplyDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!applicant || !selectedJob) return;

    setIsSubmitting(true);
    const jobId = selectedJob.id;

    const { error } = await supabase.from('job_applications').insert({
      applicant_id: applicant.id,
      job_posting_id: jobId,
      status: 'applied',
    });

    if (error) {
      toast.error('Failed to submit application');
    } else {
      // Update applicant cover letter if provided
      if (coverLetter) {
        await supabase
          .from('applicants')
          .update({ cover_letter: coverLetter })
          .eq('id', applicant.id);
      }

      toast.success('Application submitted successfully!');
      setIsApplyDialogOpen(false);
      setMyApplications((prev) => {
        const ids = new Set(prev.map(app => app.job_posting_id));
        ids.add(jobId);
        return Array.from(ids).map(id => ({ job_posting_id: id }));
      });
      fetchApplicantData();
    }

    setIsSubmitting(false);
  };

  const handleResumeUpload = async (url: string, fileName?: string) => {
    if (!applicant) return;

    // Store resume upload for this application attempt
    await supabase
      .from('applicant_documents')
      .insert({
        applicant_id: applicant.id,
        document_name: fileName || 'Resume',
        document_url: url,
        document_type: 'resume'
      });

    setResumeUrl(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Available Positions</h1>
        <p>Browse and apply for job openings at Bestlink College</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="card-elevated p-8 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No job openings available at the moment.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="card-elevated p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      {job.positions?.departments?.name && (
                        <p className="text-sm text-muted-foreground">
                          {job.positions.departments.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-muted-foreground mt-3 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                    {(job.salary_range_min || job.salary_range_max) && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <PesoSign className="h-4 w-4" />
                        {formatCurrency(job.salary_range_min || 0)} - {formatCurrency(job.salary_range_max || 0)}
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasApplied(job.id) ? (
                    <Badge className="status-applied">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Applied
                    </Badge>
                  ) : (
                    <Button
                      className="btn-primary-gradient"
                      onClick={() => handleApply(job)}
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Apply Dialog */}
      <Dialog
        open={isApplyDialogOpen}
        onOpenChange={(open) => {
          setIsApplyDialogOpen(open);
          if (!open) {
            setSelectedJob(null);
            setCoverLetter('');
            setResumeUrl('');
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Complete your application by uploading your resume and cover letter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Job Details */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Position Details</h4>
              <p className="text-sm text-muted-foreground">{selectedJob?.description}</p>
              
              {selectedJob?.requirements && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium">Requirements:</h5>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {selectedJob.requirements}
                  </p>
                </div>
              )}
            </div>

            {/* Resume Upload */}
            <div className="space-y-3">
              <Label>Resume / CV *</Label>
              {resumeUrl ? (
                <FileViewer
                  url={resumeUrl}
                  fileName="My Resume"
                  showDelete
                  onDelete={() => {
                    setResumeUrl('');
                  }}
                />
              ) : (
                user && (
                  <FileUpload
                    userId={user.id}
                    folder="resumes"
                    onUploadComplete={(url, fileName) => handleResumeUpload(url, fileName)}
                    accept=".pdf,.doc,.docx"
                  />
                )
              )}
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <Label>Cover Letter (Optional)</Label>
              <Textarea
                placeholder="Tell us why you're a great fit for this position..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmitApplication}
              disabled={!resumeUrl || isSubmitting}
              className="w-full btn-primary-gradient"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>

            {!resumeUrl && (
              <p className="text-sm text-destructive text-center">
                Please upload your resume before applying.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}






