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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreateEmployeeBenefitInput, fetchEmployeesForBenefits, fetchAvailableBenefits } from '@/features/payroll/services/employeeBenefitsService';

const employeeBenefitSchema = z.object({
  employee_id: z.string().min(1, 'Please select an employee'),
  benefit_id: z.string().min(1, 'Please select a benefit'),
  coverage_amount: z.number().positive('Coverage amount must be positive').optional(),
});

type EmployeeBenefitFormData = z.infer<typeof employeeBenefitSchema>;

interface EmployeeBenefitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateEmployeeBenefitInput) => Promise<void>;
  isLoading?: boolean;
}

export function EmployeeBenefitForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: EmployeeBenefitFormProps) {
  const [employees, setEmployees] = useState<Array<{ id: string; employee_number: string; first_name: string; last_name: string; email: string }>>([]);
  const [benefits, setBenefits] = useState<Array<{ id: string; name: string; description: string | null; type: string | null }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<EmployeeBenefitFormData>({
    resolver: zodResolver(employeeBenefitSchema),
    defaultValues: {
      employee_id: '',
      benefit_id: '',
      coverage_amount: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      loadFormData();
    }
  }, [open]);

  const loadFormData = async () => {
    setIsLoadingData(true);
    try {
      const [employeesResult, benefitsResult] = await Promise.all([
        fetchEmployeesForBenefits(),
        fetchAvailableBenefits(),
      ]);

      if (employeesResult.error) {
        toast.error(employeesResult.error);
      } else {
        setEmployees(employeesResult.data);
      }

      if (benefitsResult.error) {
        toast.error(benefitsResult.error);
      } else {
        setBenefits(benefitsResult.data);
      }
    } catch (error) {
      toast.error('Failed to load form data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (data: EmployeeBenefitFormData) => {
    await onSubmit({
      employee_id: data.employee_id,
      benefit_id: data.benefit_id,
      coverage_amount: data.coverage_amount || undefined,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll Employee in Benefit</DialogTitle>
          <DialogDescription>
            Select an employee and a benefit to enroll them.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingData || isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} ({employee.employee_number})
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
              name="benefit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefit</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingData || isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a benefit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {benefits.map(benefit => (
                        <SelectItem key={benefit.id} value={benefit.id}>
                          {benefit.name}
                          {benefit.type && ` [${benefit.type}]`}
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
              name="coverage_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage Amount (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>Leave blank if not applicable</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingData}>
                {isLoading ? 'Enrolling...' : 'Enroll Employee'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
