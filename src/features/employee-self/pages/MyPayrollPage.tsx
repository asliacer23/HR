import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { PesoSign } from '@/components/icons/PesoSign';

export function MyPayrollPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>My Payroll</h1>
        <p>View your salary and payment history</p>
      </div>

      <div className="card-elevated p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Welcome to Your Payroll Portal</h2>
          <p className="text-muted-foreground">
            Access your detailed payroll statements, salary information, and payment history all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Payroll Records</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View detailed salary statements for each pay period
                </p>
              </div>
              <PesoSign className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
            <Link to="/my-payroll-records">
              <Button className="mt-4 w-full" variant="outline">
                View Payroll Records <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  More payroll features will be available soon
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-sm text-blue-900">
            <strong>Need help?</strong> Contact your HR department if you have questions about your payroll or salary.
          </p>
        </div>
      </div>
    </div>
  );
}

