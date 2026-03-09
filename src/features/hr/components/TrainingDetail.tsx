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
import { TrainingProgram } from '@/features/hr/services/trainingService';
import { toast } from 'sonner';

interface TrainingDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TrainingProgram | null;
  onEdit?: (data: TrainingProgram) => void;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function TrainingDetail({
  open,
  onOpenChange,
  data,
  onEdit,
  onDelete,
  isLoading = false,
}: TrainingDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!data || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(data.id);
      toast.success('Training program deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete training program');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const text = `${data.title}\n${data.description || ''}\nDuration: ${data.duration_hours || 'N/A'} hours`;
    navigator.clipboard.writeText(text);
    toast.success('Training program copied to clipboard');
  };

  if (!data) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{data.title}</DialogTitle>
                <DialogDescription className="mt-2">
                  {data.description || 'No description provided'}
                </DialogDescription>
              </div>
              {data.is_mandatory && (
                <Badge className="bg-destructive text-destructive-foreground">
                  Required
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Separator />

          <div className="space-y-4">
            {data.duration_hours && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Duration</label>
                <p className="text-base">{data.duration_hours} hours</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-muted-foreground">Type</label>
              <p className="text-base">{data.is_mandatory ? 'Mandatory' : 'Optional'}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground">Created</label>
              <p className="text-base">{new Date(data.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit?.(data);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Program?</AlertDialogTitle>
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
