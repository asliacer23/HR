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
import { fetchPositions, JobPosting } from '@/features/recruitment/services/jobPostingsService';

const jobPostingSchema = z.object({
  position_id: z.string().nullable().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  salary_range_min: z.coerce.number().positive('Salary must be positive').nullable().optional(),
  salary_range_max: z.coerce.number().positive('Salary must be positive').nullable().optional(),
  deadline: z.string().optional(),
  is_active: z.boolean().default(true),
});

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

interface JobPostingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JobPostingFormData) => Promise<void>;
  initialData?: JobPosting | null;
  isLoading?: boolean;
}

export function JobPostingForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: JobPostingFormProps) {
  const [positions, setPositions] = useState<any[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const isEditing = !!initialData;

  const form = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      position_id: initialData?.position_id || null,
      title: initialData?.title || '',
      description: initialData?.description || '',
      requirements: initialData?.requirements || '',
      responsibilities: initialData?.responsibilities || '',
      salary_range_min: initialData?.salary_range_min || null,
      salary_range_max: initialData?.salary_range_max || null,
      deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
      is_active: initialData?.is_active ?? true,
    },
  });

  useEffect(() => {
    loadPositions();
  }, []);

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        position_id: initialData.position_id || null,
        title: initialData.title,
        description: initialData.description,
        requirements: initialData.requirements || '',
        responsibilities: initialData.responsibilities || '',
        salary_range_min: initialData.salary_range_min || null,
        salary_range_max: initialData.salary_range_max || null,
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
        is_active: initialData.is_active,
      });
    } else if (!open) {
      form.reset({
        position_id: null,
        title: '',
        description: '',
        requirements: '',
        responsibilities: '',
        salary_range_min: null,
        salary_range_max: null,
        deadline: '',
        is_active: true,
      });
    }
  }, [open, initialData, form]);

  const loadPositions = async () => {
    setPositionsLoading(true);
    const { data } = await fetchPositions();
    setPositions(data);
    setPositionsLoading(false);
  };

  const handleSubmit = async (data: JobPostingFormData) => {
    try {
      await onSubmit({
        ...data,
        salary_range_min: data.salary_range_min ? Number(data.salary_range_min) : undefined,
        salary_range_max: data.salary_range_max ? Number(data.salary_range_max) : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save job posting');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the job posting details below.' 
              : 'Fill in the details to create a new job posting.'}
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
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Mathematics Teacher"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Position */}
            <FormField
              control={form.control}
              name="position_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position (Optional)</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={positionsLoading || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions && positions.length > 0 ? (
                        positions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.title} ({position.departments?.name || 'N/A'})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">No positions available</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Link to an existing school position if applicable.
                  </FormDescription>
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
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed description of the job..."
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Requirements */}
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List the qualifications and requirements for this position..."
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Responsibilities */}
            <FormField
              control={form.control}
              name="responsibilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsibilities (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Outline the main responsibilities for this position..."
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Salary Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salary_range_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Salary (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 42000"
                        {...field}
                        value={field.value || ''}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary_range_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Salary (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 62000"
                        {...field}
                        value={field.value || ''}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Deadline */}
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Make this job posting visible to applicants
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
                {isLoading ? 'Saving...' : isEditing ? 'Update Job Posting' : 'Create Job Posting'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
