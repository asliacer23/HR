import { formatCurrencyPHP } from '@/lib/utils';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { EmployeeBenefit } from '@/features/payroll/services/employeeBenefitsService';

const benefitDetailSchema = z.object({
  coverage_amount: z.number().positive('Coverage amount must be positive').optional(),
  is_active: z.boolean().default(true),
});

type BenefitDetailFormData = z.infer<typeof benefitDetailSchema>;

interface EmployeeBenefitDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefit: EmployeeBenefit | null;
  onUpdate: (data: Partial<EmployeeBenefit>) => Promise<void>;
  isLoading?: boolean;
}

const benefitTypeColors: Record<string, string> = {
  health: 'bg-blue-100 text-blue-800',
  insurance: 'bg-purple-100 text-purple-800',
  allowance: 'bg-green-100 text-green-800',
};

export function EmployeeBenefitDetail({
  open,
  onOpenChange,
  benefit,
  onUpdate,
  isLoading = false,
}: EmployeeBenefitDetailProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<BenefitDetailFormData>({
    resolver: zodResolver(benefitDetailSchema),
    defaultValues: {
      coverage_amount: benefit?.coverage_amount || undefined,
      is_active: benefit?.is_active ?? true,
    },
  });

  const handleSubmit = async (data: BenefitDetailFormData) => {
    await onUpdate(data);
    setIsEditing(false);
  };

  if (!benefit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Benefit Enrollment Details</DialogTitle>
          <DialogDescription>
            View and update benefit enrollment information
          </DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-4">
            {/* Employee Information */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Employee</h3>
              {benefit.employees && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">
                    {benefit.employees.first_name} {benefit.employees.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{benefit.employees.employee_number}</p>
                  <p className="text-sm text-gray-600">{benefit.employees.email}</p>
                </div>
              )}
            </div>

            {/* Benefit Information */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Benefit</h3>
              {benefit.benefits && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{benefit.benefits.name}</p>
                  {benefit.benefits.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {benefit.benefits.description}
                    </p>
                  )}
                  {benefit.benefits.type && (
                    <Badge className={benefitTypeColors[benefit.benefits.type] || 'bg-gray-100 text-gray-800'} style={{ marginTop: '8px' }}>
                      {benefit.benefits.type}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Enrollment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Enrolled Date</h3>
                <p className="text-sm text-gray-600">
                  {new Date(benefit.enrolled_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Status</h3>
                <Badge variant={benefit.is_active ? 'default' : 'secondary'}>
                  {benefit.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* Coverage Amount */}
            {benefit.coverage_amount !== null && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Coverage Amount</h3>
                <p className="text-sm text-gray-600">
                  {formatCurrencyPHP(benefit.coverage_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
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
                name="coverage_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage Amount</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <p className="text-sm text-gray-500">
                        This benefit enrollment is currently active
                      </p>
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


