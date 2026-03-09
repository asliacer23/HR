import { formatCurrencyPHP } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Gift, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface BenefitInfo {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  is_active: boolean;
}

interface EmployeeBenefit {
  id: string;
  employee_id: string;
  benefit_id: string;
  enrolled_at: string;
  coverage_amount: number | null;
  is_active: boolean;
  benefits?: BenefitInfo | null;
}

export function MyBenefitsPage() {
  const { user } = useAuth();
  const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyBenefits();
    }
  }, [user]);

  const fetchMyBenefits = async () => {
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
        setBenefits([]);
        return;
      }

      // Fetch benefits for this employee
      const { data, error: benefitsError } = await supabase
        .from('employee_benefits')
        .select('*, benefits(*)')
        .eq('employee_id', employeeData.id)
        .order('enrolled_at', { ascending: false });

      if (benefitsError) {
        console.error('Error fetching benefits:', benefitsError);
        setError('Failed to load your benefits');
        toast.error('Failed to load your benefits');
      } else {
        setBenefits(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const activeBenefits = benefits.filter(b => b.is_active);
  const inactiveBenefits = benefits.filter(b => !b.is_active);

  const getBenefitTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'health':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'dental':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'vision':
        return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      case 'life insurance':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'retirement':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>My Benefits</h1>
        <p>View your employee benefits and coverage details</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Error Loading Benefits</h3>
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
      ) : benefits.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No benefits enrolled</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your HR department will enroll you in benefits when available.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Benefits */}
          {activeBenefits.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Active Benefits ({activeBenefits.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBenefits.map((benefit) => (
                  <BenefitCard key={benefit.id} benefit={benefit} getBenefitTypeColor={getBenefitTypeColor} />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Benefits */}
          {inactiveBenefits.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Inactive Benefits ({inactiveBenefits.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactiveBenefits.map((benefit) => (
                  <BenefitCard key={benefit.id} benefit={benefit} getBenefitTypeColor={getBenefitTypeColor} />
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900">
              <strong>Questions?</strong> Contact your HR department for more information about your benefits coverage or to make changes to your enrollment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface BenefitCardProps {
  benefit: EmployeeBenefit;
  getBenefitTypeColor: (type: string | null) => string;
}

function BenefitCard({ benefit, getBenefitTypeColor }: BenefitCardProps) {
  const benefitInfo = benefit.benefits;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={`card-elevated p-6 hover:shadow-md transition-shadow cursor-pointer ${!benefit.is_active ? 'opacity-75' : ''}`}>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-semibold text-lg ${!benefit.is_active ? 'line-through text-muted-foreground' : ''}`}>
                {benefitInfo?.name || 'Unknown Benefit'}
              </h3>
              {benefit.is_active ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
              )}
            </div>

            {benefitInfo?.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {benefitInfo.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {benefitInfo?.type && (
                <Badge className={getBenefitTypeColor(benefitInfo.type)}>
                  {benefitInfo.type}
                </Badge>
              )}
              {benefit.is_active ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 border-amber-300">Inactive</Badge>
              )}
            </div>

            {benefit.coverage_amount && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Coverage Amount</p>
                <p className="text-lg font-semibold">{benefit.coverage_amount !== null ? formatCurrencyPHP(benefit.coverage_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</p>
              </div>
            )}
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{benefitInfo?.name || 'Benefit Details'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            {benefit.is_active ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700">Benefit Active</p>
                  <p className="text-sm text-green-600">
                    Enrolled {new Date(benefit.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Clock className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-700">Benefit Inactive</p>
                  <p className="text-sm text-amber-600">
                    Enrolled {new Date(benefit.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Benefit Information */}
          {benefitInfo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                  Benefit Type
                </h4>
                <Badge className={getBenefitTypeColor(benefitInfo.type)}>
                  {benefitInfo.type || 'General'}
                </Badge>
              </div>

              {benefitInfo.description && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                    Description
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{benefitInfo.description}</p>
                </div>
              )}

              {benefit.coverage_amount && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                    Coverage Amount
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">{benefit.coverage_amount !== null ? formatCurrencyPHP(benefit.coverage_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Enrollment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                Enrollment Date
              </h4>
              <p className="text-sm">{new Date(benefit.enrolled_at).toLocaleDateString()}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">
                Status
              </h4>
              <p className="text-sm">
                {benefit.is_active ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-amber-600 font-medium">Inactive</span>
                )}
              </p>
            </div>
          </div>

          <Separator />

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900">
              For specific details about your coverage, terms, conditions, or to make changes to your enrollment, please contact your HR department.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



