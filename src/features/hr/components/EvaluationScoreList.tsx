import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EvaluationScore } from '../services/evaluationScoresService';

interface EvaluationScoreListProps {
  scores: EvaluationScore[];
  isLoading: boolean;
  onEdit: (score: EvaluationScore) => void;
  onDelete: (scoreId: string) => void;
}

export function EvaluationScoreList({
  scores,
  isLoading,
  onEdit,
  onDelete,
}: EvaluationScoreListProps) {
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-100 text-green-800';
    if (score >= 4) return 'bg-blue-100 text-blue-800';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800';
    if (score >= 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="card-elevated overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th>Criteria</th>
            <th>Score</th>
            <th>Comments</th>
            <th className="w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-muted-foreground">
                Loading scores...
              </td>
            </tr>
          ) : scores.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-muted-foreground">
                No evaluation scores yet
              </td>
            </tr>
          ) : (
            scores.map((score) => (
              <tr key={score.id}>
                <td className="font-medium">
                  <div>
                    <p>{score.performance_criteria?.name}</p>
                    {score.performance_criteria?.description && (
                      <p className="text-xs text-muted-foreground">
                        {score.performance_criteria.description}
                      </p>
                    )}
                  </div>
                </td>
                <td>
                  <Badge className={`${getScoreColor(score.score)} border-0`}>
                    {score.score.toFixed(2)} / 5.0
                  </Badge>
                </td>
                <td className="text-sm text-muted-foreground max-w-xs truncate">
                  {score.comments || '-'}
                </td>
                <td className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(score)}
                    title="Edit score"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(score.id)}
                    title="Delete score"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
