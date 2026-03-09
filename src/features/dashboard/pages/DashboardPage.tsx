import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_LABELS } from '@/lib/constants';
import { 
  Users, 
  Briefcase, 
  ClipboardList, 
  TrendingUp,
  GraduationCap,
  UserPlus,
  Calendar,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/PesoSign';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trendUp ? 'text-success' : 'text-destructive'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-primary/10">
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
      <div className={`inline-flex p-3 rounded-lg ${color} mb-4`}>
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </Link>
  );
}

// System Admin Dashboard
function SystemAdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1>System Administrator Dashboard</h1>
        <p>Complete system overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats will be populated from database */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

// HR Admin Dashboard
function HRAdminDashboard() {
  const [stats, setStats] = useState({
    activeEmployees: 0,
    newApplications: 0,
    pendingReviews: 0,
    trainingPrograms: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch active employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employment_status', 'active');

      // Fetch new applications (pending status)
      const { count: applicationCount } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'applied');

      // Fetch pending performance evaluations
      const { count: reviewCount } = await supabase
        .from('performance_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch training programs
      const { count: trainingCount } = await supabase
        .from('training_programs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

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

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1>HR Dashboard</h1>
        <p>Manage recruitment, employees, and HR operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Employees" value={stats.activeEmployees} icon={Users} />
        <StatCard title="New Applications" value={stats.newApplications} icon={UserPlus} />
        <StatCard title="Pending Reviews" value={stats.pendingReviews} icon={TrendingUp} />
        <StatCard title="Training Programs" value={stats.trainingPrograms} icon={GraduationCap} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModuleCard
          title="Applicants"
          description="Review and process job applications"
          icon={UserPlus}
          url="/recruitment/applicants"
          color="bg-primary"
        />
        <ModuleCard
          title="Employees"
          description="View and manage employee records"
          icon={Users}
          url="/employees"
          color="bg-accent"
        />
        <ModuleCard
          title="Performance"
          description="Conduct performance evaluations"
          icon={TrendingUp}
          url="/hr/performance"
          color="bg-success"
        />
        <ModuleCard
          title="Training"
          description="Manage training programs"
          icon={GraduationCap}
          url="/hr/training"
          color="bg-warning"
        />
        <ModuleCard
          title="Payroll"
          description="Process monthly payroll"
          icon={PesoSign}
          url="/payroll"
          color="bg-primary"
        />
        <ModuleCard
          title="Reports"
          description="Generate HR reports"
          icon={FileText}
          url="/reports"
          color="bg-accent"
        />
      </div>
    </div>
  );
}

// Employee Dashboard
function EmployeeDashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    trainingCompleted: 0,
    pendingTraining: 0,
    lastReviewScore: 'N/A',
    employeeId: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Get employee ID
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!employeeData) {
        setIsLoading(false);
        return;
      }

      // Fetch completed trainings
      const { count: completedCount } = await supabase
        .from('employee_trainings')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeData.id)
        .eq('status', 'completed');

      // Fetch pending trainings
      const { count: pendingCount } = await supabase
        .from('employee_trainings')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeData.id)
        .in('status', ['scheduled', 'in_progress']);

      // Fetch latest performance evaluation
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
        employeeId: employeeData.id,
      });
    } catch (error) {
      console.error('Failed to load employee dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1>Welcome, {profile?.first_name}!</h1>
        <p>View your employment information and records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Training Completed" value={stats.trainingCompleted} icon={CheckCircle} />
        <StatCard title="Pending Training" value={stats.pendingTraining} icon={GraduationCap} />
        <StatCard title="Last Review Score" value={stats.lastReviewScore} icon={TrendingUp} />
        <StatCard title="Documents" value={0} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

// Applicant Dashboard
function ApplicantDashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    availableJobs: 0,
    myApplications: 0,
    interviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Fetch active job postings
      const { count: jobCount } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get applicant ID and their applications
      const { data: applicantData } = await supabase
        .from('applicants')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      let applicationCount = 0;
      let interviewCount = 0;

      if (applicantData) {
        // Fetch applicant's applications
        const { count: appCount } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('applicant_id', applicantData.id);

        // Fetch scheduled interviews
        const { count: interviewsCount } = await supabase
          .from('interview_schedules')
          .select('*', { count: 'exact', head: true })
          .eq('applicant_id', applicantData.id);

        applicationCount = appCount || 0;
        interviewCount = interviewsCount || 0;
      }

      setStats({
        availableJobs: jobCount || 0,
        myApplications: applicationCount,
        interviews: interviewCount,
      });
    } catch (error) {
      console.error('Failed to load applicant dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1>Welcome, {profile?.first_name}!</h1>
        <p>Find and apply for job opportunities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Available Jobs" value={stats.availableJobs} icon={Briefcase} />
        <StatCard title="My Applications" value={stats.myApplications} icon={ClipboardList} />
        <StatCard title="Interviews" value={stats.interviews} icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      return <SystemAdminDashboard />;
    case 'hr_admin':
      return <HRAdminDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'applicant':
    default:
      return <ApplicantDashboard />;
  }
}

