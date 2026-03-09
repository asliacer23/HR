import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, GraduationCap, Clock, CheckCircle2, AlertCircle as AlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface EmployeeTraining {
  id: string;
  employee_id: string;
  program_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string | null;
  completion_date: string | null;
  score: number | null;
  certificate_url: string | null;
  created_at: string;
  training_programs?: {
    id: string;
    title: string;
    description: string | null;
    duration_hours: number | null;
    is_mandatory: boolean;
  } | null;
}

export function MyTrainingPage() {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<EmployeeTraining[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyTrainings();
    }
  }, [user]);

  const fetchMyTrainings = async () => {
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
        setTrainings([]);
        return;
      }

      // Now fetch trainings for this employee
      const { data, error: trainingsError } = await supabase
        .from('employee_trainings')
        .select('*, training_programs(*)')
        .eq('employee_id', employeeData.id)
        .order('start_date', { ascending: false });

      if (trainingsError) {
        console.error('Error fetching trainings:', trainingsError);
        setError('Failed to load your training assignments');
        toast.error('Failed to load your training assignments');
      } else {
        setTrainings(data || []);
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
      case 'scheduled':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'in_progress':
        return <Clock className="h-5 w-5" />;
      case 'scheduled':
        return <GraduationCap className="h-5 w-5" />;
      case 'cancelled':
        return <AlertIcon className="h-5 w-5" />;
      default:
        return <GraduationCap className="h-5 w-5" />;
    }
  };

  const upcomingTrainings = trainings.filter(t => t.status === 'scheduled');
  const inProgressTrainings = trainings.filter(t => t.status === 'in_progress');
  const completedTrainings = trainings.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>My Training</h1>
        <p>View your training programs and progress</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Error Loading Trainings</h3>
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
      ) : trainings.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No training assignments yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your training assignments will appear here once your HR manager assigns them.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Trainings */}
          {upcomingTrainings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Scheduled Training ({upcomingTrainings.length})
              </h2>
              <div className="space-y-3">
                {upcomingTrainings.map((training) => (
                  <TrainingCard key={training.id} training={training} statusColor={getStatusColor} statusIcon={getStatusIcon} />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Trainings */}
          {inProgressTrainings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                In Progress ({inProgressTrainings.length})
              </h2>
              <div className="space-y-3">
                {inProgressTrainings.map((training) => (
                  <TrainingCard key={training.id} training={training} statusColor={getStatusColor} statusIcon={getStatusIcon} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Trainings */}
          {completedTrainings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Completed ({completedTrainings.length})
              </h2>
              <div className="space-y-3">
                {completedTrainings.map((training) => (
                  <TrainingCard key={training.id} training={training} statusColor={getStatusColor} statusIcon={getStatusIcon} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TrainingCardProps {
  training: EmployeeTraining;
  statusColor: (status: string) => string;
  statusIcon: (status: string) => React.ReactNode;
}

function TrainingCard({ training, statusColor, statusIcon }: TrainingCardProps) {
  const program = training.training_programs;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="card-elevated p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{program?.title || 'Unknown Program'}</h3>
                <Badge className={statusColor(training.status)}>
                  {training.status.replace('_', ' ')}
                </Badge>
                {program?.is_mandatory && <Badge variant="destructive">Mandatory</Badge>}
              </div>

              {program?.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {program.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {program?.duration_hours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{program.duration_hours} hours</span>
                  </div>
                )}
                {training.start_date && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Start:</span>
                    <span>{new Date(training.start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {training.score !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-semibold">{training.score}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-2xl opacity-50">{statusIcon(training.status)}</div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program?.title || 'Training Details'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Mandatory */}
          <div className="flex gap-3">
            <Badge className={statusColor(training.status)}>
              {training.status.replace('_', ' ')}
            </Badge>
            {program?.is_mandatory && <Badge variant="destructive">Mandatory</Badge>}
          </div>

          <Separator />

          {/* Program Details */}
          {program && (
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-1">
                  Duration
                </h4>
                <p>{program.duration_hours ? `${program.duration_hours} hours` : 'Not specified'}</p>
              </div>

              {program.description && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-1">
                    Description
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{program.description}</p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Training Progress */}
          <div className="grid grid-cols-2 gap-4">
            {training.start_date && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-1">
                  Start Date
                </h4>
                <p>{new Date(training.start_date).toLocaleDateString()}</p>
              </div>
            )}

            {training.completion_date && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-1">
                  Completion Date
                </h4>
                <p>{new Date(training.completion_date).toLocaleDateString()}</p>
              </div>
            )}

            {training.score !== null && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-1">
                  Score
                </h4>
                <p className="text-lg font-semibold">{training.score}%</p>
              </div>
            )}

            {training.status === 'completed' && training.certificate_url && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-1">
                  Certificate
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(training.certificate_url, '_blank')}
                >
                  Download
                </Button>
              </div>
            )}
          </div>

          {training.status === 'completed' && !training.certificate_url && (
            <p className="text-sm text-muted-foreground italic">
              Training completed. Certificate will be available once issued.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
