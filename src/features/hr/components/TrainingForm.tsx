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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { TrainingProgram } from '@/features/hr/services/trainingService';

const trainingProgramSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  duration_hours: z.number().positive('Duration must be a positive number').optional(),
  is_mandatory: z.boolean().default(false),
});

type TrainingProgramFormData = z.infer<typeof trainingProgramSchema>;

interface TrainingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TrainingProgramFormData) => Promise<void>;
  initialData?: TrainingProgram | null;
  isLoading?: boolean;
}

export function TrainingForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: TrainingFormProps) {
  const isEditing = !!initialData;

  const form = useForm<TrainingProgramFormData>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      duration_hours: initialData?.duration_hours || undefined,
      is_mandatory: initialData?.is_mandatory ?? false,
    },
  });

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description || '',
        duration_hours: initialData.duration_hours || undefined,
        is_mandatory: initialData.is_mandatory,
      });
    } else if (!open) {
      form.reset({
        title: '',
        description: '',
        duration_hours: undefined,
        is_mandatory: false,
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = async (data: TrainingProgramFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('Failed to save training program');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Training Program' : 'Create Training Program'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the training program details' : 'Add a new training program to the system'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Leadership Training" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the training program..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 24"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_mandatory"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Mandatory</FormLabel>
                    <FormDescription>
                      Mark as required for all employees
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Program' : 'Create Program'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
