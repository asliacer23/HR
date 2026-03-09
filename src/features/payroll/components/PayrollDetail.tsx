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
import { PayrollPeriod } from '../services/payrollService';
import { toast } from 'sonner';

interface PayrollDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PayrollPeriod | null;
  onEdit?: (data: PayrollPeriod) => void;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function PayrollDetail({
  open,
  onOpenChange,
  data,
  onEdit,
  onDelete,
  isLoading = false,
}: PayrollDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!data || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(data.id);
      toast.success('Payroll period deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete payroll period');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const text = `Period: ${new Date(data.period_start).toLocaleDateString()} - ${new Date(data.period_end).toLocaleDateString()}\nPay Date: ${new Date(data.pay_date).toLocaleDateString()}\nStatus: ${data.is_processed ? 'Processed' : 'Pending'}`;
    navigator.clipboard.writeText(text);
    toast.success('Payroll period copied to clipboard');
  };

  if (!data) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">Payroll Period</DialogTitle>
                <DialogDescription className="mt-2">
                  {new Date(data.period_start).toLocaleDateString()} - {new Date(data.period_end).toLocaleDateString()}
                </DialogDescription>
              </div>
              <Badge className={data.is_processed ? 'status-completed' : 'status-pending'}>
                {data.is_processed ? 'Processed' : 'Pending'}
              </Badge>
            </div>
          </DialogHeader>

          <Separator />

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Period Start</label>
              <p className="text-base">{new Date(data.period_start).toLocaleDateString()}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground">Period End</label>
              <p className="text-base">{new Date(data.period_end).toLocaleDateString()}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground">Pay Date</label>
              <p className="text-base">{new Date(data.pay_date).toLocaleDateString()}</p>
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
            <AlertDialogTitle>Delete Payroll Period?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the payroll period from {new Date(data.period_start).toLocaleDateString()}? This action cannot be undone.
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
