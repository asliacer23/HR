import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Briefcase } from 'lucide-react';
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
import { EmployeeTrainingForm } from '../components/EmployeeTrainingForm';
import { EmployeeTrainingDetail } from '../components/EmployeeTrainingDetail';
import { EmployeeTrainingList } from '../components/EmployeeTrainingList';
import {
  fetchEmployeeTrainings,
  createEmployeeTraining,
  updateEmployeeTraining,
  deleteEmployeeTraining,
  EmployeeTraining,
  CreateEmployeeTrainingInput,
} from '@/features/hr/services/employeeTrainingService';

export function EmployeeTrainingPage() {
  const [trainings, setTrainings] = useState<EmployeeTraining[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<EmployeeTraining | null>(null);
  const [trainingToDelete, setTrainingToDelete] = useState<EmployeeTraining | null>(null);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    setIsLoading(true);
    const { data, error } = await fetchEmployeeTrainings();
    if (error) {
      toast.error(error);
    } else {
      setTrainings(data);
    }
    setIsLoading(false);
  };

  const handleCreateTraining = async (data: CreateEmployeeTrainingInput) => {
    setIsSubmitting(true);
    const { data: newTraining, error } = await createEmployeeTraining(data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Training assigned successfully');
      await loadTrainings();
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleViewTraining = (training: EmployeeTraining) => {
    setSelectedTraining(training);
    setShowDetailView(true);
    setShowCreateForm(false);
  };

  const handleUpdateTraining = async (data: Partial<EmployeeTraining>) => {
    if (!selectedTraining) return;
    setIsSubmitting(true);
    const { error } = await updateEmployeeTraining({
      id: selectedTraining.id,
      status: data.status,
      start_date: data.start_date,
      completion_date: data.completion_date,
      score: data.score,
      certificate_url: data.certificate_url,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success('Training updated successfully');
      await loadTrainings();
      setShowDetailView(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (training: EmployeeTraining) => {
    setTrainingToDelete(training);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!trainingToDelete) return;
    setIsSubmitting(true);
    const { error } = await deleteEmployeeTraining(trainingToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Training deleted successfully');
      setTrainings(trainings.filter(t => t.id !== trainingToDelete.id));
    }
    setShowDeleteConfirm(false);
    setTrainingToDelete(null);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Employee Training</h1>
        </div>
        <p className="text-gray-600">
          Manage employee training programs and track completion status
        </p>
      </div>

      {/* Search and Create */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by employee name, number, or program..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Training
        </Button>
      </div>

      {/* Training List */}
      <EmployeeTrainingList
        trainings={trainings}
        isLoading={isLoading}
        onView={handleViewTraining}
        onEdit={handleViewTraining}
        onDelete={handleDeleteClick}
        searchQuery={searchQuery}
      />

      {/* Create Form Dialog */}
      <EmployeeTrainingForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateTraining}
        isLoading={isSubmitting}
      />

      {/* Detail Dialog */}
      <EmployeeTrainingDetail
        open={showDetailView}
        onOpenChange={setShowDetailView}
        training={selectedTraining}
        onUpdate={handleUpdateTraining}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training assignment? This action cannot be undone.
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
