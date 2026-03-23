import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DepartmentIntegrationRegistryItem,
  dispatchDepartmentFlow,
  fetchDepartmentIntegrationRegistry,
} from '@/features/integration/services/departmentIntegrationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowRight,
  BellRing,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileClock,
  FileText,
  GraduationCap,
  Landmark,
  MonitorSmartphone,
  School,
  Send,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Inbox,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/PesoSign';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

function StatCard({ title, value, icon: Icon, trend, trendUp, tone = 'neutral' }: StatCardProps) {
  const toneClass = {
    primary: 'border-blue-200 bg-blue-50/70',
    success: 'border-emerald-200 bg-emerald-50/70',
    warning: 'border-amber-200 bg-amber-50/70',
    danger: 'border-red-200 bg-red-50/70',
    info: 'border-cyan-200 bg-cyan-50/70',
    neutral: 'border-border/60 bg-card',
  }[tone];
  return (
    <div className={`stat-card animate-fade-in border ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs ${trendUp ? 'text-success' : 'text-destructive'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  color: string;
}

function ModuleCard({ title, description, icon: Icon, url, color }: ModuleCardProps) {
  return (
    <Link to={url} className="module-card animate-fade-in group">
      <div className={`mb-4 inline-flex rounded-lg p-3 ${color}`}>
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

function DashboardPanel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ActionChip({
  label,
  icon: Icon,
  variant = 'secondary',
  asLink,
  onClick,
  disabled,
  className,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'secondary' | 'outline';
  asLink?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  if (asLink) {
    return (
      <Button asChild size="sm" variant={variant} className={className ? `justify-start ${className}` : 'justify-start'}>
        <Link to={asLink}>
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      className={className ? `justify-start ${className}` : 'justify-start'}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}) {
  const toneClass = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-sky-100 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[tone];

  return <Badge className={toneClass}>{label}</Badge>;
}

type DashboardIntegrationRow = {
  departmentKey: string;
  department: string;
  purpose: string;
  status: string;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  action: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoint: string;
  eventCode?: string;
};

const integrationIconByDepartmentKey: Record<string, React.ComponentType<{ className?: string }>> = {
  cashier: Landmark,
  clinic: ShieldCheck,
  comlab: MonitorSmartphone,
  guidance: UserCheck,
  pmed: Stethoscope,
};

const fallbackIntegrations: DashboardIntegrationRow[] = [
  {
    departmentKey: 'cashier',
    department: 'Cashier',
    purpose: 'Payroll endorsement, clearance hold and final financial clearance.',
    status: 'Ready for dispatch',
    tone: 'success',
    action: 'Send to Cashier',
    icon: Landmark,
    endpoint: '/rest/v1/rpc/dispatch_department_flow',
    eventCode: 'payroll_submission',
  },
  {
    departmentKey: 'clinic',
    department: 'Clinic',
    purpose: 'Employee profile sync, health routing, and clinic-side staff context.',
    status: 'Ready for dispatch',
    tone: 'success',
    action: 'Send to Clinic',
    icon: ShieldCheck,
    endpoint: '/rest/v1/rpc/dispatch_department_flow',
    eventCode: 'employee_profile_sync',
  },
  {
    departmentKey: 'comlab',
    department: 'Computer Laboratory',
    purpose: 'Staff roster sync, access provisioning, and lab account coordination.',
    status: 'Ready for dispatch',
    tone: 'info',
    action: 'Send to COMLAB',
    icon: MonitorSmartphone,
    endpoint: '/rest/v1/rpc/dispatch_department_flow',
    eventCode: 'employee_profile_sync',
  },
  {
    departmentKey: 'pmed',
    department: 'PMED',
    purpose: 'Employee monitoring, staff profile sync, and consolidated medical oversight.',
    status: 'Ready for dispatch',
    tone: 'danger',
    action: 'Send to PMED',
    icon: Stethoscope,
    endpoint: '/rest/v1/rpc/dispatch_department_flow',
    eventCode: 'employee_profile_sync',
  },
];

function getIntegrationTone(item: DepartmentIntegrationRegistryItem): DashboardIntegrationRow['tone'] {
  if (item.failed_count > 0) return 'danger';
  if (item.pending_count > 0) return 'warning';
  if (item.in_progress_count > 0) return 'info';
  if (item.completed_count > 0) return 'success';
  return 'neutral';
}

function getIntegrationStatusLabel(item: DepartmentIntegrationRegistryItem) {
  if (item.failed_count > 0) {
    return `${item.failed_count} handoff${item.failed_count > 1 ? 's' : ''} need attention`;
  }

  if (item.pending_count > 0) {
    return `${item.pending_count} queued for processing`;
  }

  if (item.in_progress_count > 0) {
    return `${item.in_progress_count} in progress`;
  }

  if (item.completed_count > 0 && item.latest_status) {
    return `Last flow ${item.latest_status}`;
  }

  return 'Ready for dispatch';
}

function SystemAdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1>System Administrator Dashboard</h1>
        <p>Complete system overview and management</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ModuleCard
          title="User Management"
          description="Manage all system users and their roles"
          icon={Users}
          url="/admin/users"
          color="bg-primary"
        />
        <ModuleCard
          title="Departments"
          description="Manage organizational structure"
          icon={Briefcase}
          url="/admin/departments"
          color="bg-accent"
        />
        <ModuleCard
          title="Job Postings"
          description="Create and manage job listings"
          icon={ClipboardList}
          url="/recruitment/jobs"
          color="bg-success"
        />
        <ModuleCard
          title="Payroll"
          description="Process employee compensation"
          icon={PesoSign}
          url="/payroll"
          color="bg-warning"
        />
      </div>
    </div>
  );
}

function HRAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeEmployees: 0,
    newApplications: 0,
    pendingReviews: 0,
    trainingPrograms: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [integrationRegistry, setIntegrationRegistry] = useState<DepartmentIntegrationRegistryItem[]>([]);
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [dispatchingDepartmentKey, setDispatchingDepartmentKey] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalTab, setDetailsModalTab] = useState<'approvals' | 'integrations' | 'alerts' | 'audit'>('approvals');

  useEffect(() => {
    loadStats();
    loadIntegrationRegistry();
  }, []);

  const loadStats = async () => {
    try {
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employment_status', 'active');

      const { count: applicationCount } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'applied');

      const { count: reviewCount } = await supabase
        .from('performance_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: trainingCount } = await supabase
        .from('training_programs')
        .select('*', { count: 'exact', head: true });

      setStats({
        activeEmployees: employeeCount || 0,
        newApplications: applicationCount || 0,
        pendingReviews: reviewCount || 0,
        trainingPrograms: trainingCount || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadIntegrationRegistry = async () => {
    setIntegrationLoading(true);
    const { data, error } = await fetchDepartmentIntegrationRegistry('hr');

    if (error) {
      console.error('Failed to load department integration registry:', error);
      setIntegrationRegistry([]);
      setIntegrationLoading(false);
      return;
    }

    setIntegrationRegistry(data || []);
    setIntegrationLoading(false);
  };

  const summaryCards = [
    {
      title: 'Active Employees',
      value: isLoading ? '...' : stats.activeEmployees,
      trend: 'Faculty and staff roster aligned for 2nd semester',
      trendUp: true,
      icon: Users,
      tone: 'success' as const,
    },
    {
      title: 'Faculty Assignment Gaps',
      value: 6,
      trend: 'Need dean approval before Monday load finalization',
      trendUp: false,
      icon: School,
      tone: 'warning' as const,
    },
    {
      title: 'Pending Leave Approvals',
      value: 12,
      trend: '8 teaching staff awaiting principal confirmation',
      trendUp: false,
      icon: Calendar,
      tone: 'danger' as const,
    },
    {
      title: 'Payroll Coordination Batch',
      value: 'March 28',
      trend: 'Variance pack ready for Cashier endorsement',
      trendUp: true,
      icon: PesoSign,
      tone: 'info' as const,
    },
    {
      title: 'Contract Renewals',
      value: 9,
      trend: '4 expiring within 30 days',
      trendUp: false,
      icon: FileClock,
      tone: 'warning' as const,
    },
    {
      title: 'Training & Evaluation',
      value: `${isLoading ? '...' : stats.trainingPrograms}/${isLoading ? '...' : stats.pendingReviews}`,
      trend: 'Programs live / pending evaluation reviews',
      trendUp: true,
      icon: GraduationCap,
      tone: 'primary' as const,
    },
  ];

  const approvalQueue = [
    {
      title: 'Approve leave endorsements for Senior High faculty',
      meta: '12 requests | 5 urgent substitutions needed',
      badge: { label: 'Approve Leave', tone: 'warning' as const },
      actions: ['Approve Leave', 'Forward to Administration'],
    },
    {
      title: 'Payroll variance packet for late overload pay',
      meta: 'Cashier coordination | cut-off closes at 3:00 PM',
      badge: { label: 'Submit Payroll', tone: 'info' as const },
      actions: ['Submit Payroll', 'Send to Cashier'],
    },
    {
      title: 'PMED fit-to-work follow-up for new hires',
      meta: '3 onboarding employees missing medical clearance',
      badge: { label: 'Send to PMED', tone: 'danger' as const },
      actions: ['Send to PMED', 'Start Clearance'],
    },
    {
      title: 'Contract renewal routing for probationary instructors',
      meta: '9 faculty contracts | dean remarks attached',
      badge: { label: 'Renew Contract', tone: 'success' as const },
      actions: ['Renew Contract', 'Forward to Administration'],
    },
  ];

  const integrations: DashboardIntegrationRow[] = integrationRegistry && integrationRegistry.length
    ? integrationRegistry.map((item) => {
        const primaryRoute = [...item.routes].sort((left, right) => left.priority - right.priority)[0];

        return {
          departmentKey: item.department_key,
          department: item.department_name,
          purpose: item.purpose,
          status: getIntegrationStatusLabel(item),
          tone: getIntegrationTone(item),
          action: item.default_action_label,
          icon: integrationIconByDepartmentKey[item.department_key] ?? Building2,
          endpoint: item.dispatch_endpoint,
          eventCode: primaryRoute?.event_code,
        };
      })
    : fallbackIntegrations;

  const findIntegrationByDepartmentKey = (departmentKey: string) =>
    integrations.find((item) => item.departmentKey === departmentKey)
    ?? fallbackIntegrations.find((item) => item.departmentKey === departmentKey)
    ?? null;

  const handleDepartmentDispatch = async (item: DashboardIntegrationRow) => {
    setDispatchingDepartmentKey(item.departmentKey);

    try {
      const { data, error } = await dispatchDepartmentFlow({
        targetDepartmentKey: item.departmentKey,
        eventCode: item.eventCode,
        sourceRecordId: `HR-${item.departmentKey.toUpperCase()}-${Date.now()}`,
        requestedBy: user?.id,
        payload: {
          initiated_from: 'hr_dashboard',
          requested_by_email: user?.email ?? null,
          target_department: item.department,
          action_label: item.action,
          endpoint: item.endpoint,
        },
      });

      if (error) {
        toast.error(error);
        return;
      }

      if (!data?.ok) {
        toast.error(data?.message ?? `Failed to route to ${item.department}.`);
        return;
      }

      toast.success(`${item.department} flow queued`, {
        description: `${data.event_code ?? 'Dispatch'} routed via ${data.dispatch_endpoint ?? item.endpoint}`,
      });

      await loadIntegrationRegistry();
    } catch (error) {
      console.error('Failed to dispatch dashboard integration action:', error);
      toast.error(error instanceof Error ? error.message : `Failed to route to ${item.department}.`);
    } finally {
      setDispatchingDepartmentKey(null);
    }
  };

  const handleDashboardAction = async (actionLabel: string) => {
    switch (actionLabel) {
      case 'Add Employee':
        navigate('/employees');
        return;
      case 'Assign Faculty':
        navigate('/hr/employee-requests');
        return;
      case 'Submit Payroll':
        navigate('/payroll');
        return;
      case 'Department Requests':
        navigate('/hr/employee-requests');
        return;
      case 'Approve Leave':
        navigate('/employees');
        toast.info('Leave approvals are managed from the employee roster in this build.');
        return;
      case 'Renew Contract':
        navigate('/employees/contracts');
        return;
      case 'Forward to Administration':
        navigate('/admin/departments');
        toast.info('Use Department Integration to forward HR actions to connected offices.');
        return;
      case 'Start Clearance':
        navigate('/admin/departments');
        toast.info('Open Department Integration to begin the employee clearance handoff.');
        return;
      case 'Send to Cashier':
        if (findIntegrationByDepartmentKey('cashier')) {
          await handleDepartmentDispatch(findIntegrationByDepartmentKey('cashier')!);
        }
        return;
      case 'Send to Clinic':
        if (findIntegrationByDepartmentKey('clinic')) {
          await handleDepartmentDispatch(findIntegrationByDepartmentKey('clinic')!);
        }
        return;
      case 'Send to COMLAB':
        if (findIntegrationByDepartmentKey('comlab')) {
          await handleDepartmentDispatch(findIntegrationByDepartmentKey('comlab')!);
        }
        return;
      case 'Send to PMED':
        if (findIntegrationByDepartmentKey('pmed')) {
          await handleDepartmentDispatch(findIntegrationByDepartmentKey('pmed')!);
        }
        return;
      default:
        toast.info(`${actionLabel} is not wired to a dedicated workflow yet.`);
    }
  };

  const alerts = [
    {
      title: 'Contract renewal window closes this week',
      detail: 'Nine probationary faculty need dean and school administration signatures before Friday.',
      tone: 'warning' as const,
    },
    {
      title: 'Payroll variance packet waiting on overload certification',
      detail: 'Cashier will not release the adjustment batch until Registrar confirms final faculty loads.',
      tone: 'danger' as const,
    },
    {
      title: 'Three onboarding hires are still missing PMED fit-to-work forms',
      detail: 'Delay affects ID release, payroll activation and faculty assignment readiness.',
      tone: 'info' as const,
    },
  ];

  const auditTrail = [
    '08:45 AM | Submitted overload payroll memo to Cashier for March faculty adjustments.',
    '09:10 AM | Forwarded Dean-approved faculty assignment sheet to Registrar.',
    '10:00 AM | Sent two onboarding staff to PMED for fit-to-work completion.',
    '10:28 AM | Approved emergency leave for SHS English instructor and copied Administration.',
    '11:05 AM | Started employee clearance for resigned laboratory assistant.',
  ];

  const lifecycleFlow = [
    { stage: 'Recruitment', note: 'Applicants screened and ranked', count: `${isLoading ? '...' : stats.newApplications} open applications` },
    { stage: 'Onboarding', note: 'HR, PMED, Clinic and IT coordination', count: '3 hires in motion' },
    { stage: 'Faculty Assignment', note: 'Registrar and dean load distribution', count: '6 schedules to finalize' },
    { stage: 'Active Service', note: 'Leave, payroll, attendance and case support', count: `${isLoading ? '...' : stats.activeEmployees} active employees` },
    { stage: 'Evaluation & Renewal', note: 'Performance, training and contract review', count: `${isLoading ? '...' : stats.pendingReviews} pending reviews` },
    { stage: 'Clearance & Exit', note: 'Cashier, Registrar, IT and Guidance routing', count: '4 active clearance cases' },
  ];

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-border/60 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
        <CardContent className="p-0">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.7fr_1fr] lg:px-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/15 text-white hover:bg-white/20">Bestlink College HR Operations</Badge>
                <Badge className="bg-white/10 text-white hover:bg-white/20">School Management System</Badge>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">HR Department Command Center</h1>
                <p className="mt-2 max-w-3xl text-sm text-primary-foreground/85">
                  Monitor employee records, faculty assignment, onboarding, payroll coordination, leave approvals,
                  performance evaluation, contract renewal and employee clearance across the college.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ActionChip
                  label="Add Employee"
                  icon={UserPlus}
                  variant="outline"
                  className="h-9 border-white/35 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                  onClick={() => void handleDashboardAction('Add Employee')}
                />
                <ActionChip
                  label="Assign Faculty"
                  icon={School}
                  variant="outline"
                  className="h-9 border-white/35 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                  onClick={() => void handleDashboardAction('Assign Faculty')}
                />
                <ActionChip
                  label="Submit Payroll"
                  icon={PesoSign}
                  variant="outline"
                  className="h-9 border-white/35 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                  onClick={() => void handleDashboardAction('Submit Payroll')}
                />
                <ActionChip
                  label="Approve Leave"
                  icon={Calendar}
                  variant="outline"
                  className="h-9 border-white/35 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                  onClick={() => void handleDashboardAction('Approve Leave')}
                />
                <ActionChip
                  label="Department Requests"
                  icon={Inbox}
                  variant="outline"
                  className="h-9 border-white/35 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                  onClick={() => void handleDashboardAction('Department Requests')}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary-foreground/85">Today&apos;s HR Focus</p>
                  <p className="mt-1 text-xl font-semibold">College-wide staffing and compliance</p>
                </div>
                <BellRing className="h-8 w-8 text-white/85" />
              </div>
              <div className="mt-5 space-y-3 text-sm text-primary-foreground/90">
                <div className="rounded-xl bg-black/10 p-3">
                  <p className="font-medium">Payroll endorsement deadline</p>
                  <p className="mt-1 text-primary-foreground/75">Cashier packet submission before 3:00 PM.</p>
                </div>
                <div className="rounded-xl bg-black/10 p-3">
                  <p className="font-medium">Faculty load validation</p>
                  <p className="mt-1 text-primary-foreground/75">Registrar still needs six assignment confirmations.</p>
                </div>
                <div className="rounded-xl bg-black/10 p-3">
                  <p className="font-medium">Medical onboarding</p>
                  <p className="mt-1 text-primary-foreground/75">PMED and Clinic follow-up pending for three hires.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendUp={card.trendUp}
            tone={card.tone}
          />
        ))}
      </div>

      <DashboardPanel
        title="HR Operations Details"
        description="Open focused modal views so dashboard stays short and easy to scan."
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => { setDetailsModalTab('approvals'); setDetailsModalOpen(true); }}>
            Approval Queue
          </Button>
          <Button type="button" variant="outline" onClick={() => { setDetailsModalTab('integrations'); setDetailsModalOpen(true); }}>
            Department Integration
          </Button>
          <Button type="button" variant="outline" onClick={() => { setDetailsModalTab('alerts'); setDetailsModalOpen(true); }}>
            Alerts & Lifecycle
          </Button>
          <Button type="button" variant="outline" onClick={() => { setDetailsModalTab('audit'); setDetailsModalOpen(true); }}>
            Audit Logs
          </Button>
        </div>
      </DashboardPanel>

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>HR Dashboard Details</DialogTitle>
            <DialogDescription>Focused detail view for approvals, integrations, alerts, and audit trail.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" variant={detailsModalTab === 'approvals' ? 'default' : 'outline'} onClick={() => setDetailsModalTab('approvals')}>Approvals</Button>
            <Button size="sm" variant={detailsModalTab === 'integrations' ? 'default' : 'outline'} onClick={() => setDetailsModalTab('integrations')}>Integrations</Button>
            <Button size="sm" variant={detailsModalTab === 'alerts' ? 'default' : 'outline'} onClick={() => setDetailsModalTab('alerts')}>Alerts & Lifecycle</Button>
            <Button size="sm" variant={detailsModalTab === 'audit' ? 'default' : 'outline'} onClick={() => setDetailsModalTab('audit')}>Audit</Button>
          </div>

          {detailsModalTab === 'approvals' && (
            <div className="space-y-4">
              {approvalQueue.map((item) => (
                <div key={item.title} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <StatusBadge label={item.badge.label} tone={item.badge.tone} />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.meta}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.actions.map((action) => (
                        <Button key={action} type="button" size="sm" variant="outline" onClick={() => void handleDashboardAction(action)}>
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {detailsModalTab === 'integrations' && (
            <div className="space-y-3">
              {integrations.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.department} className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{item.department}</p>
                          <StatusBadge label={item.status} tone={item.tone} />
                        </div>
                        <p className="text-sm text-muted-foreground">{item.purpose}</p>
                        <p className="font-mono text-xs text-muted-foreground/80">Endpoint: {item.endpoint}</p>
                      </div>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => void handleDepartmentDispatch(item)} disabled={dispatchingDepartmentKey === item.departmentKey}>
                      <Send className="h-4 w-4" />
                      {dispatchingDepartmentKey === item.departmentKey ? 'Dispatching...' : item.action}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {detailsModalTab === 'alerts' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.title} className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-start gap-3">
                      {alert.tone === 'danger' ? (
                        <CircleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                      ) : alert.tone === 'warning' ? (
                        <Clock3 className="mt-0.5 h-5 w-5 text-warning" />
                      ) : (
                        <CheckCircle className="mt-0.5 h-5 w-5 text-accent" />
                      )}
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {lifecycleFlow.map((stage, index) => (
                  <div key={stage.stage} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</div>
                      {index < lifecycleFlow.length - 1 ? <div className="mt-2 h-full w-px bg-border" /> : null}
                    </div>
                    <div className="flex-1 rounded-xl border border-border/60 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{stage.stage}</p>
                        <Badge variant="outline">{stage.count}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{stage.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailsModalTab === 'audit' && (
            <div className="space-y-3">
              {auditTrail.map((entry) => (
                <div key={entry} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-foreground">
                  {entry}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel
          title="Workflow Summary"
          description="Top-level HR flow and department coordination summary."
          action={<Badge variant="secondary" className="bg-warning/10 text-warning">Priority Board</Badge>}
        >
          <div className="space-y-4">
            {approvalQueue.slice(0, 2).map((item) => (
              <div key={item.title} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <StatusBadge label={item.badge.label} tone={item.badge.tone} />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.meta}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.actions.map((action) => (
                      <Button
                        key={action}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleDashboardAction(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Integration Snapshot"
          description="Live status snapshot of inter-office dispatch."
          action={
            <Badge variant="secondary" className="bg-success/10 text-success">
              {integrationLoading ? 'Loading RPC Registry' : 'Live Handoff Matrix'}
            </Badge>
          }
        >
          <div className="space-y-3">
            {integrations.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.department} className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{item.department}</p>
                        <StatusBadge label={item.status} tone={item.tone} />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.purpose}</p>
                      <p className="font-mono text-xs text-muted-foreground/80">
                        Endpoint: {item.endpoint}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDepartmentDispatch(item)}
                    disabled={dispatchingDepartmentKey === item.departmentKey}
                  >
                    <Send className="h-4 w-4" />
                    {dispatchingDepartmentKey === item.departmentKey ? 'Dispatching...' : 'Dispatch'}
                  </Button>
                </div>
              );
            })}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="HR Workflow Shortcuts"
        description="Operational modules for college HR administration, payroll coordination and compliance reporting."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <ActionChip label="Add Employee" icon={UserPlus} variant="default" onClick={() => void handleDashboardAction('Add Employee')} />
          <ActionChip label="Assign Faculty" icon={School} variant="secondary" onClick={() => void handleDashboardAction('Assign Faculty')} />
          <ActionChip label="Submit Payroll" icon={PesoSign} variant="secondary" onClick={() => void handleDashboardAction('Submit Payroll')} />
          <ActionChip label="Approve Leave" icon={Calendar} variant="secondary" onClick={() => void handleDashboardAction('Approve Leave')} />
          <ActionChip label="Department Requests" icon={Inbox} variant="secondary" onClick={() => void handleDashboardAction('Department Requests')} />
          <ActionChip
            label="Send to Cashier"
            icon={Landmark}
            variant="outline"
            onClick={() => void handleDashboardAction('Send to Cashier')}
            disabled={dispatchingDepartmentKey === 'cashier'}
          />
          <ActionChip
            label="Send to Clinic"
            icon={ShieldCheck}
            variant="outline"
            onClick={() => void handleDashboardAction('Send to Clinic')}
            disabled={dispatchingDepartmentKey === 'clinic'}
          />
          <ActionChip
            label="Send to COMLAB"
            icon={MonitorSmartphone}
            variant="outline"
            onClick={() => void handleDashboardAction('Send to COMLAB')}
            disabled={dispatchingDepartmentKey === 'comlab'}
          />
          <ActionChip
            label="Send to PMED"
            icon={Stethoscope}
            variant="outline"
            onClick={() => void handleDashboardAction('Send to PMED')}
            disabled={dispatchingDepartmentKey === 'pmed'}
          />
          <ActionChip label="Forward to Administration" icon={Building2} variant="outline" onClick={() => void handleDashboardAction('Forward to Administration')} />
          <ActionChip label="Renew Contract" icon={FileClock} variant="outline" asLink="/employees/contracts" />
          <ActionChip label="Start Clearance" icon={ClipboardList} variant="outline" onClick={() => void handleDashboardAction('Start Clearance')} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ModuleCard
            title="Employee Records"
            description="Maintain faculty and staff master records, appointment history and document completeness."
            icon={Users}
            url="/employees"
            color="bg-primary"
          />
          <ModuleCard
            title="Faculty Assignment"
            description="Coordinate department teaching loads with Registrar and school administration."
            icon={School}
            url="/employees"
            color="bg-accent"
          />
          <ModuleCard
            title="Onboarding"
            description="Track hiring requirements, PMED routing, Clinic advice and IT provisioning."
            icon={UserCheck}
            url="/hr/employee-onboarding"
            color="bg-success"
          />
          <ModuleCard
            title="Payroll Coordination"
            description="Prepare payroll periods, endorsements and cashier-ready variance submissions."
            icon={PesoSign}
            url="/payroll"
            color="bg-warning"
          />
          <ModuleCard
            title="Performance Evaluation"
            description="Manage faculty and staff review cycles, ratings, recommendations and dean approvals."
            icon={TrendingUp}
            url="/hr/performance"
            color="bg-primary"
          />
          <ModuleCard
            title="Contract Renewal"
            description="Monitor expiring appointments, prepare renewal packets and secure school admin sign-off."
            icon={FileClock}
            url="/employees/contracts"
            color="bg-accent"
          />
          <ModuleCard
            title="Clearance"
            description="Coordinate exit or transfer clearance with Cashier, Registrar, IT and Guidance."
            icon={ClipboardList}
            url="/reports"
            color="bg-success"
          />
          <ModuleCard
            title="Reports & Audit"
            description="Produce HR reports, compliance summaries and traceable inter-office audit records."
            icon={FileText}
            url="/reports"
            color="bg-warning"
          />
        </div>
      </DashboardPanel>
    </div>
  );
}

function EmployeeDashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    trainingCompleted: 0,
    pendingTraining: 0,
    lastReviewScore: 'N/A',
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!employeeData) return;

      const { count: completedCount } = await supabase
        .from('employee_trainings')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeData.id)
        .eq('status', 'completed');

      const { count: pendingCount } = await supabase
        .from('employee_trainings')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeData.id)
        .in('status', ['scheduled', 'in_progress']);

      const { data: evaluationData } = await supabase
        .from('performance_evaluations')
        .select('overall_rating')
        .eq('employee_id', employeeData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        trainingCompleted: completedCount || 0,
        pendingTraining: pendingCount || 0,
        lastReviewScore: evaluationData?.overall_rating ? `${evaluationData.overall_rating}/5` : 'N/A',
      });
    } catch (error) {
      console.error('Failed to load employee dashboard stats:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1>Welcome, {profile?.first_name}!</h1>
        <p>View your employment information and records</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Training Completed" value={stats.trainingCompleted} icon={CheckCircle} />
        <StatCard title="Pending Training" value={stats.pendingTraining} icon={GraduationCap} />
        <StatCard title="Last Review Score" value={stats.lastReviewScore} icon={TrendingUp} />
        <StatCard title="Documents" value={0} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ModuleCard
          title="My Profile"
          description="View and update personal information"
          icon={Users}
          url="/my-profile"
          color="bg-primary"
        />
        <ModuleCard
          title="My Payroll"
          description="View salary and pay history"
          icon={PesoSign}
          url="/my-payroll"
          color="bg-success"
        />
        <ModuleCard
          title="My Performance"
          description="View your performance reviews"
          icon={TrendingUp}
          url="/my-performance"
          color="bg-accent"
        />
      </div>
    </div>
  );
}

function ApplicantDashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    availableJobs: 0,
    myApplications: 0,
    interviews: 0,
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { count: jobCount } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact', head: true });

      const { data: applicantData } = await supabase
        .from('applicants')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      let applicationCount = 0;
      let interviewCount = 0;

      if (applicantData) {
        const { count: appCount } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('applicant_id', applicantData.id);

        applicationCount = appCount || 0;
        interviewCount = 0;
      }

      setStats({
        availableJobs: jobCount || 0,
        myApplications: applicationCount,
        interviews: interviewCount,
      });
    } catch (error) {
      console.error('Failed to load applicant dashboard stats:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1>Welcome, {profile?.first_name}!</h1>
        <p>Find and apply for job opportunities</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Available Jobs" value={stats.availableJobs} icon={Briefcase} />
        <StatCard title="My Applications" value={stats.myApplications} icon={ClipboardList} />
        <StatCard title="Interviews" value={stats.interviews} icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ModuleCard
          title="Browse Jobs"
          description="View all available positions"
          icon={Briefcase}
          url="/jobs"
          color="bg-primary"
        />
        <ModuleCard
          title="My Applications"
          description="Track your application status"
          icon={ClipboardList}
          url="/my-applications"
          color="bg-accent"
        />
        <ModuleCard
          title="My Profile"
          description="Update your applicant profile"
          icon={Users}
          url="/applicant-profile"
          color="bg-success"
        />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { role } = useAuth();

  switch (role) {
    case 'system_admin':
    case 'hr_admin':
      return <HRAdminDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'applicant':
    default:
      return <ApplicantDashboard />;
  }
}
