import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  EmployeeOnboarding,
  CreateEmployeeOnboardingInput,
  fetchEmployees,
  fetchOnboardingTasks,
} from '../services/employeeOnboardingService';

interface EmployeeOnboardingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateEmployeeOnboardingInput) => Promise<void>;
  initialData?: EmployeeOnboarding | null;
  isLoading?: boolean;
}

interface FormData {
  employee_id: string;
  task_id: string;
  notes: string;
}

export function EmployeeOnboardingForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: EmployeeOnboardingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    employee_id: '',
    task_id: '',
    notes: '',
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        employee_id: initialData.employee_id,
        task_id: initialData.task_id,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const loadOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const [employeesRes, tasksRes] = await Promise.all([
        fetchEmployees(),
        fetchOnboardingTasks(),
      ]);

      if (employeesRes.error) {
        toast.error(employeesRes.error);
      } else {
        setEmployees(employeesRes.data);
      }

      if (tasksRes.error) {
        toast.error(tasksRes.error);
      } else {
        setTasks(tasksRes.data);
      }
    } catch (error) {
      toast.error('Failed to load form options');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.task_id) {
      toast.error('Please select both employee and task');
      return;
    }

    try {
      await onSubmit({
        employee_id: formData.employee_id,
        task_id: formData.task_id,
        notes: formData.notes || undefined,
      });

      setFormData({
        employee_id: '',
        task_id: '',
        notes: '',
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Assign'} Employee Onboarding Task
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Update the employee onboarding task assignment'
              : 'Create a new employee onboarding task assignment'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee</Label>
            <Select
              value={formData.employee_id}
              onValueChange={(value) =>
                setFormData({ ...formData, employee_id: value })
              }
              disabled={isLoadingOptions || isLoading || !!initialData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">Onboarding Task</Label>
            <Select
              value={formData.task_id}
              onValueChange={(value) =>
                setFormData({ ...formData, task_id: value })
              }
              disabled={isLoadingOptions || isLoading || !!initialData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                    {task.is_mandatory && ' (Required)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              disabled={isLoading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingOptions}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
