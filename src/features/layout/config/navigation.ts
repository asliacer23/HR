import { AppRole } from '@/lib/constants';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserPlus,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  FileText,
  Settings,
  Building,
  FileCheck,
  Calendar,
  User,
  FolderOpen,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/PesoSign';

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// System Admin has full access
const systemAdminNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'User Management',
    items: [
      { title: 'All Users', url: '/admin/users', icon: Users },
      { title: 'Roles & Permissions', url: '/admin/roles', icon: Settings },
    ],
  },
  {
    title: 'Organization',
    items: [
      { title: 'Departments', url: '/admin/departments', icon: Building },
      { title: 'Positions', url: '/admin/positions', icon: Briefcase },
    ],
  },
  {
    title: 'Recruitment',
    items: [
      { title: 'Job Postings', url: '/recruitment/jobs', icon: ClipboardList },
      { title: 'Applicants', url: '/recruitment/applicants', icon: UserPlus },
      { title: 'Interviews', url: '/recruitment/interviews', icon: Calendar },
    ],
  },
  {
    title: 'Employees',
    items: [
      { title: 'Employee List', url: '/employees', icon: Users },
      { title: 'Contracts', url: '/employees/contracts', icon: FileCheck },
      { title: 'Documents', url: '/employees/documents', icon: FolderOpen },
    ],
  },
  {
    title: 'HR Operations',
    items: [
      { title: 'Onboarding Tasks', url: '/hr/onboarding', icon: UserPlus },
      { title: 'Employee Onboarding', url: '/hr/employee-onboarding', icon: UserPlus },
      { title: 'Training Programs', url: '/hr/training', icon: GraduationCap },
      { title: 'Employee Training', url: '/hr/employee-training', icon: GraduationCap },
      { title: 'Performance', url: '/hr/performance', icon: TrendingUp },
    ],
  },
  {
    title: 'Compensation',
    items: [
      { title: 'Payroll Periods', url: '/payroll', icon: PesoSign },
      { title: 'Payroll Records', url: '/payroll/records', icon: FileText },
      { title: 'Benefits', url: '/payroll/benefits', icon: FileText },
      { title: 'Employee Benefits', url: '/payroll/employee-benefits', icon: FileText },
    ],
  },
  {
    title: 'Reports',
    items: [
      { title: 'HR Reports', url: '/reports', icon: FileText },
      { title: 'Audit Logs', url: '/admin/audit-logs', icon: ClipboardList },
    ],
  },
];

// HR Admin - No system settings
const hrAdminNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Recruitment',
    items: [
      { title: 'Job Postings', url: '/recruitment/jobs', icon: ClipboardList },
      { title: 'Applicants', url: '/recruitment/applicants', icon: UserPlus },
      { title: 'Interviews', url: '/recruitment/interviews', icon: Calendar },
    ],
  },
  {
    title: 'Employees',
    items: [
      { title: 'Employee List', url: '/employees', icon: Users },
      { title: 'Contracts', url: '/employees/contracts', icon: FileCheck },
      { title: 'Documents', url: '/employees/documents', icon: FolderOpen },
    ],
  },
  {
    title: 'HR Operations',
    items: [
      { title: 'Onboarding Tasks', url: '/hr/onboarding', icon: UserPlus },
      { title: 'Employee Onboarding', url: '/hr/employee-onboarding', icon: UserPlus },
      { title: 'Training Programs', url: '/hr/training', icon: GraduationCap },
      { title: 'Employee Training', url: '/hr/employee-training', icon: GraduationCap },
      { title: 'Performance', url: '/hr/performance', icon: TrendingUp },
    ],
  },
  {
    title: 'Compensation',
    items: [
      { title: 'Payroll Periods', url: '/payroll', icon: PesoSign },
      { title: 'Payroll Records', url: '/payroll/records', icon: FileText },
      { title: 'Benefits', url: '/payroll/benefits', icon: FileText },
      { title: 'Employee Benefits', url: '/payroll/employee-benefits', icon: FileText },
    ],
  },
  {
    title: 'Reports',
    items: [
      { title: 'HR Reports', url: '/reports', icon: FileText },
    ],
  },
];

// Employee - Limited view
const employeeNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'My Profile',
    items: [
      { title: 'Personal Info', url: '/my-profile', icon: User },
      { title: 'My Documents', url: '/my-documents', icon: FolderOpen },
    ],
  },
  {
    title: 'Employment',
    items: [
      { title: 'Onboarding', url: '/my-onboarding', icon: UserPlus },
      { title: 'My Contract', url: '/my-contract', icon: FileCheck },
      { title: 'Performance', url: '/my-performance', icon: TrendingUp },
      { title: 'Training', url: '/my-training', icon: GraduationCap },
    ],
  },
  {
    title: 'Compensation',
    items: [
      { title: 'My Payroll', url: '/my-payroll', icon: PesoSign },
      { title: 'My Payroll Records', url: '/my-payroll-records', icon: FileText },
      { title: 'My Benefits', url: '/my-benefits', icon: FileText },
    ],
  },
];

// Applicant - Job application focused
const applicantNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/applicant/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Jobs',
    items: [
      { title: 'Available Positions', url: '/applicant/jobs', icon: Briefcase },
      { title: 'My Applications', url: '/applicant/applications', icon: ClipboardList },
    ],
  },
  {
    title: 'Profile',
    items: [
      { title: 'My Profile', url: '/applicant/profile', icon: User },
    ],
  },
];

export function getNavigationForRole(role: AppRole | null): NavGroup[] {
  switch (role) {
    case 'system_admin':
      return systemAdminNav;
    case 'hr_admin':
      return hrAdminNav;
    case 'employee':
      return employeeNav;
    case 'applicant':
      return applicantNav;
    default:
      return applicantNav;
  }
}

