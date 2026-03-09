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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Copy } from 'lucide-react';
import { Benefit } from '../services/benefitsService';
import { toast } from 'sonner';

interface BenefitDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Benefit | null;
  onEdit?: (data: Benefit) => void;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function BenefitDetail({
  open,
  onOpenChange,
  data,
  onEdit,
  onDelete,
  isLoading = false,
}: BenefitDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!data || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(data.id);
      toast.success('Benefit deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete benefit');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = () => {
    if (data) {
      const text = `${data.name}${data.type ? ` - ${data.type}` : ''}`;
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Benefit Details</DialogTitle>
            <DialogDescription>
              View and manage benefit information
            </DialogDescription>
          </DialogHeader>

          {data && (
            <div className="space-y-6 py-4">
              {/* Benefit Name & Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {data.name}
                  </h3>
                  <Badge
                    className={
                      data.is_active
                        ? 'bg-green-100 text-green-800 border-0'
                        : 'bg-gray-100 text-gray-800 border-0'
                    }
                  >
                    {data.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {data.type && (
                  <Badge variant="outline" className="mt-2">
                    {data.type}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Description */}
              {data.description && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Description
                  </p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {data.description}
                  </p>
                </div>
              )}

              {/* Created Date */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Created
                </p>
                <p className="text-sm text-gray-900">
                  {new Date(data.created_at).toLocaleDateString()}
                </p>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-between gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="text-gray-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onEdit(data);
                        onOpenChange(false);
                      }}
                      disabled={isLoading}
                      className="text-gray-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this benefit? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Benefit: <span className="font-medium text-gray-900">{data?.name}</span>
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
