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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PayrollPeriod } from '../services/payrollService';

const payrollPeriodSchema = z.object({
  period_start: z.string().min(1, 'Start date is required'),
  period_end: z.string().min(1, 'End date is required'),
  pay_date: z.string().min(1, 'Pay date is required'),
  is_processed: z.boolean().optional(),
});

type PayrollPeriodFormData = z.infer<typeof payrollPeriodSchema>;

interface PayrollFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PayrollPeriodFormData) => Promise<void>;
  initialData?: PayrollPeriod | null;
  isLoading?: boolean;
}

export function PayrollForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: PayrollFormProps) {
  const isEditing = !!initialData;

  const form = useForm<PayrollPeriodFormData>({
    resolver: zodResolver(payrollPeriodSchema),
    defaultValues: {
      period_start: initialData?.period_start || '',
      period_end: initialData?.period_end || '',
      pay_date: initialData?.pay_date || '',
      is_processed: initialData?.is_processed ?? false,
    },
  });

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        period_start: initialData.period_start,
        period_end: initialData.period_end,
        pay_date: initialData.pay_date,
        is_processed: initialData.is_processed,
      });
    } else if (!open) {
      form.reset({
        period_start: '',
        period_end: '',
        pay_date: '',
        is_processed: false,
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = async (data: PayrollPeriodFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('Failed to save payroll period');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{isEditing ? 'Edit Payroll Period' : 'Create Payroll Period'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the payroll period details' : 'Add a new payroll period'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Start</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-muted" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period End</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-muted" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pay_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-muted" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isLoading ? 'Saving...' : isEditing ? 'Update Period' : 'Create Period'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
