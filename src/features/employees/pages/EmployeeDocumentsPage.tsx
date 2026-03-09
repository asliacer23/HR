import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Download, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileViewer } from '@/features/shared/components/FileViewer';

interface Document {
  id: string;
  employee_id: string;
  document_name: string;
  document_url: string;
  document_type: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  employees?: {
    id: string;
    employee_number: string;
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      // Fetch all documents
      const { data: docsData, error: docsError } = await supabase
        .from('employee_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (docsError) {
        toast.error('Failed to fetch documents');
        setIsLoading(false);
        return;
      }

      // Fetch all employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, employee_number, user_id');

      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email');

      // Combine the data
      const docsWithEmployeeInfo = (docsData || []).map(doc => {
        const employee = (employeesData || []).find(e => e.id === doc.employee_id);
        const profile = (profilesData || []).find(p => p.user_id === employee?.user_id);

        return {
          ...doc,
          employees: {
            id: employee?.id,
            employee_number: employee?.employee_number,
            profiles: profile,
          },
        };
      });

      setDocuments(docsWithEmployeeInfo);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    }
    setIsLoading(false);
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewOpen(true);
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.employees?.profiles?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.employees?.profiles?.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Employee Documents</h1>
          <p>Manage employee documents and files</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by document name or employee..."
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
              <th>Employee</th>
              <th>Document Name</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  Loading documents...
                </td>
              </tr>
            ) : filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  No documents found
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {doc.employees?.profiles?.first_name} {doc.employees?.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.employees?.employee_number}
                      </p>
                    </div>
                  </td>
                  <td className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {doc.document_name}
                  </td>
                  <td>
                    <Badge variant="outline">
                      {doc.document_type || 'Other'}
                    </Badge>
                  </td>
                  <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDocument(doc)}
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc.document_url, doc.document_name)}
                        title="Download document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Document Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.document_name}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded text-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground text-xs">Employee</p>
                    <p className="font-medium">
                      {selectedDocument.employees?.profiles?.first_name} {selectedDocument.employees?.profiles?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDocument.employees?.employee_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Type</p>
                    <Badge variant="outline">
                      {selectedDocument.document_type || 'Other'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Uploaded</p>
                  <p className="text-sm">{new Date(selectedDocument.uploaded_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-muted/30 p-4">
                <FileViewer
                  url={selectedDocument.document_url}
                  fileName={selectedDocument.document_name}
                  compact={false}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownload(selectedDocument.document_url, selectedDocument.document_name)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
