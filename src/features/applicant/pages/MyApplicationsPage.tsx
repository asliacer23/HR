import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Calendar, Eye, Briefcase, Download, Trash2, Upload, FileText, Loader2, MapPin, Clock } from 'lucide-react';
import { STATUS_LABELS, ApplicationStatus } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FileViewer } from '@/features/shared/components/FileViewer';
import { FileUpload } from '@/features/shared/components/FileUpload';
import { toast } from 'sonner';
import {
  fetchApplicantWithDocuments,
  uploadApplicantDocument,
  deleteApplicantDocument,
  updateDocumentName,
  ApplicantDocument,
} from '../services/applicantService';

interface Application {
  id: string;
  status: ApplicationStatus;
  applied_at: string;
  notes: string | null;
  job_postings: {
    id: string;
    title: string;
    description: string;
    positions?: { departments?: { name: string } | null } | null;
  };
  interview_schedules?: {
    scheduled_date: string;
    location: string | null;
    notes: string | null;
  }[];
}

export function MyApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<ApplicantDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ApplicantDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [docToRename, setDocToRename] = useState<ApplicantDocument | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [documentType, setDocumentType] = useState('other');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  useEffect(() => {
    if (selectedApp && user) {
      loadDocuments();
    }
  }, [selectedApp, user]);

  const fetchApplications = async () => {
    if (!user) return;

    // First get the applicant
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!applicant) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job_postings (
          id,
          title,
          description,
          positions (
            departments (name)
          )
        ),
        interview_schedules (
          scheduled_date,
          location,
          notes
        )
      `)
      .eq('applicant_id', applicant.id)
      .order('applied_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch applications');
    } else {
      setApplications(data || []);
    }
    setIsLoading(false);
  };

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    const { data, error } = await fetchApplicantWithDocuments(user?.id || '');
    if (error) {
      toast.error('Failed to load documents');
    } else if (data) {
      setDocuments(data.documents || []);
    }
    setIsLoadingDocs(false);
  };

  const handleUploadDoc = async (url: string, fileName?: string) => {
    if (!user) return;

    const { data: applicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!applicant) return;

    const { error } = await uploadApplicantDocument(
      applicant.id,
      fileName || 'Untitled Document',
      url,
      documentType
    );

    if (error) {
      toast.error('Failed to upload document');
    } else {
      toast.success('Document uploaded successfully');
      setIsUploadOpen(false);
      setDocumentType('other');
      loadDocuments();
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setIsDeleting(true);
    const { error } = await deleteApplicantDocument(docId);
    if (error) {
      toast.error('Failed to delete document');
    } else {
      toast.success('Document deleted');
      loadDocuments();
    }
    setIsDeleting(false);
  };

  const handleRenameDoc = async () => {
    if (!docToRename || !newDocName.trim()) return;

    const { error } = await updateDocumentName(docToRename.id, newDocName);
    if (error) {
      toast.error('Failed to rename document');
    } else {
      toast.success('Document renamed');
      setIsRenameOpen(false);
      setDocToRename(null);
      setNewDocName('');
      loadDocuments();
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'resume':
        return '📄';
      case 'certificate':
        return '🎓';
      case 'cover_letter':
        return '📝';
      case 'portfolio':
        return '🎨';
      case 'license':
        return '✅';
      default:
        return '📦';
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

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'interview':
        return <Calendar className="h-4 w-4" />;
      default:
        return <ClipboardList className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>My Applications</h1>
        <p>Track the status of your job applications</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">No Applications Yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven't applied to any jobs yet. Browse available positions to get started.
          </p>
          <Button
            className="btn-primary-gradient"
            onClick={() => window.location.href = '/jobs'}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Browse Jobs
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div key={app.id} className="card-elevated p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(app.status)}>
                      {getStatusIcon(app.status)}
                      <span className="ml-1">{STATUS_LABELS[app.status]}</span>
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{app.job_postings.title}</h3>
                  {app.job_postings.positions?.departments?.name && (
                    <p className="text-sm text-muted-foreground">
                      {app.job_postings.positions.departments.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </p>

                  {app.status === 'interview' && app.interview_schedules?.[0] && (
                    <div className="mt-3 p-3 bg-accent/10 rounded-lg">
                      <p className="text-sm font-medium text-accent">
                        Interview Scheduled
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(app.interview_schedules[0].scheduled_date).toLocaleString()}
                        {app.interview_schedules[0].location && ` • ${app.interview_schedules[0].location}`}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setSelectedApp(app)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => {
        setSelectedApp(null);
        setSelectedDoc(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedApp?.job_postings.title}</DialogTitle>
            <DialogDescription>Application and document management</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Application Details */}
            <div className="space-y-4">
              <div>
                <Badge className={getStatusColor(selectedApp?.status || 'applied')}>
                  {STATUS_LABELS[selectedApp?.status || 'applied']}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-1">Job Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedApp?.job_postings.description}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Applied On</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedApp && new Date(selectedApp.applied_at).toLocaleString()}
                </p>
              </div>

              {/* Interview Schedule */}
              {selectedApp?.status === 'interview' && selectedApp?.interview_schedules?.[0] && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <Calendar className="h-4 w-4" />
                    Interview Schedule
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{new Date(selectedApp.interview_schedules[0].scheduled_date).toLocaleString()}</span>
                    </div>
                    {selectedApp.interview_schedules[0].location && (
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{selectedApp.interview_schedules[0].location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedApp?.status === 'interview' && selectedApp?.interview_schedules?.[0]?.notes && (
                <div>
                  <h4 className="font-medium mb-1">Interview Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedApp.interview_schedules[0].notes}</p>
                </div>
              )}

              {selectedApp?.notes && (
                <div>
                  <h4 className="font-medium mb-1">HR Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedApp.notes}</p>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Your Documents</h4>
                <Button
                  size="sm"
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
              </div>

              {isLoadingDocs ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No documents uploaded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getDocumentIcon(doc.document_type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{doc.document_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.document_type.replace('_', ' ')} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDoc(doc);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDocToRename(doc);
                                setNewDocName(doc.document_name);
                                setIsRenameOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDoc(doc.id)}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-4 border">
          {selectedDoc && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedDoc.document_name}</h2>
                <p className="text-sm text-muted-foreground">
                  Uploaded on {new Date(selectedDoc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="border rounded-lg overflow-hidden bg-muted/30">
                <FileViewer 
                  url={selectedDoc.document_url} 
                  fileName={selectedDoc.document_name}
                  compact={false}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new document to your application</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="resume">Resume / CV</option>
                <option value="cover_letter">Cover Letter</option>
                <option value="certificate">Certificate</option>
                <option value="portfolio">Portfolio</option>
                <option value="license">License / Certification</option>
                <option value="other">Other Document</option>
              </select>
            </div>

            <div className="border-2 border-dashed rounded-lg p-6">
              {user && (
                <FileUpload
                  userId={user.id}
                  folder="applicant-documents"
                  onUploadComplete={handleUploadDoc}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, JPG, PNG
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Name</Label>
              <Input
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="Enter new document name"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameDoc} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
