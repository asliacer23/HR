import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface OnboardingTask {
  id: string;
  title: string;
  description: string | null;
  is_mandatory: boolean;
}

interface EmployeeOnboarding {
  id: string;
  employee_id: string;
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  onboarding_tasks?: OnboardingTask | null;
}

export function MyOnboardingPage() {
  const { user } = useAuth();
  const [onboardings, setOnboardings] = useState<EmployeeOnboarding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyOnboarding();
    }
  }, [user]);

  const fetchMyOnboarding = async () => {
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
        setOnboardings([]);
        return;
      }

      // Fetch onboarding records for this employee
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('employee_onboarding')
        .select('*, onboarding_tasks(*)')
        .eq('employee_id', employeeData.id)
        .order('completed_at', { ascending: false, nullsFirst: true });

      if (onboardingError) {
        console.error('Error fetching onboarding:', onboardingError);
        setError('Failed to load your onboarding tasks');
        toast.error('Failed to load your onboarding tasks');
      } else {
        setOnboardings(onboardingData || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const completedTasks = onboardings.filter(o => o.is_completed);
  const pendingTasks = onboardings.filter(o => !o.is_completed);
  const mandatoryTasks = onboardings.filter(o => o.onboarding_tasks?.is_mandatory);
  const completionPercentage = onboardings.length > 0 
    ? Math.round((completedTasks.length / onboardings.length) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>My Onboarding</h1>
        <p>Complete your employee onboarding checklist</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Error Loading Onboarding</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : onboardings.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No onboarding tasks assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your HR manager will assign onboarding tasks to help you get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold mb-4">Onboarding Progress</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-2xl font-bold">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedTasks.length} of {onboardings.length} completed</span>
                <span>{pendingTasks.length} tasks remaining</span>
              </div>
            </div>

            {mandatoryTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <Badge variant="destructive" className="mr-2">Mandatory</Badge>
                  {mandatoryTasks.filter(t => t.is_completed).length} of {mandatoryTasks.length} required tasks completed
                </p>
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Tasks ({pendingTasks.length})
              </h2>
              <div className="space-y-3">
                {pendingTasks.map((onboarding) => (
                  <OnboardingCard key={onboarding.id} onboarding={onboarding} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Completed ({completedTasks.length})
              </h2>
              <div className="space-y-3">
                {completedTasks.map((onboarding) => (
                  <OnboardingCard key={onboarding.id} onboarding={onboarding} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface OnboardingCardProps {
  onboarding: EmployeeOnboarding;
}

function OnboardingCard({ onboarding }: OnboardingCardProps) {
  const task = onboarding.onboarding_tasks;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={`card-elevated p-6 hover:shadow-md transition-shadow cursor-pointer ${
            onboarding.is_completed ? 'opacity-75' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                {onboarding.is_completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${onboarding.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task?.title || 'Unknown Task'}
                </h3>
                {task?.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {task?.is_mandatory && <Badge variant="destructive">Mandatory</Badge>}
                  {onboarding.is_completed && onboarding.completed_at && (
                    <span className="text-xs text-green-600 font-medium">
                      Completed {new Date(onboarding.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task?.title || 'Task Details'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            {onboarding.is_completed ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700">Task Completed</p>
                  {onboarding.completed_at && (
                    <p className="text-sm text-green-600">
                      {new Date(onboarding.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-700">Pending Completion</p>
                  <p className="text-sm text-amber-600">This task is waiting for you</p>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Task Details */}
          {task && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                  Description
                </h4>
                {task.description ? (
                  <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                    Task Type
                  </h4>
                  <div>
                    {task.is_mandatory ? (
                      <Badge variant="destructive">Mandatory</Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                  </div>
                </div>

                {onboarding.is_completed && onboarding.completed_at && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                      Completed Date
                    </h4>
                    <p className="text-sm">{new Date(onboarding.completed_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {onboarding.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                  Notes
                </h4>
                <p className="text-sm whitespace-pre-wrap">{onboarding.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900">
              {onboarding.is_completed
                ? 'This task has been completed. Thank you for completing your onboarding!'
                : 'Please contact your HR manager if you need assistance with this task or have questions.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
