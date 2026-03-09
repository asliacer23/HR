import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle, Edit, Trash2 } from 'lucide-react';
import { EmployeeOnboarding } from '../services/employeeOnboardingService';

interface EmployeeOnboardingDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: EmployeeOnboarding;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete?: (completed: boolean) => void;
  isLoading?: boolean;
}

export function EmployeeOnboardingDetail({
  open,
  onOpenChange,
  data,
  onEdit,
  onDelete,
  onToggleComplete,
  isLoading,
}: EmployeeOnboardingDetailProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Employee Onboarding Task</DialogTitle>
          <DialogDescription>
            View and manage the task assignment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Employee Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Employee
            </h3>
            <p className="text-lg font-medium">
              {data.employees?.first_name} {data.employees?.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.employees?.email}
            </p>
          </div>

          {/* Task Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Task
            </h3>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-lg font-medium">
                {data.onboarding_tasks?.title}
              </p>
              {data.onboarding_tasks?.is_mandatory && (
                <Badge className="bg-destructive text-destructive-foreground">
                  Required
                </Badge>
              )}
            </div>
            {data.onboarding_tasks?.description && (
              <p className="text-sm text-muted-foreground">
                {data.onboarding_tasks.description}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Status
            </h3>
            <div className="flex items-center gap-2">
              {data.is_completed ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">Completed</span>
                </>
              ) : (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-yellow-500" />
                  <span className="font-medium text-yellow-600">Pending</span>
                </>
              )}
            </div>
          </div>

          {data.completed_at && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Completed Date
              </h3>
              <p className="font-medium">{formatDate(data.completed_at)}</p>
            </div>
          )}

          {/* Notes */}
          {data.notes && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Notes
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.notes}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={onEdit}
              disabled={isLoading}
              className="btn-primary-gradient"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
