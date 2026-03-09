import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmployeeTraining } from '@/features/hr/services/employeeTrainingService';

interface EmployeeTrainingListProps {
  trainings: EmployeeTraining[];
  isLoading?: boolean;
  onView: (training: EmployeeTraining) => void;
  onEdit: (training: EmployeeTraining) => void;
  onDelete: (training: EmployeeTraining) => void;
  searchQuery?: string;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function EmployeeTrainingList({
  trainings,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  searchQuery = '',
}: EmployeeTrainingListProps) {
  const filteredTrainings = trainings.filter(training => {
    const searchLower = searchQuery.toLowerCase();
    const employeeName = training.employees
      ? `${training.employees.first_name} ${training.employees.last_name}`.toLowerCase()
      : '';
    const programTitle = training.training_programs?.title.toLowerCase() || '';
    const employeeNumber = training.employees?.employee_number.toLowerCase() || '';

    return (
      employeeName.includes(searchLower) ||
      programTitle.includes(searchLower) ||
      employeeNumber.includes(searchLower)
    );
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading trainings...</div>;
  }

  if (filteredTrainings.length === 0) {
    return <div className="text-center py-8 text-gray-500">No trainings found</div>;
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Employee #</TableHead>
            <TableHead>Training Program</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Completion Date</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrainings.map(training => (
            <TableRow key={training.id}>
              <TableCell>
                {training.employees ? (
                  <div>
                    <p className="font-medium">
                      {training.employees.first_name} {training.employees.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{training.employees.email}</p>
                  </div>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {training.employees?.employee_number || 'N/A'}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {training.training_programs?.title || 'N/A'}
                  </p>
                  {training.training_programs?.duration_hours && (
                    <p className="text-sm text-gray-500">
                      {training.training_programs.duration_hours}h
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[training.status]}>
                  {training.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {training.start_date
                  ? new Date(training.start_date).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>
                {training.completion_date
                  ? new Date(training.completion_date).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>
                {training.score !== null ? `${training.score.toFixed(2)}/100` : '-'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(training)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(training)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(training)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
