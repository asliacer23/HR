import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, MoreHorizontal } from 'lucide-react';
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
import { PerformanceForm } from '../components/PerformanceForm';
import { PerformanceDetail } from '../components/PerformanceDetail';
import {
  fetchPerformanceEvaluations,
  createPerformanceEvaluation,
  updatePerformanceEvaluation,
  deletePerformanceEvaluation,
  PerformanceEvaluation,
  CreatePerformanceEvaluationInput,
} from '@/features/hr/services/performanceService';

export function PerformancePage() {
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<PerformanceEvaluation | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<PerformanceEvaluation | null>(null);
  const [evaluationToDelete, setEvaluationToDelete] = useState<PerformanceEvaluation | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setIsLoading(true);
    const { data, error } = await fetchPerformanceEvaluations();
    if (error) {
      toast.error(error);
    } else {
      setEvaluations(data);
    }
    setIsLoading(false);
  };

  const filteredEvaluations = evaluations.filter(evaluation =>
    evaluation.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateEvaluation = async (data: CreatePerformanceEvaluationInput) => {
    setIsSubmitting(true);
    try {
      const { data: newEvaluation, error } = await createPerformanceEvaluation(data);
      if (error) {
        toast.error(`Failed to create evaluation: ${error}`);
      } else if (newEvaluation) {
        toast.success('Evaluation created successfully');
        setEvaluations([newEvaluation, ...evaluations]);
        setShowCreateForm(false);
      } else {
        toast.error('Failed to create evaluation: No data returned');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleEditEvaluation = (evaluation: PerformanceEvaluation) => {
    setEditingEvaluation(evaluation);
    setShowCreateForm(true);
    setShowDetailView(false);
  };

  const handleUpdateEvaluation = async (data: CreatePerformanceEvaluationInput) => {
    if (!editingEvaluation) return;
    setIsSubmitting(true);
    try {
      const { data: updatedEvaluation, error } = await updatePerformanceEvaluation({
        id: editingEvaluation.id,
        ...data,
      });
      if (error) {
        toast.error(`Failed to update evaluation: ${error}`);
      } else if (updatedEvaluation) {
        toast.success('Evaluation updated successfully');
        setEvaluations(evaluations.map(e => e.id === editingEvaluation.id ? updatedEvaluation : e));
        setEditingEvaluation(null);
        setShowCreateForm(false);
      } else {
        toast.error('Failed to update evaluation: No data returned');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleDeleteEvaluation = async () => {
    if (!evaluationToDelete) return;
    setIsSubmitting(true);
    try {
      const { error } = await deletePerformanceEvaluation(evaluationToDelete.id);
      if (error) {
        toast.error(`Failed to delete evaluation: ${error}`);
      } else {
        toast.success('Evaluation deleted successfully');
        setEvaluations(evaluations.filter(e => e.id !== evaluationToDelete.id));
        setShowDeleteConfirm(false);
        setEvaluationToDelete(null);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleViewDetail = (evaluation: PerformanceEvaluation) => {
    setSelectedEvaluation(evaluation);
    setShowDetailView(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-interview';
      case 'pending': return 'status-pending';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Performance Evaluations</h1>
          <p>Manage employee performance reviews</p>
        </div>
        <Button
          onClick={() => {
            setEditingEvaluation(null);
            setShowCreateForm(true);
          }}
          className="btn-primary-gradient"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Evaluation
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search evaluations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Period</th>
              <th>Status</th>
              <th>Rating</th>
              <th className="w-12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading evaluations...
                </td>
              </tr>
            ) : filteredEvaluations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No matching evaluations found' : 'No evaluations found. Click "New Evaluation" to get started.'}
                </td>
              </tr>
            ) : (
              filteredEvaluations.map((evaluation) => (
                <tr key={evaluation.id}>
                  <td className="font-medium">{evaluation.employee_number} - {evaluation.employee_name}</td>
                  <td>{new Date(evaluation.evaluation_period_start).toLocaleDateString()} - {new Date(evaluation.evaluation_period_end).toLocaleDateString()}</td>
                  <td>
                    <Badge className={getStatusColor(evaluation.status)}>
                      {evaluation.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>{evaluation.overall_rating ? `${evaluation.overall_rating}/5` : '-'}</td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetail(evaluation)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditEvaluation(evaluation)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setEvaluationToDelete(evaluation);
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
      <PerformanceForm
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) setEditingEvaluation(null);
        }}
        onSubmit={editingEvaluation ? handleUpdateEvaluation : handleCreateEvaluation}
        initialData={editingEvaluation}
        isLoading={isSubmitting}
      />

      {/* Detail View Modal */}
      {selectedEvaluation && (
        <PerformanceDetail
          open={showDetailView}
          onOpenChange={setShowDetailView}
          data={selectedEvaluation}
          onEdit={() => handleEditEvaluation(selectedEvaluation)}
          onDelete={async () => {
            setEvaluationToDelete(selectedEvaluation);
            setShowDeleteConfirm(true);
            setShowDetailView(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evaluation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvaluation}
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
