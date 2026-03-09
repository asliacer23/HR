import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { PesoSign } from '@/components/icons/PesoSign';
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
import { PayrollForm } from '../components/PayrollForm';
import { PayrollDetail } from '../components/PayrollDetail';
import {
  fetchPayrollPeriods,
  createPayrollPeriod,
  updatePayrollPeriod,
  deletePayrollPeriod,
  togglePayrollStatus,
  PayrollPeriod,
  CreatePayrollPeriodInput,
} from '../services/payrollService';

export function PayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<PayrollPeriod | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    setIsLoading(true);
    const { data, error } = await fetchPayrollPeriods();
    if (error) {
      toast.error(error);
    } else {
      setPeriods(data);
    }
    setIsLoading(false);
  };

  const filteredPeriods = periods.filter(period =>
    new Date(period.period_start).toLocaleDateString().includes(searchQuery)
  );

  const handleCreatePeriod = async (data: CreatePayrollPeriodInput) => {
    setIsSubmitting(true);
    const { data: newPeriod, error } = await createPayrollPeriod(data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Payroll period created successfully');
      setPeriods([newPeriod, ...periods]);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleEditPeriod = (period: PayrollPeriod) => {
    setEditingPeriod(period);
    setShowCreateForm(true);
    setShowDetailView(false);
  };

  const handleUpdatePeriod = async (data: CreatePayrollPeriodInput) => {
    if (!editingPeriod) return;
    setIsSubmitting(true);
    const { data: updatedPeriod, error } = await updatePayrollPeriod({
      id: editingPeriod.id,
      ...data,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success('Payroll period updated successfully');
      setPeriods(periods.map(p => p.id === editingPeriod.id ? updatedPeriod : p));
      setEditingPeriod(null);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleDeletePeriod = async () => {
    if (!periodToDelete) return;
    setIsSubmitting(true);
    const { error } = await deletePayrollPeriod(periodToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Payroll period deleted successfully');
      setPeriods(periods.filter(p => p.id !== periodToDelete.id));
      setShowDeleteConfirm(false);
      setPeriodToDelete(null);
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (period: PayrollPeriod) => {
    const { data: updatedPeriod, error } = await togglePayrollStatus(period.id, period.is_processed);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Payroll period ${updatedPeriod?.is_processed ? 'marked as processed' : 'marked as pending'}`);
      setPeriods(periods.map(p => p.id === period.id ? updatedPeriod : p));
    }
  };

  const handleViewDetail = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setShowDetailView(true);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">Manage payroll periods and payment schedules</p>
        </div>
        <Button
          onClick={() => {
            setEditingPeriod(null);
            setShowCreateForm(true);
          }}
          className="btn-primary-gradient"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Pay Period
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Periods</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{periods.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <PesoSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Processed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {periods.filter(p => p.is_processed).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <PesoSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {periods.filter(p => !p.is_processed).length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <PesoSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by period start date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pay Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading payroll periods...
                  </td>
                </tr>
              ) : filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No payroll periods found
                  </td>
                </tr>
              ) : (
                filteredPeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">
                        {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(period.pay_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {period.is_processed ? (
                        <Badge className="bg-green-100 text-green-800 border-0">Processed</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(period.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetail(period)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPeriod(period)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(period)}>
                            {period.is_processed ? 'Mark as Pending' : 'Mark as Processed'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setPeriodToDelete(period);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms & Modals */}
      <PayrollForm
        open={showCreateForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateForm(false);
            setEditingPeriod(null);
          }
        }}
        onSubmit={editingPeriod ? handleUpdatePeriod : handleCreatePeriod}
        initialData={editingPeriod || null}
        isLoading={isSubmitting}
      />

      {showDetailView && selectedPeriod && (
        <PayrollDetail
          open={showDetailView}
          onOpenChange={(open) => {
            if (!open) {
              setShowDetailView(false);
              setSelectedPeriod(null);
            }
          }}
          data={selectedPeriod}
          onEdit={() => handleEditPeriod(selectedPeriod)}
          onDelete={async () => {
            setPeriodToDelete(selectedPeriod);
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
            <AlertDialogTitle>Delete Payroll Period</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payroll period? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Period: {periodToDelete && new Date(periodToDelete.period_start).toLocaleDateString()} - {periodToDelete && new Date(periodToDelete.period_end).toLocaleDateString()}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePeriod}
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

