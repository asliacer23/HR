import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Copy, X } from 'lucide-react';
import { JobPosting } from '@/features/recruitment/services/jobPostingsService';
import { toast } from 'sonner';

interface JobPostingDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: JobPosting | null;
  onEdit?: (data: JobPosting) => void;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function JobPostingDetail({
  open,
  onOpenChange,
  data,
  onEdit,
  onDelete,
  isLoading = false,
}: JobPostingDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!data || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(data.id);
      toast.success('Job posting deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete job posting');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!data) return;
    const text = `
${data.title}

Description:
${data.description}

Requirements:
${data.requirements || 'Not specified'}

Responsibilities:
${data.responsibilities || 'Not specified'}

Salary Range: ${data.salary_range_min ? '₱' + data.salary_range_min.toLocaleString() : 'Not specified'} - ${data.salary_range_max ? '₱' + data.salary_range_max.toLocaleString() : 'Not specified'}
Deadline: ${data.deadline ? new Date(data.deadline).toLocaleDateString() : 'Not specified'}
Status: ${data.is_active ? 'Open' : 'Closed'}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success('Job posting copied to clipboard');
  };

  if (!data) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{data.title}</DialogTitle>
                <DialogDescription>
                  Posted on {new Date(data.created_at).toLocaleDateString()}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="mt-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge className={data.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {data.is_active ? 'Active - Open' : 'Inactive - Closed'}
              </Badge>
            </div>

            {/* Position Info */}
            {data.positions && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Related Position</p>
                <p className="font-semibold text-blue-900">{data.positions.title}</p>
                {data.positions.departments?.name && (
                  <p className="text-sm text-blue-700">Department: {data.positions.departments.name}</p>
                )}
              </div>
            )}

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Job Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{data.description}</p>
            </div>

            {/* Requirements */}
            {data.requirements && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Requirements</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{data.requirements}</p>
              </div>
            )}

            {/* Responsibilities */}
            {data.responsibilities && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Responsibilities</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{data.responsibilities}</p>
              </div>
            )}

            <Separator />

            {/* Salary and Deadline */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-medium mb-1">Salary Range</p>
                <p className="font-semibold text-lg text-gray-900">
                  {data.salary_range_min && data.salary_range_max
                    ? `₱${data.salary_range_min.toLocaleString()} - ₱${data.salary_range_max.toLocaleString()}`
                    : 'Not specified'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-medium mb-1">Application Deadline</p>
                <p className="font-semibold text-lg text-gray-900">
                  {data.deadline ? new Date(data.deadline).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEdit(data);
                    onOpenChange(false);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{data?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

