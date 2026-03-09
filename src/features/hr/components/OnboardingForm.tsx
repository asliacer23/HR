import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { fetchDepartments, OnboardingTask } from '@/features/hr/services/onboardingService';

const onboardingTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  is_mandatory: z.boolean().default(true),
  department_id: z.string().nullable().optional(),
});

type OnboardingTaskFormData = z.infer<typeof onboardingTaskSchema>;

interface OnboardingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OnboardingTaskFormData) => Promise<void>;
  initialData?: OnboardingTask | null;
  isLoading?: boolean;
}

export function OnboardingForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: OnboardingFormProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const isEditing = !!initialData;

  const form = useForm<OnboardingTaskFormData>({
    resolver: zodResolver(onboardingTaskSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      is_mandatory: initialData?.is_mandatory ?? true,
      department_id: initialData?.department_id || null,
    },
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description || '',
        is_mandatory: initialData.is_mandatory,
        department_id: initialData.department_id || null,
      });
    } else if (!open) {
      form.reset({
        title: '',
        description: '',
        is_mandatory: true,
        department_id: null,
      });
    }
  }, [open, initialData, form]);

  const loadDepartments = async () => {
    setDepartmentsLoading(true);
    const { data } = await fetchDepartments();
    setDepartments(data);
    setDepartmentsLoading(false);
  };

  const handleSubmit = async (data: OnboardingTaskFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save onboarding task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Onboarding Task' : 'Create New Onboarding Task'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the onboarding task details below.' 
              : 'Fill in the details to create a new onboarding task.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Complete HR Paperwork"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a description of the onboarding task..."
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain what needs to be done for this task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department */}
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department (Optional)</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={departmentsLoading || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments && departments.length > 0 ? (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">No departments available</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optionally assign this task to a specific department.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mandatory Status */}
            <FormField
              control={form.control}
              name="is_mandatory"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Mandatory</FormLabel>
                    <FormDescription>
                      Mark this task as required for all new employees
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
