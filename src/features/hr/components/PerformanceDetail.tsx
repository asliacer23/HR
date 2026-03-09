import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Copy, Plus } from 'lucide-react';
import { PerformanceEvaluation } from '@/features/hr/services/performanceService';
import { toast } from 'sonner';
import { EvaluationScoreForm } from './EvaluationScoreForm';
import { EvaluationScoreList } from './EvaluationScoreList';
import { fetchEvaluationScoresByEvaluation, deleteEvaluationScore, EvaluationScore } from '../services/evaluationScoresService';

interface PerformanceDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PerformanceEvaluation | null;
  onEdit?: (data: PerformanceEvaluation) => void;
  onDelete?: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'status-completed';
    case 'in_progress': return 'status-interview';
    case 'pending': return 'status-pending';
    default: return 'bg-muted';
  }
};

export function PerformanceDetail({
  open,
  onOpenChange,
  data,
  onEdit,
  onDelete,
  isLoading = false,
}: PerformanceDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [evaluationScores, setEvaluationScores] = useState<EvaluationScore[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [isScoreFormOpen, setIsScoreFormOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<EvaluationScore | null>(null);
  const [scoreToDelete, setScoreToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (open && data) {
      loadEvaluationScores();
    }
  }, [open, data]);

  const loadEvaluationScores = async () => {
    if (!data) return;
    setScoresLoading(true);
    try {
      const { data: scores, error } = await fetchEvaluationScoresByEvaluation(data.id);
      if (error) throw error;
      setEvaluationScores(scores || []);
    } catch (error) {
      console.error('Failed to load evaluation scores:', error);
    }
    setScoresLoading(false);
  };

  const handleDeleteScore = async () => {
    if (!scoreToDelete) return;

    try {
      const { error } = await deleteEvaluationScore(scoreToDelete);
      if (error) throw error;

      setEvaluationScores(evaluationScores.filter(s => s.id !== scoreToDelete));
      toast.success('Score deleted successfully');
    } catch (error) {
      toast.error('Failed to delete score');
    } finally {
      setScoreToDelete(null);
    }
  };

  const handleDelete = async () => {
    if (!data || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(data.id);
      toast.success('Evaluation deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete evaluation');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const text = `Period: ${new Date(data.evaluation_period_start).toLocaleDateString()} - ${new Date(data.evaluation_period_end).toLocaleDateString()}\nStatus: ${data.status}\nRating: ${data.overall_rating || 'N/A'}/5\nStrengths: ${data.strengths || 'N/A'}\nAreas for Improvement: ${data.areas_for_improvement || 'N/A'}\nRecommendations: ${data.recommendations || 'N/A'}`;
    navigator.clipboard.writeText(text);
    toast.success('Evaluation copied to clipboard');
  };

  if (!data) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">Performance Evaluation</DialogTitle>
                <DialogDescription className="mt-2">
                  {new Date(data.evaluation_period_start).toLocaleDateString()} - {new Date(data.evaluation_period_end).toLocaleDateString()}
                </DialogDescription>
              </div>
              <Badge className={getStatusColor(data.status)}>
                {data.status.replace('_', ' ')}
              </Badge>
            </div>
          </DialogHeader>

          <Separator />

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Employee</label>
              <p className="text-base font-medium">{data.employee_number ? `${data.employee_number} - ` : ''}{data.employee_name || 'Unknown'}</p>
            </div>

            {data.overall_rating && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Overall Rating</label>
                <p className="text-base">{data.overall_rating}/5</p>
              </div>
            )}

            {data.strengths && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Strengths</label>
                <p className="text-base">{data.strengths}</p>
              </div>
            )}

            {data.areas_for_improvement && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Areas for Improvement</label>
                <p className="text-base">{data.areas_for_improvement}</p>
              </div>
            )}

            {data.recommendations && (
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Recommendations</label>
                <p className="text-base">{data.recommendations}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-muted-foreground">Created</label>
              <p className="text-base">{new Date(data.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <Separator />

          {/* Evaluation Scores Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Evaluation Scores</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingScore(null);
                  setIsScoreFormOpen(true);
                }}
                className="btn-primary-gradient"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Score
              </Button>
            </div>
            <EvaluationScoreList
              scores={evaluationScores}
              isLoading={scoresLoading}
              onEdit={(score) => {
                setEditingScore(score);
                setIsScoreFormOpen(true);
              }}
              onDelete={(scoreId) => setScoreToDelete(scoreId)}
            />
          </div>

          <Separator />

          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit?.(data);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evaluation Score Form */}
      <EvaluationScoreForm
        open={isScoreFormOpen}
        onOpenChange={setIsScoreFormOpen}
        evaluationId={data?.id || ''}
        editingScore={editingScore}
        onSuccess={loadEvaluationScores}
      />

      {/* Delete Score Confirmation */}
      <AlertDialog open={!!scoreToDelete} onOpenChange={(open) => !open && setScoreToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Score?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evaluation score? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteScore}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this evaluation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
