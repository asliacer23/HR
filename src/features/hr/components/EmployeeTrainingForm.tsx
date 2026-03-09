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
import { CreateEmployeeTrainingInput, fetchEmployeesForTraining, fetchAvailableTrainingPrograms } from '@/features/hr/services/employeeTrainingService';

const employeeTrainingSchema = z.object({
  employee_id: z.string().min(1, 'Please select an employee'),
  program_id: z.string().min(1, 'Please select a training program'),
  start_date: z.string().optional(),
});

type EmployeeTrainingFormData = z.infer<typeof employeeTrainingSchema>;

interface EmployeeTrainingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateEmployeeTrainingInput) => Promise<void>;
  initialData?: { employee_id: string } | null;
  isLoading?: boolean;
}

export function EmployeeTrainingForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: EmployeeTrainingFormProps) {
  const [employees, setEmployees] = useState<Array<{ id: string; employee_number: string; first_name: string; last_name: string; email: string }>>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; title: string; duration_hours: number | null; is_mandatory: boolean }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<EmployeeTrainingFormData>({
    resolver: zodResolver(employeeTrainingSchema),
    defaultValues: {
      employee_id: initialData?.employee_id || '',
      program_id: '',
      start_date: '',
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
      const [employeesResult, programsResult] = await Promise.all([
        fetchEmployeesForTraining(),
        fetchAvailableTrainingPrograms(),
      ]);

      if (employeesResult.error) {
        toast.error(employeesResult.error);
      } else {
        setEmployees(employeesResult.data);
      }

      if (programsResult.error) {
        toast.error(programsResult.error);
      } else {
        setPrograms(programsResult.data);
      }
    } catch (error) {
      toast.error('Failed to load form data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (data: EmployeeTrainingFormData) => {
    await onSubmit({
      employee_id: data.employee_id,
      program_id: data.program_id,
      start_date: data.start_date || undefined,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Training to Employee</DialogTitle>
          <DialogDescription>
            Select an employee and a training program to assign training.
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
              name="program_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Program</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingData || isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a training program" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {programs.map(program => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.title}
                          {program.duration_hours && ` (${program.duration_hours}h)`}
                          {program.is_mandatory && ' [Mandatory]'}
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
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>Leave blank to use today's date</FormDescription>
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
                {isLoading ? 'Assigning...' : 'Assign Training'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
