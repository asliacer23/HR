import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { createEvaluationScore, updateEvaluationScore, fetchPerformanceCriteria, CreateEvaluationScoreInput, UpdateEvaluationScoreInput, EvaluationScore } from '../services/evaluationScoresService';

interface EvaluationScoreFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationId: string;
  onSuccess: () => void;
  editingScore?: EvaluationScore | null;
}

interface PerformanceCriteria {
  id: string;
  name: string;
  description: string | null;
  weight: number | null;
}

export function EvaluationScoreForm({
  open,
  onOpenChange,
  evaluationId,
  onSuccess,
  editingScore,
}: EvaluationScoreFormProps) {
  const [formData, setFormData] = useState({
    criteria_id: '',
    score: '',
    comments: '',
  });
  const [criteria, setCriteria] = useState<PerformanceCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true);

  useEffect(() => {
    fetchCriteria();
  }, []);

  useEffect(() => {
    if (editingScore) {
      setFormData({
        criteria_id: editingScore.criteria_id,
        score: editingScore.score.toString(),
        comments: editingScore.comments || '',
      });
    } else {
      resetForm();
    }
  }, [editingScore, open]);

  const fetchCriteria = async () => {
    setIsLoadingCriteria(true);
    try {
      const { data, error } = await fetchPerformanceCriteria();
      if (error) throw error;
      setCriteria(data);
    } catch (error) {
      toast.error('Failed to load performance criteria');
    }
    setIsLoadingCriteria(false);
  };

  const resetForm = () => {
    setFormData({
      criteria_id: '',
      score: '',
      comments: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.criteria_id || !formData.score) {
      toast.error('Please fill in all required fields');
      return;
    }

    const score = parseFloat(formData.score);
    if (score < 0 || score > 5) {
      toast.error('Score must be between 0 and 5');
      return;
    }

    setIsLoading(true);

    try {
      if (editingScore) {
        const { error } = await updateEvaluationScore({
          id: editingScore.id,
          score,
          comments: formData.comments || undefined,
        });
        if (error) throw error;
        toast.success('Evaluation score updated successfully');
      } else {
        const { error } = await createEvaluationScore({
          evaluation_id: evaluationId,
          criteria_id: formData.criteria_id,
          score,
          comments: formData.comments || undefined,
        });
        if (error) throw error;
        toast.success('Evaluation score added successfully');
      }

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save evaluation score');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingScore ? 'Edit' : 'Add'} Evaluation Score</DialogTitle>
          <DialogDescription>
            {editingScore
              ? 'Update the evaluation score and comments'
              : 'Add a new evaluation score for this performance evaluation'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Performance Criteria */}
          <div className="space-y-2">
            <Label htmlFor="criteria_id" className="text-sm font-medium">
              Performance Criteria *
            </Label>
            <Select
              value={formData.criteria_id}
              onValueChange={(value) => setFormData({ ...formData, criteria_id: value })}
              disabled={isLoadingCriteria || !!editingScore}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select criteria..." />
              </SelectTrigger>
              <SelectContent>
                {criteria.map((crit) => (
                  <SelectItem key={crit.id} value={crit.id}>
                    {crit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {criteria.find(c => c.id === formData.criteria_id)?.description && (
              <p className="text-xs text-muted-foreground">
                {criteria.find(c => c.id === formData.criteria_id)?.description}
              </p>
            )}
          </div>

          {/* Score */}
          <div className="space-y-2">
            <Label htmlFor="score" className="text-sm font-medium">
              Score (0-5) *
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="score"
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                placeholder="e.g., 4.5"
                className="h-11 flex-1 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">/5.0</span>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Comments (Optional)
            </Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Add any comments or notes..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-primary-gradient"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingScore ? 'Update' : 'Add'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
