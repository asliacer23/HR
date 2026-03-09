import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Eye, Trash2, Upload, Calendar, FileType, Loader2 } from 'lucide-react';
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

interface DocumentsPageProps {
  applicantId?: string;
}

export function ApplicantDocumentsPage({ applicantId }: DocumentsPageProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<ApplicantDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ApplicantDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [docToRename, setDocToRename] = useState<ApplicantDocument | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [documentType, setDocumentType] = useState('other');

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    setIsLoading(true);
    const { data, error } = await fetchApplicantWithDocuments(user?.id || '');
    if (error) {
      toast.error('Failed to load documents');
    } else if (data) {
      setDocuments(data.documents || []);
    }
    setIsLoading(false);
  };

  const handleUpload = async (url: string, fileName?: string) => {
    if (!user) return;

    const { data: applicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

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

  const handleDelete = async (docId: string) => {
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

  const handleRename = async () => {
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
        return 'ðŸ“„';
      case 'certificate':
        return 'ðŸŽ“';
      case 'cover_letter':
        return 'ðŸ“';
      case 'portfolio':
        return 'ðŸŽ¨';
      case 'license':
        return 'ðŸ“‹';
      default:
        return 'ðŸ“Ž';
    }
  };

  const getDocumentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'resume':
        return 'bg-blue-100 text-blue-800';
      case 'certificate':
        return 'bg-green-100 text-green-800';
      case 'cover_letter':
        return 'bg-purple-100 text-purple-800';
      case 'portfolio':
        return 'bg-orange-100 text-orange-800';
      case 'license':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and view your application documents</p>
        </div>
        <Button
          onClick={() => setIsUploadOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg mb-1">No Documents Yet</h3>
            <p className="text-muted-foreground mb-4">Start by uploading your resume or other documents</p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getDocumentIcon(doc.document_type)}</span>
                      <Badge className={getDocumentTypeBadgeColor(doc.document_type)}>
                        {doc.document_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-base break-words">{doc.document_name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                  <Calendar className="w-3 h-3" />
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDoc(doc);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
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
                    onClick={() => handleDelete(doc.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new document to your profile</DialogDescription>
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
                  onUploadComplete={handleUpload}
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
              <Button onClick={handleRename} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.document_name}</DialogTitle>
            <DialogDescription>
              {selectedDoc && (
                <div className="flex items-center gap-4 text-xs mt-2">
                  <span className="capitalize font-medium text-foreground">{selectedDoc.document_type}</span>
                  <span>{new Date(selectedDoc.uploaded_at).toLocaleDateString()}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center min-h-[400px]">
                <FileViewer url={selectedDoc.document_url} fileName={selectedDoc.document_name} />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedDoc.document_url;
                    link.download = selectedDoc.document_name;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.open(selectedDoc.document_url, '_blank');
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

