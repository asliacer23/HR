import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Gift, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BenefitForm } from '../components/BenefitForm';
import { BenefitDetail } from '../components/BenefitDetail';
import {
  fetchBenefits,
  createBenefit,
  updateBenefit,
  deleteBenefit,
  toggleBenefitStatus,
  Benefit,
  CreateBenefitInput,
} from '../services/benefitsService';

export function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [benefitToDelete, setBenefitToDelete] = useState<Benefit | null>(null);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    setIsLoading(true);
    const { data, error } = await fetchBenefits();
    if (error) {
      toast.error(error);
    } else {
      setBenefits(data);
    }
    setIsLoading(false);
  };

  const filteredBenefits = benefits.filter(benefit =>
    benefit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateBenefit = async (data: CreateBenefitInput) => {
    setIsSubmitting(true);
    const { data: newBenefit, error } = await createBenefit(data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Benefit created successfully');
      setBenefits([newBenefit, ...benefits]);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleEditBenefit = (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setShowCreateForm(true);
    setShowDetailView(false);
  };

  const handleUpdateBenefit = async (data: CreateBenefitInput) => {
    if (!editingBenefit) return;
    setIsSubmitting(true);
    const { data: updatedBenefit, error } = await updateBenefit({
      id: editingBenefit.id,
      ...data,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success('Benefit updated successfully');
      setBenefits(benefits.map(b => b.id === editingBenefit.id ? updatedBenefit : b));
      setEditingBenefit(null);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteBenefit = async () => {
    if (!benefitToDelete) return;
    setIsSubmitting(true);
    const { error } = await deleteBenefit(benefitToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Benefit deleted successfully');
      setBenefits(benefits.filter(b => b.id !== benefitToDelete.id));
      setShowDeleteConfirm(false);
      setBenefitToDelete(null);
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (benefit: Benefit) => {
    const { data: updatedBenefit, error } = await toggleBenefitStatus(benefit.id, benefit.is_active);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Benefit ${updatedBenefit?.is_active ? 'activated' : 'deactivated'}`);
      setBenefits(benefits.map(b => b.id === benefit.id ? updatedBenefit : b));
    }
  };

  const handleViewDetail = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowDetailView(true);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Benefits Management</h1>
          <p className="text-gray-600 mt-1">Manage employee benefits and incentives</p>
        </div>
        <Button
          onClick={() => {
            setEditingBenefit(null);
            setShowCreateForm(true);
          }}
          className="btn-primary-gradient"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Benefit
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Benefits</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{benefits.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Gift className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {benefits.filter(b => b.is_active).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Gift className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Inactive</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {benefits.filter(b => !b.is_active).length}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Gift className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search benefits by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Loading benefits...
          </div>
        ) : filteredBenefits.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No benefits found
          </div>
        ) : (
          filteredBenefits.map((benefit) => (
            <div
              key={benefit.id}
              className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Gift className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{benefit.name}</h3>
                    {benefit.type && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {benefit.type}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  className={
                    benefit.is_active
                      ? 'bg-green-100 text-green-800 border-0'
                      : 'bg-gray-100 text-gray-800 border-0'
                  }
                >
                  {benefit.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {benefit.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {benefit.description}
                </p>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleViewDetail(benefit)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditBenefit(benefit)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleStatus(benefit)}>
                      {benefit.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setBenefitToDelete(benefit);
                        setShowDeleteConfirm(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Forms & Modals */}
      <BenefitForm
        open={showCreateForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateForm(false);
            setEditingBenefit(null);
          }
        }}
        onSubmit={editingBenefit ? handleUpdateBenefit : handleCreateBenefit}
        initialData={editingBenefit || null}
        isLoading={isSubmitting}
      />

      {showDetailView && selectedBenefit && (
        <BenefitDetail
          open={showDetailView}
          onOpenChange={(open) => {
            if (!open) {
              setShowDetailView(false);
              setSelectedBenefit(null);
            }
          }}
          data={selectedBenefit}
          onEdit={() => handleEditBenefit(selectedBenefit)}
          onDelete={async () => {
            setBenefitToDelete(selectedBenefit);
            setShowDeleteConfirm(true);
            setShowDetailView(false);
          }}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this benefit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Benefit: <span className="font-medium text-gray-900">{benefitToDelete?.name}</span>
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBenefit}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
