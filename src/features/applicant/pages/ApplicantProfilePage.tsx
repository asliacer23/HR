import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Briefcase, GraduationCap, Award, FileText, Edit2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { ProfessionalInfoModal } from '../components/ProfessionalInfoModal';
import { InterviewScheduleComponent } from '../components/InterviewScheduleComponent';

interface ApplicantData {
  id: string;
  resume_url: string | null;
  cover_letter: string | null;
  years_experience: number;
  education_level: string | null;
  skills: string[] | null;
}

export function ApplicantProfilePage() {
  const { user, profile } = useAuth();
  const [applicant, setApplicant] = useState<ApplicantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditProfessionalOpen, setIsEditProfessionalOpen] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchApplicantData();
      fetchFullProfile();
    }
  }, [user]);

  const fetchFullProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setFullProfile(data);
    }
  };

  const fetchApplicantData = async () => {
    if (!user) return;

    let { data } = await supabase
      .from('applicants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!data) {
      const { data: newApplicant } = await supabase
        .from('applicants')
        .insert({ user_id: user.id })
        .select()
        .single();
      data = newApplicant;
    }

    if (data) {
      setApplicant(data);
    }
    setIsLoading(false);
  };

  const handleProfessionalInfoSave = () => {
    fetchApplicantData();
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
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your professional information</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="card-elevated p-8 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {profile?.first_name} {profile?.last_name}
                  </h2>
                  <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {profile?.email}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>

              {applicant && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {applicant.years_experience > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full text-sm border">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="font-medium">{applicant.years_experience}</span>
                      <span className="text-muted-foreground">years exp.</span>
                    </div>
                  )}
                  {applicant.education_level && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full text-sm border">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span>{applicant.education_level}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information - View Only */}
        {applicant && (
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Professional Information</h3>
              </div>
              <Button
                onClick={() => setIsEditProfessionalOpen(true)}
                variant="outline"
                size="sm"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Experience & Education Row */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Years of Experience */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Years of Experience</p>
                  </div>
                  {applicant.years_experience ? (
                    <Badge variant="secondary" className="w-fit text-base px-3 py-1.5">
                      {applicant.years_experience} {applicant.years_experience === 1 ? 'year' : 'years'}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not specified</p>
                  )}
                </div>

                {/* Education Level */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Education Level</p>
                  </div>
                  {applicant.education_level ? (
                    <Badge variant="secondary" className="w-fit text-base px-3 py-1.5">
                      {applicant.education_level}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not specified</p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Skills</p>
                </div>
                {applicant.skills && applicant.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {applicant.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No skills specified</p>
                )}
              </div>

              {/* Cover Letter Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Cover Letter</p>
                </div>
                {applicant.cover_letter ? (
                  <p className="text-sm text-foreground bg-muted/30 p-4 rounded-lg leading-relaxed">
                    {applicant.cover_letter.length > 300
                      ? `${applicant.cover_letter.substring(0, 300)}...`
                      : applicant.cover_letter}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No cover letter provided</p>
                )}
              </div>

              {/* Address & Location (from profile) */}
              {(fullProfile?.address || fullProfile?.city) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                  </div>
                  <p className="text-sm text-foreground">
                    {[fullProfile?.address, fullProfile?.city].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        
      </div>

      {/* Profile Edit Modal */}
      {fullProfile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={fullProfile}
          onSave={() => {
            fetchFullProfile();
            fetchApplicantData();
          }}
        />
      )}

      {/* Professional Info Edit Modal */}
      {applicant && (
        <ProfessionalInfoModal
          isOpen={isEditProfessionalOpen}
          onClose={() => setIsEditProfessionalOpen(false)}
          applicantId={applicant.id}
          initialData={{
            years_experience: applicant.years_experience || 0,
            education_level: applicant.education_level || '',
            skills: applicant.skills || [],
            cover_letter: applicant.cover_letter || '',
          }}
          onSave={handleProfessionalInfoSave}
        />
      )}
    </div>
  );
}