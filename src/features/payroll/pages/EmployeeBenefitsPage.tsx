import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Gift } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmployeeBenefitForm } from '../components/EmployeeBenefitForm';
import { EmployeeBenefitDetail } from '../components/EmployeeBenefitDetail';
import { EmployeeBenefitList } from '../components/EmployeeBenefitList';
import {
  fetchEmployeeBenefits,
  createEmployeeBenefit,
  updateEmployeeBenefit,
  deleteEmployeeBenefit,
  EmployeeBenefit,
  CreateEmployeeBenefitInput,
} from '@/features/payroll/services/employeeBenefitsService';

export function EmployeeBenefitsPage() {
  const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<EmployeeBenefit | null>(null);
  const [benefitToDelete, setBenefitToDelete] = useState<EmployeeBenefit | null>(null);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    setIsLoading(true);
    const { data, error } = await fetchEmployeeBenefits();
    if (error) {
      toast.error(error);
    } else {
      setBenefits(data);
    }
    setIsLoading(false);
  };

  const handleCreateBenefit = async (data: CreateEmployeeBenefitInput) => {
    setIsSubmitting(true);
    const { data: newBenefit, error } = await createEmployeeBenefit(data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Employee enrolled in benefit successfully');
      await loadBenefits();
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleViewBenefit = (benefit: EmployeeBenefit) => {
    setSelectedBenefit(benefit);
    setShowDetailView(true);
    setShowCreateForm(false);
  };

  const handleUpdateBenefit = async (data: Partial<EmployeeBenefit>) => {
    if (!selectedBenefit) return;
    setIsSubmitting(true);
    const { error } = await updateEmployeeBenefit({
      id: selectedBenefit.id,
      coverage_amount: data.coverage_amount,
      is_active: data.is_active,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success('Benefit updated successfully');
      await loadBenefits();
      setShowDetailView(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (benefit: EmployeeBenefit) => {
    setBenefitToDelete(benefit);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!benefitToDelete) return;
    setIsSubmitting(true);
    const { error } = await deleteEmployeeBenefit(benefitToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Benefit enrollment deleted successfully');
      setBenefits(benefits.filter(b => b.id !== benefitToDelete.id));
    }
    setShowDeleteConfirm(false);
    setBenefitToDelete(null);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Employee Benefits</h1>
        </div>
        <p className="text-gray-600">
          Manage employee benefit enrollments and coverage information
        </p>
      </div>

      {/* Search and Create */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by employee name, number, or benefit..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Enroll Employee
        </Button>
      </div>

      {/* Benefits List */}
      <EmployeeBenefitList
        benefits={benefits}
        isLoading={isLoading}
        onView={handleViewBenefit}
        onEdit={handleViewBenefit}
        onDelete={handleDeleteClick}
        searchQuery={searchQuery}
      />

      {/* Create Form Dialog */}
      <EmployeeBenefitForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateBenefit}
        isLoading={isSubmitting}
      />

      {/* Detail Dialog */}
      <EmployeeBenefitDetail
        open={showDetailView}
        onOpenChange={setShowDetailView}
        benefit={selectedBenefit}
        onUpdate={handleUpdateBenefit}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit Enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this benefit enrollment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
