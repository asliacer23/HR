import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, GraduationCap, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TrainingForm } from '../components/TrainingForm';
import { TrainingDetail } from '../components/TrainingDetail';
import {
  fetchTrainingPrograms,
  createTrainingProgram,
  updateTrainingProgram,
  deleteTrainingProgram,
  TrainingProgram,
  CreateTrainingProgramInput,
} from '@/features/hr/services/trainingService';

export function TrainingPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [programToDelete, setProgramToDelete] = useState<TrainingProgram | null>(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setIsLoading(true);
    const { data, error } = await fetchTrainingPrograms();
    if (error) {
      toast.error(error);
    } else {
      setPrograms(data);
    }
    setIsLoading(false);
  };

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProgram = async (data: CreateTrainingProgramInput) => {
    setIsSubmitting(true);
    const { data: newProgram, error } = await createTrainingProgram(data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Training program created successfully');
      setPrograms([...programs, newProgram]);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleEditProgram = (program: TrainingProgram) => {
    setEditingProgram(program);
    setShowCreateForm(true);
    setShowDetailView(false);
  };

  const handleUpdateProgram = async (data: CreateTrainingProgramInput) => {
    if (!editingProgram) return;
    setIsSubmitting(true);
    const { data: updatedProgram, error } = await updateTrainingProgram({
      id: editingProgram.id,
      ...data,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success('Training program updated successfully');
      setPrograms(programs.map(p => p.id === editingProgram.id ? updatedProgram : p));
      setEditingProgram(null);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;
    setIsSubmitting(true);
    const { error } = await deleteTrainingProgram(programToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Training program deleted successfully');
      setPrograms(programs.filter(p => p.id !== programToDelete.id));
      setShowDeleteConfirm(false);
      setProgramToDelete(null);
    }
    setIsSubmitting(false);
  };

  const handleViewDetail = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setShowDetailView(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Training Programs</h1>
          <p>Manage employee training and development</p>
        </div>
        <Button
          onClick={() => {
            setEditingProgram(null);
            setShowCreateForm(true);
          }}
          className="btn-primary-gradient"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Program
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading programs...
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchQuery ? 'No matching training programs found' : 'No training programs yet. Click "Add Program" to get started.'}
          </div>
        ) : (
          filteredPrograms.map((program) => (
            <div key={program.id} className="card-elevated p-6 relative group">
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetail(program)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditProgram(program)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setProgramToDelete(program);
                        setShowDeleteConfirm(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent/10">
                  <GraduationCap className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{program.title}</h3>
                    {program.is_mandatory && (
                      <Badge className="bg-destructive text-destructive-foreground text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {program.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {program.description}
                </p>
              )}

              {program.duration_hours && (
                <p className="text-xs text-muted-foreground">
                  Duration: {program.duration_hours} hours
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <TrainingForm
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) setEditingProgram(null);
        }}
        onSubmit={editingProgram ? handleUpdateProgram : handleCreateProgram}
        initialData={editingProgram}
        isLoading={isSubmitting}
      />

      {/* Detail View Modal */}
      {selectedProgram && (
        <TrainingDetail
          open={showDetailView}
          onOpenChange={setShowDetailView}
          data={selectedProgram}
          onEdit={() => handleEditProgram(selectedProgram)}
          onDelete={async () => {
            setProgramToDelete(selectedProgram);
            setShowDeleteConfirm(true);
            setShowDetailView(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Program?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{programToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProgram}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
