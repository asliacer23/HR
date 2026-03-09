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
import { EmployeeBenefit } from '@/features/payroll/services/employeeBenefitsService';

interface EmployeeBenefitListProps {
  benefits: EmployeeBenefit[];
  isLoading?: boolean;
  onView: (benefit: EmployeeBenefit) => void;
  onEdit: (benefit: EmployeeBenefit) => void;
  onDelete: (benefit: EmployeeBenefit) => void;
  searchQuery?: string;
}

const statusColors: Record<string, string> = {
  'true': 'bg-green-100 text-green-800',
  'false': 'bg-red-100 text-red-800',
};

const benefitTypeColors: Record<string, string> = {
  health: 'bg-blue-100 text-blue-800',
  insurance: 'bg-purple-100 text-purple-800',
  allowance: 'bg-green-100 text-green-800',
};

export function EmployeeBenefitList({
  benefits,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  searchQuery = '',
}: EmployeeBenefitListProps) {
  const filteredBenefits = benefits.filter(benefit => {
    const searchLower = searchQuery.toLowerCase();
    const employeeName = benefit.employees
      ? `${benefit.employees.first_name} ${benefit.employees.last_name}`.toLowerCase()
      : '';
    const benefitName = benefit.benefits?.name.toLowerCase() || '';
    const employeeNumber = benefit.employees?.employee_number.toLowerCase() || '';

    return (
      employeeName.includes(searchLower) ||
      benefitName.includes(searchLower) ||
      employeeNumber.includes(searchLower)
    );
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading benefits...</div>;
  }

  if (filteredBenefits.length === 0) {
    return <div className="text-center py-8 text-gray-500">No benefits found</div>;
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Employee #</TableHead>
            <TableHead>Benefit</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Coverage Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrolled Date</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBenefits.map(benefit => (
            <TableRow key={benefit.id}>
              <TableCell>
                {benefit.employees ? (
                  <div>
                    <p className="font-medium">
                      {benefit.employees.first_name} {benefit.employees.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{benefit.employees.email}</p>
                  </div>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {benefit.employees?.employee_number || 'N/A'}
              </TableCell>
              <TableCell>
                <p className="font-medium">
                  {benefit.benefits?.name || 'N/A'}
                </p>
              </TableCell>
              <TableCell>
                {benefit.benefits?.type ? (
                  <Badge className={benefitTypeColors[benefit.benefits.type] || 'bg-gray-100 text-gray-800'}>
                    {benefit.benefits.type}
                  </Badge>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </TableCell>
              <TableCell>
                {benefit.coverage_amount !== null
                  ? `₱${benefit.coverage_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[benefit.is_active ? 'true' : 'false']}>
                  {benefit.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(benefit.enrolled_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(benefit)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(benefit)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(benefit)}
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
