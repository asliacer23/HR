import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, MoreHorizontal, CheckCircle, ClipboardCheck } from 'lucide-react';
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
import { OnboardingForm } from '../components/OnboardingForm';
import { OnboardingDetail } from '../components/OnboardingDetail';
import {
  fetchOnboardingTasks,
  createOnboardingTask,
  updateOnboardingTask,
  deleteOnboardingTask,
  OnboardingTask,
  CreateOnboardingTaskInput,
} from '@/features/hr/services/onboardingService';

export function OnboardingPage() {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTask, setEditingTask] = useState<OnboardingTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<OnboardingTask | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    const { data, error } = await fetchOnboardingTasks();
    if (error) {
      toast.error(error);
    } else {
      setTasks(data);
    }
    setIsLoading(false);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTask = async (data: CreateOnboardingTaskInput) => {
    setIsSubmitting(true);
    const { data: newTask, error } = await createOnboardingTask(data);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Onboarding task created successfully');
      setTasks([...tasks, newTask]);
      setShowCreateForm(false);
    }
    setIsSubmitting(false);
  };

  const handleEditTask = (task: OnboardingTask) => {
    setEditingTask(task);
    setShowCreateForm(true);
    setShowDetailView(false);
  };

  const handleUpdateTask = async (data: CreateOnboardingTaskInput) => {
    if (!editingTask) return;
    setIsSubmitting(true);
    const { data: updatedTask, error } = await updateOnboardingTask({
      id: editingTask.id,
      ...data,
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success('Onboarding task updated successfully');
      setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
      setEditingTask(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsSubmitting(true);
    const { error } = await deleteOnboardingTask(taskToDelete.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Onboarding task deleted successfully');
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
    setIsSubmitting(false);
  };

  const handleViewDetail = (task: OnboardingTask) => {
    setSelectedTask(task);
    setShowDetailView(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Onboarding Tasks</h1>
          <p>Manage employee onboarding checklist</p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null);
            setShowCreateForm(true);
          }}
          className="btn-primary-gradient"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchQuery ? 'No matching onboarding tasks found' : 'No onboarding tasks yet. Click "Add Task" to get started.'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="card-elevated p-6 relative group">
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetail(task)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditTask(task)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setTaskToDelete(task);
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
                <div className="p-2 rounded-lg bg-primary/10">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{task.title}</h3>
                    {task.is_mandatory && (
                      <Badge className="bg-destructive text-destructive-foreground text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {task.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <OnboardingForm
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask}
        isLoading={isSubmitting}
      />

      {/* Detail View Modal */}
      {selectedTask && (
        <OnboardingDetail
          open={showDetailView}
          onOpenChange={setShowDetailView}
          data={selectedTask}
          onEdit={() => handleEditTask(selectedTask)}
          onDelete={async () => {
            setTaskToDelete(selectedTask);
            setShowDeleteConfirm(true);
            setShowDetailView(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Onboarding Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
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
