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
import { toast } from 'sonner';
import { PerformanceEvaluation, fetchEmployees, CreatePerformanceEvaluationInput } from '@/features/hr/services/performanceService';

const performanceEvaluationSchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  evaluation_period_start: z.string().min(1, 'Start date is required'),
  evaluation_period_end: z.string().min(1, 'End date is required'),
  status: z.enum(['pending', 'in_progress', 'completed']),
  overall_rating: z.coerce.number().min(1).max(5).optional().or(z.literal('')),
  strengths: z.string().optional(),
  areas_for_improvement: z.string().optional(),
  recommendations: z.string().optional(),
});

type PerformanceEvaluationFormData = z.infer<typeof performanceEvaluationSchema>;

interface PerformanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePerformanceEvaluationInput) => Promise<void>;
  initialData?: PerformanceEvaluation | null;
  isLoading?: boolean;
}

export function PerformanceForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: PerformanceFormProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const isEditing = !!initialData;

  const form = useForm<PerformanceEvaluationFormData>({
    resolver: zodResolver(performanceEvaluationSchema),
    defaultValues: {
      employee_id: initialData?.employee_id || '',
      evaluation_period_start: initialData?.evaluation_period_start || '',
      evaluation_period_end: initialData?.evaluation_period_end || '',
      status: (initialData?.status as 'pending' | 'in_progress' | 'completed') || 'pending',
      overall_rating: initialData?.overall_rating || '',
      strengths: initialData?.strengths || '',
      areas_for_improvement: initialData?.areas_for_improvement || '',
      recommendations: initialData?.recommendations || '',
    },
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const { data, error } = await fetchEmployees();
      if (error) {
        toast.error(`Failed to load employees: ${error}`);
        setEmployees([]);
      } else {
        setEmployees(data || []);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      setEmployees([]);
    }
    setEmployeesLoading(false);
  };

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        employee_id: initialData.employee_id,
        evaluation_period_start: initialData.evaluation_period_start,
        evaluation_period_end: initialData.evaluation_period_end,
        status: (initialData.status as 'pending' | 'in_progress' | 'completed'),
        overall_rating: initialData.overall_rating || '',
        strengths: initialData.strengths || '',
        areas_for_improvement: initialData.areas_for_improvement || '',
        recommendations: initialData.recommendations || '',
      });
    } else if (!open) {
      form.reset({
        employee_id: '',
        evaluation_period_start: '',
        evaluation_period_end: '',
        status: 'pending',
        overall_rating: '',
        strengths: '',
        areas_for_improvement: '',
        recommendations: '',
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = async (formData: PerformanceEvaluationFormData) => {
    try {
      // Convert form data to the required API format
      const submitData: CreatePerformanceEvaluationInput = {
        employee_id: formData.employee_id,
        evaluation_period_start: formData.evaluation_period_start,
        evaluation_period_end: formData.evaluation_period_end,
        status: formData.status,
        overall_rating: formData.overall_rating ? Number(formData.overall_rating) : undefined,
        strengths: formData.strengths || undefined,
        areas_for_improvement: formData.areas_for_improvement || undefined,
        recommendations: formData.recommendations || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save evaluation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{isEditing ? 'Edit Evaluation' : 'Create Performance Evaluation'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the evaluation details' : 'Add a new performance evaluation'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-muted">
                          <SelectValue placeholder={employeesLoading ? "Loading employees..." : "Select an employee"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.employee_number} - {emp.first_name} {emp.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-muted">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="evaluation_period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evaluation Period Start</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-muted" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluation_period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evaluation Period End</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-muted" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="overall_rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating (1-5)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      placeholder="e.g., 4"
                      className="bg-muted"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strengths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strengths</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe employee strengths..."
                      className="bg-muted min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areas_for_improvement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Areas for Improvement</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe areas for improvement..."
                      className="bg-muted min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide recommendations..."
                      className="bg-muted min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="btn-primary-gradient" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Evaluation' : 'Create Evaluation'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
