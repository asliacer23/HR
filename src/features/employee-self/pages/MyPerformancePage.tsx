import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface PerformanceEvaluation {
  id: string;
  employee_id: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  status: 'pending' | 'in_progress' | 'completed';
  overall_rating: number | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  recommendations: string | null;
  created_at: string;
  updated_at: string;
}

export function MyPerformancePage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEval, setSelectedEval] = useState<PerformanceEvaluation | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyPerformance();
    }
  }, [user]);

  const fetchMyPerformance = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // First, get the employee ID for the current user
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        setError('Failed to load your employee information');
        toast.error('Failed to load your employee information');
        return;
      }

      if (!employeeData) {
        setError('Employee record not found');
        toast.error('Employee record not found');
        setEvaluations([]);
        return;
      }

      // Now fetch performance evaluations for this employee
      const { data, error: evalsError } = await supabase
        .from('performance_evaluations')
        .select('*')
        .eq('employee_id', employeeData.id)
        .order('evaluation_period_start', { ascending: false });

      if (evalsError) {
        console.error('Error fetching evaluations:', evalsError);
        setError('Failed to load your performance evaluations');
        toast.error('Failed to load your performance evaluations');
      } else {
        setEvaluations(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'text-muted-foreground';
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-blue-600';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>My Performance</h1>
        <p>View your performance evaluations</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Error Loading Evaluations</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : evaluations.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No performance evaluations yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your performance evaluations will appear here once your manager submits them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="card-elevated p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">
                      {new Date(evaluation.evaluation_period_start).toLocaleDateString()} -{' '}
                      {new Date(evaluation.evaluation_period_end).toLocaleDateString()}
                    </h3>
                    <Badge className={getStatusColor(evaluation.status)}>
                      {evaluation.status.replace('_', ' ').charAt(0).toUpperCase() +
                        evaluation.status.replace('_', ' ').slice(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {evaluation.overall_rating !== null && (
                      <div className="bg-muted/50 rounded p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Overall Rating
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${getRatingColor(evaluation.overall_rating)}`}>
                          {evaluation.overall_rating}/5
                        </p>
                      </div>
                    )}
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Evaluation Date
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedEval(evaluation)}>
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        Performance Evaluation:{' '}
                        {new Date(evaluation.evaluation_period_start).toLocaleDateString()} -{' '}
                        {new Date(evaluation.evaluation_period_end).toLocaleDateString()}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Status and Rating */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Status
                          </p>
                          <Badge className={getStatusColor(evaluation.status)}>
                            {evaluation.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {evaluation.overall_rating !== null && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              Overall Rating
                            </p>
                            <p className={`text-2xl font-bold ${getRatingColor(evaluation.overall_rating)}`}>
                              {evaluation.overall_rating}/5
                            </p>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Strengths */}
                      {evaluation.strengths && (
                        <div>
                          <h4 className="font-semibold mb-2 text-green-700">Strengths</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {evaluation.strengths}
                          </p>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {evaluation.areas_for_improvement && (
                        <div>
                          <h4 className="font-semibold mb-2 text-amber-700">Areas for Improvement</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {evaluation.areas_for_improvement}
                          </p>
                        </div>
                      )}

                      {/* Recommendations */}
                      {evaluation.recommendations && (
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-700">Recommendations</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {evaluation.recommendations}
                          </p>
                        </div>
                      )}

                      {!evaluation.strengths &&
                        !evaluation.areas_for_improvement &&
                        !evaluation.recommendations && (
                          <p className="text-sm text-muted-foreground italic">
                            No detailed feedback provided yet.
                          </p>
                        )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Quick preview of strengths */}
              {evaluation.strengths && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-1">Key Strengths</p>
                  <p className="text-sm text-green-900 line-clamp-2">{evaluation.strengths}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
