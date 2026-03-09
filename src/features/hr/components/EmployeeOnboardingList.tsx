import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, MoreHorizontal, CheckCircle } from 'lucide-react';
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
import { EmployeeOnboardingForm } from './EmployeeOnboardingForm';
import { EmployeeOnboardingDetail } from './EmployeeOnboardingDetail';
import {
  fetchEmployeeOnboardings,
  createEmployeeOnboarding,
  updateEmployeeOnboarding,
  deleteEmployeeOnboarding,
  EmployeeOnboarding,
  CreateEmployeeOnboardingInput,
} from '../services/employeeOnboardingService';

export function EmployeeOnboardingList() {
  const [records, setRecords] = useState<EmployeeOnboarding[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmployeeOnboarding | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<EmployeeOnboarding | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<EmployeeOnboarding | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    const { data, error } = await fetchEmployeeOnboardings();
    if (error) {
      toast.error(error);
    } else {
      setRecords(data);
    }
    setIsLoading(false);
  };

  const filteredRecords = records.filter((record) => {
    const searchMatch =
      record.employees?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employees?.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employees?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.onboarding_tasks?.title.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && record.is_completed) ||
      (filterStatus === 'pending' && !record.is_completed);

    return searchMatch && statusMatch;
  });

  const handleCreateRecord = async (data: CreateEmployeeOnboardingInput) => {
    setIsSubmitting(true);
    const { data: newRecord, error } = await createEmployeeOnboarding(data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Employee onboarding task assigned successfully');
      setRecords([...records, newRecord]);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleEditRecord = (record: EmployeeOnboarding) => {
    setEditingRecord(record);
    setShowCreateForm(true);
    setShowDetailView(false);
  };

  const handleUpdateRecord = async (data: CreateEmployeeOnboardingInput) => {
    if (!editingRecord) return;
    setIsSubmitting(true);
    const { data: updatedRecord, error } = await updateEmployeeOnboarding({
      id: editingRecord.id,
      ...data,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success('Employee onboarding task updated successfully');
      setRecords(records.map(r => r.id === editingRecord.id ? updatedRecord : r));
      setEditingRecord(null);
      setShowDetailView(false);
    }
    setIsSubmitting(false);
  };

  const handleToggleComplete = async (record: EmployeeOnboarding) => {
    setIsSubmitting(true);
    const { error } = await updateEmployeeOnboarding({
      id: record.id,
      is_completed: !record.is_completed,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success(
        record.is_completed
          ? 'Task marked as pending'
          : 'Task marked as completed'
      );
      setRecords(
        records.map(r =>
          r.id === record.id ? { ...r, is_completed: !r.is_completed } : r
        )
      );
    }
    setIsSubmitting(false);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsSubmitting(true);
    const { error } = await deleteEmployeeOnboarding(recordToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Employee onboarding task deleted successfully');
      setRecords(records.filter(r => r.id !== recordToDelete.id));
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    }
    setIsSubmitting(false);
  };

  const handleViewDetail = (record: EmployeeOnboarding) => {
    setSelectedRecord(record);
    setShowDetailView(true);
  };

  const getStatusBadge = (record: EmployeeOnboarding) => {
    if (record.is_completed) {
      return <Badge className="bg-green-500 text-white">Completed</Badge>;
    }
    return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Employee Onboarding</h1>
          <p>Manage employee onboarding task assignments</p>
        </div>
        <Button
          onClick={() => {
            setEditingRecord(null);
            setShowCreateForm(true);
          }}
          className="btn-primary-gradient"
        >
          <Plus className="mr-2 h-4 w-4" />
          Assign Task
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee, email, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            size="sm"
          >
            Completed
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">Employee</th>
              <th className="text-left py-3 px-4 font-semibold">Task</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  Loading records...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? 'No matching employee onboarding records found'
                    : 'No employee onboarding records yet. Click "Assign Task" to get started.'}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">
                        {record.employees?.first_name} {record.employees?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.employees?.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{record.onboarding_tasks?.title}</p>
                      {record.onboarding_tasks?.is_mandatory && (
                        <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                          Required
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(record)}</td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isSubmitting}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetail(record)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleComplete(record)}
                          disabled={isSubmitting}
                        >
                          {record.is_completed ? 'Mark as Pending' : 'Mark as Completed'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setRecordToDelete(record);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Create/Edit Form Modal */}
      <EmployeeOnboardingForm
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) setEditingRecord(null);
        }}
        onSubmit={editingRecord ? handleUpdateRecord : handleCreateRecord}
        initialData={editingRecord}
        isLoading={isSubmitting}
      />

      {/* Detail View Modal */}
      {selectedRecord && (
        <EmployeeOnboardingDetail
          open={showDetailView}
          onOpenChange={setShowDetailView}
          data={selectedRecord}
          onEdit={() => handleEditRecord(selectedRecord)}
          onDelete={async () => {
            setRecordToDelete(selectedRecord);
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
            <AlertDialogTitle>Delete Employee Onboarding Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the onboarding task for{' '}
              {recordToDelete?.employees?.first_name}{' '}
              {recordToDelete?.employees?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecord}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
