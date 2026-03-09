import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileText, AlertCircle } from 'lucide-react';
import { FileViewer } from '@/features/shared/components/FileViewer';
import { toast } from 'sonner';

interface Document {
  id: string;
  document_name: string;
  document_url: string;
  document_type: string | null;
  uploaded_at: string;
}

export function MyDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyDocuments();
    }
  }, [user]);

  const fetchMyDocuments = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // First, get the employee ID for the current user
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        setError('Failed to load your employee information');
        toast.error('Failed to load your employee information');
        return;
      }

      if (!employeeData) {
        setError('Employee record not found');
        toast.error('Employee record not found');
        setDocuments([]);
        return;
      }

      // Now fetch documents for this employee
      const { data, error: docsError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeData.id)
        .order('uploaded_at', { ascending: false });

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        setError('Failed to load your documents');
        toast.error('Failed to load your documents');
      } else {
        setDocuments(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.document_type && doc.document_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>My Documents</h1>
        <p>View your uploaded employee documents</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Error Loading Documents</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium">No documents found</p>
            <p className="text-sm mt-1">
              {documents.length === 0
                ? 'You don\'t have any documents yet. Documents will be uploaded by your HR administrator.'
                : 'No documents match your search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-primary/10 rounded flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm break-words">{doc.document_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {doc.document_type && (
                        <Badge variant="secondary" className="text-xs">
                          {doc.document_type}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {doc.document_url && (
                    <FileViewer url={doc.document_url} fileName={doc.document_name} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
