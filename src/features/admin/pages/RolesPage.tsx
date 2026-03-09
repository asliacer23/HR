import { ROLE_LABELS, AppRole } from '@/lib/constants';
import { Shield, Users, Briefcase, UserCheck } from 'lucide-react';

const roles: { role: AppRole; icon: React.ComponentType<{ className?: string }>; permissions: string[] }[] = [
  {
    role: 'system_admin',
    icon: Shield,
    permissions: [
      'Full system access (CRUD all)',
      'Manage users, roles, permissions',
      'Manage system settings',
      'View and manage all HR modules',
      'Access audit logs',
    ],
  },
  {
    role: 'hr_admin',
    icon: Users,
    permissions: [
      'Manage recruitment and applicants',
      'Review job applications',
      'Schedule and manage interviews',
      'Hire applicants and convert to employees',
      'Manage employee contracts, performance, payroll',
      'Generate HR and compliance reports',
    ],
  },
  {
    role: 'employee',
    icon: Briefcase,
    permissions: [
      'View personal profile and employment info',
      'View performance evaluations',
      'View salary, benefits, and payroll history',
      'Update limited personal information',
    ],
  },
  {
    role: 'applicant',
    icon: UserCheck,
    permissions: [
      'View available job positions',
      'Submit job applications',
      'Upload resume and documents',
      'Track application status',
    ],
  },
];

export function RolesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Roles & Permissions</h1>
        <p>View system roles and their access levels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(({ role, icon: Icon, permissions }) => (
          <div key={role} className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{ROLE_LABELS[role]}</h3>
            </div>
            <ul className="space-y-2">
              {permissions.map((permission, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-success mt-0.5">•</span>
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
