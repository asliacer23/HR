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
import { Edit, Trash2, Copy } from 'lucide-react';
import { OnboardingTask } from '@/features/hr/services/onboardingService';
import { toast } from 'sonner';

interface OnboardingDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: OnboardingTask | null;
  onEdit?: (data: OnboardingTask) => void;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function OnboardingDetail({
  open,
  onOpenChange,
  data,
  onEdit,
  onDelete,
  isLoading = false,
}: OnboardingDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!data || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(data.id);
      toast.success('Onboarding task deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete onboarding task');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!data) return;
    const text = `
${data.title}

${data.description || 'No description provided'}

Status: ${data.is_mandatory ? 'Mandatory' : 'Optional'}
Department: ${data.departments?.name || 'All Departments'}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success('Onboarding task copied to clipboard');
  };

  if (!data) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between pr-8">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{data.title}</DialogTitle>
                <DialogDescription>
                  Created on {new Date(data.created_at).toLocaleDateString()}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Status Badges */}
            <div className="flex items-center gap-2">
              {data.is_mandatory ? (
                <Badge className="bg-destructive text-destructive-foreground">
                  Mandatory
                </Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground">
                  Optional
                </Badge>
              )}
            </div>

            {/* Department Info */}
            {data.departments && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{data.departments.name}</p>
              </div>
            )}

            <Separator />

            {/* Description */}
            {data.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{data.description}</p>
              </div>
            )}

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
              <Button
                variant="default"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Onboarding Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{data.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
