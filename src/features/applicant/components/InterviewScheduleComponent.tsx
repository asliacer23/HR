import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InterviewSchedule {
  id: string;
  application_id: string;
  scheduled_date: string;
  location?: string | null;
  notes?: string | null;
  is_completed: boolean;
  job_postings?: {
    id: string;
    title: string;
    positions?: {
      departments?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

export function InterviewScheduleComponent() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
    if (!user) return;

    try {
      // First get the applicant
      const { data: applicant } = await supabase
        .from('applicants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!applicant) {
        setInterviews([]);
        setIsLoading(false);
        return;
      }

      // Then fetch interviews through job_applications
      const { data, error } = await supabase
        .from('interview_schedules')
        .select(`
          id,
          application_id,
          scheduled_date,
          location,
          notes,
          is_completed,
          job_applications!inner (
            applicant_id,
            job_postings (
              id,
              title,
              positions (
                departments (name)
              )
            )
          )
        `)
        .eq('job_applications.applicant_id', applicant.id)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching interviews:', error);
        toast.error('Failed to load interview schedules');
      } else {
        // Map the data to our interface
        const mappedData = (data || []).map((item: any) => ({
          id: item.id,
          application_id: item.application_id,
          scheduled_date: item.scheduled_date,
          location: item.location,
          notes: item.notes,
          is_completed: item.is_completed,
          job_postings: item.job_applications?.job_postings,
        }));
        setInterviews(mappedData);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load interview schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredInterviews = () => {
    const now = new Date();
    
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduled_date);
      
      if (filter === 'upcoming') {
        return interviewDate >= now && !interview.is_completed;
      } else if (filter === 'completed') {
        return interview.is_completed;
      }
      return true;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isUpcomingInterview = (dateString: string) => {
    const interviewDate = new Date(dateString);
    const now = new Date();
    const daysUntil = Math.ceil((interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 7;
  };

  const filteredInterviews = getFilteredInterviews();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading interview schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Interview Schedule</h2>
        <p className="text-muted-foreground">View and manage your scheduled interviews</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('upcoming')}
          className={filter === 'upcoming' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Upcoming
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Completed
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          All
        </Button>
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-medium text-lg mb-2">No Interviews Scheduled</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'upcoming'
                ? "You don't have any upcoming interviews scheduled."
                : filter === 'completed'
                ? "You don't have any completed interviews."
                : 'You have no interview schedules yet.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Interview schedules will appear here once HR schedules an interview for your application.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map(interview => (
            <Card
              key={interview.id}
              className={`overflow-hidden transition-all ${
                isUpcomingInterview(interview.scheduled_date) ? 'border-2 border-orange-300 bg-orange-50/50' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">
                        {interview.job_postings?.title || 'Interview'}
                      </CardTitle>
                      <Badge className={interview.is_completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {interview.is_completed ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </div>
                    {interview.job_postings?.positions?.departments?.name && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {interview.job_postings.positions.departments.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isUpcomingInterview(interview.scheduled_date) && !interview.is_completed && (
                  <div className="flex items-center gap-2 p-2 bg-orange-100/50 rounded-lg border border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <p className="text-sm text-orange-700 font-medium">
                      Interview coming up soon!
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Date and Time */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {formatDate(interview.scheduled_date)} at {formatTime(interview.scheduled_date)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {interview.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{interview.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {interview.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Additional Information</p>
                    <p className="text-sm leading-relaxed">{interview.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

