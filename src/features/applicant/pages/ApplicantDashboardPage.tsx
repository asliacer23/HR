import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { InterviewScheduleComponent } from '../components/InterviewScheduleComponent';
import { STATUS_LABELS, ApplicationStatus } from '@/lib/constants';

interface ApplicationStats {
  total: number;
  applied: number;
  interview: number;
  hired: number;
  rejected: number;
}

interface RecentApplication {
  id: string;
  status: ApplicationStatus;
  applied_at: string;
  job_postings?: {
    id: string;
    title: string;
    positions?: {
      departments?: {
        name: string;
      } | null;
    } | null;
  } | null;
  interview_schedules?: {
    scheduled_date: string;
  }[];
}

export function ApplicantDashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Get applicant
      const { data: applicant } = await supabase
        .from('applicants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!applicant) {
        setIsLoading(false);
        return;
      }

      // Get all applications
      const { data: applications, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_postings (
            id,
            title,
            positions (
              departments (name)
            )
          ),
          interview_schedules (
            scheduled_date
          )
        `)
        .eq('applicant_id', applicant.id)
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load dashboard data');
        setIsLoading(false);
        return;
      }

      // Calculate stats
      const apps = applications || [];
      const newStats: ApplicationStats = {
        total: apps.length,
        applied: apps.filter((a: any) => a.status === 'applied').length,
        interview: apps.filter((a: any) => a.status === 'interview').length,
        hired: apps.filter((a: any) => a.status === 'hired').length,
        rejected: apps.filter((a: any) => a.status === 'rejected').length,
      };

      setStats(newStats);
      setRecentApplications(apps.slice(0, 5));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-orange-100 text-orange-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = () => {
    if (profile) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Header */}
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {profile?.first_name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your job applications and interview schedules
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Stats Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Application Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Total Applications */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Applications</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{stats.total}</p>
                  </div>
                  <Briefcase className="h-10 w-10 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Applied */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Applied</p>
                    <p className="text-3xl font-bold text-slate-600 mt-1">{stats.applied}</p>
                  </div>
                  <FileText className="h-10 w-10 text-slate-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Interviews */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Interviews</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">{stats.interview}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Hired */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hired</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.hired}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Rejected */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejected}</p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Applications</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/applicant/applications')}
            >
              View All
            </Button>
          </div>

          {recentApplications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-medium text-lg mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't applied to any jobs yet. Start exploring available positions!
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/applicant/jobs')}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentApplications.map(app => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">
                            {app.job_postings?.title || 'Job Posting'}
                          </h4>
                          <Badge className={getStatusColor(app.status)}>
                            {STATUS_LABELS[app.status]}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                          {app.job_postings?.positions?.departments?.name && (
                            <>
                              <span>{app.job_postings.positions.departments.name}</span>
                              <span className="hidden sm:inline">â€¢</span>
                            </>
                          )}
                          <span>Applied {formatDate(app.applied_at)}</span>
                          {app.interview_schedules && app.interview_schedules.length > 0 && (
                            <>
                              <span>â€¢</span>
                              <span className="text-orange-600 font-medium">
                                Interview scheduled
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/applicant/applications`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Interview Schedule Section */}
        <div className="border-t pt-8">
          <InterviewScheduleComponent />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/applicant/profile')}
              >
                <User className="h-5 w-5" />
                <span>Update Profile</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/applicant/jobs')}
              >
                <Briefcase className="h-5 w-5" />
                <span>Browse Jobs</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/applicant/applications')}
              >
                <FileText className="h-5 w-5" />
                <span>View Applications</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

