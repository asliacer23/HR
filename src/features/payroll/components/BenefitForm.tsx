import { useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Benefit } from '../services/benefitsService';

const benefitSchema = z.object({
  name: z.string().min(1, 'Benefit name is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  is_active: z.boolean().optional(),
});

type BenefitFormData = z.infer<typeof benefitSchema>;

interface BenefitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BenefitFormData) => Promise<void>;
  initialData?: Benefit | null;
  isLoading?: boolean;
}

export function BenefitForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: BenefitFormProps) {
  const isEditing = !!initialData;

  const form = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      name: '',
      description: '',
      type: undefined,
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        type: initialData.type || undefined,
        is_active: initialData.is_active,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        type: undefined,
        is_active: true,
      });
    }
  }, [initialData, isEditing, form, open]);

  const handleSubmit = async (data: BenefitFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Benefit' : 'Add New Benefit'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the benefit information'
              : 'Create a new benefit for employees'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Benefit Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Benefit Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Health Insurance, Dental Plan"
                      {...field}
                      disabled={isLoading}
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description & Type Grid */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Type
                    </FormLabel>
                    <FormControl>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-muted">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Health">Health</SelectItem>
                          <SelectItem value="Financial">Financial</SelectItem>
                          <SelectItem value="Wellness">Wellness</SelectItem>
                          <SelectItem value="Retirement">Retirement</SelectItem>
                          <SelectItem value="Allowance">Allowance</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add benefit details..."
                      {...field}
                      disabled={isLoading}
                      className="bg-muted min-h-[100px] resize-none"
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
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormLabel className="text-gray-700 font-medium cursor-pointer mb-0">
                    Active
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="btn-primary-gradient"
              >
                {isLoading
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Benefit'
                    : 'Create Benefit'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
