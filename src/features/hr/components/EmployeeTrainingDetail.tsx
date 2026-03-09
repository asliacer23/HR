import { useState } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { EmployeeTraining } from '@/features/hr/services/employeeTrainingService';

const trainingDetailSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  start_date: z.string().optional(),
  completion_date: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  certificate_url: z.string().url().optional(),
});

type TrainingDetailFormData = z.infer<typeof trainingDetailSchema>;

interface EmployeeTrainingDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training: EmployeeTraining | null;
  onUpdate: (data: Partial<EmployeeTraining>) => Promise<void>;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function EmployeeTrainingDetail({
  open,
  onOpenChange,
  training,
  onUpdate,
  isLoading = false,
}: EmployeeTrainingDetailProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<TrainingDetailFormData>({
    resolver: zodResolver(trainingDetailSchema),
    defaultValues: {
      status: training?.status || 'scheduled',
      start_date: training?.start_date || '',
      completion_date: training?.completion_date || '',
      score: training?.score || undefined,
      certificate_url: training?.certificate_url || '',
    },
  });

  const handleSubmit = async (data: TrainingDetailFormData) => {
    await onUpdate(data);
    setIsEditing(false);
  };

  if (!training) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Training Assignment Details</DialogTitle>
          <DialogDescription>
            View and update training assignment information
          </DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-4">
            {/* Employee Information */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Employee</h3>
              {training.employees && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">
                    {training.employees.first_name} {training.employees.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{training.employees.employee_number}</p>
                  <p className="text-sm text-gray-600">{training.employees.email}</p>
                </div>
              )}
            </div>

            {/* Training Program Information */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Training Program</h3>
              {training.training_programs && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{training.training_programs.title}</p>
                  {training.training_programs.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {training.training_programs.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    {training.training_programs.duration_hours && (
                      <Badge variant="outline">
                        {training.training_programs.duration_hours} hours
                      </Badge>
                    )}
                    {training.training_programs.is_mandatory && (
                      <Badge variant="default">Mandatory</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Training Status */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Status</h3>
              <Badge className={statusColors[training.status]}>
                {training.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Start Date</h3>
                <p className="text-sm text-gray-600">
                  {training.start_date
                    ? new Date(training.start_date).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Completion Date</h3>
                <p className="text-sm text-gray-600">
                  {training.completion_date
                    ? new Date(training.completion_date).toLocaleDateString()
                    : 'Not completed'}
                </p>
              </div>
            </div>

            {/* Score */}
            {training.score !== null && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Score</h3>
                <p className="text-sm text-gray-600">{training.score.toFixed(2)}/100</p>
              </div>
            )}

            {/* Certificate */}
            {training.certificate_url && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Certificate</h3>
                <a
                  href={training.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Certificate
                </a>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificate_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/certificate"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
