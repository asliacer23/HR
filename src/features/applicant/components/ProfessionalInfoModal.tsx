import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ProfessionalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantId: string;
  initialData: {
    years_experience: number;
    education_level: string;
    skills: string[];
    cover_letter: string;
  };
  onSave: () => void;
}

export function ProfessionalInfoModal({
  isOpen,
  onClose,
  applicantId,
  initialData,
  onSave,
}: ProfessionalInfoModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    years_experience: initialData.years_experience,
    education_level: initialData.education_level,
    skills: initialData.skills.join(', '),
    cover_letter: initialData.cover_letter,
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from('applicants')
      .update({
        years_experience: formData.years_experience,
        education_level: formData.education_level.trim(),
        skills: formData.skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        cover_letter: formData.cover_letter.trim(),
      })
      .eq('id', applicantId);

    setIsSaving(false);

    if (error) {
      toast.error('Failed to update professional information');
      console.error(error);
    } else {
      toast.success('Professional information updated successfully');
      onSave();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Professional Information</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-sm font-medium">
                Years of Experience
              </Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.years_experience}
                onChange={(e) =>
                  handleInputChange('years_experience', parseInt(e.target.value) || 0)
                }
                disabled={isSaving}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education" className="text-sm font-medium">
                Education Level
              </Label>
              <Input
                id="education"
                placeholder="e.g., Bachelor's Degree"
                value={formData.education_level}
                onChange={(e) => handleInputChange('education_level', e.target.value)}
                disabled={isSaving}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills" className="text-sm font-medium">
              Skills
            </Label>
            <Input
              id="skills"
              placeholder="e.g., Teaching, Curriculum Development, Classroom Management"
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              disabled={isSaving}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple skills with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover-letter" className="text-sm font-medium">
              Cover Letter
            </Label>
            <Textarea
              id="cover-letter"
              placeholder="Write a brief introduction about yourself and your career goals..."
              value={formData.cover_letter}
              onChange={(e) => handleInputChange('cover_letter', e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              {formData.cover_letter.length} characters
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
